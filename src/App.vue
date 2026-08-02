<script setup lang="ts">
import GameSetup from '@/components/GameSetup.vue'
import RoundEntry from '@/components/RoundEntry.vue'
import ScoreBoard from '@/components/ScoreBoard.vue'
import ScoreHistory from '@/components/ScoreHistory.vue'
import { useGame } from '@/composables/useGame'

const {
  players,
  rounds,
  hasGame,
  totals,
  perRound,
  leadingTotal,
  startGame,
  addRound,
  deleteRound,
  resetGame,
} = useGame()

function confirmReset() {
  if (window.confirm('Start a new game? Current scores will be lost.')) {
    resetGame()
  }
}
</script>

<template>
  <div class="wrap">
    <header class="app-header">
      <div>
        <p class="eyebrow">Score tracker</p>
        <h1>Rummy</h1>
      </div>
      <button v-if="hasGame" class="btn btn-ghost" type="button" @click="confirmReset">
        New game
      </button>
    </header>

    <GameSetup v-if="!hasGame" @start="startGame" />

    <template v-else>
      <ScoreBoard :players="players" :totals="totals" :leading-total="leadingTotal" />
      <RoundEntry
        :players="players"
        :round-number="rounds.length + 1"
        @add="addRound"
      />
      <ScoreHistory
        :players="players"
        :rounds="rounds"
        :per-round="perRound"
        @delete="deleteRound"
      />
    </template>
  </div>
</template>

<style scoped>
.wrap {
  max-width: 920px;
  margin: 0 auto;
  padding: 2.5rem 1.25rem 5rem;
}

.app-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.app-header h1 {
  font-size: 1.7rem;
}

.app-header .eyebrow {
  margin: 0 0 0.3rem;
}
</style>
