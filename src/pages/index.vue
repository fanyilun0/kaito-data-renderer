<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, onMounted, ref, watch } from 'vue'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 类型定义
interface DataFile {
  name: string
  label: string
  date: string
  durations: string[]
}

interface TickerItem {
  ticker_id: string
  ticker: string
  fullname: string
  logo?: string
  rank: number
  mindshare: number
  last_7d_mindshare: number
  change_24h_ratio: number
}

// 数据加载状态
const loading = ref(true)
const dataFiles = ref<DataFile[]>([])
const selectedDataFile = ref('')
const tickerData = ref<TickerItem[]>([])
const updateTime = ref(dayjs().format('YYYY-MM-DD'))
const notification = ref({ show: false, message: '', type: 'info' })
const selectedDuration = ref('24h')

// 加载数据文件列表
async function loadDataFileList() {
  try {
    const dataFileList = []

    // 获取所有可用的数据文件（扫描目录中的所有文件）
    const allDurations = ['24h', '48h', '7d', '30d', '3m', '6m', '12m']

    // 生成日期范围（从2025-04-18到今天）
    const possibleDates = generateDateRange()

    // 不再检查文件是否存在，直接生成所有可能的日期，默认支持所有duration
    for (const dateStr of possibleDates) {
      const formattedDate = dayjs(dateStr, 'YYYYMMDD').format('YYYY-MM-DD')
      dataFileList.push({
        name: `kaito_data_${dateStr}`,
        label: formattedDate,
        date: dateStr,
        durations: allDurations, // 默认支持所有duration
      })
    }

    // 按日期倒序排列（最新的在前面）
    dataFileList.sort((a, b) => b.date.localeCompare(a.date))

    dataFiles.value = dataFileList

    // 默认选择最新的数据文件
    if (dataFileList.length > 0) {
      selectedDataFile.value = dataFileList[0].date
      updateTime.value = dataFileList[0].label
    }
    else {
      showNotification('未找到可用的数据文件', 'error')
    }
  }
  catch (error) {
    console.error('加载数据文件列表失败:', error)
    showNotification('加载数据文件列表失败', 'error')
  }
}

// 生成可能的日期范围（从2025年4月18日到当前日期）
function generateDateRange() {
  const dates = []
  const startDate = dayjs('2025-04-18') // 修改起始日期为2025-04-18
  const endDate = dayjs()

  let currentDate = startDate
  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
    dates.push(currentDate.format('YYYYMMDD'))
    currentDate = currentDate.add(1, 'day')
  }

  return dates.reverse() // 返回倒序（最新的在前）
}

// 添加调试功能
function debugLog(message, data = null) {
  if (process.env.NODE_ENV !== 'production') {
    if (data) {
      console.warn(`[DEBUG] ${message}`, data)
    }
    else {
      console.warn(`[DEBUG] ${message}`)
    }
  }
}

// 加载特定日期和时间段的数据
async function loadDataForDateAndDuration(dateStr: string, duration: string) {
  loading.value = true
  try {
    // 尝试加载特定duration的文件 (例如: kaito_data_20250418_24h.json)
    const specificPath = `./data/kaito_data_${dateStr}_${duration}.json`
    debugLog(`尝试加载特定时间段文件: ${specificPath}`)

    try {
      const response = await fetch(specificPath)
      if (response.ok) {
        debugLog(`获取文件成功: ${specificPath}`)
        try {
          const data = await response.json()
          debugLog(`解析JSON成功`)
          if (data.resultWithTicker) {
            tickerData.value = data.resultWithTicker as TickerItem[]
            const formattedDate = dayjs(dateStr, 'YYYYMMDD').format('YYYY-MM-DD')
            updateTime.value = `${formattedDate} (${duration})`
            return true
          }
          else {
            debugLog('文件中没有resultWithTicker字段', data)
          }
        }
        catch (parseError) {
          debugLog(`解析JSON失败`, parseError)
          console.error('解析JSON失败:', parseError)
        }
      }
      else {
        debugLog(`文件不存在或无法访问: ${response.status} ${response.statusText}`)
      }
    }
    catch (error) {
      debugLog(`加载文件出错`, error)
      console.error('加载文件失败:', error)
    }

    return false
  }
  catch (error) {
    debugLog(`加载数据失败`, error)
    console.error('加载数据文件失败:', error)
    return false
  }
  finally {
    loading.value = false
  }
}

// 从本地数据文件加载数据
async function loadDataFromFile(dateStr: string) {
  loading.value = true
  try {
    if (!dateStr) {
      showNotification('请选择日期', 'error')
      return
    }

    const success = await loadDataForDateAndDuration(dateStr, selectedDuration.value)

    if (!success) {
      // 不显示错误通知，而是显示信息提示，因为可能只是文件不存在
      const formattedDate = dayjs(dateStr, 'YYYYMMDD').format('YYYY-MM-DD')
      showNotification(`${formattedDate} 的 ${selectedDuration.value} 数据暂未找到，请尝试其他日期或时间段`, 'info')
      tickerData.value = []
    }
  }
  catch (error) {
    console.error('加载数据文件失败:', error)
    showNotification('加载数据文件失败', 'error')
    tickerData.value = []
  }
  finally {
    loading.value = false
  }
}

// 切换数据文件
function changeDataFile(dateStr: string | number) {
  const strDateStr = String(dateStr)
  selectedDataFile.value = strDateStr
  loadDataFromFile(strDateStr)
}

// 切换时间段
function changeDuration(duration: string | number) {
  selectedDuration.value = String(duration)

  // 如果已经选择了数据文件，则从该文件重新加载对应时间段的数据
  if (selectedDataFile.value) {
    loadDataFromFile(selectedDataFile.value)
  }
}

// 监视数据文件的变化
watch(selectedDataFile, (newValue) => {
  if (newValue) {
    loadDataFromFile(newValue)
  }
})

// 监视时间段的变化
watch(selectedDuration, () => {
  if (selectedDataFile.value) {
    loadDataFromFile(selectedDataFile.value)
  }
})

// 获取当前选择日期的可用时间段
const availableDurations = computed(() => {
  const selectedDate = dataFiles.value.find(file => file.date === selectedDataFile.value)
  return selectedDate ? selectedDate.durations : []
})

// 当选择的时间段不在当前日期的可用时间段中时，自动选择第一个可用的
watch(availableDurations, (newDurations) => {
  if (newDurations.length > 0 && !newDurations.includes(selectedDuration.value)) {
    selectedDuration.value = newDurations[0]
  }
})

// 显示通知
function showNotification(message: string, type: 'info' | 'error' = 'info') {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// 在组件挂载时加载数据文件列表和数据
onMounted(async () => {
  await loadDataFileList()
  if (selectedDataFile.value) {
    await loadDataFromFile(selectedDataFile.value)
  }
})

// 搜索关键词
const searchKeyword = ref('')

// 排序相关
const sortField = ref<'rank' | 'mindshare' | 'last_7d_mindshare' | 'change_24h_ratio'>('rank')
const sortOrder = ref<'asc' | 'desc'>('asc')

// 排序函数
function sortTickerData(data: TickerItem[], field: string, order: 'asc' | 'desc') {
  return [...data].sort((a, b) => {
    let aValue = (a as any)[field]
    let bValue = (b as any)[field]
    
    // 处理特殊字段
    if (field === 'rank') {
      aValue = Number(aValue) || 999999
      bValue = Number(bValue) || 999999
    }
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  })
}

// 切换排序
function toggleSort(field: 'rank' | 'mindshare' | 'last_7d_mindshare' | 'change_24h_ratio') {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = field === 'rank' ? 'asc' : 'desc' // rank默认升序，其他降序
  }
}

// 过滤和排序后的代币列表
const filteredTickers = computed(() => {
  // 首先过滤
  const filtered = tickerData.value
    .filter((item) => {
      if (!searchKeyword.value)
        return true
      const name = item.fullname?.toLowerCase() || ''
      const ticker = item.ticker?.toLowerCase() || ''
      return name.includes(searchKeyword.value.toLowerCase())
        || ticker.includes(searchKeyword.value.toLowerCase())
    })
  
  // 然后排序
  return sortTickerData(filtered, sortField.value, sortOrder.value)
})

// 格式化百分比
function formatPercentage(value) {
  return `${(value * 100).toFixed(2)}%`
}

// 格式化变化率
function formatChangeRatio(value) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${(value * 100).toFixed(2)}%`
}

// 获取时间段的中文标签
function getDurationLabel(duration) {
  const durationMap = {
    '24h': '24小时',
    '48h': '48小时',
    '7d': '7天',
    '30d': '30天',
    '3m': '3个月',
    '6m': '6个月',
    '12m': '12个月',
  }
  return durationMap[duration] || duration
}
</script>

<template>
  <AppLayout>
    <div class="mb-6">
      <div class="flex flex-col space-y-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <AppHeader 
            title="KAITO-PRE-TGE热门代币提及度排行"
            current-route="table"
          />

          <div class="flex items-center space-x-3">
            <div class="relative w-64 md:w-72">
              <div class="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                </svg>
              </div>
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="搜索代币名称或代号..."
                class="w-full border border-gray-300 rounded-md py-2 pl-10 pr-4 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
            </div>

            <!-- 日期选择 -->
            <AppSelect
              v-model="selectedDataFile"
              :options="dataFiles.map(file => ({ value: file.date, label: file.label }))"
              @update:model-value="changeDataFile($event)"
            />

            <!-- 时间段选择 -->
            <AppSelect
              v-model="selectedDuration"
              :options="availableDurations.map(duration => ({ value: duration, label: getDurationLabel(duration) }))"
              @update:model-value="changeDuration($event)"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-12 w-12 animate-spin border-b-2 border-t-2 border-blue-500 rounded-full" />
    </div>

    <div v-else-if="tickerData.length === 0" class="flex items-center justify-center py-12">
      <div class="text-gray-500">
        没有找到数据，请选择其他日期或时间段
      </div>
    </div>

    <div v-else class="table-container">
      <table class="min-w-full bg-white">
        <thead class="bg-gray-50">
          <tr>
            <th class="sticky top-0 bg-gray-50 px-6 py-3 text-left text-xs text-gray-500 font-medium tracking-wider uppercase">
              代币
            </th>
            <th 
              class="sticky top-0 w-32 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase cursor-pointer hover:bg-gray-100 transition-colors"
              @click="toggleSort('rank')"
            >
              <div class="flex items-center justify-center space-x-1">
                <span>排名</span>
                <div class="flex flex-col">
                  <svg 
                    class="h-2 w-2" 
                    :class="sortField === 'rank' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M7 14l5-5 5 5z"/>
                  </svg>
                  <svg 
                    class="h-2 w-2" 
                    :class="sortField === 'rank' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M7 10l5 5 5-5z"/>
                  </svg>
                </div>
              </div>
            </th>
            <th 
              class="sticky top-0 w-40 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase cursor-pointer hover:bg-gray-100 transition-colors"
              @click="toggleSort('mindshare')"
            >
              <div class="flex items-center justify-center space-x-1">
                <span>{{ selectedDuration }}提及度</span>
                <div class="flex flex-col">
                  <svg 
                    class="h-2 w-2" 
                    :class="sortField === 'mindshare' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M7 14l5-5 5 5z"/>
                  </svg>
                  <svg 
                    class="h-2 w-2" 
                    :class="sortField === 'mindshare' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M7 10l5 5 5-5z"/>
                  </svg>
                </div>
              </div>
            </th>
            <th 
              class="sticky top-0 w-40 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase cursor-pointer hover:bg-gray-100 transition-colors"
              @click="toggleSort('last_7d_mindshare')"
            >
              <div class="flex items-center justify-center space-x-1">
                <span>7天提及度</span>
                <div class="flex flex-col">
                  <svg 
                    class="h-2 w-2" 
                    :class="sortField === 'last_7d_mindshare' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M7 14l5-5 5 5z"/>
                  </svg>
                  <svg 
                    class="h-2 w-2" 
                    :class="sortField === 'last_7d_mindshare' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M7 10l5 5 5-5z"/>
                  </svg>
                </div>
              </div>
            </th>
            <th 
              class="sticky top-0 w-40 bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 font-medium tracking-wider uppercase cursor-pointer hover:bg-gray-100 transition-colors"
              @click="toggleSort('change_24h_ratio')"
            >
              <div class="flex items-center justify-center space-x-1">
                <span>{{ selectedDuration }}变化</span>
                <div class="flex flex-col">
                  <svg 
                    class="h-2 w-2" 
                    :class="sortField === 'change_24h_ratio' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'"
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M7 14l5-5 5 5z"/>
                  </svg>
                  <svg 
                    class="h-2 w-2" 
                    :class="sortField === 'change_24h_ratio' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'"
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M7 10l5 5 5-5z"/>
                  </svg>
                </div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="(item, index) in filteredTickers"
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
