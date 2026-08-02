import { describe, expect, it } from 'vitest'
import { computeGame, computeRoundScores, formatScore, toNum } from './scoring'
import type { Round } from '@/types'

const round = (over: Partial<Round> = {}): Round => ({
  id: 1,
  declarer: 0,
  values: [0, 0, 0],
  penalties: [0, 0, 0],
  ...over,
})

describe('computeRoundScores', () => {
  it('scores the worked three-player example', () => {
    // A: value 2, penalty 3 | B: value 3, penalty 5 | C declared: value 1
    const scores = computeRoundScores(
      round({ declarer: 2, values: [2, 3, 1], penalties: [3, 5, 0] }),
      3,
    )
    expect(scores).toEqual([-3, -2, 5])
  })

  it('always sums to zero — points only move between players', () => {
    const scores = computeRoundScores(
      round({ declarer: 1, values: [7, 2, 4], penalties: [11, 0, 6] }),
      3,
    )
    expect(scores.reduce((a, b) => a + b, 0)).toBe(0)
  })

  it('gives the declarer every other player’s penalty', () => {
    const scores = computeRoundScores(
      round({ declarer: 0, values: [0, 0, 0], penalties: [0, 4, 6] }),
      3,
    )
    expect(scores).toEqual([10, -4, -6])
  })

  it('transfers value independently of penalties', () => {
    const scores = computeRoundScores(
      round({ declarer: 0, values: [5, 1, 0], penalties: [0, 0, 0] }),
      3,
    )
    // A is owed 5 by each of B and C, and owes B 1 → +10 - 1 = +9
    expect(scores).toEqual([9, -3, -6])
  })

  it('handles two players', () => {
    const scores = computeRoundScores(
      round({ declarer: 1, values: [3, 1], penalties: [8, 0] }),
      2,
    )
    // A pays an 8 penalty but is owed 3 and owes 1 → -8 + 2 = -6
    expect(scores).toEqual([-6, 6])
  })
})

describe('computeGame', () => {
  it('carries running totals across rounds', () => {
    const { perRound, totals } = computeGame(
      [
        round({ id: 1, declarer: 2, values: [2, 3, 1], penalties: [3, 5, 0] }),
        round({ id: 2, declarer: 0, values: [0, 0, 0], penalties: [0, 4, 6] }),
      ],
      3,
    )

    expect(perRound[0].scores).toEqual([-3, -2, 5])
    expect(perRound[0].running).toEqual([-3, -2, 5])
    expect(perRound[1].running).toEqual([7, -6, -1])
    expect(totals).toEqual([7, -6, -1])
  })

  it('returns zeroed totals for a game with no rounds', () => {
    expect(computeGame([], 4).totals).toEqual([0, 0, 0, 0])
  })

  it('keeps each round’s running snapshot independent', () => {
    const { perRound } = computeGame(
      [
        round({ id: 1, declarer: 0, values: [0, 0, 0], penalties: [0, 2, 2] }),
        round({ id: 2, declarer: 0, values: [0, 0, 0], penalties: [0, 2, 2] }),
      ],
      3,
    )
    expect(perRound[0].running).toEqual([4, -2, -2])
    expect(perRound[1].running).toEqual([8, -4, -4])
  })
})

describe('helpers', () => {
  it('formats scores with an explicit sign', () => {
    expect(formatScore(8)).toBe('+8')
    expect(formatScore(-3)).toBe('-3')
    expect(formatScore(0)).toBe('0')
  })

  it('treats empty input as zero', () => {
    expect(toNum('')).toBe(0)
    expect(toNum('abc')).toBe(0)
    expect(toNum('7')).toBe(7)
  })
})
