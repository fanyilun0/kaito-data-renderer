<script setup lang="ts">
interface Props {
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: '1200px'
})
</script>

<template>
  <div class="mx-auto px-4 py-4" :style="{ maxWidth: props.maxWidth }">
    <slot />
  </div>
</template>

<style scoped>
/* 统一的容器样式 */
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
</style> 