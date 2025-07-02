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
    <select
      :value="currentLocale"
      class="appearance-none border border-gray-300 rounded bg-white px-3 py-2 pr-8 text-sm transition-all duration-200 focus:border-blue-500 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      @change="switchLanguage(($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="lang in languages"
        :key="lang.code"
        :value="lang.code"
      >
        {{ lang.name }}
      </option>
    </select>
    <div class="pointer-events-none absolute inset-y-0 right-2 flex items-center">
      <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
</template>
