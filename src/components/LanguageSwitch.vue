<script setup lang="ts">
import { computed } from 'vue'
import { getCurrentLocale, setLocale } from '../i18n'

const currentLocale = computed(() => getCurrentLocale())

const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
]

function switchLanguage(locale: string) {
  setLocale(locale)
}
</script>

<template>
  <div class="relative">
    <!-- 当前语言显示 -->
    <div class="group relative cursor-pointer text-xs text-blue-600 font-medium transition-colors duration-200 hover:text-blue-700">
      {{ languages.find(lang => lang.code === currentLocale)?.name }}

      <!-- 激活状态指示器 -->
      <div class="absolute left-0 h-0.5 w-full rounded-full bg-blue-600 -bottom-1" />

      <!-- 下拉菜单 -->
      <div class="invisible absolute left-0 top-full z-50 mt-1 min-w-20 border border-gray-200 rounded-md bg-white opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
        <div
          v-for="lang in languages"
          :key="lang.code"
          class="cursor-pointer px-3 py-2 text-xs transition-colors duration-150"
          :class="[
            lang.code === currentLocale
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
          ]"
          @click="switchLanguage(lang.code)"
        >
          <div class="flex items-center justify-between">
            <span>{{ lang.name }}</span>
            <!-- 当前选中语言的勾选标记 -->
            <svg
              v-if="lang.code === currentLocale"
              class="h-3 w-3 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
