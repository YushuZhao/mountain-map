# 🏔️ 中国名山推荐地图

基于 React + ECharts 的交互式中国名山推荐地图

## ✨ 特性

- 🎨 清新的春天配色风格
- 🗺️ 基于真实地理数据的中国地图
- 📍 可交互的山峰标注（点击、缩放、拖拽）
- ✨ 涟漪动画效果
- 💡 详细的悬浮提示信息
- 📱 响应式设计，支持移动端

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

浏览器会自动打开 `http://localhost:3000`

### 构建生产版本

```bash
npm run build
```

构建产物会输出到 `dist` 目录

### 预览生产版本

```bash
npm run preview
```

## 📦 技术栈

- **React 18** - UI 框架
- **Vite** - 构建工具
- **ECharts 5** - 数据可视化
- **echarts-for-react** - React ECharts 封装

## 📂 项目结构

```
mountain-map/
├── src/
│   ├── components/
│   │   ├── MountainMap.jsx      # 地图组件
│   │   └── MountainMap.css      # 地图样式
│   ├── data/
│   │   └── mountains.js         # 山峰数据
│   ├── App.jsx                  # 主应用组件
│   ├── App.css                  # 主应用样式
│   ├── main.jsx                 # 入口文件
│   └── index.css                # 全局样式
├── index.html                    # HTML 模板
├── vite.config.js               # Vite 配置
└── package.json                 # 项目配置
```

## 🎯 标注的名山

- 🏔️ **峨眉山**（四川）- 云海佛光
- 🍄 **梵净山**（贵州）- 梵天净土
- 🌿 **武功山**（江西）- 高山草甸
- 🌲 **黄山**（安徽）- 奇松怪石

## 🛠️ 自定义

### 添加新的山峰

编辑 `src/data/mountains.js` 文件：

```javascript
export const mountainData = [
  {
    name: '泰山',
    value: [117.1, 36.25, 100],  // [经度, 纬度, 数值]
    label: '五岳独尊',
    province: '山东',
    color: '#E63946',
    icon: '⛰️',
    description: '五岳之首，中华文明的象征'
  },
  // ... 更多山峰
]
```

### 修改配色

在 `src/index.css` 中修改全局配色：

```css
body {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

在 `src/components/MountainMap.jsx` 中修改地图配色。

## 📄 许可

MIT License
