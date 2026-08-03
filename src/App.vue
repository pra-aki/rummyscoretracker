<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="wrap">
    <header class="app-header">
      <RouterLink class="brand" to="/">
        <p class="eyebrow">Score tracker</p>
        <h1>Rummy</h1>
      </RouterLink>
      <RouterLink v-if="route.name === 'game'" class="btn btn-ghost" to="/">
        New game
      </RouterLink>
    </header>

    <RouterView />
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

.brand {
  text-decoration: none;
  color: inherit;
}

.app-header h1 {
  font-size: 1.7rem;
}

.app-header .eyebrow {
  margin: 0 0 0.3rem;
}
</style>
