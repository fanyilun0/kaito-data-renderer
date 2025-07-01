<script setup lang="ts">
import type { KaitoDataItem, TokenStats } from '../composables/kaitoDataProcessor'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { createChartConfig, resetChartState, updateChartWithState } from '../composables/chartConfig'
import { getTopTokens, loadAll24hData, prepareChartData } from '../composables/kaitoDataProcessor'

// 数据状态
const loading = ref(true)
const chartRef = ref<HTMLElement>()
const allData = ref<Record<string, KaitoDataItem[]>>({})
const availableDates = ref<string[]>([])
const allTokens = ref<string[]>([])
const notification = ref({ show: false, message: '', type: 'info' })

// 使用 shallowRef 来存储 ECharts 实例，避免深度响应式代理
const chartInstance = shallowRef<echarts.ECharts | null>(null)

// 添加初始化状态管理
const chartInitialized = ref(false)
const chartInitializing = ref(false)

// 图表配置 - 默认显示前15个代币
const topTokenCount = ref(15)
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
async function initChart() {
  // 防止重复初始化
  if (chartInitializing.value) {
    return
  }

  if (!chartRef.value) {
    console.warn('Chart container not found')
    return
  }

  chartInitializing.value = true

  try {
    // 确保容器有尺寸
    const rect = chartRef.value.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      console.warn('Chart container has no size, retrying...')
      chartInitializing.value = false
      // 延迟重试
      setTimeout(() => {
        initChart()
      }, 100)
      return
    }

    // 清理现有实例
    if (chartInstance.value) {
      try {
        chartInstance.value.dispose()
      }
      catch (error) {
        console.warn('Error disposing chart:', error)
      }
      chartInstance.value = null
      chartInitialized.value = false
    }

    // 初始化图表，明确指定渲染器
    const chart = echarts.init(chartRef.value, null, {
      renderer: 'canvas',
      useDirtyRect: false, // 禁用脏矩形优化以提高兼容性
      width: chartRef.value.clientWidth || 800,
      height: chartRef.value.clientHeight || 600,
    })

    // 使用 markRaw 防止 ECharts 实例被 Vue 的响应式系统代理
    chartInstance.value = markRaw(chart)

    // 添加错误处理
    chartInstance.value.on('error', (err: any) => {
      console.error('ECharts error:', err)
      showNotification('图表渲染出现错误', 'error')
    })

    chartInitialized.value = true
    console.warn('图表初始化成功')

    // 延迟更新图表，确保 ECharts 实例完全初始化
    await nextTick()
    setTimeout(() => {
      updateChart()
    }, 50)
  }
  catch (error) {
    console.error('初始化图表失败:', error)
    showNotification('初始化图表失败', 'error')
    chartInitialized.value = false
  }
  finally {
    chartInitializing.value = false
  }
}

// 更新图表
function updateChart() {
  if (!chartInstance.value || !chartData.value || !chartInitialized.value) {
    console.warn('Chart instance not ready or data not available')
    return
  }

  const { categories, series } = chartData.value

  // 验证数据有效性
  if (!categories.length || !series.length) {
    console.warn('图表数据为空，跳过更新')
    // 显示空状态
    if (chartInstance.value) {
      chartInstance.value.clear()
      chartInstance.value.setOption({
        title: {
          text: '暂无数据',
          left: 'center',
          top: 'center',
          textStyle: {
            color: '#999',
            fontSize: 16,
          },
        },
      })
    }
    return
  }

  const displayTokenCount = topTokenCount.value === 0 || topTokenCount.value >= allTokens.value.length
    ? allTokens.value.length
    : topTokenCount.value

  // 验证并清理series数据
  const validSeries = series.filter((s) => {
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
  }).map((s) => {
    // 确保数据的完整性和正确性
    const cleanData = s.data.map((d) => {
      if (typeof d === 'number' && !Number.isNaN(d) && Number.isFinite(d) && d >= 0) {
        return d
      }
      return 0
    })

    // 使用 JSON.parse(JSON.stringify()) 确保数据是纯对象，防止响应式代理
    return JSON.parse(JSON.stringify({
      ...s,
      data: cleanData,
    }))
  })

  if (validSeries.length === 0) {
    console.warn('No valid series data available')
    showNotification('没有有效的数据可以显示', 'error')
    return
  }

  console.warn(`更新图表: ${validSeries.length} 个系列, ${categories.length} 个时间点`)

  try {
    // 显示加载状态
    if (chartInstance.value) {
      chartInstance.value.showLoading('default', {
        text: '正在渲染图表...',
        textColor: '#5470c6',
        maskColor: 'rgba(255, 255, 255, 0.8)',
      })
    }

    // 使用新的配置创建函数，确保所有数据都是纯对象
    const option = createChartConfig({
      categories: [...categories], // 创建纯数组副本
      series: validSeries,
      displayTokenCount,
      selectedDateRange: selectedDateRange.value,
      allTokensLength: allTokens.value.length,
      displayDates: [...displayDates.value], // 创建纯数组副本
    })

    // 验证配置对象
    if (!option || typeof option !== 'object') {
      throw new Error('Invalid chart option generated')
    }

    // 使用 markRaw 确保配置对象不被响应式代理
    const rawOption = markRaw(option)

    // 使用新的更新函数（保持状态）
    updateChartWithState(chartInstance.value, rawOption)

    // 隐藏加载状态
    if (chartInstance.value) {
      chartInstance.value.hideLoading()
    }

    console.warn('图表更新成功')
  }
  catch (error) {
    console.error('更新图表失败:', error)

    // 隐藏加载状态
    if (chartInstance.value) {
      chartInstance.value.hideLoading()
    }

    showNotification(`更新图表失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')

    // 如果更新失败，尝试完全重新初始化
    try {
      console.warn('尝试重新初始化图表...')
      chartInitialized.value = false
      setTimeout(() => {
        initChart()
      }, 500)
    }
    catch (reinitError) {
      console.error('重新初始化图表也失败:', reinitError)
    }
  }
}

// 合并所有相关的监听器，避免重复触发
watch([topTokenCount, selectedDateRange], async () => {
  if (chartInstance.value && chartInitialized.value && chartData.value && chartData.value.categories.length > 0) {
    await nextTick()
    updateChart()
  }
}, { immediate: false })

// 统一的数据和初始化状态监听器
watch([loading, chartData, () => chartRef.value], async () => {
  // 只有在数据加载完成、有可用数据、容器存在且尚未初始化时才初始化图表
  if (
    !loading.value
    && availableDates.value.length > 0
    && chartData.value
    && chartData.value.categories.length > 0
    && chartRef.value
    && !chartInitialized.value
    && !chartInitializing.value
  ) {
    console.warn('触发图表初始化条件：数据已加载，容器已准备，图表未初始化')
    await nextTick()
    // 稍微延迟以确保DOM完全渲染
    setTimeout(() => {
      initChart()
    }, 50)
  }
  // 如果图表已初始化且数据变化了，只更新图表
  else if (
    !loading.value
    && chartInstance.value
    && chartInitialized.value
    && chartData.value
    && chartData.value.categories.length > 0
  ) {
    await nextTick()
    updateChart()
  }
}, {
  immediate: false,
  deep: true,
  flush: 'post', // 确保在DOM更新后执行
})

// 响应式处理
function handleResize() {
  if (chartInstance.value && chartInitialized.value) {
    try {
      chartInstance.value.resize()
    }
    catch (error) {
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
  if (chartInstance.value && chartInitialized.value) {
    resetChartState(chartInstance.value)
    console.warn('图表状态已重置')
    showNotification('图表状态已重置', 'success')
  }
}

// 组件挂载
onMounted(async () => {
  console.warn('组件开始挂载')

  try {
    await loadData()
    console.warn('数据加载完成')

    // 数据加载完成后，监听器会自动处理图表初始化
    // 不需要在这里手动调用 initChart()
  }
  catch (error) {
    console.error('组件挂载过程中出现错误:', error)
    showNotification('数据加载失败', 'error')
  }

  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
onBeforeUnmount(() => {
  if (chartInstance.value) {
    try {
      chartInstance.value.dispose()
    }
    catch (error) {
      console.error('销毁图表失败:', error)
    }
    chartInstance.value = null
  }
  chartInitialized.value = false
  chartInitializing.value = false
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <AppLayout width="1600px">
    <!-- 头部 -->
    <div class="mb-6">
      <div class="flex flex-col space-y-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <AppHeader
            title="KAITO-PRE-TGE热门代币图表"
            current-route="chart"
          />

          <!-- 控制面板 -->

          <button
            v-if="chartInstance"
            class="rounded-full bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="重置图表状态（清除筛选和缩放）"
            @click="resetChart"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
              <AppSelect
                v-model="topTokenCount"
                :options="[
                  { value: 0, label: `所有代币 (${allTokens.length})` },
                  { value: 5, label: '前5个' },
                  { value: 10, label: '前10个' },
                  { value: 15, label: '前15个' },
                  { value: 20, label: '前20个' },
                  { value: 25, label: '前25个' },
                  { value: 50, label: '前50个' },
                  { value: 100, label: '前100个' },
                ]"
              />
            </div>

            <div class="flex items-center space-x-2">
              <AppSelect
                v-model="selectedDateRange"
                :options="[
                  { value: 7, label: '最近7天' },
                  { value: 14, label: '最近14天' },
                  { value: 30, label: '最近30天' },
                  { value: 60, label: '最近60天' },
                  { value: 90, label: '最近90天' },
                  { value: 0, label: `全部时间 (${availableDates.length}天)` },
                ]"
              />
            </div>
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
      <!-- 调试信息 -->
      <div v-if="!chartInstance" class="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
        <div class="flex items-center space-x-2">
          <div class="h-4 w-4 animate-spin border-b-2 border-t-2 border-blue-500 rounded-full" />
          <span>正在初始化图表... (数据点: {{ chartData?.categories?.length || 0 }})</span>
        </div>
      </div>

      <div
        ref="chartRef"
        class="h-96 w-full border border-gray-200 rounded-lg bg-white shadow-sm md:h-[800px]"
        :style="{ minHeight: '800px' }"
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
  </AppLayout>
</template>

<style scoped>
.chart-container {
  background: white;
  border-radius: 8px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .chart-container {
    padding: 8px;
  }
}
</style>
