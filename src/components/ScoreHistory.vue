<script setup lang="ts">
import { ref } from 'vue'
import { formatScore, signClass } from '@/lib/scoring'
import type { Round, RoundResult } from '@/types'

defineProps<{
  players: string[]
  rounds: Round[]
  perRound: RoundResult[]
}>()

const emit = defineEmits<{ delete: [id: number] }>()

const expanded = ref<Set<number>>(new Set())

function toggle(id: number) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}
</script>

<template>
  <div class="history-head">
    <h3>Score history</h3>
  </div>

  <div class="history-scroll">
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
        <tr
          v-for="(round, rIndex) in rounds"
          :key="round.id"
          class="history-row"
          :aria-expanded="expanded.has(round.id)"
          @click="toggle(round.id)"
        >
          <td class="round-num">
            {{ rIndex + 1 }}
            <span class="chevron" aria-hidden="true">
              {{ expanded.has(round.id) ? '▾' : '▸' }}
            </span>
          </td>

          <td v-for="(_, index) in players" :key="index">
            <div v-if="expanded.has(round.id)" class="cell-breakdown">
              Value {{ round.values[index] }} · Penalty {{ round.penalties[index] }}
            </div>
            <div class="cell-round num" :class="signClass(perRound[rIndex].scores[index])">
              {{ formatScore(perRound[rIndex].scores[index]) }}
              <span v-if="round.declarer === index" class="chip-declarer">DECL</span>
            </div>
            <div v-if="expanded.has(round.id)" class="cell-running num">
              total {{ formatScore(perRound[rIndex].running[index]) }}
            </div>
          </td>

          <td class="row-actions">
            <button
              class="icon-btn"
              type="button"
              :title="`Delete round ${rIndex + 1}`"
              @click.stop="emit('delete', round.id)"
            >
              ✕
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
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

.history-scroll {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: var(--shadow);
  background: var(--surface);
}

table.history {
  border-collapse: collapse;
  width: 100%;
  min-width: 480px;
  background: var(--surface);
}

table.history thead th {
  position: sticky;
  top: 0;
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
  vertical-align: top;
}

table.history tbody tr:last-child td {
  border-bottom: none;
}

.history-row {
  cursor: pointer;
}

.history-row:hover {
  background: var(--surface-2);
}

.round-num {
  color: var(--muted);
  font-size: 0.85rem;
}

.chevron {
  display: inline-block;
  margin-left: 0.4rem;
  font-size: 0.65rem;
}

.cell-breakdown {
  font-size: 0.72rem;
  color: var(--muted);
  margin-bottom: 0.25rem;
}

.cell-round {
  font-size: 0.95rem;
  font-weight: 600;
}

.cell-running {
  font-size: 0.78rem;
  color: var(--muted);
  margin-top: 0.15rem;
}

.row-actions {
  text-align: right;
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
  background: var(--surface);
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
