<script setup lang="ts">
import { ref } from 'vue'
import { formatScore, signClass } from '@/lib/scoring'
import type { Round, RoundResult } from '@/types'

defineProps<{
  players: string[]
  rounds: Round[]
  perRound: RoundResult[]
}>()

const emit = defineEmits<{ delete: [id: string] }>()

const expanded = ref<Set<string>>(new Set())

function toggle(id: string) {
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

  <div v-if="rounds.length === 0" class="empty-state">
    No rounds recorded yet. Add your first round above.
  </div>

  <ul v-else class="history-list">
    <li
      v-for="(round, rIndex) in rounds"
      :key="round.id"
      class="history-item"
      :aria-expanded="expanded.has(round.id)"
      @click="toggle(round.id)"
    >
      <div class="history-item-head">
        <span class="round-num">
          Round {{ rIndex + 1 }}
          <span class="chevron" aria-hidden="true">
            {{ expanded.has(round.id) ? '▾' : '▸' }}
          </span>
        </span>
        <button
          class="icon-btn"
          type="button"
          :title="`Delete round ${rIndex + 1}`"
          @click.stop="emit('delete', round.id)"
        >
          ✕
        </button>
      </div>

      <div class="history-item-scores">
        <div v-for="(name, index) in players" :key="index" class="player-score">
          <span class="player-score-name">{{ name }}</span>
          <span class="cell-round num" :class="signClass(perRound[rIndex].scores[index])">
            {{ formatScore(perRound[rIndex].scores[index]) }}
            <span v-if="round.declarer === index" class="chip-declarer">DECL</span>
          </span>
          <div v-if="expanded.has(round.id)" class="cell-breakdown">
            Value {{ round.values[index] }} · Penalty {{ round.penalties[index] }}
          </div>
          <div v-if="expanded.has(round.id)" class="cell-running num">
            total {{ formatScore(perRound[rIndex].running[index]) }}
          </div>
        </div>
      </div>
    </li>
  </ul>
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

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.history-item {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 0.75rem 0.9rem;
  cursor: pointer;
  transition: border-color 0.15s;
}

.history-item:hover {
  border-color: var(--accent);
}

.history-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.round-num {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.chevron {
  display: inline-block;
  margin-left: 0.3rem;
  font-size: 0.65rem;
}

.history-item-scores {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.player-score {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.player-score-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-breakdown {
  flex-basis: 100%;
  font-size: 0.72rem;
  color: var(--muted);
}

.cell-round {
  font-size: 0.95rem;
  font-weight: 600;
}

.cell-running {
  flex-basis: 100%;
  font-size: 0.75rem;
  color: var(--muted);
  text-align: right;
}

.icon-btn {
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 1rem;
  padding: 0.45rem 0.55rem;
  border-radius: 6px;
  line-height: 1;
  font-family: inherit;
  flex: none;
}

.icon-btn:hover {
  color: var(--negative);
  background: var(--surface-2);
}

.empty-state {
  padding: 2rem 1.25rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.9rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
}

@media (min-width: 560px) {
  .history-item-scores {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 0.75rem;
  }

  .player-score {
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: flex-start;
    gap: 0.15rem;
  }

  .cell-breakdown,
  .cell-running {
    flex-basis: auto;
    width: 100%;
    text-align: left;
  }
}
</style>
