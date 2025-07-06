<script setup lang="ts">
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { isTokenIssued } from '../config/tokenConfig'

interface RewardItem {
  reward_station_project_name: string
  reward_station_ticker: string
  reward_station_description: string
  reward_station_pool: string
  reward_station_url: string
  reward_station_twitter_handle: string
  reward_station_twitter_img: string
  reward_station_active_period: number[]
  reward_station_claim_period: number[]
  reward_station_action_status: string
  reward_station_list_status: string
  reward_station_order?: number
  reward_station_categories: string[]
  created: string
  modified: string
  twitter_id: string
  eligible_item: any
  reward_station_open_code?: string
}

interface Props {
  item: RewardItem
}

defineProps<Props>()
const { t } = useI18n()

// 格式化时间戳为日期
function formatTimestamp(timestamp: number) {
  if (!timestamp)
    return '-'
  return dayjs(timestamp).format('YYYY-MM-DD')
}

// 获取状态样式类
function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case 'current':
      return 'bg-green-100 text-green-800'
    case 'past':
      return 'bg-gray-100 text-gray-800'
    case 'upcoming':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// 获取分类样式类
function getCategoryClass(category: string) {
  const colors = {
    Yap: 'bg-purple-100 text-purple-800',
    Eco: 'bg-green-100 text-green-800',
    Use: 'bg-blue-100 text-blue-800',
    Trade: 'bg-orange-100 text-orange-800',
    Refer: 'bg-pink-100 text-pink-800',
  }
  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}
</script>

<template>
  <tr class="hover:bg-gray-50">
    <!-- 项目信息 -->
    <td class="px-4 py-4">
      <div class="flex items-center space-x-3">
        <img
          v-if="item.reward_station_twitter_img"
          :src="item.reward_station_twitter_img"
          :alt="item.reward_station_project_name"
          class="h-10 w-10 flex-shrink-0 rounded-full"
        >
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm text-gray-900 font-medium">
            {{ item.reward_station_project_name }}
          </div>
          <div class="truncate text-xs text-gray-500">
            <a
              :href="`https://twitter.com/${item.reward_station_twitter_handle}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 transition-colors hover:text-blue-800"
            >
              @{{ item.reward_station_twitter_handle }}
            </a>
          </div>
          <div class="truncate text-xs text-blue-600">
            {{ item.reward_station_ticker }}
          </div>
        </div>
      </div>
    </td>

    <!-- 描述 -->
    <td class="px-3 py-4">
      <div class="max-w-sm text-xs text-gray-700">
        <div class="line-clamp-3">
          {{ item.reward_station_description }}
        </div>
      </div>
    </td>

    <!-- 奖池大小 -->
    <td class="px-3 py-4 text-center">
      <div class="text-xs text-gray-900 font-medium">
        {{ item.reward_station_pool }}
      </div>
    </td>

    <!-- 状态 -->
    <td class="px-3 py-4 text-center">
      <span
        class="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
        :class="getStatusClass(item.reward_station_list_status)"
      >
        {{ t(`reward.statusValues.${item.reward_station_list_status.toLowerCase()}`) }}
      </span>
    </td>

    <!-- 分类 -->
    <td class="px-3 py-4 text-center">
      <div class="flex flex-wrap justify-center gap-1">
        <span
          v-for="category in item.reward_station_categories"
          :key="category"
          class="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
          :class="getCategoryClass(category)"
        >
          {{ category }}
        </span>
      </div>
    </td>

    <!-- 活跃期 -->
    <td class="px-3 py-4 text-center text-xs">
      <div v-if="item.reward_station_active_period && item.reward_station_active_period.length > 0">
        <div v-for="(period, index) in item.reward_station_active_period" :key="index">
          {{ formatTimestamp(period) }}
        </div>
      </div>
      <div v-else class="text-gray-400">
        -
      </div>
    </td>

    <!-- 认领期 -->
    <td class="px-3 py-4 text-center text-xs">
      <div v-if="item.reward_station_claim_period && item.reward_station_claim_period.length > 0">
        <div v-for="(period, index) in item.reward_station_claim_period" :key="index">
          {{ formatTimestamp(period) }}
        </div>
      </div>
      <div v-else class="text-gray-400">
        -
      </div>
    </td>

    <!-- 是否发行代币 -->
    <td class="px-3 py-4 text-center">
      <div v-if="isTokenIssued(item.reward_station_project_name)">
        <span class="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 font-semibold">
          {{ item.reward_station_ticker }}
        </span>
      </div>
      <div v-else class="text-xs text-gray-400">
        {{ t('reward.notIssued') }}
      </div>
    </td>

    <!-- URL -->
    <td class="px-3 py-4 text-center">
      <a
        v-if="item.reward_station_url"
        :href="item.reward_station_url"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-blue-600 underline transition-colors hover:text-blue-800"
      >
        {{ t('reward.viewDetails') }}
      </a>
      <div v-else class="text-xs text-gray-400">
        {{ t('reward.noLink') }}
      </div>
    </td>
  </tr>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
