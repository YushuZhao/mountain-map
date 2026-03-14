import { useEffect, useRef, useState } from 'react'

function getPixelPositions(instance, mountains) {
  const opt = instance.getOption()
  if (!opt?.geo?.length) return []

  return mountains
    .filter(m => m.visible)
    .map(m => {
      try {
        const px = instance.convertToPixel('geo', [m.value[0], m.value[1]])
        if (!px) return null
        return { ...m, x: px[0], y: px[1] }
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

function StatusBadge({ status }) {
  if (status === 'wishlist') return <span className="marker-tooltip-badge marker-tooltip-badge--wishlist">★ 向往</span>
  if (status === 'visited') return <span className="marker-tooltip-badge marker-tooltip-badge--visited">✓ 已达</span>
  return null
}

function SmallPin({ color }) {
  return (
    <svg viewBox="0 0 1024 1024" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="512" cy="900" rx="150" ry="50" fill="rgba(0,0,0,0.2)" />
      <path d="M642.464889 252.604158c0-72.054059-58.411341-130.4654-130.4654-130.4654-72.053036 0-130.464377 58.411341-130.464377 130.4654 0 65.089437 47.668673 119.04121 109.998253 128.862903l0 520.393157 40.932248 0L532.465612 381.467061C594.796216 371.645368 642.464889 317.694619 642.464889 252.604158zM436.790576 214.232223c0-21.192671 17.180288-38.372959 38.371936-38.372959 21.192671 0 38.371936 17.180288 38.371936 38.372959 0 21.191648-17.179264 38.371936-38.371936 38.371936C453.96984 252.604158 436.790576 235.424894 436.790576 214.232223z" fill={color}/>
    </svg>
  )
}

const getPinColor = (status) => {
  if (status === 'wishlist') return '#C3BD4F' /* 藤黄 */
  if (status === 'visited') return '#62A790'  /* 石绿 */
  return '#B4CC8C'                            /* 浅青绿 */
}

export default function MapMarkers({ chartRef, mountains }) {
  const [markers, setMarkers] = useState([])
  const [hoverId, setHoverId] = useState(null)
  const rafRef = useRef(null)
  const readyRef = useRef(false)
  const mountainsRef = useRef(mountains)

  mountainsRef.current = mountains

  const update = () => {
    if (!chartRef.current) return
    const instance = chartRef.current.getEchartsInstance()

    if (!instance || instance.isDisposed() || !readyRef.current) return

    setMarkers(getPixelPositions(instance, mountainsRef.current))
  }

  useEffect(() => {
    if (!chartRef.current) return
    const instance = chartRef.current.getEchartsInstance()
    if (!instance) return

    const onFinished = () => {
      readyRef.current = true
      update()
    }

    const onRoam = () => {
      if (!readyRef.current) return
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    }

    instance.on('finished', onFinished)
    instance.on('georoam', onRoam)
    window.addEventListener('resize', onRoam)
    if (readyRef.current) update()

    return () => {
      if (!instance.isDisposed()) {
        instance.off('finished', onFinished)
        instance.off('georoam', onRoam)
      }
      window.removeEventListener('resize', onRoam)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [chartRef.current])

  useEffect(() => {
    update()
  }, [mountains])

  return (
    <div className="map-markers-layer">
      {markers.map(m => (
        <div
          key={m.id}
          className="map-marker-anchor"
          style={{
            left: m.x,
            top: m.y,
            zIndex: hoverId === m.id ? 100 : 10
          }}
          onMouseEnter={() => setHoverId(m.id)}
          onMouseLeave={() => setHoverId(null)}
        >
          {hoverId === m.id && (
            <div className="marker-tooltip">
              <div className="marker-tooltip-header">
                {m.icon.startsWith('/') || m.icon.startsWith('http')
                  ? <img src={m.icon} alt={m.name} className="marker-tooltip-img" />
                  : <span className="marker-tooltip-emoji">{m.icon}</span>
                }
                <div className="marker-tooltip-title">
                  <span className="marker-tooltip-name">{m.name}</span>
                  <StatusBadge status={m.status} />
                </div>
              </div>
              <div className="marker-tooltip-meta">📍 {m.province} · {m.label}</div>
              <div className="marker-tooltip-desc">{m.description}</div>
            </div>
          )}

          <div className="marker-v2">
            <div className="marker-v2-pin">
              <SmallPin color={getPinColor(m.status)} />
            </div>

            <div className="marker-v2-content">
              <div className={`marker-v2-img-wrap marker-v2-img-wrap--${m.status}`}>
                {m.icon.startsWith('/') || m.icon.startsWith('http')
                  ? <img src={m.icon} alt={m.name} className="marker-v2-img" />
                  : <span className="marker-v2-emoji">{m.icon}</span>
                }
              </div>
              <div className="marker-v2-name">{m.name}</div>
              <div className="marker-v2-subtitle">{m.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
