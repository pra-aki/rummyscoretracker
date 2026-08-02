<script setup lang="ts">
import { formatScore, signClass } from '@/lib/scoring'

defineProps<{
  players: string[]
  totals: number[]
  leadingTotal: number | null
}>()
</script>

<template>
  <div class="scoreboard">
    <div
      v-for="(name, index) in players"
      :key="index"
      class="score-card"
      :class="{ lead: leadingTotal !== null && totals[index] === leadingTotal }"
    >
      <div class="name">
        <span class="label">{{ name }}</span>
        <span v-if="leadingTotal !== null && totals[index] === leadingTotal" class="crown">
          LEAD
        </span>
      </div>
      <div class="total num" :class="signClass(totals[index])">
        {{ formatScore(totals[index]) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.scoreboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.75rem;
}

.score-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 1rem 1.1rem;
  box-shadow: var(--shadow);
  transition: border-color 0.15s;
}

.score-card.lead {
  border-color: var(--gold);
}

.name {
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.name .label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.crown {
  font-size: 0.7rem;
  background: var(--gold-soft);
  color: var(--gold);
  border-radius: 5px;
  padding: 0.1rem 0.4rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  flex: none;
}

.total {
  font-size: 1.6rem;
  font-weight: 600;
}
</style>
