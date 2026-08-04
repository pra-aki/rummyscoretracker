import { fail, json, type Env } from '../../../_shared'

/**
 * GET /api/games/:id/version — one row, one column.
 *
 * This is what clients poll. Fetching the whole game every few seconds reads
 * a row per seat, round and entry; this reads exactly one, so the full game is
 * only pulled when something has actually changed.
 */
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = String(params.id ?? '')
  if (!id) return fail('Missing game id.', 404)

  const row = await env.DB.prepare('select updated_at from games where id = ?')
    .bind(id)
    .first<{ updated_at: number }>()

  if (!row) return fail('That game does not exist. Check the link.', 404)

  return json({ updatedAt: row.updated_at })
}
