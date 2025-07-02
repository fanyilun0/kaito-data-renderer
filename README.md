<h1 align='center'>
Kaito Data Renderer
</h1>

<h3 align='center'>
<a href="https://kaito-data-renderer.vercel.app/">Kaito Pre-TGE Token Data Visualization Platform</a>
</h3>

<p align='center'>
  <b>
    <a href="README.md">🇺🇸 English</a> •
    <a href="README-ZH.md">🇨🇳 中文</a>
  </b>
</p>

<p align='center'>
  <a href="https://kaito-data-renderer.vercel.app/">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-Online_Experience-blue?style=for-the-badge" alt="Live Demo">
  </a>
  <img src="https://img.shields.io/badge/⚡_Powered_by-Vue_3_+_TypeScript-4FC08D?style=for-the-badge&logo=vue.js" alt="Vue 3">
  <img src="https://img.shields.io/badge/📊_Charts-ECharts-FF6B6B?style=for-the-badge" alt="ECharts">
  <img src="https://img.shields.io/badge/🚀_Deploy-Vercel-000000?style=for-the-badge&logo=vercel" alt="Vercel">
</p>

## ✨ Project Overview

📈 **Kaito Data Renderer** is a specialized data visualization platform for displaying Kaito Pre-TGE hot token mention rankings. Using modern web technology stack, the platform provides intuitive tables and charts to real-time display token social media mentions and ranking trend changes across different time periods, helping users quickly understand market hotspots and token popularity dynamics.

## 🎯 Core Features

### 📊 Data Display

#### 📋 Table View (index.vue)

- 🏆 **Real-time Leaderboard** - Display token mention rankings across different time periods
- 📅 **Multi-temporal Dimensions** - Support data viewing for 24h, 48h, 7d, 30d, 3m, 6m, 12m
- 🔍 **Smart Search** - Support quick search by token name or symbol with real-time filtering
- 📈 **Trend Analysis** - Display token mention trends and percentage changes
- 📱 **Responsive Design** - Perfect adaptation for desktop and mobile devices
- 🎨 **Interactive Sorting** - Click table headers to sort by different fields

#### 📈 Chart View (chart-stack.vue)

- 📊 **Stacked Area Chart** - Use ECharts to display time-series changes of token mentions
- 🎯 **Configurable Display** - Support showing top 10/15/20/25/50 tokens or all tokens
- 📅 **Time Range Selection** - Support data display for recent 7/14/30/60/90 days or all time
- 🎨 **Interactive Charts** - Support zoom, pan, legend interaction and other functions
- 🔄 **State Reset** - One-click reset chart view state
- 📊 **Data Statistics** - Display data range, days, token count and other statistics

### 📡 Data Processing

- 📊 **JSON Data Source** - Structured token mention data with historical data backtracking
- 🔄 **Smart Caching** - Browser local cache to improve data loading speed
- 💾 **Dynamic Loading** - Load data on demand for different time periods, reducing bandwidth consumption
- 🔍 **Real-time Filtering** - Client-side data filtering and search with fast response
- 🛡️ **Data Validation** - Complete data type checking and exception handling

### 🎨 User Experience

- 🌙 **Dark Mode** - Support light/dark theme switching
- 📱 **Mobile First** - Responsive design with perfect mobile device support
- ⚡ **Performance Optimization** - Virtual scrolling, lazy loading and other performance optimizations
- 🔔 **Smart Notifications** - Friendly operation feedback and status prompts
- 🎯 **Accessibility** - Follow WCAG accessibility design standards

### 🌍 Internationalization

- 🌐 **Bilingual Support** - Complete Chinese and English internationalization
- 🔄 **Smart Language Detection** - Auto-detect browser language and save user preference to localStorage
- ⚡ **Seamless Switching** - Dynamic language switching without page refresh
- 📊 **Full Coverage** - All interface texts including tables, charts, notifications are internationalized
- 📅 **Date Localization** - Automatic date format adjustment based on language

## 🚀 Quick Start

### 📋 Requirements

- 💻 Node.js 18+ (recommended 20+)
- 📦 pnpm 8+ (recommended) or npm/yarn

### ⚡ Local Development

```bash
# 📥 Clone project
git clone https://github.com/fanyilun0/kaito-data-renderer.git
cd kaito-data-renderer

# 📦 Install dependencies
pnpm install

# 🚀 Start development server (http://localhost:3333)
pnpm dev

# 🌐 Open in browser
open http://localhost:3333
```

### 🏗️ Build & Deploy

```bash
# 🏗️ Build for production
pnpm build

# 👀 Preview build
pnpm preview

# 🚀 Deploy to Vercel (requires Vercel CLI)
vercel deploy
```

### 🧪 Testing & Quality Check

```bash
# 🧪 Run unit tests
pnpm test

# 🔍 Code linting
pnpm lint

# 🔧 TypeScript type check
pnpm typecheck

# 📦 Dependency update check
pnpm up
```

## 📊 Data Structure

### 📁 Data File Format

```
public/data/
├── kaito_data_20250418_24h.json   # 24h data
├── kaito_data_20250418_48h.json   # 48h data
├── kaito_data_20250418_7d.json    # 7d data
├── kaito_data_20250418_30d.json   # 30d data
├── kaito_data_20250418_3m.json    # 3m data
├── kaito_data_20250418_6m.json    # 6m data
├── kaito_data_20250418_12m.json   # 12m data
└── ...                            # Other date data
```

### 🏷️ Data Field Description

```typescript
interface TickerItem {
  ticker_id: string // Unique identifier
  ticker: string // Token symbol (e.g., "BTC", "ETH")
  fullname: string // Token full name (e.g., "Bitcoin", "Ethereum")
  logo?: string // Token icon URL
  rank: number // Current ranking

  // Mention percentages for different time periods
  last_24h_mindshare: number
  last_48h_mindshare: number
  last_7d_mindshare: number
  last_30d_mindshare: number
  last_3m_mindshare: number
  last_6m_mindshare: number
  last_12m_mindshare: number

  // Change ratios for different time periods
  change_24h_ratio: number
  change_48h_ratio: number
  change_7d_ratio: number
  change_30d_ratio: number
  change_3m_ratio: number
  change_6m_ratio: number
  change_12m_ratio: number
}
```

### 📋 Data File Structure

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
      // ... other fields
    }
    // ... more token data
  ]
}
```

## 📱 Interface Features

### 🏠 Main Page - Table View (`/`)

#### 🔍 Search and Filter Features

- **Smart Search Box** - Real-time search for token names and symbols
- **Date Selector** - Select data for specific dates
- **Time Period Switch** - Dynamically switch between different time dimensions

#### 📊 Data Table

- **Ranking Display** - Clear numerical ranking identification
- **Token Information** - Symbol, full name and icon display
- **Mention Data** - Current time period mention percentage
- **Trend Indicators** - Color-coded rise/fall change rates
- **Interactive Sorting** - Click table headers to sort by different fields

#### 🎨 Interface Features

- **Responsive Layout** - Adaptive to desktop and mobile devices
- **Loading Animation** - Elegant data loading states
- **Error Handling** - Friendly error message prompts
- **Performance Optimization** - Virtual scrolling for large data sets

### 📈 Chart Page - Visualization View (`/chart-stack`)

#### 📊 Chart Configuration

- **Token Count Selection** - Top 10/15/20/25/50 or all tokens
- **Time Range Selection** - Recent 7/14/30/60/90 days or all time
- **Chart Type** - Stacked area chart clearly showing trend changes

#### 🎮 Interactive Features

- **Zoom & Pan** - Mouse or touch operations for chart interaction
- **Legend Control** - Click legend to show/hide specific tokens
- **State Reset** - One-click reset chart to initial state
- **Responsive Chart** - Adaptive to different screen sizes

#### 📈 Data Statistics

- **Data Range Display** - Current displayed date range
- **Day Count** - Actual included data days
- **Token Count** - Currently displayed token count
- **Total Data** - Available historical data total

### 🎨 Common UI Components

#### 🧩 Reusable Components

- **AppLayout** - Unified page layout container
- **AppHeader** - Page title and navigation
- **AppSelect** - Unified style selector
- **TickerTableHeader** - Table header component
- **TickerTableRow** - Table row component
- **LanguageSwitch** - Language switching component

## 🌍 Internationalization (i18n)

### ✨ Features

- ✅ Support Chinese (zh) and English (en) languages
- ✅ Language preference auto-saved to localStorage
- ✅ Auto-detect browser language for default language
- ✅ Dynamic language switching without page refresh
- ✅ Full interface text internationalization
- ✅ Date format adjustment based on language

### 📁 File Structure

```
src/i18n/
├── index.ts              # i18n configuration and utility functions
├── locales/
│   ├── en.json          # English translations
│   └── zh.json          # Chinese translations
```

### 🔄 Language Switching

Click the language selector in the page header navigation to switch languages:

- 中文 (Chinese)
- English

### 📝 Adding New Translations

1. Add English translation in `locales/en.json`
2. Add corresponding Chinese translation in `locales/zh.json`
3. Use `t('key')` function in components

Example:

```vue
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <div>{{ t('table.title') }}</div>
  <div>{{ t('notification.loadSuccess', { count: 5 }) }}</div>
</template>
```

## 🚀 Deployment & Hosting

### 🌐 Vercel Deployment (Recommended)

1. **Connect Repository**

   ```bash
   # Connect GitHub repository to Vercel
   vercel --prod
   ```

2. **Automatic Deployment**

   - Push to `main` branch triggers automatic deployment
   - Support preview deployments and production deployments
   - Built-in CDN and edge function optimization

3. **Analytics Configuration**
   - Enable Web Analytics in Vercel console
   - App integrated with `@vercel/analytics/vue` component
   - Automatically collect visit statistics and performance data

### 🔧 Other Deployment Platforms

```bash
# Netlify deployment
npm run build
# Upload dist folder to Netlify

# GitHub Pages deployment
npm run build
# Configure GitHub Actions for automatic deployment

# Self-hosted server
npm run build
# Deploy dist folder to web server
```

## 📈 Data Update Process

### 📅 Automated Data Processing

```python
# Python data processing script
python src/data_process.py

# Generated file format
kaito_data_{YYYYMMDD}_{duration}.json
```

### 🔄 Update Frequency

- **Daily Updates** - Generate new data files daily
- **Multi-period Coverage** - Cover all time dimensions from 24 hours to annual
- **Historical Data Retention** - Complete preservation of historical data for trend analysis

## 🔧 Development Guide

### 📁 Project Structure

```
kaito-data-renderer/
├── public/
│   ├── data/                   # Static data files
│   │   └── favicon.svg             # Website icon
├── src/
│   ├── components/             # Reusable components
│   │   ├── AppHeader.vue      # Page header
│   │   ├── AppLayout.vue      # Layout container
│   │   ├── AppSelect.vue      # Selector component
│   │   ├── LanguageSwitch.vue # Language switcher
│   │   ├── TickerTableHeader.vue # Table header
│   │   └── TickerTableRow.vue    # Table row
│   ├── composables/           # Composable functions
│   │   ├── chartConfig.ts     # Chart configuration
│   │   ├── dark.ts           # Dark mode
│   │   ├── index.ts          # Unified export
│   │   └── kaitoDataProcessor.ts # Data processing
│   ├── i18n/                 # Internationalization
│   │   ├── index.ts          # i18n configuration
│   │   └── locales/          # Translation files
│   │       ├── en.json       # English translations
│   │       └── zh.json       # Chinese translations
│   ├── pages/                # Page components
│   │   ├── index.vue         # Table view
│   │   └── chart-stack.vue   # Chart view
│   ├── styles/
│   │   └── main.css          # Global styles
│   ├── App.vue               # Root component
│   └── main.ts               # Application entry
├── test/                     # Test files
└── README.md                # Project documentation
```

## 📄 License

📜 This project is licensed under the [MIT License](LICENSE)

## 🤝 Contributing

Welcome to submit Issues and Pull Requests!

1. **Fork the project**
2. **Create feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to branch** (`git push origin feature/AmazingFeature`)
5. **Create Pull Request**

### 📋 Development Standards

- Use TypeScript for type-safe development
- Follow ESLint code standards
- Write unit tests to cover new features
- Update relevant documentation

## 🙏 Acknowledgments

- 🌟 Thanks to [Anthony Fu](https://github.com/antfu) for providing the [Vitesse](https://github.com/antfu/vitesse) template
- 📊 Thanks to Kaito for data support

---

<p align='center'>
⭐ If this project helps you, please give it a star!<br>
</p>

<p align='center'>
  <a href="https://github.com/fanyilun0/kaito-data-renderer/stargazers">
    <img src="https://img.shields.io/github/stars/fanyilun0/kaito-data-renderer?style=social" alt="GitHub Stars">
  </a>
  <a href="https://github.com/fanyilun0/kaito-data-renderer/network/members">
    <img src="https://img.shields.io/github/forks/fanyilun0/kaito-data-renderer?style=social" alt="GitHub Forks">
  </a>
</p>
