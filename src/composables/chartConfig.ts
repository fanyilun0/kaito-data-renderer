import type { EChartsOption } from 'echarts'
import dayjs from 'dayjs'

export interface ChartConfigOptions {
  categories: string[]
  series: any[]
  displayTokenCount: number
  selectedDateRange: number
  allTokensLength: number
  displayDates: string[]
}

// 简化的tooltip格式化函数
function createSimpleTooltipFormatter(displayDates: string[]) {
  return function(params: any) {
    if (!params || !Array.isArray(params) || params.length === 0) {
      return ''
    }

    const fullDate = displayDates[params[0].dataIndex]
    const formattedDate = dayjs(fullDate, 'YYYYMMDD').format('YYYY-MM-DD')

    // 过滤有效数据并计算总和
    const validParams = params.filter((param: any) => 
      param && typeof param.value === 'number' && param.value > 0
    )

    if (validParams.length === 0) {
      return `<div style="text-align: center;">
        <div style="font-weight: bold; margin-bottom: 5px;">${formattedDate}</div>
        <div style="color: #999;">当日暂无数据</div>
      </div>`
    }

    const total = validParams.reduce((sum: number, param: any) => sum + param.value, 0)
    
    // 排序并只显示前5个
    validParams.sort((a: any, b: any) => b.value - a.value)
    const topParams = validParams.slice(0, 5)

    let html = `<div style="min-width: 200px;">
      <div style="font-weight: bold; text-align: center; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        ${formattedDate}
      </div>
      <div style="text-align: center; margin-bottom: 8px; color: #666;">
        总计: ${total.toFixed(2)}%
      </div>`

    topParams.forEach((param: any) => {
      html += `<div style="display: flex; justify-content: space-between; margin: 3px 0;">
        <span style="display: flex; align-items: center;">
          ${param.marker}
          <span style="margin-left: 5px;">${param.seriesName}</span>
        </span>
        <span style="font-weight: bold;">${param.value.toFixed(2)}%</span>
      </div>`
    })

    if (validParams.length > 5) {
      html += `<div style="text-align: center; margin-top: 5px; font-size: 12px; color: #999;">
        还有${validParams.length - 5}个代币...
      </div>`
    }

    html += '</div>'
    return html
  }
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
    displayTokenCount, 
    selectedDateRange, 
    allTokensLength, 
    displayDates 
  } = options

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
    },
  }))

  return {
    title: {
      text: 'KAITO 24H Mindshare 历史趋势图',
      subtext: `Stack柱状图 | ${displayTokenCount === allTokensLength ? '所有' : `前${displayTokenCount}`}代币 | ${selectedDateRange === 0 ? '全部时间' : `最近${selectedDateRange}天`}`,
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
      formatter: createSimpleTooltipFormatter(displayDates),
    },
    legend: {
      top: '50px',
      type: 'scroll',
      pageButtonPosition: 'end',
      pageFormatter: '{current}/{total}',
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
      textStyle: {
        fontSize: 12,
      },
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
    series: simplifiedSeries,
    animationDuration: 800,
    animationEasing: 'cubicOut',
    dataZoom: categories.length > 20 ? [
      {
        type: 'slider',
        xAxisIndex: 0,
        bottom: '2%',
        height: 20,
        start: Math.max(0, 100 - (20 / categories.length * 100)),
        end: 100,
        textStyle: {
          fontSize: 10,
        },
      },
    ] : undefined,
  }
}

// 更新图表配置（保持状态）
export function updateChartWithState(
  chartInstance: any,
  newOption: EChartsOption
): void {
  if (!chartInstance) return

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
        end: currentOption.dataZoom[0].end
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
    if (preservedDataZoom && newOption.dataZoom && Array.isArray(newOption.dataZoom)) {
      newOption.dataZoom[0] = {
        ...newOption.dataZoom[0],
        start: preservedDataZoom.start,
        end: preservedDataZoom.end
      }
    }

    // 更新图表，使用notMerge: false来保持legend交互功能
    chartInstance.setOption(newOption, false, true)
  } catch (error) {
    console.error('更新图表配置失败:', error)
    throw error
  }
}

// 重置图表状态
export function resetChartState(chartInstance: any): void {
  if (!chartInstance) return

  try {
    chartInstance.dispatchAction({
      type: 'legendAllSelect'
    })
    
    chartInstance.dispatchAction({
      type: 'dataZoom',
      start: 0,
      end: 100
    })
  } catch (error) {
    console.warn('重置图表状态失败:', error)
  }
} 