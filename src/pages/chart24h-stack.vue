<script setup lang="ts">
import type { KaitoDataItem, TokenStats } from '../composables/kaitoDataProcessor'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getTopTokens, loadAll24hData, prepareChartData } from '../composables/kaitoDataProcessor'
import { createChartConfig, updateChartWithState, resetChartState } from '../composables/chartConfig'

// 数据状态
const loading = ref(true)
const chartRef = ref<HTMLElement>()
const allData = ref<Record<string, KaitoDataItem[]>>({})
const availableDates = ref<string[]>([])
const allTokens = ref<string[]>([])
const notification = ref({ show: false, message: '', type: 'info' })
const chartInstance = ref<echarts.ECharts | null>(null)

// 图表配置 - 默认显示前50个代币
const topTokenCount = ref(10)
const selectedDateRange = ref(30) // 显示最近N天

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const result = await loadAll24hData()
    allData.value = result.allData
    availableDates.value = result.availableDates
    allTokens.value = result.allTokens

    if (result.availableDates.length === 0) {
      showNotification('未找到任何24H数据文件', 'error')
    }
    else {
      showNotification(`成功加载 ${result.availableDates.length} 天的数据`, 'success')
    }
  }
  catch (error) {
    console.error('加载数据失败:', error)
    showNotification('加载数据失败', 'error')
  }
  finally {
    loading.value = false
  }
}

// 获取要显示的日期范围
const displayDates = computed(() => {
  if (selectedDateRange.value === 0) {
    // 选择0表示显示全部时间
    return availableDates.value
  }
  return availableDates.value.slice(-selectedDateRange.value)
})

// 获取前N个代币
const topTokens = computed((): TokenStats[] => {
  if (!allData.value || !displayDates.value.length) {
    return []
  }
  return getTopTokens(allData.value, displayDates.value, topTokenCount.value)
})

// 准备图表数据
const chartData = computed(() => {
  if (!allData.value || !displayDates.value.length || !topTokens.value.length) {
    return { categories: [], series: [] }
  }
  return prepareChartData(allData.value, displayDates.value, topTokens.value)
})

// 初始化图表
function initChart() {
  if (!chartRef.value) {
    console.warn('Chart container not found')
    return
  }

  // 清理现有实例
  if (chartInstance.value) {
    try {
      chartInstance.value.dispose()
    } catch (error) {
      console.warn('Error disposing chart:', error)
    }
    chartInstance.value = null
  }

  try {
    chartInstance.value = echarts.init(chartRef.value)
    updateChart()
  } catch (error) {
    console.error('初始化图表失败:', error)
    showNotification('初始化图表失败', 'error')
  }
}

// 更新图表
function updateChart() {
  if (!chartInstance.value || !chartData.value) {
    console.warn('Chart instance or data not available')
    return
  }

  const { categories, series } = chartData.value

  // 验证数据有效性
  if (!categories.length || !series.length) {
    console.warn('图表数据为空，跳过更新')
    return
  }

  const displayTokenCount = topTokenCount.value === 0 || topTokenCount.value >= allTokens.value.length
    ? allTokens.value.length
    : topTokenCount.value

  // 验证并清理series数据
  const validSeries = series.filter(s => {
    if (!s || typeof s.name !== 'string' || !Array.isArray(s.data)) {
      console.warn('Invalid series data:', s)
      return false
    }
    // 检查数据数组长度是否与categories匹配
    if (s.data.length !== categories.length) {
      console.warn(`Series ${s.name} data length (${s.data.length}) doesn't match categories length (${categories.length})`)
      return false
    }
    return true
  }).map(s => {
    // 确保数据的完整性和正确性
    const cleanData = s.data.map(d => {
      if (typeof d === 'number' && !isNaN(d) && isFinite(d) && d >= 0) {
        return d
      }
      return 0
    })

    return {
      ...s,
      data: cleanData,
    }
  })

  if (validSeries.length === 0) {
    console.warn('No valid series data available')
    showNotification('没有有效的数据可以显示', 'error')
    return
  }

  console.log(`更新图表: ${validSeries.length} 个系列, ${categories.length} 个时间点`)

  try {
    // 使用新的配置创建函数
    const option = createChartConfig({
      categories,
      series: validSeries,
      displayTokenCount,
      selectedDateRange: selectedDateRange.value,
      allTokensLength: allTokens.value.length,
      displayDates: displayDates.value,
    })

    // 使用新的更新函数（保持状态）
    updateChartWithState(chartInstance.value, option)
  } catch (error) {
    console.error('更新图表失败:', error)
    showNotification('更新图表失败', 'error')
    
    // 如果更新失败，尝试完全重新初始化
    try {
      console.log('尝试重新初始化图表...')
      initChart()
    } catch (reinitError) {
      console.error('重新初始化图表也失败:', reinitError)
    }
  }
}

// 监听控制参数变化
watch([topTokenCount, selectedDateRange], async () => {
  if (chartInstance.value && chartData.value && chartData.value.categories.length > 0) {
    await nextTick()
    updateChart()
  }
}, { immediate: false })

// 监听数据加载状态变化，确保图表在数据加载完成后正确初始化
watch(loading, async (isLoading) => {
  if (!isLoading && availableDates.value.length > 0 && !chartInstance.value) {
    await nextTick()
    initChart()
  }
})

// 响应式处理
function handleResize() {
  if (chartInstance.value) {
    try {
      chartInstance.value.resize()
    } catch (error) {
      console.error('调整图表大小失败:', error)
    }
  }
}

// 显示通知
function showNotification(message: string, type = 'info') {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// 重置图表状态
function resetChart() {
  if (chartInstance.value) {
    resetChartState(chartInstance.value)
    console.log('图表状态已重置')
  }
}

// 组件挂载
onMounted(async () => {
  await loadData()
  await nextTick()
  if (chartData.value && chartData.value.categories.length > 0) {
    initChart()
  }

  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
onBeforeUnmount(() => {
  if (chartInstance.value) {
    try {
      chartInstance.value.dispose()
    } catch (error) {
      console.error('销毁图表失败:', error)
    }
    chartInstance.value = null
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="mx-auto px-4 py-4 container">
    <!-- 头部 -->
    <div class="mb-6">
      <div class="flex flex-col space-y-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div class="flex items-center gap-4">
            <img
              src="https://avatars.githubusercontent.com/u/136059942"
              alt="Author Avatar"
              class="h-10 w-10 rounded-full"
            >
            <div>
              <h1 class="text-2xl font-bold">
                KAITO 24H Mindshare Stack图表
              </h1>
              <div class="flex items-center text-xs text-gray-500 space-x-4">
                <span>基于历史数据的堆叠柱状图分析 | 横轴：时间 | 纵轴：Mindshare | Stack模式</span>
              </div>
            </div>
          </div>

          <!-- 控制面板 -->
          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <label class="text-sm text-gray-700">显示代币数量:</label>
              <select
                v-model.number="topTokenCount"
                class="border border-gray-300 rounded bg-white px-2 py-1 text-sm"
              >
                <option :value="0">
                  所有代币 ({{ allTokens.length }})
                </option>
                <option :value="5">
                  前5个
                </option>
                <option :value="10">
                  前10个
                </option>
                <option :value="15">
                  前15个
                </option>
                <option :value="20">
                  前20个
                </option>
                <option :value="25">
                  前25个
                </option>
                <option :value="50">
                  前50个
                </option>
                <option :value="100">
                  前100个
                </option>
              </select>
            </div>

            <div class="flex items-center space-x-2">
              <label class="text-sm text-gray-700">时间范围:</label>
              <select
                v-model.number="selectedDateRange"
                class="border border-gray-300 rounded bg-white px-2 py-1 text-sm"
              >
                <option :value="7">
                  最近7天
                </option>
                <option :value="14">
                  最近14天
                </option>
                <option :value="30">
                  最近30天
                </option>
                <option :value="60">
                  最近60天
                </option>
                <option :value="90">
                  最近90天
                </option>
                <option :value="0">
                  全部时间 ({{ availableDates.length }}天)
                </option>
              </select>
            </div>

            <button
              v-if="chartInstance"
              @click="resetChart"
              class="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 transition-colors"
              title="重置图表状态（清除筛选和缩放）"
            >
              重置图表
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex items-center space-x-3">
        <div class="h-8 w-8 animate-spin border-b-2 border-t-2 border-blue-500 rounded-full" />
        <span class="text-gray-600">正在加载历史数据...</span>
      </div>
    </div>

    <!-- 图表容器 -->
    <div v-else-if="availableDates.length > 0" class="chart-container">
      <div
        ref="chartRef"
        class="h-96 w-full border border-gray-200 rounded-lg shadow-sm md:h-[700px]"
      />

      <!-- 数据统计信息 -->
      <div class="grid grid-cols-1 mt-4 gap-4 text-sm md:grid-cols-4">
        <div class="rounded-lg bg-blue-50 p-3">
          <div class="text-blue-800 font-semibold">
            数据范围
          </div>
          <div class="text-blue-600">
            {{ dayjs(displayDates[0], 'YYYYMMDD').format('YYYY-MM-DD') }} 至
            {{ dayjs(displayDates[displayDates.length - 1], 'YYYYMMDD').format('YYYY-MM-DD') }}
          </div>
        </div>
        <div class="rounded-lg bg-green-50 p-3">
          <div class="text-green-800 font-semibold">
            显示天数
          </div>
          <div class="text-green-600">
            {{ displayDates.length }} 天
          </div>
        </div>
        <div class="rounded-lg bg-purple-50 p-3">
          <div class="text-purple-800 font-semibold">
            代币数量
          </div>
          <div class="text-purple-600">
            {{ topTokenCount === 0 || topTokenCount >= allTokens.length ? `所有${topTokens.length}` : `前${topTokens.length}` }} 个
          </div>
        </div>
        <div class="rounded-lg bg-orange-50 p-3">
          <div class="text-orange-800 font-semibold">
            总数据量
          </div>
          <div class="text-orange-600">
            {{ availableDates.length }} 天可用
          </div>
        </div>
      </div>

      <!-- 说明文字 -->
      <div class="mt-4 rounded-lg bg-gray-50 p-4">
        <div class="text-sm text-gray-700">
          <h3 class="mb-2 font-semibold">
            📊 图表说明：
          </h3>
          <ul class="text-xs space-y-1">
            <li>• <strong>横轴（X轴）</strong>：时间（日期），从左到右按时间顺序排列</li>
            <li>• <strong>纵轴（Y轴）</strong>：Mindshare百分比值，表示各代币的关注度占比</li>
            <li>• <strong>Stack模式</strong>：每个代币的数据堆叠显示，柱子总高度代表当日所有代币的总Mindshare</li>
            <li>• <strong>颜色区分</strong>：每种颜色代表一个代币，鼠标悬停可查看详细数据</li>
            <li>• <strong>数据缩放</strong>：当数据点较多时，底部会显示缩放滑块，可拖拽查看不同时间段</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-else class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="mb-2 text-lg text-gray-500">
          暂无可用的24H数据
        </div>
        <div class="text-sm text-gray-400">
          请检查数据文件是否存在
        </div>
      </div>
    </div>

    <!-- 通知提示 -->
    <div
      v-if="notification.show"
      class="fixed bottom-4 right-4 z-50 rounded-md px-4 py-2 text-white"
      :class="{
        'bg-red-500': notification.type === 'error',
        'bg-green-500': notification.type === 'success',
        'bg-blue-500': notification.type === 'info',
      }"
    >
      {{ notification.message }}
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1400px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .chart-container {
    padding: 8px;
  }
}
</style>
