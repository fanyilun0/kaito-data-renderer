<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { isTokenIssued } from '../config/tokenConfig'
// 根据当前语言设置 dayjs 的 locale
import { getCurrentLocale } from '../i18n'

import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)

const { t } = useI18n()
watch(() => getCurrentLocale(), (locale) => {
  dayjs.locale(locale === 'zh' ? 'zh-cn' : 'en')
}, { immediate: true })

// 类型定义
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

// 数据加载状态
const loading = ref(true)
const rewardData = ref<RewardItem[]>([])
const notification = ref({ show: false, message: '', type: 'info' })

// 搜索关键词
const searchKeyword = ref('')

// 状态过滤
const statusFilter = ref('all')

// 分类过滤
const categoryFilter = ref('all')

// 代币发行状态过滤
const tokenIssuedFilter = ref('all')

// 排序相关
type SortField = 'reward_station_order' | 'reward_station_project_name' | 'reward_station_list_status' | 'reward_station_action_status' | 'reward_station_token_issued' | 'created' | 'modified'

const sortField = ref<SortField>('reward_station_order')
const sortOrder = ref<'asc' | 'desc'>('asc')

// 状态选项
const statusOptions = computed(() => [
  { value: 'all', label: t('reward.allStatus') },
  { value: 'Current', label: t('reward.statusValues.current') },
  { value: 'Past', label: t('reward.statusValues.past') },
  { value: 'Upcoming', label: t('reward.statusValues.upcoming') },
])

// 分类选项
const categoryOptions = computed(() => {
  const allCategories = new Set<string>()
  rewardData.value.forEach((item) => {
    item.reward_station_categories?.forEach(cat => allCategories.add(cat))
  })

  return [
    { value: 'all', label: t('reward.allCategories') },
    ...Array.from(allCategories).map(cat => ({ value: cat, label: cat })),
  ]
})

// 代币发行状态选项
const tokenIssuedOptions = computed(() => [
  { value: 'all', label: t('reward.allTokenStatus') },
  { value: 'issued', label: t('reward.tokenStatusValues.issued') },
  { value: 'not_issued', label: t('reward.tokenStatusValues.notIssued') },
])

// 加载数据
async function loadRewardData() {
  loading.value = true
  try {
    const response = await fetch('./data/reward station.json')
    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data)) {
        rewardData.value = data.map((item, index) => ({
          ...item,
          reward_station_order: item.reward_station_order ?? index,
        }))
        showNotification(t('reward.loadSuccess', { count: data.length }), 'info')
      }
      else {
        throw new TypeError('Invalid data format')
      }
    }
    else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }
  catch (error) {
    console.error('加载 reward station 数据失败:', error)
    showNotification(t('reward.loadFailed'), 'error')
    rewardData.value = []
  }
  finally {
    loading.value = false
  }
}

// 排序函数
function sortRewardData(data: RewardItem[], field: string, order: 'asc' | 'desc') {
  return [...data].sort((a, b) => {
    let aValue = (a as any)[field]
    let bValue = (b as any)[field]

    // 处理字符串字段
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    // 处理数值字段
    if (field === 'reward_station_order') {
      aValue = Number(aValue) || 999999
      bValue = Number(bValue) || 999999
    }

    if (aValue < bValue)
      return order === 'asc' ? -1 : 1
    if (aValue > bValue)
      return order === 'asc' ? 1 : -1
    return 0
  })
}

// 切换排序
function toggleSort(field: SortField) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  }
  else {
    sortField.value = field
    sortOrder.value = field === 'reward_station_order' ? 'asc' : 'desc'
  }
}

// 过滤和排序后的奖励列表
const filteredRewards = computed(() => {
  let filtered = rewardData.value

  // 搜索过滤
  if (searchKeyword.value) {
    filtered = filtered.filter((item) => {
      const projectName = item.reward_station_project_name?.toLowerCase() || ''
      const ticker = item.reward_station_ticker?.toLowerCase() || ''
      const description = item.reward_station_description?.toLowerCase() || ''
      const keyword = searchKeyword.value.toLowerCase()

      return projectName.includes(keyword)
        || ticker.includes(keyword)
        || description.includes(keyword)
    })
  }

  // 状态过滤
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(item => item.reward_station_list_status === statusFilter.value)
  }

  // 分类过滤
  if (categoryFilter.value !== 'all') {
    filtered = filtered.filter(item =>
      item.reward_station_categories?.includes(categoryFilter.value),
    )
  }

  // 代币发行状态过滤
  if (tokenIssuedFilter.value !== 'all') {
    filtered = filtered.filter((item) => {
      const hasIssuedTokens = isTokenIssued(item.reward_station_project_name)
      return tokenIssuedFilter.value === 'issued' ? hasIssuedTokens : !hasIssuedTokens
    })
  }

  // 排序
  return sortRewardData(filtered, sortField.value, sortOrder.value)
})

// 显示通知
function showNotification(message: string, type: 'info' | 'error' = 'info') {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// 在组件挂载时加载数据
onMounted(() => {
  loadRewardData()
})
</script>

<template>
  <AppLayout width="1600px">
    <div class="mb-6">
      <div class="flex flex-col space-y-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <AppHeader
            :title="t('reward.title')"
            current-route="reward"
          />

          <div class="flex flex-wrap items-center space-x-3">
            <!-- 搜索框 -->
            <div class="relative w-260px">
              <div class="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                </svg>
              </div>
              <input
                v-model="searchKeyword"
                type="text"
                :placeholder="t('reward.searchPlaceholder')"
                class="w-full border border-gray-300 rounded bg-white px-3 py-2 pl-10 text-sm transition-all duration-200 focus:border-blue-500 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
            </div>

            <!-- 状态过滤 -->
            <AppSelect
              v-model="statusFilter"
              :options="statusOptions"
            />

            <!-- 分类过滤 -->
            <AppSelect
              v-model="categoryFilter"
              :options="categoryOptions"
            />

            <!-- 代币发行状态过滤 -->
            <AppSelect
              v-model="tokenIssuedFilter"
              :options="tokenIssuedOptions"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-12 w-12 animate-spin border-b-2 border-t-2 border-blue-500 rounded-full" />
    </div>

    <div v-else-if="rewardData.length === 0" class="flex items-center justify-center py-12">
      <div class="text-gray-500">
        {{ t('reward.noDataFound') }}
      </div>
    </div>

    <div v-else class="table-container">
      <table class="min-w-full bg-white">
        <RewardTableHeader
          :sort-field="sortField"
          :sort-order="sortOrder"
          @sort="toggleSort"
        />
        <tbody class="divide-y divide-gray-200">
          <RewardTableRow
            v-for="(item) in filteredRewards"
            :key="item.twitter_id || item.reward_station_project_name"
            :item="item"
          />
        </tbody>
      </table>
    </div>

    <!-- 通知提示 -->
    <div
      v-if="notification.show"
      class="fixed bottom-4 right-4 rounded-md px-4 py-2 text-white"
      :class="notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'"
    >
      {{ notification.message }}
    </div>
  </AppLayout>
</template>

<style scoped>
.table-container {
  max-height: 70vh;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

/* 自定义滚动条样式 */
.table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

th {
  white-space: nowrap;
  z-index: 1;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
}

/* 确保表头在滚动时保持可见 */
thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

/* 美化按钮过渡效果 */
button,
a {
  transition: all 0.2s ease;
}
</style>
