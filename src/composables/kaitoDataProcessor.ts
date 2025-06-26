import dayjs from 'dayjs'

// 数据类型定义
export interface KaitoDataItem {
  ticker: string
  fullname: string
  logo: string
  last_24h_mindshare: number
  [key: string]: any
}

export interface TokenStats {
  ticker: string
  fullname: string
  logo: string
  totalMindshare: number
  appearances: number
  avgMindshare: number
}

export interface ChartData {
  categories: string[]
  series: Array<{
    name: string
    type: 'bar'
    stack: string
    emphasis: { focus: 'series' }
    data: number[]
    itemStyle: { color: string }
  }>
}

// 颜色配置
export const colorPalette = [
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

/**
 * 生成可能的日期范围（从2025-04-18到当前日期）
 */
export function generateDateRange(): string[] {
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

/**
 * 验证数据项是否有效
 */
function isValidDataItem(item: any): item is KaitoDataItem {
  return item
    && typeof item.ticker === 'string'
    && item.ticker.trim() !== ''
    && typeof item.last_24h_mindshare === 'number'
    && !Number.isNaN(item.last_24h_mindshare)
    && item.last_24h_mindshare >= 0
}

/**
 * 加载所有24H数据
 */
export async function loadAll24hData(): Promise<{
  allData: Record<string, KaitoDataItem[]>
  availableDates: string[]
  allTokens: string[]
}> {
  const possibleDates = generateDateRange()
  const loadedData: Record<string, KaitoDataItem[]> = {}
  const successfulDates: string[] = []

  // 并行加载所有日期的数据
  const loadPromises = possibleDates.map(async (dateStr) => {
    try {
      const response = await fetch(`/data/kaito_data_${dateStr}_24h.json`)
      
      // 检查响应状态
      if (!response.ok) {
        // 404错误表示文件不存在，这是正常情况，不需要警告
        if (response.status !== 404) {
          console.warn(`Failed to load data for ${dateStr}: HTTP ${response.status}`)
        }
        return
      }

      // 检查响应内容类型
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.warn(`Invalid content type for ${dateStr}: ${contentType}`)
        return
      }

      const data = await response.json()
      
      // 增强数据验证，确保数据结构完整
      if (data && data.resultWithTicker && Array.isArray(data.resultWithTicker) && data.resultWithTicker.length > 0) {
        // 验证每个数据项的必需字段
        const validData = data.resultWithTicker.filter(isValidDataItem)
        if (validData.length > 0) {
          loadedData[dateStr] = validData
          successfulDates.push(dateStr)
        } else {
          console.warn(`No valid data items found for ${dateStr}`)
        }
      } else {
        console.warn(`Invalid data structure for ${dateStr}:`, data)
      }
    }
    catch (error) {
      // 只对非网络错误进行警告
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // 网络错误，可能是开发环境中的正常情况
        return
      }
      
      if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
        // JSON解析错误，可能返回了HTML错误页面
        console.warn(`Received non-JSON response for ${dateStr}, file may not exist`)
        return
      }
      
      console.warn(`Failed to load data for ${dateStr}:`, error)
    }
  })

  await Promise.all(loadPromises)

  // 按日期排序
  successfulDates.sort()

  // 计算所有出现过的代币
  const tokenSet = new Set<string>()
  Object.values(loadedData).forEach((dayData) => {
    dayData.forEach((item) => {
      if (item && item.ticker) {
        tokenSet.add(item.ticker)
      }
    })
  })
  const allTokens = Array.from(tokenSet)

  // 输出加载统计信息
  console.log(`Successfully loaded ${successfulDates.length} days of data, found ${allTokens.length} unique tokens`)

  return {
    allData: loadedData,
    availableDates: successfulDates,
    allTokens,
  }
}

/**
 * 获取指定日期范围内的前N个代币统计
 */
export function getTopTokens(
  allData: Record<string, KaitoDataItem[]>,
  displayDates: string[],
  topCount: number,
): TokenStats[] {
  if (displayDates.length === 0)
    return []

  const tokenStats: Record<string, TokenStats> = {}

  // 统计每个代币在所有日期中的mindshare
  displayDates.forEach((dateStr) => {
    const dayData = allData[dateStr] || []
    dayData.forEach((item) => {
      // 增强数据验证
      if (!isValidDataItem(item)) {
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

  // 如果topCount为0或大于等于总数量，返回所有代币
  if (topCount === 0 || topCount >= sortedTokens.length) {
    return sortedTokens
  }

  return sortedTokens.slice(0, topCount)
}

/**
 * 准备图表数据 - Stack柱状图模式
 */
export function prepareChartData(
  allData: Record<string, KaitoDataItem[]>,
  displayDates: string[],
  topTokens: TokenStats[],
): ChartData {
  // 增强数据验证
  if (!allData || !displayDates || !topTokens || displayDates.length === 0 || topTokens.length === 0) {
    return { categories: [], series: [] }
  }

  // X轴：日期
  const categories = displayDates.map(dateStr => {
    try {
      return dayjs(dateStr, 'YYYYMMDD').format('MM-DD')
    } catch (error) {
      console.warn(`Invalid date format: ${dateStr}`)
      return dateStr
    }
  })

  // Y轴系列：每个代币作为一个series，使用stack模式堆叠
  const series = topTokens.map((token, index) => {
    // 验证token数据
    if (!token || !token.ticker) {
      console.warn(`Invalid token data at index ${index}:`, token)
      return null
    }

    const data = displayDates.map((dateStr) => {
      try {
        const dayData = allData[dateStr] || []
        const tokenData = dayData.find(item => item && item.ticker === token.ticker)
        
        // 将mindshare转换为百分比并保留3位小数，增强数值验证
        if (tokenData && 
            typeof tokenData.last_24h_mindshare === 'number' && 
            !Number.isNaN(tokenData.last_24h_mindshare) && 
            tokenData.last_24h_mindshare >= 0) {
          return Number((tokenData.last_24h_mindshare * 100).toFixed(3))
        }
        return 0
      } catch (error) {
        console.warn(`Error processing data for ${token.ticker} on ${dateStr}:`, error)
        return 0
      }
    })

    return {
      name: token.ticker || `Token-${index}`,
      type: 'bar' as const,
      stack: 'mindshare', // 关键：设置stack名称，相同stack的系列会堆叠
      emphasis: {
        focus: 'series' as const,
      },
      data,
      itemStyle: {
        color: colorPalette[index % colorPalette.length] || `hsl(${index * 137.5 % 360}, 70%, 50%)`,
      },
    }
  }).filter((series): series is NonNullable<typeof series> => series !== null) // 过滤掉null值

  return { categories, series }
}
