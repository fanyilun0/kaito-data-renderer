<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface Props {
  modelValue: string | number
  options: Array<{ value: string | number, label: string }>
  placeholder?: string
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = ref(false)
const isFocused = ref(false)
const selectRef = ref<HTMLDivElement>()

// 获取当前选中项的标签
const selectedLabel = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '')
    return props.placeholder || ''
  const selectedOption = props.options.find(option => option.value === props.modelValue)
  return selectedOption?.label || ''
})

// 选择项目
function selectOption(value: string | number) {
  emit('update:modelValue', value)
  isOpen.value = false
}

// 切换下拉框状态
function toggleDropdown() {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
    isFocused.value = isOpen.value
  }
}

// 点击外部关闭下拉框
function handleClickOutside(event: MouseEvent) {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    isOpen.value = false
    isFocused.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="selectRef" class="relative inline-block min-w-[120px] w-auto">
    <!-- 选择框主体 -->
    <div
      class="w-auto flex cursor-pointer items-center justify-between border rounded bg-white px-3 py-2 text-sm transition-all duration-200" :class="[
        {
          'border-gray-300 hover:border-gray-400': !disabled && !isFocused,
          'border-blue-500 ring-2 ring-blue-500/20': isFocused || isOpen,
          'opacity-60 cursor-not-allowed border-gray-300': disabled,
        },
      ]"
      @click="toggleDropdown"
    >
      <span :class="{ 'text-gray-500': props.modelValue === null || props.modelValue === undefined || props.modelValue === '' }">
        {{ selectedLabel }}
      </span>
      <svg
        class="ml-2 h-4 w-4 flex-shrink-0 transition-transform" :class="[
          { 'rotate-180': isOpen },
        ]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <!-- 下拉选项列表 -->
    <div
      v-if="isOpen"
      class="absolute left-0 right-0 top-full z-50 mt-1 max-h-[240px] overflow-y-auto border border-gray-300 rounded bg-white shadow-lg"
    >
      <!-- placeholder 选项 -->
      <div
        v-if="placeholder && (props.modelValue === null || props.modelValue === undefined || props.modelValue === '')"
        class="cursor-default px-3 py-2 text-sm text-gray-500"
      >
        {{ placeholder }}
      </div>

      <!-- 选项列表 -->
      <div
        v-for="option in options"
        :key="option.value"
        class="cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-gray-100" :class="[
          {
            'bg-blue-50 text-blue-600': option.value === modelValue,
          },
        ]"
        @click="selectOption(option.value)"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Firefox 滚动条样式 */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}
</style>
