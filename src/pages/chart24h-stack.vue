<script setup lang="ts">
import type { KaitoDataItem, TokenStats } from '../composables/kaitoDataProcessor'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getTopTokens, loadAll24hData, prepareChartData } from '../composables/kaitoDataProcessor'

// 数据状态
const loading = ref(true)
const chartRef = ref<HTMLElement>()
const allData = ref<Record<string, KaitoDataItem[]>>({})
const availableDates = ref<string[]>([])
const allTokens = ref<string[]>([])
const notification = ref({ show: false, message: '', type: 'info' })
const chartInstance = ref<echarts.ECharts>()

// 图表配置 - 默认显示前50个代币
const topTokenCount = ref(50)
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
  if (!chartRef.value || chartInstance.value) {
    return
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

  const option: echarts.EChartsOption = {
    title: {
      text: 'KAITO 24H Mindshare 历史趋势图',
      subtext: `Stack柱状图 | ${displayTokenCount === allTokens.value.length ? '所有' : `前${displayTokenCount}`}代币 | ${selectedDateRange.value === 0 ? '全部时间' : `最近${selectedDateRange.value}天`}`,
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
        type: 'shadow',
      },
      confine: true,
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: '#333',
      borderWidth: 1,
      textStyle: {
        color: '#fff',
        fontSize: 12,
      },
      formatter(params: any) {
        if (!params || !Array.isArray(params) || params.length === 0) {
          return ''
        }

        let result = `<div style="margin-bottom: 8px; font-weight: bold; font-size: 14px;">${params[0].axisValue}</div>`

        // 计算总和并过滤有效数据
        const validParams = params.filter((param: any) => 
          param && 
          typeof param.value === 'number' && 
          !Number.isNaN(param.value) && 
          param.value > 0
        )

        if (validParams.length === 0) {
          return result + '<div>暂无数据</div>'
        }

        let total = 0
        validParams.forEach((param: any) => {
          total += param.value
        })

        result += `<div style="margin-bottom: 4px; font-weight: bold; color: #ffd700;">总计: ${total.toFixed(3)}%</div>`
        result += '<div style="border-top: 1px solid #555; margin: 4px 0;"></div>'

        // 按值排序显示
        validParams.sort((a: any, b: any) => b.value - a.value)
        validParams.forEach((param: any, index: number) => {
          const percentage = total > 0 ? ((param.value / total) * 100).toFixed(1) : '0.0'
          result += `<div style="display: flex; justify-content: space-between; align-items: center; margin: 3px 0; padding: 2px 0;">
            <span style="display: flex; align-items: center;">
              ${param.marker}
              <span style="margin-left: 5px;">${param.seriesName}</span>
            </span>
            <span style="margin-left: 20px; font-weight: bold; color: #ffd700;">
              ${param.value.toFixed(3)}% (${percentage}%)
            </span>
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
      // 确保图例可交互
      selected: {},
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
      // 设置图例的样式
      textStyle: {
        fontSize: 12,
      },
      itemWidth: 14,
      itemHeight: 14,
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
        rotate: categories.length > 15 ? 45 : 0,
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
    series: series.map((s, index) => ({
      ...s,
      // 确保series有完整的配置
      name: s.name || `系列${index + 1}`,
      type: 'bar',
      stack: 'mindshare',
      emphasis: {
        focus: 'series',
      },
      data: s.data || [],
      itemStyle: {
        color: s.itemStyle?.color || `hsl(${index * 137.5 % 360}, 70%, 50%)`,
      },
    })),
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    // 添加数据缩放组件
    dataZoom: [
      {
        type: 'slider',
        show: categories.length > 20,
        xAxisIndex: 0,
        bottom: '2%',
        height: 20,
        start: Math.max(0, 100 - (20 / categories.length * 100)),
        end: 100,
        textStyle: {
          fontSize: 10,
        },
      },
    ],
  }

  try {
    chartInstance.value.setOption(option, true)
  } catch (error) {
    console.error('更新图表失败:', error)
    showNotification('更新图表失败', 'error')
  }
}

// 监听控制参数变化
watch([topTokenCount, selectedDateRange], () => {
  if (chartInstance.value && chartData.value) {
    nextTick(() => {
      updateChart()
    })
  }
}, { immediate: false })

// 监听chartData变化
watch(chartData, (newData) => {
  if (chartInstance.value && newData && (newData.categories.length > 0 || newData.series.length > 0)) {
    nextTick(() => {
      updateChart()
    })
  }
}, { immediate: false, deep: true })

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
      chartInstance.value = undefined
    } catch (error) {
      console.error('销毁图表失败:', error)
    }
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
