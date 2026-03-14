import { useRef, useState, useEffect, useMemo } from 'react'
import html2canvas from 'html2canvas'
import * as echarts from 'echarts'
import ReactECharts from 'echarts-for-react'
import { initialMountains } from './data/mountains'
import Sidebar from './components/Sidebar'
import MapMarkers from './components/MapMarkers'
import './App.css'

// ─── 静态常量 ────────────────────────────────────────────────────────────────

const GEO_URLS = {
  province: 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
  city:     'https://geo.datav.aliyun.com/areas_v3/bound/100000_full_city.json'
}

const BORDER_STYLE = {
  province: { borderColor: '#E6D7B8', borderWidth: 1.0 },
  city:     { borderColor: '#D4C4A8', borderWidth: 0.8 }
}

// 主地图 scatter：只作为提供坐标的底座，不显示元素，全部UI由 React 覆盖层渲染
const BASE_SCATTER_SERIES = {
  type: 'scatter',
  coordinateSystem: 'geo',
  geoIndex: 0,
  symbolSize: 0,
  label: { show: false }
}


const TOOLTIP_CONFIG = {
  show: true,
  trigger: 'item',
  backgroundColor: 'rgba(248, 242, 230, 0.95)',
  borderColor: 'rgba(74, 51, 32, 0.2)',
  borderWidth: 1,
  padding: 16,
  borderRadius: 12,
  textStyle: { color: '#4A3320' },
  formatter: (params) => {
    if (params.componentSubType !== 'scatter') return null
    const d = params.data
    let badge = ''
    if (d.status === 'wishlist') {
      badge = `<span style="display:inline-block;margin-left:8px;padding:2px 6px;border-radius:4px;background:#FFF0F0;color:#B63B2B;font-size:12px;font-weight:bold;">★ 向往</span>`
    } else if (d.status === 'visited') {
      badge = `<span style="display:inline-block;margin-left:8px;padding:2px 6px;border-radius:4px;background:#E8F5E9;color:#4A7C59;font-size:12px;font-weight:bold;">✓ 已达</span>`
    }
    const iconHtml = (d.icon.startsWith('/') || d.icon.startsWith('http'))
      ? `<img src="${d.icon}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;margin-right:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" />`
      : `<span style="font-size:24px;margin-right:8px;background:#fff;padding:4px;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.05);">${d.icon}</span>`
    return `
      <div style="width:280px;font-family:sans-serif;white-space:normal;word-wrap:break-word;">
        <div style="display:flex;align-items:center;margin-bottom:8px;">
          ${iconHtml}
          <span style="font-size:20px;font-weight:900;letter-spacing:1px;">${d.name}</span>
          ${badge}
        </div>
        <div style="font-size:13px;color:#8C7B6B;font-weight:bold;margin-bottom:12px;border-bottom:1px solid rgba(74,51,32,0.1);padding-bottom:8px;">
          📍 ${d.province} · ${d.label}
        </div>
        <div style="font-size:14px;line-height:1.6;color:#555;">${d.description}</div>
      </div>`
  }
}

// ─── 组件 ────────────────────────────────────────────────────────────────────

function App() {
  const chartRef = useRef(null)
  const posterChartRef = useRef(null)
  const posterTemplateRef = useRef(null)
  const geoCache = useRef({})

  const [geoJson, setGeoJson] = useState(null)
  const [mapReady, setMapReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const [mountains, setMountains] = useState(initialMountains)
  const [activeCategory, setActiveCategory] = useState('all')

  // 互斥单选
  const [mapLevel, setMapLevel] = useState('province') // 'province' | 'city'
  const [showLabels, setShowLabels] = useState(false)

  useEffect(() => {
    const fetchAndCache = (level) => {
      if (geoCache.current[level]) return Promise.resolve(geoCache.current[level])
      return fetch(GEO_URLS[level])
        .then(r => r.json())
        .then(data => { geoCache.current[level] = data; return data })
    }
    setLoading(true)
    fetchAndCache('province').then(data => {
      echarts.registerMap('china', data)
      setGeoJson(data)
      setMapReady(true)
      setLoading(false)
      fetchAndCache('city').catch(() => {})
    }).catch(() => setLoading(false))
  }, [])

  // 切换图层/地名时只更新 geo 样式，不传 zoom/center，视角完全保留
  useEffect(() => {
    if (!geoJson) return
    const style = BORDER_STYLE[mapLevel]
    const applyGeoStyle = () => {
      if (!chartRef.current) return
      const instance = chartRef.current.getEchartsInstance()
      if (instance.isDisposed()) return
      instance.setOption({
        geo: {
          itemStyle: { areaColor: '#FFFFFF', borderColor: style.borderColor, borderWidth: style.borderWidth },
          emphasis: {
            itemStyle: { areaColor: '#F8F4EC' },
            label: { show: showLabels, color: '#B63B2B', fontSize: 12, fontWeight: 'bold' }
          },
          label: {
            show: showLabels,
            color: '#9A8C78',
            fontSize: mapLevel === 'city' ? 9 : 11,
            formatter: (params) => params.name
          }
        }
      })
    }
    if (geoCache.current[mapLevel]) {
      echarts.registerMap('china', geoCache.current[mapLevel])
      applyGeoStyle()
    } else {
      setIsSwitching(true)
      fetch(GEO_URLS[mapLevel])
        .then(r => r.json())
        .then(data => {
          geoCache.current[mapLevel] = data
          echarts.registerMap('china', data)
          applyGeoStyle()
          setIsSwitching(false)
        })
        .catch(() => setIsSwitching(false))
    }
  }, [mapLevel, showLabels, geoJson])

  // 山峰数据变化：只保留需展示的数据传递给ECharts进行坐标系测算
  const dynamicSeriesData = useMemo(() => {
    return mountains.filter(m => m.visible)
  }, [mountains])

  useEffect(() => {
    if (!chartRef.current || !geoJson) return
    const instance = chartRef.current.getEchartsInstance()
    if (instance.isDisposed()) return
    instance.setOption({ series: [{ data: dynamicSeriesData }] })
  }, [dynamicSeriesData, geoJson])

  const initialMapOption = useMemo(() => {
    if (!geoJson || !mapReady) return {}
    // 热重载时 ECharts 全局注册可能丢失，useMemo 重算时补充注册
    echarts.registerMap('china', geoJson)
    return {
      backgroundColor: 'transparent',
      tooltip: { show: false },
      geo: {
        map: 'china',
        zoom: 1.2,
        center: [105, 36],
        roam: true,
        itemStyle: {
          areaColor: '#FFFFFF',
          borderColor: BORDER_STYLE.province.borderColor,
          borderWidth: BORDER_STYLE.province.borderWidth
        },
        emphasis: { itemStyle: { areaColor: '#F8F4EC' }, label: { show: false } },
        label: { show: false }
      },
      series: [{ ...BASE_SCATTER_SERIES, data: dynamicSeriesData }],
      animation: true,
      animationDurationUpdate: 300
    }
  }, [geoJson, mapReady])

  const posterMapOption = useMemo(() => {
    if (!geoJson || !mapReady) return {}
    echarts.registerMap('china', geoJson)
    const level = mapLevel
    const style = BORDER_STYLE[level]
    return {
      backgroundColor: 'transparent',
      tooltip: { show: false },
      geo: {
        map: 'china',
        zoom: 1.2,
        center: [105, 36],
        roam: false,
        itemStyle: { areaColor: '#FFFFFF', borderColor: style.borderColor, borderWidth: style.borderWidth },
        label: {
          show: showLabels, color: '#9A8C78',
          fontSize: level === 'city' ? 9 : 11,
          formatter: (params) => params.name
        }
      },
      series: [{ ...BASE_SCATTER_SERIES, data: dynamicSeriesData }],
      animation: false
    }
  }, [geoJson, dynamicSeriesData, mapLevel, showLabels])

  const handleGenerateImage = async () => {
    if (!posterTemplateRef.current) return
    setIsGenerating(true)
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(posterTemplateRef.current, {
          useCORS: true, scale: 2, backgroundColor: '#F4EAD1', logging: false, allowTaint: true,
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
      <Sidebar
        mountains={mountains}
        setMountains={setMountains}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* 右上角地图控制面板 */}
      <div className="map-controls">
        <div className="control-group">
          <span className="control-label">图层:</span>
          <div className="layer-toggles">
            <button className={`layer-btn ${mapLevel === 'province' ? 'active' : ''}`} onClick={() => setMapLevel('province')}>省界</button>
            <button className={`layer-btn ${mapLevel === 'city' ? 'active' : ''}`} onClick={() => setMapLevel('city')}>市界</button>
          </div>
        </div>
        <div className="control-group">
          <span className="control-label">地名:</span>
          <button className={`switch-btn ${showLabels ? 'active' : ''}`} onClick={() => setShowLabels(v => !v)}>
            {showLabels ? '显示中' : '已隐藏'}
          </button>
        </div>
        {isSwitching && <div className="control-switching-hint">加载中...</div>}
      </div>

      {/* 主地图 */}
      <div className="home-map-container" style={{ backgroundColor: '#E8DCC4' }}>
        <ReactECharts
          ref={chartRef}
          option={initialMapOption}
          style={{ height: '100%', width: '100%', filter: 'drop-shadow(6px 12px 18px rgba(120, 95, 75, 0.25))' }}
          opts={{ renderer: 'canvas' }}
          notMerge={false}
          lazyUpdate={true}
        />
        {/* React 覆盖层：自定义山峰标注卡片 */}
        {mapReady && (
          <MapMarkers chartRef={chartRef} mountains={mountains} />
        )}
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

      {/* 离屏海报模板 */}
      <div className="poster-offscreen-container">
        <div className="poster-template" ref={posterTemplateRef}>
          <header className="poster-header">
            <h1>春山昂首 <span className="title-icon">⛰️</span></h1>
            <p className="subtitle">Awakening Mountains</p>
          </header>
          <div className="poster-map-inner-container">
            {mapReady && (
              <>
                <ReactECharts
                  ref={posterChartRef}
                  option={posterMapOption}
                  style={{ height: '100%', width: '100%', filter: 'drop-shadow(6px 12px 18px rgba(120, 95, 75, 0.25))' }}
                  opts={{ renderer: 'canvas' }}
                  notMerge={true}
                  lazyUpdate={false}
                />
                <MapMarkers chartRef={posterChartRef} mountains={mountains} />
              </>
            )}
          </div>
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

      {/* 预览弹窗 */}
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
