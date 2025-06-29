<script setup lang="ts">
interface TickerItem {
  ticker_id: string
  ticker: string
  fullname: string
  logo?: string
  rank: number
  // 各时间段的提及度
  last_24h_mindshare: number
  last_48h_mindshare: number
  last_7d_mindshare: number
  last_30d_mindshare: number
  last_3m_mindshare: number
  last_6m_mindshare: number
  last_12m_mindshare: number
  // 各时间段的变化比率
  change_24h_ratio: number
  change_48h_ratio: number
  change_7d_ratio: number
  change_30d_ratio: number
  change_3m_ratio: number
  change_6m_ratio: number
  change_12m_ratio: number
}

interface Props {
  item: TickerItem
  selectedDuration: string
}

const props = defineProps<Props>()

const { isNaN } = Number

// 格式化百分比
function formatPercentage(value: number | undefined | null) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0.00%'
  }
  const numValue = Number(value)
  return `${(numValue * 100).toFixed(2)}%`
}

// 格式化变化率
function formatChangeRatio(value: number | undefined | null) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return '0.00%'
  }
  const numValue = Number(value)
  const sign = numValue > 0 ? '+' : ''
  return `${sign}${(numValue * 100).toFixed(2)}%`
}

// 获取变化率的样式类
function getChangeRatioClass(value: number | undefined | null) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return 'text-gray-500'
  }
  const numValue = Number(value)
  if (numValue > 0)
    return 'text-green-600'
  if (numValue < 0)
    return 'text-red-600'
  return 'text-gray-500'
}

// 检查列是否为当前选择的时间段
function isCurrentDurationColumn(columnDuration: string): boolean {
  return props.selectedDuration === columnDuration
}

// 获取当前时间段对应的列样式
function getCurrentDurationColumnClass(columnDuration: string): string {
  return isCurrentDurationColumn(columnDuration) ? 'bg-blue-50 font-semibold' : ''
}
</script>

<template>
  <tr class="hover:bg-gray-50">
    <!-- 代币信息 -->
    <td class="px-4 py-4">
      <div class="flex items-center space-x-3">
        <div class="w-8 text-sm text-gray-600 font-medium">
          {{ item.rank }}
        </div>
        <img
          v-if="item.logo"
          :src="item.logo"
          :alt="item.ticker"
          class="h-8 w-8 flex-shrink-0 rounded-full"
        >
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm text-gray-900 font-medium">
            {{ item.ticker }}
          </div>
          <div class="truncate text-xs text-gray-500">
            {{ item.fullname }}
          </div>
        </div>
      </div>
    </td>

    <!-- 24h数据 -->
    <td class="px-3 py-4 text-center text-xs" :class="getCurrentDurationColumnClass('24h')">
      {{ formatPercentage(item.last_24h_mindshare) }}
    </td>
    <td class="px-3 py-4 text-center text-xs" :class="getCurrentDurationColumnClass('24h')">
      <span :class="getChangeRatioClass(item.change_24h_ratio)">
        {{ formatChangeRatio(item.change_24h_ratio) }}
      </span>
    </td>

    <!-- 48h数据 -->
    <td class="px-3 py-4 text-center text-xs" :class="getCurrentDurationColumnClass('48h')">
      {{ formatPercentage(item.last_48h_mindshare) }}
    </td>
    <td class="px-3 py-4 text-center text-xs" :class="getCurrentDurationColumnClass('48h')">
      <span :class="getChangeRatioClass(item.change_48h_ratio)">
        {{ formatChangeRatio(item.change_48h_ratio) }}
      </span>
    </td>

    <!-- 7天数据 -->
    <td class="px-3 py-4 text-center text-xs" :class="getCurrentDurationColumnClass('7d')">
      {{ formatPercentage(item.last_7d_mindshare) }}
    </td>
    <td class="px-3 py-4 text-center text-xs" :class="getCurrentDurationColumnClass('7d')">
      <span :class="getChangeRatioClass(item.change_7d_ratio)">
        {{ formatChangeRatio(item.change_7d_ratio) }}
      </span>
    </td>

    <!-- 30天数据 -->
    <td class="px-3 py-4 text-center text-xs" :class="getCurrentDurationColumnClass('30d')">
      {{ formatPercentage(item.last_30d_mindshare) }}
    </td>

    <!-- 3个月数据 -->
    <td class="px-3 py-4 text-center text-xs" :class="getCurrentDurationColumnClass('3m')">
      {{ formatPercentage(item.last_3m_mindshare) }}
    </td>

    <!-- 6个月数据 -->
    <td class="px-3 py-4 text-center text-xs" :class="getCurrentDurationColumnClass('6m')">
      {{ formatPercentage(item.last_6m_mindshare) }}
    </td>

    <!-- 12个月数据 -->
    <td class="px-3 py-4 text-center text-xs" :class="getCurrentDurationColumnClass('12m')">
      {{ formatPercentage(item.last_12m_mindshare) }}
    </td>
  </tr>
</template>
