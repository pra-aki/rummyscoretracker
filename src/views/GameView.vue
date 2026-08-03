<script setup lang="ts">
import { ref } from 'vue'
import RoundEntry from '@/components/RoundEntry.vue'
import ScoreBoard from '@/components/ScoreBoard.vue'
import ScoreHistory from '@/components/ScoreHistory.vue'
import ShareLink from '@/components/ShareLink.vue'
import { useGame } from '@/composables/useGame'

const props = defineProps<{ id: string }>()

const {
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
  reload,
} = useGame(props.id)

const confirmingDelete = ref<string | null>(null)

function requestDelete(roundId: string) {
  confirmingDelete.value = roundId
}

function cancelDelete() {
  confirmingDelete.value = null
}

async function confirmDelete() {
  const id = confirmingDelete.value
  confirmingDelete.value = null
  if (id) await deleteRound(id)
}
</script>

<template>
  <div v-if="loading" class="state">Loading game…</div>

  <div v-else-if="notFound" class="state">
    <h2>Game not found</h2>
    <p>That link does not match any game. Check it was copied in full.</p>
    <RouterLink class="btn" to="/">Start a new game</RouterLink>
  </div>

  <template v-else>
    <div v-if="error" class="banner" role="alert">
      <span>{{ error }}</span>
      <div class="banner-actions">
        <button class="btn" type="button" @click="reload">Retry</button>
        <button class="btn btn-ghost" type="button" @click="dismissError">Dismiss</button>
      </div>
    </div>

    <ScoreBoard :players="players" :totals="totals" :leading-total="leadingTotal" />

    <RoundEntry
      :players="players"
      :round-number="rounds.length + 1"
      :busy="saving"
      @add="addRound"
    />

    <ScoreHistory
      :players="players"
      :rounds="rounds"
      :per-round="perRound"
      @delete="requestDelete"
    />

    <ShareLink />

    <div v-if="confirmingDelete" class="confirm-backdrop" @click.self="cancelDelete">
      <div class="confirm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h3 id="confirm-title">Delete this round?</h3>
        <p>Everyone on this link will lose it. Later rounds keep their scores.</p>
        <div class="confirm-actions">
          <button class="btn" type="button" @click="cancelDelete">Cancel</button>
          <button class="btn btn-danger" type="button" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
.state {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--muted);
}

.state h2 {
  font-size: 1.2rem;
  color: var(--ink);
  margin-bottom: 0.5rem;
}

.state p {
  margin: 0 0 1.25rem;
}

.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  background: var(--surface);
  border: 1px solid var(--negative);
  border-left-width: 3px;
  border-radius: 10px;
  padding: 0.7rem 0.9rem;
  margin-bottom: 1.25rem;
  color: var(--ink);
  font-size: 0.88rem;
}

.banner-actions {
  display: flex;
  gap: 0.5rem;
}

.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 16, 13, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  z-index: 20;
}

.confirm {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: var(--shadow);
  padding: 1.5rem;
  max-width: 360px;
  width: 100%;
}

.confirm h3 {
  font-size: 1.05rem;
  margin-bottom: 0.4rem;
}

.confirm p {
  color: var(--muted);
  font-size: 0.88rem;
  margin: 0 0 1.25rem;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}
</style>
