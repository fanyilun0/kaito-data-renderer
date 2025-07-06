<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// 排序字段类型
type SortField = 'reward_station_order' | 'reward_station_project_name' | 'reward_station_list_status' | 'reward_station_action_status' | 'reward_station_token_issued' | 'created' | 'modified'

interface Props {
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
      <!-- 项目信息 -->
      <th class="sticky top-0 min-w-[200px] bg-gray-50 px-4 py-3 text-left text-xs text-gray-500 font-medium tracking-wider uppercase">
        {{ t('reward.project') }}
      </th>

      <!-- 描述 -->
      <th class="sticky top-0 min-w-[300px] bg-gray-50 px-3 py-3 text-left text-xs text-gray-500 font-medium tracking-wider uppercase">
        {{ t('reward.description') }}
      </th>

      <!-- 奖池大小 -->
      <th class="sticky top-0 min-w-[150px] bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase">
        {{ t('reward.pool') }}
      </th>

      <!-- 状态 -->
      <th
        class="sticky top-0 min-w-[100px] cursor-pointer bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase transition-colors hover:bg-gray-100"
        @click="handleSort('reward_station_list_status')"
      >
        <div class="flex items-center justify-center space-x-1">
          <span>{{ t('reward.status') }}</span>
          <div class="flex flex-col">
            <svg
              class="h-3 w-3"
              :class="sortField === 'reward_station_list_status' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 14l5-5 5 5z" />
            </svg>
            <svg
              class="h-3 w-3"
              :class="sortField === 'reward_station_list_status' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </th>

      <!-- 分类 -->
      <th class="sticky top-0 min-w-[120px] bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase">
        {{ t('reward.categories') }}
      </th>

      <!-- 活跃期 -->
      <th class="sticky top-0 min-w-[150px] bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase">
        {{ t('reward.activePeriod') }}
      </th>

      <!-- 认领期 -->
      <th class="sticky top-0 min-w-[150px] bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase">
        {{ t('reward.claimPeriod') }}
      </th>

      <!-- 是否发行代币 -->
      <th
        class="sticky top-0 min-w-[120px] cursor-pointer bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase transition-colors hover:bg-gray-100"
        @click="handleSort('reward_station_token_issued')"
      >
        <div class="flex items-center justify-center space-x-1">
          <span>{{ t('reward.tokenIssued') }}</span>
          <div class="flex flex-col">
            <svg
              class="h-3 w-3"
              :class="sortField === 'reward_station_token_issued' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 14l5-5 5 5z" />
            </svg>
            <svg
              class="h-3 w-3"
              :class="sortField === 'reward_station_token_issued' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </th>

      <!-- URL -->
      <th class="sticky top-0 min-w-[100px] bg-gray-50 px-3 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase">
        {{ t('reward.url') }}
      </th>
    </tr>
  </thead>
</template>
