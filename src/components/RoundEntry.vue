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

    <div class="entry-scroll">
      <table class="entry-table">
        <thead>
          <tr>
            <th>Declared</th>
            <th v-for="(name, index) in players" :key="index">{{ name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="hint-cell">
              <template v-if="draft.declarer === null">
                Mark who declared this round.
              </template>
              <template v-else>
                <b>{{ players[draft.declarer] }}</b> declared this round.
              </template>
            </td>
            <td v-for="(name, index) in players" :key="index">
              <label class="declarer-radio">
                <input
                  type="radio"
                  name="declarer"
                  :checked="draft.declarer === index"
                  :aria-label="`${name} declared`"
                  @change="selectDeclarer(index)"
                />
              </label>
            </td>
          </tr>

          <tr>
            <td class="row-label">Value</td>
            <td v-for="(name, index) in players" :key="index">
              <input
                v-model="draft.values[index]"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                :aria-label="`${name} value`"
              />
            </td>
          </tr>

          <tr>
            <td class="row-label">Penalty</td>
            <td v-for="(name, index) in players" :key="index">
              <input
                v-model="draft.penalties[index]"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                :disabled="draft.declarer === index"
                :aria-label="`${name} penalty`"
              />
            </td>
          </tr>
        </tbody>
      </table>
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
  padding: 1.25rem 1.25rem 1.4rem;
  margin-bottom: 2rem;
}

.entry-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.entry-head h3 {
  font-size: 1.02rem;
}

.entry-scroll {
  overflow-x: auto;
}

.entry-table {
  border-collapse: collapse;
  width: 100%;
  min-width: 420px;
}

.entry-table th {
  text-align: left;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 600;
  padding: 0 0.6rem 0.5rem 0;
  white-space: nowrap;
}

.entry-table td {
  padding: 0.3rem 0.6rem 0.3rem 0;
  vertical-align: middle;
}

.hint-cell {
  font-size: 0.78rem;
  color: var(--muted);
  font-weight: 500;
  max-width: 170px;
  line-height: 1.3;
  padding-right: 1rem;
}

.hint-cell b {
  color: var(--gold);
  font-weight: 700;
}

.row-label {
  font-weight: 600;
  padding-right: 1rem;
  white-space: nowrap;
}

input[type='number'] {
  width: 68px;
  padding: 0.4rem 0.5rem;
  border-radius: 7px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  font-size: 0.92rem;
  font-family: inherit;
}

input[type='number']:disabled {
  background: var(--surface-2);
  color: var(--muted);
}

.declarer-radio {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  cursor: pointer;
}

.declarer-radio input {
  accent-color: var(--gold);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.entry-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 1.1rem;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>
