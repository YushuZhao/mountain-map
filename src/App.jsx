import { useRef, useState, useEffect, useMemo } from 'react'
import html2canvas from 'html2canvas'
import * as echarts from 'echarts'
import ReactECharts from 'echarts-for-react'
import { initialMountains } from './data/mountains'
import Sidebar from './components/Sidebar'
import './App.css'

// ─── 静态常量 ────────────────────────────────────────────────────────────────

const GEO_URLS = {
  province: 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
  city:     'https://geo.datav.aliyun.com/areas_v3/bound/100000_full_city.json'
}

// 生成对应状态颜色的 SVG 图钉 data URI
function makePinSvg(color) {
  const svg = `<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M642.464889 252.604158c0-72.054059-58.411341-130.4654-130.4654-130.4654-72.053036 0-130.464377 58.411341-130.464377 130.4654 0 65.089437 47.668673 119.04121 109.998253 128.862903l0 520.393157 40.932248 0L532.465612 381.467061C594.796216 371.645368 642.464889 317.694619 642.464889 252.604158zM436.790576 214.232223c0-21.192671 17.180288-38.372959 38.371936-38.372959 21.192671 0 38.371936 17.180288 38.371936 38.372959 0 21.191648-17.179264 38.371936-38.371936 38.371936C453.96984 252.604158 436.790576 235.424894 436.790576 214.232223z" fill="${color}"/></svg>`
  return 'image://' + 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

const PIN_SYMBOL = {
  none:     makePinSvg('#C1B6A6'),
  wishlist: makePinSvg('#d81e06'),
  visited:  makePinSvg('#4A7C59')
}

const BORDER_STYLE = {
  province: { borderColor: '#E6D7B8', borderWidth: 1.0 },
  city:     { borderColor: '#D4C4A8', borderWidth: 0.8 }
}

const BASE_SCATTER_SERIES = {
  type: 'scatter',
  coordinateSystem: 'geo',
  geoIndex: 0,
  symbol: PIN_SYMBOL.none, // 每个数据点会通过 data.symbol 单独覆盖
  symbolSize: [40, 40],
  symbolOffset: [0, '-50%'],
  label: {
    show: true,
    position: 'top',
    distance: 5,
    formatter: (params) => {
      const d = params.data
      return `{icon|${d.icon}}\n{gap|}\n{nameBox|${d.name}}\n{descText|${d.label}}`
    },
    rich: {
      icon: {
        fontSize: 34, lineHeight: 34, align: 'center',
        backgroundColor: '#FFFFFF', padding: [10, 10, 10, 10],
        borderRadius: 40, borderWidth: 2, borderColor: '#F4EAD1',
        shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.1)'
      },
      gap: { height: 6 },
      nameBox: {
        backgroundColor: '#4A3320', color: '#F4EAD1',
        padding: [4, 14, 4, 14], borderRadius: 15,
        fontSize: 15, fontWeight: '900', align: 'center',
        shadowBlur: 4, shadowColor: 'rgba(0,0,0,0.2)', shadowOffsetY: 2
      },
      descText: {
        color: '#4A3320', fontSize: 13, fontWeight: 'bold',
        align: 'center', padding: [4, 0, 0, 0]
      }
    }
  }
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
    return `
      <div style="width:280px;font-family:sans-serif;white-space:normal;word-wrap:break-word;">
        <div style="display:flex;align-items:center;margin-bottom:8px;">
          <span style="font-size:24px;margin-right:8px;background:#fff;padding:4px;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.05);">${d.icon}</span>
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
  const posterTemplateRef = useRef(null)
  const geoCache = useRef({})

  const [geoJson, setGeoJson] = useState(null)
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

  // 山峰数据变化：只更新 series data
  const dynamicSeriesData = useMemo(() => {
    return mountains.filter(m => m.visible).map(m => ({
      ...m,
      symbol: PIN_SYMBOL[m.status] ?? PIN_SYMBOL.none,
      symbolSize: [40, 40],
    }))
  }, [mountains])

  useEffect(() => {
    if (!chartRef.current || !geoJson) return
    const instance = chartRef.current.getEchartsInstance()
    if (instance.isDisposed()) return
    instance.setOption({ series: [{ data: dynamicSeriesData }] })
  }, [dynamicSeriesData, geoJson])

  const initialMapOption = useMemo(() => {
    if (!geoJson) return {}
    return {
      backgroundColor: '#E8DCC4',
      tooltip: TOOLTIP_CONFIG,
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
  }, [geoJson])

  const posterMapOption = useMemo(() => {
    if (!geoJson) return {}
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

      {/* 离屏海报模板 */}
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
