<script setup lang="ts">
interface Props {
  modelValue: string | number
  options: Array<{ value: string | number; label: string }>
  placeholder?: string
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <select
    :value="modelValue"
    :disabled="disabled"
    class="border border-gray-300 rounded bg-white px-3 py-2 text-sm transition-colors hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-if="placeholder" value="" disabled>
      {{ placeholder }}
    </option>
    <option
      v-for="option in options"
      :key="option.value"
      :value="option.value"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<style scoped>
/* 确保下拉框在不同状态下都有统一的样式 */
select {
  min-width: 120px;
}

select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style> 