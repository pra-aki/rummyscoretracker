<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toNum } from '@/lib/scoring'
import type { Round, RoundDraft } from '@/types'

const props = defineProps<{
  players: string[]
  roundNumber: number
  /** Who sat out the last recorded round. They stay skipped until unticked. */
  previousSkipped?: boolean[]
  busy?: boolean
}>()

const emit = defineEmits<{ add: [round: Omit<Round, 'id'>] }>()

function freshDraft(count: number): RoundDraft {
  const skipped = Array.from({ length: count }, (_, i) => props.previousSkipped?.[i] ?? false)
  // Never carry over a state that cannot be submitted.
  const carry = skipped.filter((flag) => !flag).length >= 2
  return {
    declarer: null,
    values: Array.from({ length: count }, () => ''),
    penalties: Array.from({ length: count }, () => ''),
    skipped: carry ? skipped : skipped.map(() => false),
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

// A skipped player sits the round out, so anything typed for them is dropped
// and they cannot be the one who declared.
function toggleSkip(index: number) {
  const skipping = !draft.value.skipped[index]
  draft.value.skipped[index] = skipping
  if (!skipping) return
  draft.value.values[index] = ''
  draft.value.penalties[index] = ''
  if (draft.value.declarer === index) draft.value.declarer = null
}

const activeCount = computed(() => draft.value.skipped.filter((flag) => !flag).length)
const canSubmit = computed(
  () => draft.value.declarer !== null && activeCount.value >= 2 && !props.busy,
)

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
  if (!canSubmit.value || draft.value.declarer === null) return
  awaitingOwnSave.value = true
  emit('add', {
    declarer: draft.value.declarer,
    values: draft.value.values.map(toNum),
    penalties: draft.value.penalties.map(toNum),
    skipped: draft.value.skipped.slice(),
  })
}
</script>

<template>
  <section class="entry">
    <header class="entry-head">
      <h3>Round {{ roundNumber }}</h3>
    </header>

    <p class="entry-hint">
      <template v-if="activeCount < 2">At least two players must play the round.</template>
      <template v-else-if="draft.declarer === null">Mark who declared this round.</template>
      <template v-else><b>{{ players[draft.declarer] }}</b> declared this round.</template>
    </p>

    <div class="entry-players">
      <div
        v-for="(name, index) in players"
        :key="index"
        class="player-entry"
        :class="{ declared: draft.declarer === index, skipped: draft.skipped[index] }"
      >
        <div class="player-entry-head">
          <span class="player-name">{{ name }}</span>
          <div class="player-toggles">
            <label class="toggle skip-toggle">
              <input
                type="checkbox"
                :checked="draft.skipped[index]"
                :aria-label="`Skip ${name} this round`"
                @change="toggleSkip(index)"
              />
              <span>Skip</span>
            </label>
            <label class="toggle declarer-toggle">
              <input
                type="radio"
                name="declarer"
                :checked="draft.declarer === index"
                :disabled="draft.skipped[index]"
                :aria-label="`${name} declared`"
                @change="selectDeclarer(index)"
              />
              <span>Declared</span>
            </label>
          </div>
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
              :disabled="draft.skipped[index]"
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
              :disabled="draft.declarer === index || draft.skipped[index]"
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
        :disabled="!canSubmit"
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

.player-entry.skipped {
  border-style: dashed;
  background: var(--surface-2);
}

.player-entry.skipped .player-name {
  color: var(--muted);
}

.player-name {
  font-weight: 600;
  font-size: 0.92rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-toggles {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: none;
}

.toggle {
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

.toggle input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.toggle input:disabled {
  cursor: not-allowed;
}

.declarer-toggle input {
  accent-color: var(--gold);
}

.skip-toggle input {
  accent-color: var(--muted);
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
