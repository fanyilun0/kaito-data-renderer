<script setup lang="ts">
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// 数据状态
const loading = ref(true)
const chartRef = ref<HTMLElement>()
const allData = ref<Record<string, any[]>>({})
const availableDates = ref<string[]>([])
const notification = ref({ show: false, message: '', type: 'info' })
const chartInstance = ref<echarts.ECharts>()

// 图表配置
const topTokenCount = ref(0) // 默认为0表示显示所有代币
const selectedDateRange = ref(30) // 显示最近N天
const allTokens = ref<any[]>([]) // 所有出现过的代币列表

// 颜色配置 - 使用更丰富的颜色调色板
const colorPalette = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
  '#ea7ccc',
  '#f39800',
  '#d4b106',
  '#c23531',
  '#2f4554',
  '#61a0a8',
  '#d48265',
  '#749f83',
  '#ca8622',
  '#bda29a',
  '#6e7074',
  '#546570',
  '#c4ccd3',
  '#b5d5f5',
  '#d0d0d0',
  '#e5e5e5',
  '#f5f5f5',
]

// 生成可能的日期范围（从2025-04-18到当前日期）
function generateDateRange() {
  const dates = []
  const startDate = dayjs('2025-04-18') // 数据起始日期
  const endDate = dayjs()

  let currentDate = startDate
  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
    dates.push(currentDate.format('YYYYMMDD'))
    currentDate = currentDate.add(1, 'day')
  }

  return dates
}

// 加载所有24H数据
async function loadAll24hData() {
  loading.value = true
  const possibleDates = generateDateRange()
  const loadedData: Record<string, any[]> = {}
  const successfulDates: string[] = []

  try {
    // 并行加载所有日期的数据
    const loadPromises = possibleDates.map(async (dateStr) => {
      try {
        const response = await fetch(`/data/kaito_data_${dateStr}_24h.json`)
        if (response.ok) {
          const data = await response.json()
          // 增强数据验证，确保数据结构完整
          if (data && data.resultWithTicker && Array.isArray(data.resultWithTicker) && data.resultWithTicker.length > 0) {
            // 验证每个数据项的必需字段
            const validData = data.resultWithTicker.filter((item: any) =>
              item
              && typeof item.ticker === 'string'
              && item.ticker.trim() !== ''
              && typeof item.last_24h_mindshare === 'number'
              && !Number.isNaN(item.last_24h_mindshare)
              && item.last_24h_mindshare >= 0,
            )
            if (validData.length > 0) {
              loadedData[dateStr] = validData
              successfulDates.push(dateStr)
            }
          }
        }
      }
      catch (error) {
        console.warn(`Failed to load data for ${dateStr}:`, error)
      }
    })

    await Promise.all(loadPromises)

    // 按日期排序
    successfulDates.sort()

    allData.value = loadedData
    availableDates.value = successfulDates

    if (successfulDates.length === 0) {
      showNotification('未找到任何24H数据文件', 'error')
    }
    else {
      showNotification(`成功加载 ${successfulDates.length} 天的数据`, 'success')
      // 计算所有出现过的代币并设置默认值
      calculateAllTokens()
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

// 计算所有出现过的代币
function calculateAllTokens() {
  const tokenSet = new Set<string>()
  Object.values(allData.value).forEach((dayData) => {
    dayData.forEach((item) => {
      if (item && item.ticker) {
        tokenSet.add(item.ticker)
      }
    })
  })
  allTokens.value = Array.from(tokenSet)

  // 保持topTokenCount为0，让computed属性处理显示逻辑
  // 这样下拉框可以正常工作
}

// 获取要显示的日期范围
const displayDates = computed(() => {
  const dates = availableDates.value.slice(-selectedDateRange.value)
  return dates
})

// 获取所有出现过的代币列表并计算平均mindshare
const topTokens = computed(() => {
  if (displayDates.value.length === 0)
    return []

  const tokenStats: Record<string, {
    ticker: string
    fullname: string
    logo: string
    totalMindshare: number
    appearances: number
    avgMindshare: number
  }> = {}

  // 统计每个代币在所有日期中的mindshare
  displayDates.value.forEach((dateStr) => {
    const dayData = allData.value[dateStr] || []
    dayData.forEach((item) => {
      // 增强数据验证
      if (!item || !item.ticker || typeof item.last_24h_mindshare !== 'number') {
        return
      }

      if (!tokenStats[item.ticker]) {
        tokenStats[item.ticker] = {
          ticker: item.ticker,
          fullname: item.fullname || item.ticker, // 如果fullname不存在，使用ticker
          logo: item.logo || '', // 如果logo不存在，使用空字符串
          totalMindshare: 0,
          appearances: 0,
          avgMindshare: 0,
        }
      }
      tokenStats[item.ticker].totalMindshare += item.last_24h_mindshare || 0
      tokenStats[item.ticker].appearances += 1
    })
  })

  // 计算平均mindshare并排序
  Object.values(tokenStats).forEach((token) => {
    token.avgMindshare = token.totalMindshare / token.appearances
  })

  const sortedTokens = Object.values(tokenStats)
    .sort((a, b) => b.avgMindshare - a.avgMindshare)

  // 如果topTokenCount为0或大于等于总数量，返回所有代币
  if (topTokenCount.value === 0 || topTokenCount.value >= sortedTokens.length) {
    return sortedTokens
  }

  return sortedTokens.slice(0, topTokenCount.value)
})

// 准备图表数据 - Stack柱状图模式
const chartData = computed(() => {
  if (displayDates.value.length === 0 || topTokens.value.length === 0) {
    return { categories: [], series: [] }
  }

  // X轴：日期
  const categories = displayDates.value.map(dateStr =>
    dayjs(dateStr, 'YYYYMMDD').format('MM-DD'),
  )

  // Y轴系列：每个代币作为一个series，使用stack模式堆叠
  const series = topTokens.value.map((token, index) => {
    const data = displayDates.value.map((dateStr) => {
      const dayData = allData.value[dateStr] || []
      const tokenData = dayData.find(item => item && item.ticker === token.ticker)
      // 将mindshare转换为百分比并保留3位小数，增强数值验证
      if (tokenData && typeof tokenData.last_24h_mindshare === 'number' && !Number.isNaN(tokenData.last_24h_mindshare)) {
        return Number((tokenData.last_24h_mindshare * 100).toFixed(3))
      }
      return 0
    })

    return {
      name: token.ticker,
      type: 'bar',
      stack: 'mindshare', // 关键：设置stack名称，相同stack的系列会堆叠
      emphasis: {
        focus: 'series',
      },
      data,
      itemStyle: {
        color: colorPalette[index % colorPalette.length],
      },
    }
  })

  return { categories, series }
})

// 初始化图表
function initChart() {
  if (!chartRef.value)
    return

  chartInstance.value = echarts.init(chartRef.value)
  updateChart()
}

// 更新图表
function updateChart() {
  if (!chartInstance.value)
    return

  const { categories, series } = chartData.value

  const displayTokenCount = topTokenCount.value === 0 || topTokenCount.value >= allTokens.value.length
    ? allTokens.value.length
    : topTokenCount.value

  const option = {
    title: {
      text: 'KAITO 24H Mindshare 历史趋势图',
      subtext: `Stack柱状图 | ${displayTokenCount === allTokens.value.length ? '所有' : `前${displayTokenCount}`}代币 | 最近${selectedDateRange.value}天`,
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
      },
      subtextStyle: {
        fontSize: 12,
        color: '#666',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow', // 显示阴影指示器
      },
      formatter(params: any) {
        let result = `<div style="margin-bottom: 8px;"><strong>${params[0].axisValue}</strong></div>`

        // 计算总和
        let total = 0
        params.forEach((param: any) => {
          total += Number(param.value) || 0
        })

        result += `<div style="margin-bottom: 4px; font-weight: bold;">总计: ${total.toFixed(3)}%</div>`
        result += '<div style="border-top: 1px solid #ccc; margin: 4px 0;"></div>'

        // 按值排序显示
        params.sort((a: any, b: any) => Number(b.value) - Number(a.value))
        params.forEach((param: any) => {
          result += `<div style="display: flex; justify-content: space-between; margin: 2px 0;">
            <span>${param.marker}${param.seriesName}</span>
            <span style="margin-left: 20px; font-weight: bold;">${param.value}%</span>
          </div>`
        })
        return result
      },
    },
    legend: {
      top: '50px',
      type: 'scroll',
      pageButtonItemGap: 5,
      pageButtonGap: 20,
      pageButtonPosition: 'end',
      pageFormatter: '{current}/{total}',
      animationDurationUpdate: 800,
      selector: [
        {
          type: 'all',
          title: '全选',
        },
        {
          type: 'inverse',
          title: '反选',
        },
      ],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '120px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        fontSize: 11,
        rotate: categories.length > 15 ? 45 : 0, // 日期过多时旋转标签
      },
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: 'value',
      name: 'Mindshare (%)',
      nameTextStyle: {
        fontSize: 12,
      },
      axisLabel: {
        formatter: '{value}%',
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
        },
      },
    },
    series,
    animationDuration: 1000,
    animationEasing: 'cubicOut' as const,
    // 添加数据缩放组件，允许用户缩放查看
    dataZoom: [
      {
        type: 'slider',
        show: categories.length > 20,
        xAxisIndex: 0,
        bottom: '2%',
        height: 20,
        start: Math.max(0, 100 - (20 / categories.length * 100)), // 默认显示最后20个数据点
        end: 100,
      },
    ],
  }

  chartInstance.value.setOption(option, true)
}

// 监听数据变化
watch([chartData, topTokenCount, selectedDateRange], () => {
  nextTick(() => {
    updateChart()
  })
}, { immediate: false })

// 监听allTokens变化，确保下拉框显示正确
watch(allTokens, () => {
  // 当所有代币列表更新时，如果当前选择的数量超过总数，重置为显示所有
  if (topTokenCount.value > allTokens.value.length && topTokenCount.value !== 0) {
    topTokenCount.value = 0
  }
})

// 响应式处理
function handleResize() {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}

// 显示通知
function showNotification(message: string, type = 'info') {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// 组件挂载
onMounted(async () => {
  await loadAll24hData()
  await nextTick()
  initChart()

  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理
onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
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
                v-model="topTokenCount"
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
              </select>
            </div>

            <div class="flex items-center space-x-2">
              <label class="text-sm text-gray-700">时间范围:</label>
              <select
                v-model="selectedDateRange"
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
              </select>
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
            {{ topTokenCount === 0 || topTokenCount >= allTokens.length ? `所有${allTokens.length}` : `前${topTokenCount}` }} 个
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
