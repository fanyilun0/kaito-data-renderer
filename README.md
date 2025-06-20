<h1 align='center'>
Kaito Data Renderer
</h1>

<h3 align='center'>
<a href="https://kaito-data-renderer.vercel.app/">Kaito Pre-TGE 代币数据可视化平台</a>
</h3>

## ✨ 项目简介

📈 **Kaito Data Renderer** 是一个专门用于展示 Kaito Pre-TGE 热门代币提及度排行的数据可视化平台。通过直观的表格形式，实时展示不同时间段内各代币的社交媒体提及度、排名变化趋势，帮助用户快速了解市场热点。

## 🎯 核心功能

### 📊 数据展示

- 🏆 **实时排行榜** - 显示代币在不同时间段的提及度排名
- 📅 **多时间维度** - 支持 24小时、48小时、7天、30天、3个月、6个月、12个月的数据查看
- 🔍 **智能搜索** - 支持按代币名称或代号快速搜索
- 📈 **趋势分析** - 显示代币提及度的变化趋势和百分比

### 📡 数据处理

- 📊 **JSON 数据源** - 结构化的代币提及度数据
- 🔄 **动态加载** - 按需加载不同时间段的数据
- 🔍 **实时过滤** - 客户端数据过滤和搜索

## 🚀 快速开始

### 📋 环境要求

- 💻 Node.js 16+
- 📦 pnpm (推荐) 或 npm/yarn

### ⚡ 本地开发

```bash
# 📥 克隆项目
git clone https://github.com/your-username/kaito-data-renderer.git
cd kaito-data-renderer

# 📦 安装依赖
pnpm install

# 🚀 启动开发服务器
pnpm dev
```

### 🏗️ 构建部署

```bash
# 🏗️ 构建生产版本
pnpm build

# 👀 预览构建结果
pnpm preview
```

### 🧪 测试

```bash
# 🧪 运行单元测试
pnpm test

# 🔍 代码检查
pnpm lint

# 🔧 类型检查
pnpm typecheck
```

## 📊 数据结构

### 📁 数据文件格式

```
public/data/
├── kaito_data_20250418_24h.json
├── kaito_data_20250418_48h.json
├── kaito_data_20250418_7d.json
└── ...
```

### 🏷️ 数据字段说明

- 🎯 `ticker` - 代币代号
- 📛 `fullname` - 代币全名
- 🏆 `rank` - 当前排名
- 📊 `mindshare` - 提及度百分比
- 📈 `change_*_ratio` - 不同时间段的变化率
- 🖼️ `logo` - 代币图标链接

## 🎨 界面功能

### 🔍 搜索和筛选

- 🔍 **智能搜索** - 支持代币名称和代号搜索
- 📅 **日期选择** - 选择特定日期的数据
- ⏱️ **时间段切换** - 动态切换不同时间维度

### 📊 数据展示

- 📋 **排行榜表格** - 清晰的数据表格展示
- 🏆 **排名标识** - 直观的排名数字显示
- 📈 **趋势指标** - 颜色编码的涨跌趋势
- 🖼️ **代币图标** - 代币品牌形象展示

### 🔔 用户反馈

- 💡 **智能提示** - 数据加载状态提示
- ⚠️ **错误处理** - 友好的错误信息展示
- 🔄 **加载动画** - 平滑的加载体验

## 🌐 部署平台

- 🚀 [Vercel](https://vercel.com) - 边缘函数支持

## 📈 数据更新

### 📅 更新频率

- 🔄 **每日更新** - 每天生成新的数据文件
- ⏰ **多时段覆盖** - 涵盖从小时到年度的各个时间维度
- 📊 **历史数据保留** - 完整保存历史数据用于趋势分析

### 🔧 数据维护

```bash
# 📊 Python 数据处理脚本
python src/data_process.py
```

## 📄 许可证

📜 本项目采用 [MIT License](LICENSE) 许可证

## 🙏 致谢

- 🌟 感谢 [Anthony Fu](https://github.com/antfu) 提供的 Vitesse 模板
- 📊 感谢 Kaito 提供的数据支持

---

<p align='center'>
⭐ 如果这个项目对你有帮助，请给它一个 star！
</p>
