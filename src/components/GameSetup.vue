<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const emit = defineEmits<{ start: [names: string[]] }>()

const MIN_PLAYERS = 2
const MAX_PLAYERS = 8

const count = ref(3)
const names = ref<string[]>(Array.from({ length: count.value }, () => ''))

const options = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, i) => i + MIN_PLAYERS,
)

// Resize the name list when the player count changes, keeping what was typed.
watch(count, (next) => {
  const resized = Array.from({ length: next }, (_, i) => names.value[i] ?? '')
  names.value = resized
})

const ready = computed(() => names.value.every((name) => name.trim().length > 0))

function start() {
  if (!ready.value) return
  emit('start', names.value)
}
</script>

<template>
  <div class="setup-card">
    <h2>New game</h2>
    <p class="sub">Set the table, then keep score round by round.</p>

    <form @submit.prevent="start">
      <div class="field">
        <label for="player-count">Number of players</label>
        <select id="player-count" v-model.number="count">
          <option v-for="n in options" :key="n" :value="n">{{ n }} players</option>
        </select>
      </div>

      <div class="name-grid">
        <div v-for="(_, index) in names" :key="index" class="name-row">
          <span class="swatch" aria-hidden="true"></span>
          <input
            v-model="names[index]"
            type="text"
            :placeholder="`Player ${index + 1} name`"
            :aria-label="`Player ${index + 1} name`"
          />
        </div>
      </div>

      <button class="btn btn-primary start" type="submit" :disabled="!ready">
        Start game
      </button>
    </form>
  </div>
</template>

<style scoped>
.setup-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--shadow);
  padding: 2.25rem;
  max-width: 460px;
  margin: 3rem auto 0;
}

h2 {
  font-size: 1.35rem;
  margin-bottom: 0.35rem;
}

.sub {
  color: var(--muted);
  font-size: 0.92rem;
  margin: 0 0 1.75rem;
}

.field {
  margin-bottom: 1.1rem;
}

.field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--muted);
  margin-bottom: 0.4rem;
}

select,
input[type='text'] {
  width: 100%;
  padding: 0.6rem 0.7rem;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  font-size: 0.95rem;
  font-family: inherit;
}

.name-grid {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-bottom: 1.5rem;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.swatch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  flex: none;
}

.name-row input {
  flex: 1;
}

.start {
  width: 100%;
}
</style>
