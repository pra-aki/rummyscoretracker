import { computed, ref } from 'vue'
import { computeGame } from '@/lib/scoring'
import type { Round } from '@/types'

/**
 * Owns all game state. Every mutation funnels through the actions below, so
 * adding persistence later means writing to a backend inside these functions
 * rather than touching any component.
 */
export function useGame() {
  const players = ref<string[]>([])
  const rounds = ref<Round[]>([])
  let nextRoundId = 1

  const playerCount = computed(() => players.value.length)
  const hasGame = computed(() => players.value.length > 0)

  const game = computed(() => computeGame(rounds.value, playerCount.value))
  const totals = computed(() => game.value.totals)
  const perRound = computed(() => game.value.perRound)

  /** Highest total, or null before any round is played. */
  const leadingTotal = computed(() => {
    if (rounds.value.length === 0) return null
    const max = Math.max(...totals.value)
    return max === 0 ? null : max
  })

  function startGame(names: string[]) {
    players.value = names.map((name) => name.trim())
    rounds.value = []
    nextRoundId = 1
  }

  function addRound(round: Omit<Round, 'id'>) {
    rounds.value.push({ ...round, id: nextRoundId++ })
  }

  function deleteRound(id: number) {
    rounds.value = rounds.value.filter((round) => round.id !== id)
  }

  function resetGame() {
    players.value = []
    rounds.value = []
    nextRoundId = 1
  }

  return {
    players,
    rounds,
    playerCount,
    hasGame,
    totals,
    perRound,
    leadingTotal,
    startGame,
    addRound,
    deleteRound,
    resetGame,
  }
}
