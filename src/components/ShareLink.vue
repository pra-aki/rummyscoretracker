<script setup lang="ts">
import { ref } from 'vue'

const copied = ref(false)
const failed = ref(false)
let resetTimer: number | undefined

async function copy() {
  const url = window.location.href
  failed.value = false
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
  } catch {
    // Clipboard access is blocked outside secure contexts and in some browsers.
    failed.value = true
  }
  window.clearTimeout(resetTimer)
  resetTimer = window.setTimeout(() => {
    copied.value = false
    failed.value = false
  }, 2500)
}
</script>

<template>
  <section class="share">
    <div class="share-text">
      <h3>Share this game</h3>
      <p>Anyone with this link can add rounds. Scores update within a few seconds.</p>
    </div>
    <div class="share-action">
      <code class="url">{{ $route.fullPath }}</code>
      <button class="btn" type="button" @click="copy">
        {{ copied ? 'Copied' : failed ? 'Press ⌘C' : 'Copy link' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.share {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
  padding: 1rem 1.1rem;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
}

h3 {
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
}

p {
  margin: 0;
  color: var(--muted);
  font-size: 0.8rem;
}

.share-action {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.url {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--muted);
  background: var(--surface-2);
  border-radius: 6px;
  padding: 0.35rem 0.5rem;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
