<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// 排序字段类型
type SortField = 'rank' | 'last_24h_mindshare' | 'change_24h_ratio' | 'last_48h_mindshare' | 'change_48h_ratio' | 'last_7d_mindshare' | 'change_7d_ratio' | 'last_30d_mindshare' | 'last_3m_mindshare' | 'last_6m_mindshare' | 'last_12m_mindshare'

interface Props {
  selectedDuration: string
  sortField: SortField
  sortOrder: 'asc' | 'desc'
}

interface Emits {
  (e: 'sort', field: SortField): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

// 处理排序点击
function handleSort(field: SortField) {
  emit('sort', field)
}
</script>

<template>
  <thead class="bg-gray-50">
    <tr>
      <!-- 代币信息 -->
      <th class="sticky top-0 min-w-[200px] bg-gray-50 px-4 py-3 text-left text-xs text-gray-500 font-medium tracking-wider uppercase">
        {{ t('table.token') }}
      </th>

      <!-- 24h数据 -->
      <th
        class="sticky top-0 min-w-[100px] cursor-pointer bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase transition-colors hover:bg-gray-100"
        @click="handleSort('last_24h_mindshare')"
      >
        <div class="flex items-center justify-center space-x-1">
          <span>{{ t('table.24hMindshare') }}</span>
          <div class="flex flex-col">
            <svg
              class="h-3 w-3"
              :class="sortField === 'last_24h_mindshare' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 14l5-5 5 5z" />
            </svg>
            <svg
              class="h-3 w-3"
              :class="sortField === 'last_24h_mindshare' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </th>
      <th
        class="sticky top-0 min-w-[100px] cursor-pointer bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase transition-colors hover:bg-gray-100"
        @click="handleSort('change_24h_ratio')"
      >
        <div class="flex items-center justify-center space-x-1">
          <span>{{ t('table.24hChange') }}</span>
          <div class="flex flex-col">
            <svg
              class="h-3 w-3"
              :class="sortField === 'change_24h_ratio' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 14l5-5 5 5z" />
            </svg>
            <svg
              class="h-3 w-3"
              :class="sortField === 'change_24h_ratio' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </th>

      <!-- 48h数据 -->
      <th
        class="sticky top-0 min-w-[100px] cursor-pointer bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase transition-colors hover:bg-gray-100"
        @click="handleSort('last_48h_mindshare')"
      >
        <div class="flex items-center justify-center space-x-1">
          <span>{{ t('table.48hMindshare') }}</span>
          <div class="flex flex-col">
            <svg
              class="h-3 w-3"
              :class="sortField === 'last_48h_mindshare' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 14l5-5 5 5z" />
            </svg>
            <svg
              class="h-3 w-3"
              :class="sortField === 'last_48h_mindshare' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </th>
      <th
        class="sticky top-0 min-w-[100px] cursor-pointer bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase transition-colors hover:bg-gray-100"
        @click="handleSort('change_48h_ratio')"
      >
        <div class="flex items-center justify-center space-x-1">
          <span>{{ t('table.48hChange') }}</span>
          <div class="flex flex-col">
            <svg
              class="h-3 w-3"
              :class="sortField === 'change_48h_ratio' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 14l5-5 5 5z" />
            </svg>
            <svg
              class="h-3 w-3"
              :class="sortField === 'change_48h_ratio' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </th>

      <!-- 7天数据 -->
      <th
        class="sticky top-0 min-w-[100px] cursor-pointer bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase transition-colors hover:bg-gray-100"
        @click="handleSort('last_7d_mindshare')"
      >
        <div class="flex items-center justify-center space-x-1">
          <span>{{ t('table.7dMindshare') }}</span>
          <div class="flex flex-col">
            <svg
              class="h-3 w-3"
              :class="sortField === 'last_7d_mindshare' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 14l5-5 5 5z" />
            </svg>
            <svg
              class="h-3 w-3"
              :class="sortField === 'last_7d_mindshare' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </th>
      <th
        class="sticky top-0 min-w-[100px] cursor-pointer bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase transition-colors hover:bg-gray-100"
        @click="handleSort('change_7d_ratio')"
      >
        <div class="flex items-center justify-center space-x-1">
          <span>{{ t('table.7dChange') }}</span>
          <div class="flex flex-col">
            <svg
              class="h-3 w-3"
              :class="sortField === 'change_7d_ratio' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 14l5-5 5 5z" />
            </svg>
            <svg
              class="h-3 w-3"
              :class="sortField === 'change_7d_ratio' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </th>

      <!-- 30天数据 -->
      <th
        class="sticky top-0 min-w-[100px] cursor-pointer bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase transition-colors hover:bg-gray-100"
        @click="handleSort('last_30d_mindshare')"
      >
        <div class="flex items-center justify-center space-x-1">
          <span>{{ t('table.30dMindshare') }}</span>
          <div class="flex flex-col">
            <svg
              class="h-3 w-3"
              :class="sortField === 'last_30d_mindshare' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 14l5-5 5 5z" />
            </svg>
            <svg
              class="h-3 w-3"
              :class="sortField === 'last_30d_mindshare' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </th>

      <!-- 3个月数据 -->
      <th
        class="sticky top-0 min-w-[100px] cursor-pointer bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase transition-colors hover:bg-gray-100"
        @click="handleSort('last_3m_mindshare')"
      >
        <div class="flex items-center justify-center space-x-1">
          <span>{{ t('table.3mMindshare') }}</span>
          <div class="flex flex-col">
            <svg
              class="h-3 w-3"
              :class="sortField === 'last_3m_mindshare' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 14l5-5 5 5z" />
            </svg>
            <svg
              class="h-3 w-3"
              :class="sortField === 'last_3m_mindshare' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </th>

      <!-- 6个月数据 -->
      <th
        class="sticky top-0 min-w-[100px] cursor-pointer bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase transition-colors hover:bg-gray-100"
        @click="handleSort('last_6m_mindshare')"
      >
        <div class="flex items-center justify-center space-x-1">
          <span>{{ t('table.6mMindshare') }}</span>
          <div class="flex flex-col">
            <svg
              class="h-3 w-3"
              :class="sortField === 'last_6m_mindshare' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 14l5-5 5 5z" />
            </svg>
            <svg
              class="h-3 w-3"
              :class="sortField === 'last_6m_mindshare' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </th>

      <!-- 12个月数据 -->
      <th
        class="sticky top-0 min-w-[100px] cursor-pointer bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase transition-colors hover:bg-gray-100"
        @click="handleSort('last_12m_mindshare')"
      >
        <div class="flex items-center justify-center space-x-1">
          <span>{{ t('table.12mMindshare') }}</span>
          <div class="flex flex-col">
            <svg
              class="h-3 w-3"
              :class="sortField === 'last_12m_mindshare' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 14l5-5 5 5z" />
            </svg>
            <svg
              class="h-3 w-3"
              :class="sortField === 'last_12m_mindshare' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </th>
    </tr>
  </thead>
</template>
