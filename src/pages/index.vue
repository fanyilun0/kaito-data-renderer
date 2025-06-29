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
}

// 时间段选项类型
interface DurationOption {
  value: string
  label: string
}

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

// 缓存相关类型
interface CacheItem {
  data: TickerItem[]
  date: string
  duration: string
}

const { isNaN } = Number

// 数据加载状态
const loading = ref(true)
const dataFiles = ref<DataFile[]>([])
const selectedDataFile = ref('')
const selectedDuration = ref('24h') // 新增：当前选择的时间段
const tickerData = ref<TickerItem[]>([])
const updateTime = ref(dayjs().format('YYYY-MM-DD'))
const notification = ref({ show: false, message: '', type: 'info' })

// 可选的时间段选项
const durationOptions: DurationOption[] = [
  { value: '24h', label: '24小时' },
  { value: '48h', label: '48小时' },
  { value: '7d', label: '7天' },
  { value: '30d', label: '30天' },
  { value: '3m', label: '3个月' },
  { value: '6m', label: '6个月' },
  { value: '12m', label: '12个月' },
]

// 缓存相关函数
function getCacheKey(dateStr: string, duration: string) {
  return `kaito_data_${dateStr}_${duration}`
}

function getDataFromCache(dateStr: string, duration: string): TickerItem[] | null {
  try {
    const cacheKey = getCacheKey(dateStr, duration)
    const cached = localStorage.getItem(cacheKey)
    if (!cached)
      return null

    const cacheItem: CacheItem = JSON.parse(cached)
    debugLog(`从缓存加载数据: ${dateStr}_${duration}`, { count: cacheItem.data.length })
    return cacheItem.data
  }
  catch (error) {
    debugLog(`缓存读取失败: ${dateStr}_${duration}`, error)
    return null
  }
}

function saveDataToCache(dateStr: string, duration: string, data: TickerItem[]) {
  try {
    const cacheKey = getCacheKey(dateStr, duration)
    const cacheItem: CacheItem = {
      data,
      date: dateStr,
      duration,
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheItem))
    debugLog(`数据已缓存: ${dateStr}_${duration}`, { count: data.length })
  }
  catch (error) {
    debugLog(`缓存保存失败: ${dateStr}_${duration}`, error)
  }
}

// 加载数据文件列表
async function loadDataFileList() {
  try {
    const dataFileList = []

    // 生成日期范围（从2025-04-18到今天）
    const possibleDates = generateDateRange()

    // 生成数据文件列表
    for (const dateStr of possibleDates) {
      const formattedDate = dayjs(dateStr, 'YYYYMMDD').format('YYYY-MM-DD')
      dataFileList.push({
        name: `kaito_data_${dateStr}`,
        label: formattedDate,
        date: dateStr,
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
function debugLog(message: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') {
    if (data) {
      console.warn(`[DEBUG] ${message}`, data)
    }
    else {
      console.warn(`[DEBUG] ${message}`)
    }
  }
}

// 数据处理函数：确保所有数据都是有效的数值
function processRawTickerData(rawData: any[]): TickerItem[] {
  return rawData.map((item: any, index: number) => {
    // 安全的数值转换函数
    const safeNumber = (value: any, defaultValue: number = 0): number => {
      if (value === null || value === undefined || value === '') {
        return defaultValue
      }
      const num = Number(value)
      return isNaN(num) ? defaultValue : num
    }

    return {
      ticker_id: item.ticker_id || item.ticker || '',
      ticker: item.ticker || '',
      fullname: item.fullname || item.ticker || '',
      logo: item.logo || '',
      rank: safeNumber(item.rank, index + 1),
      // 各时间段的提及度
      last_24h_mindshare: safeNumber(item.last_24h_mindshare),
      last_48h_mindshare: safeNumber(item.last_48h_mindshare),
      last_7d_mindshare: safeNumber(item.last_7d_mindshare),
      last_30d_mindshare: safeNumber(item.last_30d_mindshare),
      last_3m_mindshare: safeNumber(item.last_3m_mindshare),
      last_6m_mindshare: safeNumber(item.last_6m_mindshare),
      last_12m_mindshare: safeNumber(item.last_12m_mindshare),
      // 各时间段的变化比率
      change_24h_ratio: safeNumber(item.change_24h_ratio),
      change_48h_ratio: safeNumber(item.change_48h_ratio),
      change_7d_ratio: safeNumber(item.change_7d_ratio),
      change_30d_ratio: safeNumber(item.change_30d_ratio),
      change_3m_ratio: safeNumber(item.change_3m_ratio),
      change_6m_ratio: safeNumber(item.change_6m_ratio),
      change_12m_ratio: safeNumber(item.change_12m_ratio),
    } as TickerItem
  })
}

// 设置处理后的数据到组件状态
function setProcessedData(data: TickerItem[], dateStr: string) {
  // 再次确保数据的完整性
  const validatedData = processRawTickerData(data)

  tickerData.value = validatedData

  const formattedDate = dayjs(dateStr, 'YYYYMMDD').format('YYYY-MM-DD')
  updateTime.value = formattedDate

  debugLog(`设置处理后的数据: ${validatedData.length} 条记录`)
}

// 从远程服务器加载数据
async function loadDataFromServer(dateStr: string, duration: string): Promise<TickerItem[] | null> {
  const filePath = `./data/kaito_data_${dateStr}_${duration}.json`

  debugLog(`尝试加载文件: ${filePath}`)

  try {
    const response = await fetch(filePath)
    if (response.ok) {
      debugLog(`获取文件成功: ${filePath}`)
      try {
        const data = await response.json()
        debugLog(`解析JSON成功`)

        if (data.resultWithTicker && Array.isArray(data.resultWithTicker)) {
          // 处理原始数据
          const processedData = processRawTickerData(data.resultWithTicker)
          debugLog(`成功处理数据: ${processedData.length} 条记录`)
          return processedData
        }
        else {
          debugLog('文件中没有有效的resultWithTicker字段', data)
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

  return null
}

// 加载特定日期和时间段的数据
async function loadDataForDate(dateStr: string, duration: string = selectedDuration.value): Promise<boolean> {
  loading.value = true
  try {
    // 首先尝试从缓存加载
    const cachedData = getDataFromCache(dateStr, duration)
    if (cachedData) {
      // 对缓存数据也进行处理，确保数据完整性
      setProcessedData(cachedData, dateStr)
      const durationLabel = durationOptions.find(opt => opt.value === duration)?.label || duration
      const formattedDate = dayjs(dateStr, 'YYYYMMDD').format('YYYY-MM-DD')
      showNotification(`从缓存加载 ${formattedDate} ${durationLabel} 数据`, 'info')
      return true
    }

    // 缓存未命中，从服务器加载
    const processedData = await loadDataFromServer(dateStr, duration)

    if (processedData && processedData.length > 0) {
      // 设置数据到组件状态
      setProcessedData(processedData, dateStr)

      // 保存到缓存
      saveDataToCache(dateStr, duration, processedData)

      return true
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
async function loadDataFromFile(dateStr: string, duration: string = selectedDuration.value) {
  try {
    if (!dateStr) {
      showNotification('请选择日期', 'error')
      return
    }

    const success = await loadDataForDate(dateStr, duration)

    if (!success) {
      // 不显示错误通知，而是显示信息提示，因为可能只是文件不存在
      const formattedDate = dayjs(dateStr, 'YYYYMMDD').format('YYYY-MM-DD')
      const durationLabel = durationOptions.find(opt => opt.value === duration)?.label || duration
      showNotification(`${formattedDate} ${durationLabel} 的数据暂未找到，请尝试其他日期或时间段`, 'info')
      tickerData.value = []
    }
  }
  catch (error) {
    console.error('加载数据文件失败:', error)
    showNotification('加载数据文件失败', 'error')
    tickerData.value = []
  }
}

// 删除了 changeDataFile 和 changeDuration 函数
// 因为现在使用 watch 监听器来处理变化，避免重复加载

// 监视数据文件的变化
watch(selectedDataFile, (newValue) => {
  if (newValue) {
    debugLog(`监听器触发：selectedDataFile 变化为 ${newValue}`)
    loadDataFromFile(newValue, selectedDuration.value)
  }
})

// 监视时间段的变化
watch(selectedDuration, (newValue) => {
  if (selectedDataFile.value && newValue) {
    debugLog(`监听器触发：selectedDuration 变化为 ${newValue}`)
    loadDataFromFile(selectedDataFile.value, newValue)
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
onMounted(() => {
  loadDataFileList()
})

// 搜索关键词
const searchKeyword = ref('')

// 排序相关
type SortField = 'rank' | 'last_24h_mindshare' | 'change_24h_ratio' | 'last_48h_mindshare' | 'change_48h_ratio' | 'last_7d_mindshare' | 'change_7d_ratio' | 'last_30d_mindshare' | 'last_3m_mindshare' | 'last_6m_mindshare' | 'last_12m_mindshare'

const sortField = ref<SortField>('rank')
const sortOrder = ref<'asc' | 'desc'>('asc')

// 排序函数
function sortTickerData(data: TickerItem[], field: string, order: 'asc' | 'desc') {
  return [...data].sort((a, b) => {
    let aValue = (a as any)[field]
    let bValue = (b as any)[field]

    // 安全的数值转换
    const safeNumber = (value: any, defaultValue: number = 0): number => {
      if (value === null || value === undefined || value === '') {
        return defaultValue
      }
      const num = Number(value)
      return isNaN(num) ? defaultValue : num
    }

    // 处理特殊字段
    if (field === 'rank') {
      aValue = safeNumber(aValue, 999999)
      bValue = safeNumber(bValue, 999999)
    }
    else {
      // 确保数值比较
      aValue = safeNumber(aValue)
      bValue = safeNumber(bValue)
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

// isCurrentDurationColumn 函数已移动到 TickerTableHeader 组件中
</script>

<template>
  <AppLayout width="1600px">
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
            />

            <!-- 时间段选择 -->
            <AppSelect
              v-model="selectedDuration"
              :options="durationOptions"
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
        <TickerTableHeader
          :selected-duration="selectedDuration"
          :sort-field="sortField"
          :sort-order="sortOrder"
          @sort="toggleSort"
        />
        <tbody class="divide-y divide-gray-200">
          <TickerTableRow
            v-for="(item) in filteredTickers"
            :key="item.ticker_id"
            :item="item"
            :selected-duration="selectedDuration"
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
