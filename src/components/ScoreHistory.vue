<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { formatScore, signClass } from '@/lib/scoring'
import type { Round, RoundResult } from '@/types'

const props = defineProps<{
  players: string[]
  rounds: Round[]
  perRound: RoundResult[]
}>()

const emit = defineEmits<{ delete: [id: string] }>()

const expanded = ref<Set<string>>(new Set())
const root = ref<HTMLElement | null>(null)
const scroller = ref<HTMLElement | null>(null)

/** Round to flash after it lands, so the eye finds it once scrolling stops. */
const highlighted = ref<string | null>(null)
const HIGHLIGHT_MS = 2000
let highlightTimer: number | undefined

/**
 * Newest round first. `order` is kept alongside each round because scores and
 * running totals are computed in play order — reversing the array alone would
 * misalign them and mislabel the round numbers.
 */
const displayRounds = computed(() =>
  props.rounds.map((round, order) => ({ round, order })).reverse(),
)

/**
 * The detail panel spans a table that is at least 480px wide, so left to itself
 * it would inherit that width and scroll sideways like everything else. Pinning
 * it with `position: sticky` keeps it at the left edge, and this width — the
 * scroll container's visible width, tracked as it changes — keeps it fitting
 * the screen instead of the table.
 */
const panelWidth = ref<string>('100%')
let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  if (!scroller.value) return
  resizeObserver = new ResizeObserver(([entry]) => {
    panelWidth.value = `${entry.contentRect.width}px`
  })
  resizeObserver.observe(scroller.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  window.clearTimeout(highlightTimer)
})

function toggle(id: string) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

/** Bring a round's scores into view once it has rendered, then flash it. */
async function scrollToRound(id: string) {
  await nextTick()
  const row = root.value?.querySelector<HTMLElement>(`[data-round-id="${id}"]`)
  if (!row) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  row.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })

  highlighted.value = id
  window.clearTimeout(highlightTimer)
  highlightTimer = window.setTimeout(() => {
    highlighted.value = null
  }, HIGHLIGHT_MS)
}

defineExpose({ scrollToRound })
</script>

<template>
  <section ref="root">
    <div class="history-head">
      <h3>Score history</h3>
    </div>

    <div ref="scroller" class="history-scroll">
      <div v-if="rounds.length === 0" class="empty-state">
        No rounds recorded yet. Add your first round above.
      </div>

      <table v-else class="history">
        <thead>
          <tr>
            <th class="round-col">Round</th>
            <th v-for="(name, index) in players" :key="index">{{ name }}</th>
            <th><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="{ round, order } in displayRounds" :key="round.id">
            <tr
              class="history-row"
              :class="{ flash: highlighted === round.id, open: expanded.has(round.id) }"
              :data-round-id="round.id"
              :aria-expanded="expanded.has(round.id)"
              @click="toggle(round.id)"
            >
              <td class="round-num">
                {{ order + 1 }}
                <span class="chevron" aria-hidden="true">
                  {{ expanded.has(round.id) ? '▾' : '▸' }}
                </span>
              </td>

              <td v-for="(_, index) in players" :key="index">
                <span class="cell-round num" :class="signClass(perRound[order].scores[index])">
                  {{ formatScore(perRound[order].scores[index]) }}
                </span>
              </td>

              <td class="row-actions">
                <button
                  class="icon-btn"
                  type="button"
                  :title="`Delete round ${order + 1}`"
                  @click.stop="emit('delete', round.id)"
                >
                  ✕
                </button>
              </td>
            </tr>

            <tr v-if="expanded.has(round.id)" class="detail-row">
              <td :colspan="players.length + 2" class="detail-cell">
                <div class="detail-panel" :style="{ width: panelWidth }">
                  <div v-for="(name, index) in players" :key="index" class="detail-player">
                    <div class="detail-name">
                      <span class="detail-name-text">{{ name }}</span>
                      <span v-if="round.declarer === index" class="chip-declarer">DECL</span>
                    </div>
                    <div
                      class="detail-score num"
                      :class="signClass(perRound[order].scores[index])"
                    >
                      {{ formatScore(perRound[order].scores[index]) }}
                    </div>
                    <div class="detail-line">Value {{ round.values[index] }}</div>
                    <div class="detail-line">Penalty {{ round.penalties[index] }}</div>
                    <div class="detail-total num">
                      total {{ formatScore(perRound[order].running[index]) }}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.history-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.history-head h3 {
  font-size: 1.02rem;
}

/*
 * Scroll shadows, no JavaScript.
 *
 * Four gradient layers. The two `--surface` "covers" use
 * background-attachment: local, so they travel with the content; the two dark
 * shadows use `scroll`, so they stay pinned to the container's edges. At the
 * start of the scroll the cover sits on top of the shadow and hides it — scroll
 * away and the cover moves, revealing the shadow. The result is a shadow that
 * appears on exactly the side that has more content, and fades at each end.
 */
.history-scroll {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: var(--shadow);
  background-color: var(--surface);
  background-image:
    linear-gradient(to right, var(--surface), transparent),
    linear-gradient(to left, var(--surface), transparent),
    linear-gradient(to right, var(--scroll-shadow), transparent),
    linear-gradient(to left, var(--scroll-shadow), transparent);
  background-repeat: no-repeat;
  background-size: 34px 100%, 34px 100%, 15px 100%, 15px 100%;
  background-position: left center, right center, left center, right center;
  background-attachment: local, local, scroll, scroll;
}

table.history {
  border-collapse: collapse;
  width: 100%;
  min-width: 480px;
  /* Transparent so the container's scroll shadows show through. */
  background: transparent;
}

table.history thead th {
  background: var(--surface-2);
  text-align: left;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--ink);
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

table.history thead th.round-col {
  width: 64px;
}

table.history tbody td {
  padding: 0.7rem 0.9rem;
  border-bottom: 1px solid var(--line);
  vertical-align: middle;
}

table.history tbody tr:last-child td {
  border-bottom: none;
}

.history-row {
  cursor: pointer;
  transition: background 0.5s ease;
}

.history-row:hover {
  background: var(--surface-2);
}

/* A plain background rather than an animation: the global reduced-motion rule
   disables animations outright, which would remove the cue altogether. Here it
   only drops the fade, so the highlight still appears and still clears. */
.history-row.flash,
.history-row.flash:hover {
  background: var(--accent-soft);
}

/* An open row reads as the head of its detail panel, so it loses the divider. */
.history-row.open td {
  border-bottom: none;
}

.round-num {
  color: var(--muted);
  font-size: 0.85rem;
  white-space: nowrap;
}

.chevron {
  display: inline-block;
  margin-left: 0.4rem;
  font-size: 0.65rem;
}

.cell-round {
  font-size: 0.95rem;
  font-weight: 600;
}

.row-actions {
  text-align: right;
  white-space: nowrap;
}

/* ---- expanded detail ---- */

table.history tbody td.detail-cell {
  padding: 0;
}

.detail-panel {
  position: sticky;
  left: 0;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.7rem 0.9rem;
  padding: 0.25rem 0.9rem 0.9rem;
  background: var(--surface);
}

.detail-player {
  min-width: 0;
}

.detail-name {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 0.25rem;
}

.detail-name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-name .chip-declarer {
  margin-left: 0;
  flex: none;
}

/* The round's own score — the reason for opening the panel, so it leads. */
.detail-score {
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 0.2rem;
}

.detail-line {
  font-size: 0.75rem;
  color: var(--muted);
  line-height: 1.5;
  white-space: nowrap;
}

.detail-total {
  font-size: 0.78rem;
  color: var(--ink);
  font-weight: 600;
  margin-top: 0.15rem;
  white-space: nowrap;
}

.icon-btn {
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0.3rem 0.45rem;
  border-radius: 6px;
  line-height: 1;
  font-family: inherit;
}

.icon-btn:hover {
  color: var(--negative);
  background: var(--surface-2);
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.9rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
</style>
