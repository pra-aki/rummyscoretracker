import { fail, json, loadGame, type Env } from '../../../_shared'

/** GET /api/games/:id — the whole game, ready for the client to score. */
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = String(params.id ?? '')
  if (!id) return fail('Missing game id.', 404)

  const game = await loadGame(env.DB, id)
  if (!game) return fail('That game does not exist. Check the link.', 404)

  return json(game)
}
