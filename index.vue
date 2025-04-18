<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, onMounted, ref } from 'vue'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// API请求参数
const API_URL = 'https://hub.kaito.ai/api/v1/gateway/ai?nft=false&ex_official=false&weighted=false&duration=24h&sort_type=desc&type=heatmap&pre_tge=true'

const STORAGE_KEY = 'hiddenTickerIds'

// 数据加载状态
const loading = ref(true)
const tickerData = ref([])
const updateTime = ref(dayjs().format('YYYY-MM-DD'))
const notification = ref({ show: false, message: '', type: 'info' })

// 从API获取数据
async function fetchData() {
  loading.value = true
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: '/api/yapper/dashboard_ticker_mindshare',
        method: 'GET',
        params: {
          nft: 'false',
          ex_official: 'false',
          weighted: 'false',
          duration: '24h',
          sort_type: 'desc',
          type: 'heatmap',
          pre_tge: 'true',
        },
        body: {},
      }),
    })

    const data = await response.json()
    if (data.resultWithTicker) {
      tickerData.value = data.resultWithTicker
    }
  }
  catch (error) {
    console.error('获取数据失败:', error)
    showNotification('获取数据失败', 'error')
  }
  finally {
    loading.value = false
  }
}

// 显示通知
function showNotification(message, type = 'info') {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// 在组件挂载时获取数据
onMounted(() => {
  fetchData()
})

// 从localStorage获取隐藏的Ticker ID,并与默认隐藏ID合并
function getHiddenIds() {
  const localHidden = localStorage.getItem(STORAGE_KEY)
  const localIds = localHidden ? JSON.parse(localHidden) : []
  // 合并本地存储和默认隐藏ID,并去重
  return [...new Set([...localIds])]
}

// 隐藏的Ticker ID
const hiddenTickerIds = ref(getHiddenIds())

// 搜索关键词
const searchKeyword = ref('')
const showHighMindshareOnly = ref(false)

// 判断是否高关注度项目 (mindshare > 0.1)
function isHighMindshare(item) {
  return item.mindshare > 0.1
}

// 过滤后的Ticker列表
const filteredTickers = computed(() => {
  return tickerData.value
    .filter(item => !hiddenTickerIds.value.includes(item.ticker_id))
    .filter((item) => {
      if (showHighMindshareOnly.value && !isHighMindshare(item))
        return false
      if (!searchKeyword.value)
        return true
      const name = item.fullname?.toLowerCase() || ''
      const ticker = item.ticker?.toLowerCase() || ''
      return name.includes(searchKeyword.value.toLowerCase())
        || ticker.includes(searchKeyword.value.toLowerCase())
    })
})

// 隐藏Ticker
function hideTicker(id) {
  if (!hiddenTickerIds.value.includes(id)) {
    hiddenTickerIds.value.push(id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenTickerIds.value))
    showNotification('已隐藏该代币')
  }
}

// 复制隐藏ID到剪贴板
async function copyHiddenIds() {
  try {
    const idsString = JSON.stringify(hiddenTickerIds.value)
    await navigator.clipboard.writeText(idsString)
    showNotification('已复制到剪贴板')
  }
  catch (err) {
    console.error('复制失败:', err)
    showNotification('复制失败', 'error')
  }
}

// 导入隐藏ID
function importHiddenIds(event) {
  const input = event.target
  const file = input.files?.[0]
  if (!file)
    return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result
      const ids = JSON.parse(content)
      if (Array.isArray(ids)) {
        // 合并导入的ID、默认ID和现有ID
        hiddenTickerIds.value = [...new Set([...hiddenTickerIds.value, ...ids])]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenTickerIds.value))
        showNotification('导入成功')
      }
    }
    catch (err) {
      console.error('导入失败:', err)
      showNotification('导入失败', 'error')
    }
  }
  reader.readAsText(file)
}

// 导出隐藏ID
function exportHiddenIds() {
  const idsString = JSON.stringify(hiddenTickerIds.value)
  const blob = new Blob([idsString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'hidden_ticker_ids.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  showNotification('已下载隐藏ID列表')
}

// 格式化百分比
function formatPercentage(value) {
  return `${(value * 100).toFixed(2)}%`
}

// 格式化变化率
function formatChangeRatio(value) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(2)}%`
}

// 处理项目链接
function getProjectLink(ticker) {
  return `https://hub.kaito.ai/assets/${ticker}`
}
</script>

<template>
  <div class="mx-auto px-4 py-4 container">
    <div class="mb-6">
      <div class="flex items-center justify-between space-x-4">
        <div class="flex flex-col items-start items-center space-x-4">
          <h1 class="text-2xl font-bold">
            KAITO-PRE-TGE热门代币提及度排行
          </h1>
          <div class="text-xs text-gray-500">
            更新时间：{{ updateTime }}
          </div>
        </div>

        <div class="max-w-2xl flex flex-1 items-center space-x-4">
          <div class="relative flex-1">
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索代币名称或代号..."
              class="w-full border border-gray-300 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
          </div>
          <div class="flex items-center space-x-2">
            <button
              class="whitespace-nowrap rounded px-4 py-2 text-sm font-medium"
              :class="showHighMindshareOnly ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'"
              @click="showHighMindshareOnly = !showHighMindshareOnly"
            >
              {{ showHighMindshareOnly ? '查看全部' : '只看高关注度' }}
            </button>
          </div>
          <button
            class="whitespace-nowrap rounded bg-blue-50 px-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-100"
            @click="copyHiddenIds"
          >
            复制隐藏ID列表
          </button>
          <input
            id="fileInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="importHiddenIds"
          >
          <label
            for="fileInput"
            class="cursor-pointer whitespace-nowrap rounded bg-gray-50 px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100"
          >
            导入隐藏ID列表
          </label>
          <button
            class="whitespace-nowrap rounded bg-gray-50 px-4 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100"
            @click="exportHiddenIds"
          >
            导出隐藏ID列表
          </button>
          <div class="whitespace-nowrap text-sm text-gray-500">
            已隐藏 {{ hiddenTickerIds.length }} 个代币
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-12 w-12 animate-spin border-b-2 border-t-2 border-blue-500 rounded-full" />
    </div>

    <div v-else class="table-container">
      <table class="min-w-full bg-white">
        <thead class="bg-gray-50">
          <tr>
            <th class="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs text-gray-500 font-medium tracking-wider uppercase">
              代币
            </th>
            <th class="sticky top-0 w-32 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase">
              排名
            </th>
            <th class="sticky top-0 w-40 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase">
              24小时提及度
            </th>
            <th class="sticky top-0 w-40 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase">
              7天提及度
            </th>
            <th class="sticky top-0 w-40 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase">
              24小时变化
            </th>
            <th class="sticky top-0 w-40 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase">
              操作
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="item in filteredTickers"
            :key="item.ticker_id"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4">
              <div class="flex items-center space-x-2">
                <img
                  v-if="item.logo"
                  :src="item.logo"
                  :alt="item.ticker"
                  class="h-8 w-8 rounded-full"
                >
                <div>
                  <div class="text-sm text-gray-900 font-medium">
                    {{ item.ticker }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ item.fullname }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-center">
              <span
                class="inline-flex rounded-full bg-gray-100 px-2 text-xs text-gray-800 font-semibold leading-5"
              >
                {{ item.rank }}
              </span>
            </td>
            <td class="px-6 py-4 text-center text-sm text-gray-500">
              {{ formatPercentage(item.mindshare) }}
            </td>
            <td class="px-6 py-4 text-center text-sm text-gray-500">
              {{ formatPercentage(item.last_7d_mindshare) }}
            </td>
            <td class="px-6 py-4 text-center text-sm">
              <span
                :class="item.change_24h_ratio > 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ formatChangeRatio(item.change_24h_ratio) }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm">
              <div class="flex items-center space-x-4">
                <a
                  :href="getProjectLink(item.ticker)"
                  target="_blank"
                  class="inline-flex items-center border border-blue-600 rounded-md px-3 py-1.5 text-blue-600 hover:bg-blue-50"
                >
                  查看详情
                </a>
                <button
                  class="inline-flex items-center border border-gray-300 rounded-md px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                  @click="hideTicker(item.ticker_id)"
                >
                  隐藏
                </button>
              </div>
            </td>
          </tr>
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
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
}

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
