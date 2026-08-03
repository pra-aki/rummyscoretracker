<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import GameSetup from '@/components/GameSetup.vue'
import { createGame } from '@/lib/api'

const router = useRouter()
const creating = ref(false)
const error = ref<string | null>(null)

async function start(names: string[]) {
  creating.value = true
  error.value = null
  try {
    const { id } = await createGame(names)
    await router.push({ name: 'game', params: { id } })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not start the game.'
    creating.value = false
  }
}
</script>

<template>
  <GameSetup :busy="creating" :error="error" @start="start" />
</template>
