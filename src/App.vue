<script setup lang="ts">
import { Analytics } from '@vercel/analytics/vue'
</script>

<template>
  <main font-sans p="x-4 y-10" text="center gray-700 dark:gray-200">
    <RouterView />
    <Analytics />
  </main>
</template>
