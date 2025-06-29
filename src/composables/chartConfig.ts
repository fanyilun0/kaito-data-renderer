import type { EChartsOption } from 'echarts'

export interface ChartConfigOptions {
  categories: string[]
  series: any[]
  displayTokenCount: number
  selectedDateRange: number
  allTokensLength: number
  displayDates: string[]
}

// 生成颜色
function generateColor(index: number): string {
  return `hsl(${index * 137.5 % 360}, 70%, 50%)`
}

// 创建简化的图表配置
export function createChartConfig(options: ChartConfigOptions): EChartsOption {
  const {
    categories,
    series,
  } = options

  // 确保数据的安全性和正确性
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    throw new Error('Invalid categories data')
  }
  if (!series || !Array.isArray(series) || series.length === 0) {
    throw new Error('Invalid series data')
  }

  // 简化series配置
  const simplifiedSeries = series.map((s, index) => ({
    name: s.name,
    type: 'bar' as const,
    stack: 'mindshare',
    data: s.data,
    itemStyle: {
      color: s.itemStyle?.color || generateColor(index),
    },
    emphasis: {
      focus: 'series' as const,
      itemStyle: {
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffsetX: 2,
        shadowOffsetY: 2,
      },
    },
    // 添加动画延迟
    animationDelay: (idx: number) => idx * 5,
  }))

  return {
    title: {
      text: 'KAITO 24H Mindshare 历史趋势图',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
      },
      top: '16px',
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
      textStyle: {
        align: 'left',
      },
    },
    legend: {
      orient: 'vertical',
      right: '10px',
      top: '80px',
      type: 'scroll',
      pageButtonPosition: 'end',
      pageFormatter: '{current}/{total}',
      textStyle: {
        fontSize: 12,
      },
      itemGap: 8,
      itemWidth: 14,
      itemHeight: 14,
      // 增加选择器
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
      selectorPosition: 'start',
    },
    grid: {
      left: '3%',
      right: '120px',
      bottom: '8%',
      top: '80px',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        fontSize: 11,
        rotate: categories.length > 15 ? 45 : 0,
        margin: 8,
      },
      axisTick: {
        alignWithLabel: true,
      },
      axisLine: {
        lineStyle: {
          color: '#ddd',
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Mindshare (%)',
      nameTextStyle: {
        fontSize: 12,
        padding: [0, 0, 0, 20],
      },
      axisLabel: {
        formatter: '{value}%',
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#f0f0f0',
        },
      },
      axisLine: {
        lineStyle: {
          color: '#ddd',
        },
      },
    },
    series: simplifiedSeries,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    animationDelayUpdate: (idx: number) => idx * 2,
    dataZoom: categories.length > 20
      ? [
          {
            type: 'slider',
            xAxisIndex: 0,
            bottom: '2%',
            height: 20,
            start: Math.max(0, 100 - (20 / categories.length * 100)),
            end: 100,
            minSpan: 5, // 最小缩放范围
            maxSpan: 100, // 最大缩放范围
            zoomLock: false, // 允许缩放
            textStyle: {
              fontSize: 10,
            },
            handleStyle: {
              color: '#5470c6',
            },
            dataBackground: {
              areaStyle: {
                color: 'rgba(84, 112, 198, 0.2)',
              },
              lineStyle: {
                color: '#5470c6',
              },
            },
            // 移除可能导致问题的 startValue 和 endValue
            filterMode: 'none', // 不过滤数据，只缩放视图
          },
        ]
      : [],
  }
}

// 更新图表配置（保持状态）
export function updateChartWithState(
  chartInstance: any,
  newOption: EChartsOption,
): void {
  if (!chartInstance)
    return

  try {
    // 保存当前状态
    const currentOption = chartInstance.getOption() as any
    let preservedLegendSelected = {}
    let preservedDataZoom = null

    if (currentOption?.legend?.[0]) {
      preservedLegendSelected = currentOption.legend[0].selected || {}
    }
    if (currentOption?.dataZoom?.[0]) {
      preservedDataZoom = {
        start: currentOption.dataZoom[0].start,
        end: currentOption.dataZoom[0].end,
      }
    }

    // 正确应用保存的legend状态
    if (Object.keys(preservedLegendSelected).length > 0 && newOption.legend) {
      // 确保legend配置结构完整，只更新selected字段
      if (typeof newOption.legend === 'object' && !Array.isArray(newOption.legend)) {
        (newOption.legend as any).selected = preservedLegendSelected
      }
    }

    // 应用保存的dataZoom状态
    if (preservedDataZoom && newOption.dataZoom && Array.isArray(newOption.dataZoom) && newOption.dataZoom.length > 0) {
      // 确保 preservedDataZoom 的值是有效的
      const validStart = typeof preservedDataZoom.start === 'number' && !Number.isNaN(preservedDataZoom.start)
        ? Math.max(0, Math.min(100, preservedDataZoom.start))
        : (newOption.dataZoom[0] as any)?.start || 0
      const validEnd = typeof preservedDataZoom.end === 'number' && !Number.isNaN(preservedDataZoom.end)
        ? Math.max(0, Math.min(100, preservedDataZoom.end))
        : (newOption.dataZoom[0] as any)?.end || 100

      // 安全地更新 dataZoom 配置
      if (newOption.dataZoom[0]) {
        newOption.dataZoom[0] = {
          ...newOption.dataZoom[0],
          start: validStart,
          end: validEnd,
        }
      }
    }

    // 更新图表，使用notMerge: false来保持legend交互功能
    chartInstance.setOption(newOption, false, true)
  }
  catch (error) {
    console.error('更新图表配置失败:', error)
    throw error
  }
}

// 重置图表状态
export function resetChartState(chartInstance: any): void {
  if (!chartInstance)
    return

  try {
    chartInstance.dispatchAction({
      type: 'legendAllSelect',
    })

    chartInstance.dispatchAction({
      type: 'dataZoom',
      start: 0,
      end: 100,
    })
  }
  catch (error) {
    console.warn('重置图表状态失败:', error)
  }
}
