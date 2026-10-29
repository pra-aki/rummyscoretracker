<script setup lang="ts">
import { computed } from 'vue'
import { formatScore, signClass } from '@/lib/scoring'

const props = defineProps<{
  players: string[]
  totals: number[]
  leadingTotal: number | null
}>()

/**
 * Columns on a phone. Up to three players share one row; beyond that the cards
 * split evenly over two rows (four per row at most), so 5–6 players take two
 * lines instead of three.
 */
const phoneColumns = computed(() => {
  const n = props.players.length
  return n <= 3 ? n : Math.min(Math.ceil(n / 2), 4)
})

/** Wider screens fit up to six on one line; seven or eight split over two. */
const wideColumns = computed(() => {
  const n = props.players.length
  return n <= 6 ? n : Math.ceil(n / 2)
})
</script>

<template>
  <div
    class="scoreboard"
    :class="{ dense: phoneColumns === 4 }"
    :style="{ '--phone-cols': phoneColumns, '--wide-cols': wideColumns }"
  >
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
  grid-template-columns: repeat(var(--phone-cols), minmax(0, 1fr));
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.score-card {
  /* Sizes the total and lead chip to the card, not the screen. */
  container-type: inline-size;
  position: relative;
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 0.65rem 0.7rem;
  box-shadow: var(--shadow);
  transition: border-color 0.15s;
}

.score-card.lead {
  border-color: var(--gold);
}

.name {
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.3rem;
}

.name .label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.crown {
  font-size: 0.58rem;
  background: var(--gold-soft);
  color: var(--gold);
  border-radius: 5px;
  padding: 0.1rem 0.3rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  flex: none;
}

.total {
  /* Shrinks with the card, so a four-digit total fits four cards to a row. */
  font-size: min(1.3rem, 24cqi);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Wider screens: one line for up to six players. Below ~860px six cards on
   one line would truncate four-digit totals. */
@media (min-width: 860px) {
  .scoreboard {
    grid-template-columns: repeat(var(--wide-cols), minmax(0, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.75rem;
  }

  .score-card {
    padding: 0.9rem 1rem;
  }

  .name {
    font-size: 0.85rem;
    margin-bottom: 0.45rem;
  }

  .scoreboard.dense .score-card {
    padding: 0.9rem 1rem;
  }

  .total {
    font-size: min(1.5rem, 24cqi);
  }
}

/* Four cards to a row on a phone: tighter padding for more number room. */
.scoreboard.dense .score-card {
  padding: 0.55rem 0.45rem;
}

/* Too narrow for name and chip side by side: lift the chip onto the card's top
   edge so the name keeps the full width. */
@container (max-width: 75px) {
  .crown {
    position: absolute;
    top: -0.45rem;
    right: 0.3rem;
  }
}
</style>
