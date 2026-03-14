import { useRef, useState, useEffect, useMemo } from 'react'
import html2canvas from 'html2canvas'
import * as echarts from 'echarts'
import ReactECharts from 'echarts-for-react'
import { initialMountains } from './data/mountains'
import Sidebar from './components/Sidebar'
import './App.css'

// 基础的散点系列配置（剥离了静态的 data 和动态的 itemStyle）
const baseScatterSeries = {
  type: 'scatter',
  coordinateSystem: 'geo',
  symbol: 'pin',
  symbolSize: [30, 36],
  symbolOffset: [0, '-20%'],
  label: {
    show: true,
    position: 'top',
    distance: 5,
    formatter: (params) => {
      const data = params.data
      return `{icon|${data.icon}}\n{gap|}\n{nameBox|${data.name}}\n{descText|${data.label}}`
    },
    rich: {
      icon: {
        fontSize: 34,
        lineHeight: 34,
        align: 'center',
        backgroundColor: '#FFFFFF',
        padding: [10, 10, 10, 10],
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#F4EAD1',
        shadowBlur: 8,
        shadowColor: 'rgba(0,0,0,0.1)'
      },
      gap: { height: 6 },
      nameBox: {
        backgroundColor: '#4A3320',
        color: '#F4EAD1',
        padding: [4, 14, 4, 14],
        borderRadius: 15,
        fontSize: 15,
        fontWeight: '900',
        align: 'center',
        shadowBlur: 4,
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffsetY: 2
      },
      descText: {
        color: '#4A3320',
        fontSize: 13,
        fontWeight: 'bold',
        align: 'center',
        padding: [4, 0, 0, 0]
      }
    }
  }
}

const geoBase = {
  map: 'china',
  zoom: 1.2,
  center: [105, 36],
  itemStyle: {
    areaColor: '#FFFFFF',
    borderColor: '#E6D7B8',
    borderWidth: 1.5
  },
  emphasis: {
    itemStyle: { areaColor: '#FFFFFF' },
    label: { show: false }
  }
}

function App() {
  const chartRef = useRef(null)
  const posterTemplateRef = useRef(null)
  const [geoJson, setGeoJson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // 新增的状态管理
  const [mountains, setMountains] = useState(initialMountains)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
      .then(r => r.json())
      .then(data => {
        echarts.registerMap('china', data)
        setGeoJson(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // 动态生成 ECharts 所需的 data 数组
  const dynamicSeriesData = useMemo(() => {
    return mountains
      .filter(m => m.visible)
      .map(m => {
        // 根据状态决定地图上图钉的颜色
        let pinColor = '#B63B2B'; // 默认 fallback
        if (m.status === 'none') pinColor = '#C1B6A6'; // 未标记状态为低调的棕灰色
        else if (m.status === 'wishlist') pinColor = '#B63B2B'; // 向往为复古红
        else if (m.status === 'visited') pinColor = '#4A7C59'; // 已达为森林绿

        return {
          ...m,
          itemStyle: {
            color: pinColor,
            shadowBlur: 4,
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowOffsetY: 3
          }
        };
      })
  }, [mountains])

  // ================= 核心修复：地图无闪烁更新 =================
  // 1. 初始化一个固定不变的 mapOption，让 ECharts 只挂载一次
  const initialMapOption = useMemo(() => {
    if (!geoJson) return {}
    return {
      backgroundColor: '#E8DCC4',
      tooltip: {
        show: true,
        trigger: 'item',
        backgroundColor: 'rgba(248, 242, 230, 0.95)',
        borderColor: 'rgba(74, 51, 32, 0.2)',
        borderWidth: 1,
        padding: 16,
        borderRadius: 12,
        textStyle: {
          color: '#4A3320'
        },
        formatter: (params) => {
          if (params.componentSubType === 'scatter') {
            const data = params.data;
            // 根据状态渲染徽章文字和颜色
            let statusBadge = '';
            if (data.status === 'wishlist') {
              statusBadge = `<span style="display:inline-block; margin-left: 8px; padding: 2px 6px; border-radius: 4px; background: #FFF0F0; color: #B63B2B; font-size: 12px; font-weight: bold;">★ 向往</span>`;
            } else if (data.status === 'visited') {
              statusBadge = `<span style="display:inline-block; margin-left: 8px; padding: 2px 6px; border-radius: 4px; background: #E8F5E9; color: #4A7C59; font-size: 12px; font-weight: bold;">✓ 已达</span>`;
            }

            return `
              <div style="width: 280px; font-family: sans-serif; white-space: normal; word-break: break-all; word-wrap: break-word;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 24px; margin-right: 8px; background: #fff; padding: 4px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">${data.icon}</span>
                  <span style="font-size: 20px; font-weight: 900; letter-spacing: 1px;">${data.name}</span>
                  ${statusBadge}
                </div>
                <div style="font-size: 13px; color: #8C7B6B; font-weight: bold; margin-bottom: 12px; border-bottom: 1px solid rgba(74,51,32,0.1); padding-bottom: 8px;">
                  📍 ${data.province} · ${data.label}
                </div>
                <div style="font-size: 14px; line-height: 1.6; color: #555;">${data.description}</div>
              </div>
            `;
          }
          return params.name;
        }
      },
      geo: { ...geoBase, roam: true },
      series: [{
        ...baseScatterSeries,
        data: dynamicSeriesData // 只用作初始状态
      }],
      animation: true,
      animationDurationUpdate: 300
    }
  }, [geoJson]) // 注意依赖项里没有 dynamicSeriesData

  // 2. 当数据发生变化时，通过 ECharts API 局部更新 data，绝不触碰 geo 缩放状态
  useEffect(() => {
    if (chartRef.current && geoJson) {
      const echartInstance = chartRef.current.getEchartsInstance()
      // 只 setOption series 的数据，这样既改变了点，又完美保留了用户的平移/缩放级别
      echartInstance.setOption({
        series: [{
          data: dynamicSeriesData
        }]
      })
    }
  }, [dynamicSeriesData, geoJson])
  // =========================================================

  // 海报专用配置 (一直渲染在底部，不用管交互，直接生成即可)
  const posterMapOption = useMemo(() => {
    if (!geoJson) return {}
    return {
      backgroundColor: 'transparent',
      tooltip: { show: false },
      geo: { ...geoBase, roam: false, center: [105, 36], zoom: 1.2 },
      series: [{
        ...baseScatterSeries,
        data: dynamicSeriesData
      }],
      animation: false
    }
  }, [geoJson, dynamicSeriesData])

  const handleGenerateImage = async () => {
    if (!posterTemplateRef.current) return
    setIsGenerating(true)
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(posterTemplateRef.current, {
          useCORS: true,
          scale: 2,
          backgroundColor: '#F4EAD1',
          logging: false,
          allowTaint: true,
        })
        setPreviewImage(canvas.toDataURL('image/png'))
      } catch (err) {
        console.error('html2canvas error:', err)
        alert('生成海报失败')
      } finally {
        setIsGenerating(false)
      }
    }, 500)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>加载地图中...</p>
      </div>
    )
  }

  return (
    <div className="app-wrapper">
      {/* 左侧控制台组件 */}
      <Sidebar
        mountains={mountains}
        setMountains={setMountains}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* 1. 首页全屏可交互地图 */}
      <div className="home-map-container">
        <ReactECharts
          ref={chartRef}
          option={initialMapOption}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={false}
          lazyUpdate={true}
        />
      </div>

      {/* 生成海报按钮 */}
      <button
        className={`action-button ${isGenerating ? 'generating' : ''}`}
        onClick={handleGenerateImage}
        disabled={isGenerating}
      >
        <span className="btn-icon">📸</span>
        {isGenerating ? '生成中...' : '生成海报'}
      </button>

      {/* 2. 海报模板 */}
      <div className="poster-offscreen-container">
        <div className="poster-template" ref={posterTemplateRef}>
          <header className="poster-header">
            <h1>春山昂首 <span className="title-icon">⛰️</span></h1>
            <p className="subtitle">Awakening Mountains</p>
          </header>

          <div className="poster-map-inner-container">
            {geoJson && (
              <ReactECharts
                option={posterMapOption}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
                notMerge={true}
                lazyUpdate={false}
              />
            )}
          </div>

          {/* 底部落款 */}
          <footer className="poster-footer">
            <div className="logo-container">
              <span className="logo-main">赴山海</span>
              <div className="logo-sub">
                <span>To The Mountains</span>
                <span>And Seas</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* 3. 预览弹窗 */}
      {previewImage && (
        <div className="preview-modal" onClick={() => setPreviewImage(null)}>
          <div className="preview-content" onClick={e => e.stopPropagation()}>
            <div className="preview-header">
              <h3>✨ 长按或右键可保存图片</h3>
              <button className="close-btn" onClick={() => setPreviewImage(null)}>✕</button>
            </div>
            <div className="preview-img-container">
              <img src={previewImage} alt="生成的海报" className="preview-img" />
            </div>
            <p className="preview-tip">「山不来见我，我便向山走去」</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App