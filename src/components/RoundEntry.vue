<script setup lang="ts">
import { ref, watch } from 'vue'
import { toNum } from '@/lib/scoring'
import type { Round, RoundDraft } from '@/types'

const props = defineProps<{
  players: string[]
  roundNumber: number
  busy?: boolean
}>()

const emit = defineEmits<{ add: [round: Omit<Round, 'id'>] }>()

function freshDraft(count: number): RoundDraft {
  return {
    declarer: null,
    values: Array.from({ length: count }, () => ''),
    penalties: Array.from({ length: count }, () => ''),
  }
}

const draft = ref<RoundDraft>(freshDraft(props.players.length))

watch(
  () => props.players.length,
  (count) => {
    draft.value = freshDraft(count)
  },
)

// The declarer never carries a penalty of their own.
function selectDeclarer(index: number) {
  draft.value.declarer = index
  draft.value.penalties[index] = ''
}

// Set while our own submission is in flight, so the draft is cleared only when
// that submission lands — not when polling picks up someone else's round, and
// not if the save fails.
const awaitingOwnSave = ref(false)

watch(
  () => props.roundNumber,
  () => {
    if (!awaitingOwnSave.value) return
    awaitingOwnSave.value = false
    draft.value = freshDraft(props.players.length)
  },
)

function submit() {
  if (draft.value.declarer === null || props.busy) return
  awaitingOwnSave.value = true
  emit('add', {
    declarer: draft.value.declarer,
    values: draft.value.values.map(toNum),
    penalties: draft.value.penalties.map(toNum),
  })
}
</script>

<template>
  <section class="entry">
    <header class="entry-head">
      <h3>Round {{ roundNumber }}</h3>
    </header>

    <p class="entry-hint">
      <template v-if="draft.declarer === null">Mark who declared this round.</template>
      <template v-else><b>{{ players[draft.declarer] }}</b> declared this round.</template>
    </p>

    <div class="entry-players">
      <div
        v-for="(name, index) in players"
        :key="index"
        class="player-entry"
        :class="{ declared: draft.declarer === index }"
      >
        <div class="player-entry-head">
          <span class="player-name">{{ name }}</span>
          <label class="declarer-toggle">
            <input
              type="radio"
              name="declarer"
              :checked="draft.declarer === index"
              :aria-label="`${name} declared`"
              @change="selectDeclarer(index)"
            />
            <span>Declared</span>
          </label>
        </div>

        <div class="player-entry-fields">
          <label class="field">
            <span class="field-label">Value</span>
            <input
              v-model="draft.values[index]"
              type="number"
              inputmode="numeric"
              min="0"
              step="1"
              placeholder="0"
              :aria-label="`${name} value`"
            />
          </label>
          <label class="field">
            <span class="field-label">Penalty</span>
            <input
              v-model="draft.penalties[index]"
              type="number"
              inputmode="numeric"
              min="0"
              step="1"
              placeholder="0"
              :disabled="draft.declarer === index"
              :aria-label="`${name} penalty`"
            />
          </label>
        </div>
      </div>
    </div>

    <footer class="entry-foot">
      <button
        class="btn btn-primary"
        type="button"
        :disabled="draft.declarer === null || busy"
        @click="submit"
      >
        {{ busy ? 'Saving…' : 'Add round' }}
      </button>
    </footer>
  </section>
</template>

<style scoped>
.entry {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: var(--shadow);
  padding: 1.1rem 1.1rem 1.25rem;
  margin-bottom: 1.5rem;
}

.entry-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.entry-head h3 {
  font-size: 1.02rem;
}

.entry-hint {
  font-size: 0.82rem;
  color: var(--muted);
  font-weight: 500;
  line-height: 1.35;
  margin: 0 0 1rem;
}

.entry-hint b {
  color: var(--gold);
  font-weight: 700;
}

.entry-players {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.1rem;
}

.player-entry {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.7rem 0.8rem;
  transition: border-color 0.15s, background 0.15s;
}

.player-entry.declared {
  border-color: var(--gold);
  background: var(--gold-soft);
}

.player-entry-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.player-name {
  font-weight: 600;
  font-size: 0.92rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.declarer-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted);
  flex: none;
  padding: 0.35rem 0.1rem;
  cursor: pointer;
}

.player-entry.declared .declarer-toggle {
  color: var(--gold);
}

.declarer-toggle input {
  accent-color: var(--gold);
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.player-entry-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field-label {
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 600;
}

.field input[type='number'] {
  width: 100%;
  padding: 0.6rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  font-size: 1rem;
  font-family: inherit;
}

.field input[type='number']:disabled {
  background: var(--surface-2);
  color: var(--muted);
}

.entry-foot {
  display: flex;
}

.entry-foot .btn {
  width: 100%;
}

@media (min-width: 640px) {
  .entry-players {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 0.75rem;
  }

  .entry-foot {
    justify-content: flex-end;
  }

  .entry-foot .btn {
    width: auto;
  }
}
</style>
