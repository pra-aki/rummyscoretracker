import {
  MAX_NAME_LEN,
  MAX_PLAYERS,
  MIN_PLAYERS,
  fail,
  json,
  newId,
  readJson,
  type Env,
} from '../../_shared'

interface CreateBody {
  name?: unknown
  players?: unknown
}

/** POST /api/games — create a game and return its id. */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson<CreateBody>(request)
  if (!body) return fail('Could not read the request body.')

  if (!Array.isArray(body.players)) return fail('players must be an array of names.')
  if (body.players.length < MIN_PLAYERS || body.players.length > MAX_PLAYERS) {
    return fail(`A game needs between ${MIN_PLAYERS} and ${MAX_PLAYERS} players.`)
  }

  const seats: string[] = []
  for (const raw of body.players) {
    const name = typeof raw === 'string' ? raw.trim() : ''
    if (!name) return fail('Every player needs a name.')
    seats.push(name.slice(0, MAX_NAME_LEN))
  }

  const name =
    typeof body.name === 'string' && body.name.trim()
      ? body.name.trim().slice(0, MAX_NAME_LEN)
      : null

  const id = newId()
  const now = Date.now()

  await env.DB.batch([
    env.DB.prepare(
      'insert into games (id, name, created_at, updated_at) values (?, ?, ?, ?)',
    ).bind(id, name, now, now),
    ...seats.map((displayName, index) =>
      env.DB.prepare(
        'insert into seats (game_id, seat_index, display_name) values (?, ?, ?)',
      ).bind(id, index, displayName),
    ),
  ])

  return json({ id }, 201)
}
