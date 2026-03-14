import { useRef, useState, useEffect, useMemo } from 'react'
import html2canvas from 'html2canvas'
import * as echarts from 'echarts'
import ReactECharts from 'echarts-for-react'
import { mountainData } from './data/mountains'
import './App.css'

// 散点系列配置，主地图和海报共用，确保 label formatter 函数一致
const scatterSeries = {
  type: 'scatter',
  coordinateSystem: 'geo',
  symbol: 'pin',
  symbolSize: [30, 36],
  symbolOffset: [0, '-20%'],
  itemStyle: {
    color: '#B63B2B',
    shadowBlur: 4,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffsetY: 3
  },
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
  },
  data: mountainData,
  zlevel: 2
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

  // 首页主地图配置（可交互）
  const mapOption = useMemo(() => {
    if (!geoJson) return {}
    return {
      backgroundColor: '#E8DCC4',
      tooltip: { show: false },
      geo: { ...geoBase, roam: true },
      series: [scatterSeries],
      animation: false
    }
  }, [geoJson])

  // 海报专用配置（静止、居中、透明背景）
  // 直接引用 scatterSeries，保留 formatter 函数
  const posterMapOption = useMemo(() => {
    if (!geoJson) return {}
    return {
      backgroundColor: 'transparent',
      tooltip: { show: false },
      geo: { ...geoBase, roam: false, center: [105, 36], zoom: 1.2 },
      series: [scatterSeries],
      animation: false
    }
  }, [geoJson])

  const handleGenerateImage = async () => {
    if (!posterTemplateRef.current) return
    setIsGenerating(true)
    // 给海报内的 ECharts 500ms 确保富文本渲染完毕
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
      {/* 1. 首页全屏可交互地图 */}
      <div className="home-map-container">
        <ReactECharts
          ref={chartRef}
          option={mapOption}
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

      {/* 2. 海报模板（隐藏在底层，始终渲染，确保 ECharts 完整绘制） */}
      <div className="poster-offscreen-container">
        <div className="poster-template" ref={posterTemplateRef}>
          <header className="poster-header">
            <h1>中国名山推荐 <span className="title-icon">↓</span></h1>
            <p className="subtitle">Best Mountain Destinations</p>
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

          <footer className="poster-footer">
            <div className="logo-container">
              <span className="logo-main">山河文旅</span>
              <div className="logo-sub">
                <span>Mountains &</span>
                <span>Rivers Tourism</span>
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
            <p className="preview-tip">你已经成功定格了这片绝美风景！</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
