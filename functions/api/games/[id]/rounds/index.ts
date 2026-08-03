import { cleanPoints, fail, json, newId, readJson, type Env } from '../../../../_shared'

interface AddRoundBody {
  declarer?: unknown
  values?: unknown
  penalties?: unknown
}

/** How many times to retry when another writer claims the same round number. */
const MAX_ATTEMPTS = 4

/** POST /api/games/:id/rounds — append a round. */
export const onRequestPost: PagesFunction<Env> = async ({ request, params, env }) => {
  const gameId = String(params.id ?? '')
  if (!gameId) return fail('Missing game id.', 404)

  const body = await readJson<AddRoundBody>(request)
  if (!body) return fail('Could not read the request body.')

  const seatCount = await env.DB.prepare('select count(*) as n from seats where game_id = ?')
    .bind(gameId)
    .first<{ n: number }>()

  if (!seatCount || seatCount.n === 0) {
    return fail('That game does not exist. Check the link.', 404)
  }
  const seats = seatCount.n

  if (
    typeof body.declarer !== 'number' ||
    !Number.isInteger(body.declarer) ||
    body.declarer < 0 ||
    body.declarer >= seats
  ) {
    return fail('declarer must be the seat number of the player who declared.')
  }

  if (
    !Array.isArray(body.values) ||
    !Array.isArray(body.penalties) ||
    body.values.length !== seats ||
    body.penalties.length !== seats
  ) {
    return fail(`values and penalties must each hold ${seats} entries.`)
  }

  const values: number[] = []
  const penalties: number[] = []
  for (let seat = 0; seat < seats; seat++) {
    const value = cleanPoints(body.values[seat])
    // The declarer never carries a penalty of their own.
    const penalty = seat === body.declarer ? 0 : cleanPoints(body.penalties[seat])
    if (value === null || penalty === null) {
      return fail('Values and penalties must be whole numbers of zero or more.')
    }
    values.push(value)
    penalties.push(penalty)
  }

  // round_index is assigned here, never by the client. If two people submit at
  // once the unique constraint rejects the loser, and it retries with the next
  // number rather than silently overwriting.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const highest = await env.DB.prepare(
      'select coalesce(max(round_index), 0) as top from rounds where game_id = ?',
    )
      .bind(gameId)
      .first<{ top: number }>()

    const roundIndex = (highest?.top ?? 0) + 1
    const roundId = newId()
    const now = Date.now()

    try {
      await env.DB.batch([
        env.DB.prepare(
          'insert into rounds (id, game_id, round_index, declarer, created_at) values (?, ?, ?, ?, ?)',
        ).bind(roundId, gameId, roundIndex, body.declarer, now),
        ...values.map((value, seat) =>
          env.DB.prepare(
            'insert into round_entries (round_id, seat_index, value, penalty) values (?, ?, ?, ?)',
          ).bind(roundId, seat, value, penalties[seat]),
        ),
        env.DB.prepare('update games set updated_at = ? where id = ?').bind(now, gameId),
      ])

      return json({ id: roundId, declarer: body.declarer, values, penalties }, 201)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const lostRace = message.includes('UNIQUE') || message.includes('constraint')
      if (!lostRace || attempt === MAX_ATTEMPTS - 1) {
        return fail('Could not save that round. Please try again.', 500)
      }
      // Someone else took this round number; loop and take the next one.
    }
  }

  return fail('Could not save that round. Please try again.', 500)
}
