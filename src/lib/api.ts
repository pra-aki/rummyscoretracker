import type { Round } from '@/types'

export interface GameData {
  id: string
  name: string | null
  createdAt: number
  seats: string[]
  rounds: Round[]
}

/** Thrown for any non-2xx response, carrying the server's message. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    throw new ApiError('Could not reach the server. Check your connection.', 0)
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new ApiError(body?.error ?? 'Something went wrong.', response.status)
  }

  return (await response.json()) as T
}

export function createGame(players: string[]): Promise<{ id: string }> {
  return request('/api/games', {
    method: 'POST',
    body: JSON.stringify({ players }),
  })
}

export function fetchGame(gameId: string): Promise<GameData> {
  return request(`/api/games/${encodeURIComponent(gameId)}`)
}

export function addRound(gameId: string, round: Omit<Round, 'id'>): Promise<Round> {
  return request(`/api/games/${encodeURIComponent(gameId)}/rounds`, {
    method: 'POST',
    body: JSON.stringify(round),
  })
}

export function deleteRound(gameId: string, roundId: string): Promise<{ ok: true }> {
  return request(
    `/api/games/${encodeURIComponent(gameId)}/rounds/${encodeURIComponent(roundId)}`,
    { method: 'DELETE' },
  )
}
