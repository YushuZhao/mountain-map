# 🏔️ 春山昂首 (Awakening Mountains)

一个基于 React + ECharts 的交互式中国名山地图，支持一键生成打卡海报。

## ✨ 功能特点

- **地图交互**：全屏可交互的中国地图（支持缩放、拖拽）。
- **个性化标注**：支持自定义山峰坐标、图标及描述文案。
- **海报生成**：内置截图引擎，智能修正地图视角，一键导出 900x1200 竖屏海报。

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 本地运行
npm run dev

# 3. 生产构建
npm run build
```

## 🛠️ 数据配置

如需添加或修改地图上的山峰，只需编辑 `src/data/mountains.js` 文件：

```javascript
export const mountainData = [
  {
    name: '泰山',                 // 标题
    value: [117.1, 36.25, 100],  // [经度, 纬度, 权重]
    label: '五岳独尊',             // 副标题
    province: '山东',             // 省份
    color: '#E63946',            // 标记颜色
    icon: '⛰️',                   // 顶部图标
  }
]
```

## 📦 技术栈

- React 18 + Vite
- ECharts 5 (数据可视化)
- html2canvas (海报截图)

---
*「山不来见我，我便向山走去」*
