<h1 align='center'>
Kaito Data Renderer
</h1>

<h3 align='center'>
<a href="https://kaito-data-renderer.vercel.app/">Kaito Pre-TGE 代币数据可视化平台</a>
</h3>

<p align='center'>
  <b>
    <a href="README.md">🇺🇸 English</a> •
    <a href="README-ZH.md">🇨🇳 中文</a>
  </b>
</p>

<p align='center'>
  <a href="https://kaito-data-renderer.vercel.app/">
    <img src="https://img.shields.io/badge/🌐_在线体验-Live_Demo-blue?style=for-the-badge" alt="Live Demo">
  </a>
  <img src="https://img.shields.io/badge/⚡_Powered_by-Vue_3_+_TypeScript-4FC08D?style=for-the-badge&logo=vue.js" alt="Vue 3">
  <img src="https://img.shields.io/badge/📊_Charts-ECharts-FF6B6B?style=for-the-badge" alt="ECharts">
  <img src="https://img.shields.io/badge/🚀_Deploy-Vercel-000000?style=for-the-badge&logo=vercel" alt="Vercel">
</p>

## ✨ 项目简介

📈 **Kaito Data Renderer** 是一个专门用于展示 Kaito Pre-TGE 热门代币提及度排行的数据可视化平台。平台通过现代化的 Web 技术栈，提供直观的表格和图表形式，实时展示不同时间段内各代币的社交媒体提及度、排名变化趋势，帮助用户快速了解市场热点和代币热度动态。

## 🎯 核心功能

### 📊 数据展示

#### 📋 表格视图 (index.vue)

- 🏆 **实时排行榜** - 显示代币在不同时间段的提及度排名
- 📅 **多时间维度** - 支持 24小时、48小时、7天、30天、3个月、6个月、12个月的数据查看
- 🔍 **智能搜索** - 支持按代币名称或代号快速搜索，实时过滤结果
- 📈 **趋势分析** - 显示代币提及度的变化趋势和百分比
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🎨 **交互排序** - 点击表头可按不同字段进行排序

#### 📈 图表视图 (chart-stack.vue)

- 📊 **堆叠面积图** - 使用 ECharts 展示代币提及度的时间序列变化
- 🎯 **可配置展示** - 支持显示前 10/15/20/25/50 个代币或全部代币
- 📅 **时间范围选择** - 支持最近 7/14/30/60/90 天或全部时间的数据展示
- 🎨 **交互式图表** - 支持缩放、平移、图例交互等功能
- 🔄 **状态重置** - 一键重置图表视图状态
- 📊 **数据统计** - 显示数据范围、天数、代币数量等统计信息

### 📡 数据处理

- 📊 **JSON 数据源** - 结构化的代币提及度数据，支持历史数据回溯
- 🔄 **智能缓存** - 浏览器本地缓存，提升数据加载速度
- 💾 **动态加载** - 按需加载不同时间段的数据，减少带宽消耗
- 🔍 **实时过滤** - 客户端数据过滤和搜索，响应速度快
- 🛡️ **数据验证** - 完整的数据类型检查和异常处理

### 🎨 用户体验

- 🌙 **深色模式** - 支持明暗主题切换
- 📱 **移动优先** - 响应式设计，完美支持移动设备
- ⚡ **性能优化** - 虚拟滚动、懒加载等性能优化
- 🔔 **智能通知** - 友好的操作反馈和状态提示
- 🎯 **无障碍访问** - 遵循 WCAG 无障碍设计标准

## 🚀 快速开始

### 📋 环境要求

- 💻 Node.js 18+ (推荐 20+)
- 📦 pnpm 8+ (推荐) 或 npm/yarn

### ⚡ 本地开发

```bash
# 📥 克隆项目
git clone https://github.com/fanyilun0/kaito-data-renderer.git
cd kaito-data-renderer

# 📦 安装依赖
pnpm install

# 🚀 启动开发服务器 (http://localhost:3333)
pnpm dev

# 🌐 在浏览器中访问
open http://localhost:3333
```

### 🏗️ 构建部署

```bash
# 🏗️ 构建生产版本
pnpm build

# 👀 预览构建结果
pnpm preview

# 🚀 部署到 Vercel (需要 Vercel CLI)
vercel deploy
```

### 🧪 测试和质量检查

```bash
# 🧪 运行单元测试
pnpm test

# 🔍 代码检查
pnpm lint

# 🔧 TypeScript 类型检查
pnpm typecheck

# 📦 依赖更新检查
pnpm up
```

## 📊 数据结构

### 📁 数据文件格式

```
public/data/
├── kaito_data_20250418_24h.json   # 24小时数据
├── kaito_data_20250418_48h.json   # 48小时数据
├── kaito_data_20250418_7d.json    # 7天数据
├── kaito_data_20250418_30d.json   # 30天数据
├── kaito_data_20250418_3m.json    # 3个月数据
├── kaito_data_20250418_6m.json    # 6个月数据
├── kaito_data_20250418_12m.json   # 12个月数据
└── ...                            # 其他日期的数据
```

### 🏷️ 数据字段说明

```typescript
interface TickerItem {
  ticker_id: string // 唯一标识符
  ticker: string // 代币代号 (如 "BTC", "ETH")
  fullname: string // 代币全名 (如 "Bitcoin", "Ethereum")
  logo?: string // 代币图标链接
  rank: number // 当前排名

  // 各时间段的提及度 (百分比)
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
```

### 📋 数据文件结构

```json
{
  "resultWithTicker": [
    {
      "ticker_id": "bitcoin",
      "ticker": "BTC",
      "fullname": "Bitcoin",
      "logo": "https://example.com/btc-logo.png",
      "rank": 1,
      "last_24h_mindshare": 25.5,
      "change_24h_ratio": 1.2
      // ... 其他字段
    }
    // ... 更多代币数据
  ]
}
```

## 📱 界面功能详解

### 🏠 主页面 - 表格视图 (`/`)

#### 🔍 搜索和筛选功能

- **智能搜索框** - 实时搜索代币名称和代号
- **日期选择器** - 选择特定日期的数据
- **时间段切换** - 动态切换不同时间维度的数据

#### 📊 数据表格

- **排名显示** - 清晰的数字排名标识
- **代币信息** - 代号、全名和图标展示
- **提及度数据** - 当前时间段的提及度百分比
- **趋势指标** - 彩色编码的涨跌变化率
- **交互排序** - 点击表头按不同字段排序

#### 🎨 界面特性

- **响应式布局** - 自适应桌面和移动设备
- **加载动画** - 优雅的数据加载状态
- **错误处理** - 友好的错误信息提示
- **性能优化** - 虚拟滚动处理大量数据

### 📈 图表页面 - 可视化视图 (`/chart-stack`)

#### 📊 图表配置

- **代币数量选择** - 前 10/15/20/25/50 个或全部代币
- **时间范围选择** - 最近 7/14/30/60/90 天或全部时间
- **图表类型** - 堆叠面积图，清晰展示趋势变化

#### 🎮 交互功能

- **缩放平移** - 鼠标或触摸操作进行图表交互
- **图例控制** - 点击图例显示/隐藏特定代币
- **状态重置** - 一键重置图表到初始状态
- **响应式图表** - 自适应不同屏幕尺寸

#### 📈 数据统计

- **数据范围显示** - 当前显示的日期范围
- **天数统计** - 实际包含的数据天数
- **代币数量** - 当前显示的代币数量
- **总数据量** - 可用的历史数据总量

### 🎨 通用 UI 组件

#### 🧩 复用组件

- **AppLayout** - 统一的页面布局容器
- **AppHeader** - 页面标题和导航
- **AppSelect** - 统一样式的选择器
- **TickerTableHeader** - 表格头部组件
- **TickerTableRow** - 表格行组件

## 🚀 部署和托管

### 🌐 Vercel 部署 (推荐)

1. **连接仓库**

   ```bash
   # 连接 GitHub 仓库到 Vercel
   vercel --prod
   ```

2. **自动部署**

   - 推送到 `main` 分支自动触发部署
   - 支持预览部署和生产部署
   - 内置 CDN 和边缘函数优化

3. **Analytics 配置**
   - 在 Vercel 控制台启用 Web Analytics
   - 应用已集成 `@vercel/analytics/vue` 组件
   - 自动收集访问统计和性能数据

### 🔧 其他部署平台

```bash
# Netlify 部署
npm run build
# 上传 dist 文件夹到 Netlify

# GitHub Pages 部署
npm run build
# 配置 GitHub Actions 自动部署

# 自托管服务器
npm run build
# 将 dist 文件夹部署到 Web 服务器
```

## 📈 数据更新流程

### 📅 自动化数据处理

```python
# Python 数据处理脚本
python src/data_process.py

# 生成的文件格式
kaito_data_{YYYYMMDD}_{duration}.json
```

### 🔄 更新频率

- **每日更新** - 每天生成新的数据文件
- **多时段覆盖** - 涵盖从24小时到年度的各个时间维度
- **历史数据保留** - 完整保存历史数据用于趋势分析

## 🔧 开发指南

### 📁 项目结构

```
kaito-data-renderer/
├── public/
│   ├── data/                   # 静态数据文件
│   │   └── favicon.svg            # 网站图标
│   ├── src/
│   │   ├── components/            # 可复用组件
│   │   │   ├── AppHeader.vue     # 页面头部
│   │   │   ├── AppLayout.vue     # 布局容器
│   │   │   ├── AppSelect.vue     # 选择器组件
│   │   │   ├── TickerTableHeader.vue  # 表格头部
│   │   │   └── TickerTableRow.vue     # 表格行
│   │   ├── composables/          # 组合式函数
│   │   │   ├── chartConfig.ts    # 图表配置
│   │   │   ├── dark.ts          # 深色模式
│   │   │   ├── index.ts         # 统一导出
│   │   │   └── kaitoDataProcessor.ts  # 数据处理
│   │   ├── pages/               # 页面组件
│   │   │   ├── index.vue        # 表格视图
│   │   │   └── chart-stack.vue  # 图表视图
│   │   ├── styles/
│   │   │   └── main.css         # 全局样式
│   │   ├── App.vue              # 根组件
│   │   └── main.ts              # 应用入口
│   ├── test/                    # 测试文件
│   └── README.md               # 项目文档
└── package.json           # 项目配置
```

## 📄 许可证

📜 本项目采用 [MIT License](LICENSE) 许可证

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. **Fork 项目**
2. **创建功能分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建 Pull Request**

### 📋 开发规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 代码规范
- 编写单元测试覆盖新功能
- 更新相关文档

## 🙏 致谢

- 🌟 感谢 [Anthony Fu](https://github.com/antfu) 提供的 [Vitesse](https://github.com/antfu/vitesse) 模板
- 📊 感谢 Kaito 提供的数据支持

---

<p align='center'>
⭐ 如果这个项目对你有帮助，请给它一个 star！<br>
</p>

<p align='center'>
  <a href="https://github.com/fanyilun0/kaito-data-renderer/stargazers">
    <img src="https://img.shields.io/github/stars/fanyilun0/kaito-data-renderer?style=social" alt="GitHub Stars">
  </a>
  <a href="https://github.com/fanyilun0/kaito-data-renderer/network/members">
    <img src="https://img.shields.io/github/forks/fanyilun0/kaito-data-renderer?style=social" alt="GitHub Forks">
  </a>
</p>
