// Shared helpers for the Pages Functions API.
// Files prefixed with `_` are not routed by Cloudflare Pages.

export interface Env {
  DB: D1Database
}

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 8
export const MAX_NAME_LEN = 40
/** Guards against a typo turning into an absurd score. */
export const MAX_POINTS = 100_000

/** URL-safe id. 32-char alphabet over random bytes — 256/32 is exact, so no
 *  modulo bias. 22 characters is ~110 bits, far past guessable. */
export function newId(length = 22): string {
  const alphabet = '23456789abcdefghijkmnpqrstuvwxyz'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let out = ''
  for (const byte of bytes) out += alphabet[byte % alphabet.length]
  return out
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

export function fail(message: string, status = 400): Response {
  return json({ error: message }, status)
}

/** Parse a JSON body, returning null rather than throwing on malformed input. */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

/** Coerce to a whole number within the allowed range; null if unusable. */
export function cleanPoints(input: unknown): number | null {
  const n = typeof input === 'number' ? input : Number(input)
  if (!Number.isFinite(n)) return null
  const rounded = Math.round(n)
  if (rounded < 0 || rounded > MAX_POINTS) return null
  return rounded
}

export interface GamePayload {
  id: string
  name: string | null
  createdAt: number
  /** Bumped on every write. Clients poll this to avoid refetching the game. */
  updatedAt: number
  seats: string[]
  rounds: Array<{
    id: string
    declarer: number
    values: number[]
    penalties: number[]
  }>
}

/** Load a whole game — seats, rounds and entries — or null if it is missing. */
export async function loadGame(db: D1Database, gameId: string): Promise<GamePayload | null> {
  const game = await db
    .prepare('select id, name, created_at, updated_at from games where id = ?')
    .bind(gameId)
    .first<{ id: string; name: string | null; created_at: number; updated_at: number }>()

  if (!game) return null

  const [seatRows, roundRows, entryRows] = await Promise.all([
    db
      .prepare('select seat_index, display_name from seats where game_id = ? order by seat_index')
      .bind(gameId)
      .all<{ seat_index: number; display_name: string }>(),
    db
      .prepare(
        'select id, round_index, declarer from rounds where game_id = ? order by round_index',
      )
      .bind(gameId)
      .all<{ id: string; round_index: number; declarer: number }>(),
    db
      .prepare(
        `select e.round_id, e.seat_index, e.value, e.penalty
           from round_entries e
           join rounds r on r.id = e.round_id
          where r.game_id = ?`,
      )
      .bind(gameId)
      .all<{ round_id: string; seat_index: number; value: number; penalty: number }>(),
  ])

  const seats = seatRows.results.map((row) => row.display_name)

  const byRound = new Map<string, { values: number[]; penalties: number[] }>()
  for (const round of roundRows.results) {
    byRound.set(round.id, {
      values: new Array(seats.length).fill(0),
      penalties: new Array(seats.length).fill(0),
    })
  }
  for (const entry of entryRows.results) {
    const slot = byRound.get(entry.round_id)
    if (!slot || entry.seat_index >= seats.length) continue
    slot.values[entry.seat_index] = entry.value
    slot.penalties[entry.seat_index] = entry.penalty
  }

  return {
    id: game.id,
    name: game.name,
    createdAt: game.created_at,
    updatedAt: game.updated_at,
    seats,
    rounds: roundRows.results.map((round) => ({
      id: round.id,
      declarer: round.declarer,
      values: byRound.get(round.id)!.values,
      penalties: byRound.get(round.id)!.penalties,
    })),
  }
}
