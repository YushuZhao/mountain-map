import { useRef, useState, useEffect, useMemo } from 'react'
import html2canvas from 'html2canvas'
import * as echarts from 'echarts'
import ReactECharts from 'echarts-for-react'
import { HexAlphaColorPicker } from 'react-colorful'
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
  province: { borderColor: '#A2B5A5', borderWidth: 1.0 }, // 淡石绿
  city:     { borderColor: '#CCD4CD', borderWidth: 0.8 }  // 极淡绿灰
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
  const [comparing, setComparing] = useState(new Set())

  // 互斥单选
  const [mapLevel, setMapLevel] = useState('province') // 'province' | 'city'
  const [showLabels, setShowLabels] = useState(false)

  // 背景颜色控制 (千里江山图 - 仿古绢丝色)
  const [bgColor, setBgColor] = useState('#F2EFE8')
  const [showColorPicker, setShowColorPicker] = useState(false)

  // 动态更新 CSS 变量以改变全局背景
  useEffect(() => {
    document.documentElement.style.setProperty('--map-bg-color', bgColor)
  }, [bgColor])

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
          areaColor: '#F7F8F5',
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
        zoom: 1.5, /* 放大比例从 1.2 提升到 1.5 */
        center: [105, 34], /* 中心点向下微调，让主体中国版图更居中，填补空白 */
        roam: false,
        itemStyle: { areaColor: '#F7F8F5', borderColor: style.borderColor, borderWidth: style.borderWidth },
        label: {
          show: showLabels, color: '#8A9A39',
          fontSize: level === 'city' ? 9 : 11,
          formatter: (params) => params.name
        }
      },
      series: [{ ...BASE_SCATTER_SERIES, data: dynamicSeriesData }],
      animation: false
    }
  }, [geoJson, dynamicSeriesData, mapLevel, showLabels, mapReady])

  const handleGenerateImage = async () => {
    if (!posterTemplateRef.current) return
    setIsGenerating(true)
    setTimeout(async () => {
      try {
        // 读取 CSS 变量中的背景色传递给 html2canvas
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--map-bg-color').trim() || '#F7F2E8';
        const canvas = await html2canvas(posterTemplateRef.current, {
          useCORS: true, scale: 2, backgroundColor: bgColor, logging: false, allowTaint: true,
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
        comparing={comparing}
        setComparing={setComparing}
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
        <div className="control-group" style={{ position: 'relative' }}>
          <span className="control-label">背景:</span>
          <div
            className="color-picker-trigger"
            style={{ backgroundColor: bgColor }}
            onClick={() => setShowColorPicker(!showColorPicker)}
          />
          {showColorPicker && (
            <div className="color-picker-popover">
              <div className="color-picker-cover" onClick={() => setShowColorPicker(false)} />
              <HexAlphaColorPicker color={bgColor} onChange={setBgColor} />
            </div>
          )}
        </div>
        {isSwitching && <div className="control-switching-hint">加载中...</div>}
      </div>

      {/* 主地图 */}
      <div className="home-map-container">
        <ReactECharts
          ref={chartRef}
          option={initialMapOption}
          style={{ height: '100%', width: '100%', filter: 'drop-shadow(6px 12px 18px rgba(96, 107, 34, 0.25))' }}
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
            <h1>赴山海
              <span className="title-icon">
                <svg viewBox="0 0 1024 1024" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                  <path d="M430.545455 847.127273l223.418181-53.527273 2.327273-18.618182h-20.945454v-20.945454h25.6l4.654545-25.6 144.290909-32.581819 6.981818-16.290909h-20.945454v-20.945454h30.254545l6.981818-16.290909-67.490909-137.309091 67.490909-169.890909 67.490909-32.581818 23.272728-100.072728C828.509091 81.454545 679.563636 0 512 0 230.4 0 0 230.4 0 512c0 214.109091 132.654545 397.963636 318.836364 474.763636l111.709091-139.636363z m346.763636-432.872728h25.6l-9.309091 20.945455h-16.290909v-20.945455zM546.909091 114.036364c34.909091 0 62.836364 30.254545 62.836364 65.163636 0 34.909091-27.927273 65.163636-62.836364 65.163636-34.909091 0-62.836364-30.254545-62.836364-65.163636 0-34.909091 27.927273-62.836364 62.836364-65.163636z m-183.854546 111.709091l62.836364 44.218181-114.036364 188.509091-62.836363-32.581818 114.036363-200.145454z m-114.036363 649.30909l72.145454-165.236363V467.781818l104.727273-174.545454c11.636364-20.945455 34.909091-34.909091 58.181818-34.909091 11.636364-2.327273 23.272727 2.327273 32.581818 11.636363l102.4 121.018182 114.036364 32.581818c13.963636 9.309091 18.618182 27.927273 11.636364 44.218182-11.636364 20.945455-20.945455 25.6-30.254546 20.945455l-123.345454-32.581818-41.890909-55.854546-62.836364 111.709091 123.345455 76.8 20.945454 153.6c0 11.636364-9.309091 44.218182-41.890909 44.218182-25.6-2.327273-46.545455-20.945455-51.2-44.218182l-9.309091-97.745455-114.036364-55.854545v144.290909l-83.781818 186.181818c-11.636364 9.309091-25.6 16.290909-41.890909 16.290909-6.981818 0-13.963636-2.327273-20.945454-4.654545-18.618182-11.636364-18.618182-44.218182-18.618182-55.854546z" fill="currentColor"></path>
                </svg>
              </span>
            </h1>
            <p className="subtitle">Roaming Free</p>
          </header>
          <div className="poster-map-inner-container">
            {mapReady && (
              <>
                <ReactECharts
                  ref={posterChartRef}
                  option={posterMapOption}
                  style={{ height: '100%', width: '100%', filter: 'drop-shadow(6px 12px 18px rgba(96, 107, 34, 0.25))' }}
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
              <span className="logo-main">阅尽千山</span>
              <div className="logo-sub">
                <span>See the World</span>
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
          </div>
        </div>
      )}
    </div>
  )
}

export default App
