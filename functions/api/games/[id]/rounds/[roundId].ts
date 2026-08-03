import { fail, json, type Env } from '../../../../_shared'

/** DELETE /api/games/:id/rounds/:roundId — remove a round.
 *  Entries are deleted explicitly rather than relying on cascade, since
 *  foreign-key enforcement is not guaranteed to be on. */
export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const gameId = String(params.id ?? '')
  const roundId = String(params.roundId ?? '')
  if (!gameId || !roundId) return fail('Missing game or round id.', 404)

  const round = await env.DB.prepare('select id from rounds where id = ? and game_id = ?')
    .bind(roundId, gameId)
    .first<{ id: string }>()

  if (!round) return fail('That round no longer exists.', 404)

  await env.DB.batch([
    env.DB.prepare('delete from round_entries where round_id = ?').bind(roundId),
    env.DB.prepare('delete from rounds where id = ?').bind(roundId),
    env.DB.prepare('update games set updated_at = ? where id = ?').bind(Date.now(), gameId),
  ])

  return json({ ok: true })
}
