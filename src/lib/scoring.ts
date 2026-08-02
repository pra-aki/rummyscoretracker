import type { Round, RoundResult } from '@/types'

/**
 * Score a single round.
 *
 * Two independent transfers happen each round:
 *
 * 1. Penalties — every non-declarer pays their own penalty, and the declarer
 *    collects the sum of all of them.
 * 2. Values — each player receives their own value from every other player and
 *    pays every other player's value. Netted out, that is
 *    `value[i] * playerCount - sumOfAllValues`.
 *
 * The returned scores always sum to zero: points only move between players.
 */
export function computeRoundScores(round: Round, playerCount: number): number[] {
  let totalValue = 0
  let nonDeclarerPenaltySum = 0

  for (let i = 0; i < playerCount; i++) {
    totalValue += round.values[i] ?? 0
    if (i !== round.declarer) nonDeclarerPenaltySum += round.penalties[i] ?? 0
  }

  const scores: number[] = []
  for (let i = 0; i < playerCount; i++) {
    const penaltyTransfer =
      i === round.declarer ? nonDeclarerPenaltySum : -(round.penalties[i] ?? 0)
    const valueTransfer = (round.values[i] ?? 0) * playerCount - totalValue
    scores.push(penaltyTransfer + valueTransfer)
  }
  return scores
}

/**
 * Score every round in order, carrying running totals forward.
 * Returns the per-round breakdown and the final totals.
 */
export function computeGame(
  rounds: readonly Round[],
  playerCount: number,
): { perRound: RoundResult[]; totals: number[] } {
  const running = new Array<number>(playerCount).fill(0)

  const perRound = rounds.map((round) => {
    const scores = computeRoundScores(round, playerCount)
    scores.forEach((score, i) => {
      running[i] += score
    })
    return { scores, running: running.slice() }
  })

  return { perRound, totals: running.slice() }
}

/** Format a score with an explicit sign, e.g. `+8`, `-3`, `0`. */
export function formatScore(n: number): string {
  const rounded = Math.round(n * 100) / 100
  return rounded > 0 ? `+${rounded}` : String(rounded)
}

/** Class suffix used to colour a score. */
export function signClass(n: number): 'pos' | 'neg' | 'zero' {
  if (n > 0) return 'pos'
  if (n < 0) return 'neg'
  return 'zero'
}

/** Parse a possibly-empty input field into a number. */
export function toNum(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? 0 : parsed
}
