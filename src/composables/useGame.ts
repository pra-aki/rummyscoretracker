import { computed, onUnmounted, ref } from 'vue'
import * as api from '@/lib/api'
import { computeGame } from '@/lib/scoring'
import type { Round } from '@/types'

/**
 * Polling cadence for picking up rounds added by other people on the same link.
 *
 * A rummy round takes minutes to play, so polling every 5s forever spends
 * requests on nothing. The interval starts fast, doubles while the game is
 * quiet, and drops straight back to the floor the moment anything happens.
 */
const MIN_POLL_MS = 5000
const MAX_POLL_MS = 30000

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

  /** Server's updated_at as of our last full fetch. */
  let lastSeenVersion = 0

  function apply(data: api.GameData) {
    players.value = data.seats
    rounds.value = data.rounds
    lastSeenVersion = data.updatedAt
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

  /**
   * Background refresh. Asks for the version first — one row — and only pulls
   * the whole game when it has actually moved. Most polls happen while nobody
   * is adding rounds, so this is the difference between reading ~100 rows and
   * reading 1. Stays quiet on failure so a blip does not disrupt play.
   */
  async function refresh(force = false): Promise<boolean> {
    if (saving.value || notFound.value || loading.value) return false
    try {
      if (!force) {
        const { updatedAt } = await api.fetchGameVersion(gameId)
        if (updatedAt === lastSeenVersion) return false
      }
      apply(await api.fetchGame(gameId))
      return true
    } catch {
      /* transient — the next poll will retry */
      return false
    }
  }

  /** Returns the created round, or null if the save failed. */
  async function addRound(round: Omit<Round, 'id'>): Promise<Round | null> {
    saving.value = true
    error.value = null
    try {
      const created = await api.addRound(gameId, round)
      rounds.value = [...rounds.value, created]
      // Our write moved the server's version, so the next poll reconciles and
      // picks up anything the others added meanwhile. Go back to fast polling.
      quicken()
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Could not save that round.'
      return null
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
      quicken()
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

  let pollDelay = MIN_POLL_MS
  let pollTimer: number | undefined

  function schedulePoll() {
    window.clearTimeout(pollTimer)
    pollTimer = window.setTimeout(poll, pollDelay)
  }

  /** Drop back to the fast cadence — something happened, more may follow. */
  function quicken() {
    pollDelay = MIN_POLL_MS
    schedulePoll()
  }

  async function poll() {
    if (document.visibilityState === 'visible') {
      const changed = await refresh()
      pollDelay = changed ? MIN_POLL_MS : Math.min(pollDelay * 2, MAX_POLL_MS)
    } else {
      // Hidden tab: no request, and no point waking often either. onVisible
      // catches us up the moment it comes back.
      pollDelay = MAX_POLL_MS
    }
    schedulePoll()
  }

  // A sleeping phone misses polls entirely, so catch up on wake.
  function onVisible() {
    if (document.visibilityState !== 'visible') return
    void refresh()
    quicken()
  }
  document.addEventListener('visibilitychange', onVisible)

  schedulePoll()

  onUnmounted(() => {
    window.clearTimeout(pollTimer)
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
