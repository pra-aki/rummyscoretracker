import { computed, onUnmounted, ref } from 'vue'
import * as api from '@/lib/api'
import { computeGame } from '@/lib/scoring'
import type { Round } from '@/types'

/** How often to pick up rounds added by other people on the same link. */
const POLL_INTERVAL_MS = 5000

/**
 * Owns one game's state and every mutation against it. The server is the source
 * of truth: mutations post, then apply the server's response.
 */
export function useGame(gameId: string) {
  const players = ref<string[]>([])
  const rounds = ref<Round[]>([])

  const loading = ref(true)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const notFound = ref(false)

  const playerCount = computed(() => players.value.length)
  const game = computed(() => computeGame(rounds.value, playerCount.value))
  const totals = computed(() => game.value.totals)
  const perRound = computed(() => game.value.perRound)

  /** Highest total, or null before any round is played. */
  const leadingTotal = computed(() => {
    if (rounds.value.length === 0) return null
    const max = Math.max(...totals.value)
    return max === 0 ? null : max
  })

  function apply(data: api.GameData) {
    players.value = data.seats
    rounds.value = data.rounds
  }

  async function load() {
    loading.value = true
    error.value = null
    try {
      apply(await api.fetchGame(gameId))
    } catch (err) {
      if (err instanceof api.ApiError && err.status === 404) notFound.value = true
      else error.value = err instanceof Error ? err.message : 'Could not load this game.'
    } finally {
      loading.value = false
    }
  }

  /** Background refresh. Stays quiet on failure so a blip does not disrupt play. */
  async function refresh() {
    if (saving.value || notFound.value) return
    try {
      apply(await api.fetchGame(gameId))
    } catch {
      /* transient — the next poll will retry */
    }
  }

  async function addRound(round: Omit<Round, 'id'>) {
    saving.value = true
    error.value = null
    try {
      rounds.value = [...rounds.value, await api.addRound(gameId, round)]
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Could not save that round.'
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteRound(roundId: string) {
    const previous = rounds.value
    // Optimistic: deletion is unambiguous, and reverting is cheap if it fails.
    rounds.value = rounds.value.filter((round) => round.id !== roundId)
    saving.value = true
    try {
      await api.deleteRound(gameId, roundId)
    } catch (err) {
      rounds.value = previous
      error.value = err instanceof Error ? err.message : 'Could not delete that round.'
    } finally {
      saving.value = false
    }
  }

  function dismissError() {
    error.value = null
  }

  const timer = window.setInterval(() => {
    if (document.visibilityState === 'visible') void refresh()
  }, POLL_INTERVAL_MS)

  // A sleeping phone misses polls entirely, so catch up on wake.
  function onVisible() {
    if (document.visibilityState === 'visible') void refresh()
  }
  document.addEventListener('visibilitychange', onVisible)

  onUnmounted(() => {
    window.clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisible)
  })

  void load()

  return {
    players,
    rounds,
    loading,
    saving,
    error,
    notFound,
    totals,
    perRound,
    leadingTotal,
    addRound,
    deleteRound,
    dismissError,
    reload: load,
  }
}
