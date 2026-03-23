import React from 'react';
import { categories } from '../data/mountains';
import './Sidebar.css';

function Sidebar({ mountains, setMountains, activeCategory, setActiveCategory, comparing, setComparing }) {
  // 切换可见性
  const toggleVisibility = (id) => {
    setMountains(prev => prev.map(m =>
      m.id === id ? { ...m, visible: !m.visible } : m
    ));
  };

  // 切换状态循环: none -> wishlist -> visited -> none
  const toggleStatus = (id) => {
    setMountains(prev => prev.map(m => {
      if (m.id === id) {
        let nextStatus = 'wishlist';
        if (m.status === 'none') nextStatus = 'wishlist';
        else if (m.status === 'wishlist') nextStatus = 'visited';
        else if (m.status === 'visited') nextStatus = 'none';
        return { ...m, status: nextStatus };
      }
      return m;
    }));
  };

  // 对比操作
  const toggleComparing = (id) => {
    setComparing(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearComparing = () => setComparing(new Set());

  const isComparingTab = activeCategory === 'compare';

  // 过滤当前显示的列表
  const displayedMountains = isComparingTab
    ? mountains.filter(m => comparing.has(m.id))
    : activeCategory === 'all'
      ? mountains
      : mountains.filter(m => m.category === activeCategory);

  // 批量显隐控制 (只影响当前 Tab 下的山峰)
  const handleBatchVisibility = (show) => {
    const currentIds = displayedMountains.map(m => m.id);
    setMountains(prev => prev.map(m =>
      currentIds.includes(m.id) ? { ...m, visible: show } : m
    ));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="header-top">
          <h2>山岳图鉴</h2>
          <div className="batch-actions">
            <button onClick={() => handleBatchVisibility(true)} title="显示当前列表所有">👁️ 全显</button>
            <button onClick={() => handleBatchVisibility(false)} title="隐藏当前列表所有">🙈 全隐</button>
          </div>
        </div>
        <p className="sidebar-subtitle">山海长卷 · 点亮向往</p>
      </div>

      <div className="sidebar-tabs-container">
        <div className="sidebar-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
          <button
            className={`tab-btn compare-tab ${activeCategory === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveCategory('compare')}
          >
            对比
            {comparing.size > 0 && <span className="compare-badge">{comparing.size}</span>}
          </button>
        </div>
      </div>

      <div className="mountain-list">
        {isComparingTab && (
          <div className="compare-toolbar">
            <span className="compare-count">已选 {comparing.size} 座</span>
            <button className="compare-clear-btn" onClick={clearComparing}>清空</button>
          </div>
        )}

        {isComparingTab && displayedMountains.length === 0 && (
          <div className="compare-empty">点击卡片上的 ⊕ 添加山峰</div>
        )}

        {displayedMountains.map(m => (
          isComparingTab ? (
            // 对比 Tab：带完整数据的卡片
            <div key={m.id} className="mountain-card compare-card">
              <div className="m-icon-wrapper">
                {m.icon.startsWith('/') || m.icon.startsWith('http')
                  ? <img src={m.icon} alt={m.name} className="m-icon-img" />
                  : <span className="m-icon">{m.icon}</span>
                }
              </div>
              <div className="m-info">
                <div className="m-title-row">
                  <span className="m-name">{m.name}</span>
                  <span className="m-province">{m.province}</span>
                  <div
                    className={`status-toggle ${m.status}`}
                    onClick={(e) => { e.stopPropagation(); toggleStatus(m.id); }}
                    title="点击切换: 未标记 -> 向往 -> 已达"
                  >
                    {m.status === 'none' && '➕ 标记'}
                    {m.status === 'wishlist' && '★ 向往'}
                    {m.status === 'visited' && '✓ 已达'}
                  </div>
                </div>
                <div className="m-data-row">
                  {m.elevation && <span className="m-data-item">海拔 <strong>{m.elevation}m</strong></span>}
                  {m.climbingGain && <span className="m-data-item">爬升 <strong>{m.climbingGain}m</strong></span>}
                </div>
                <span className="m-label">{m.label}</span>
              </div>
              <button
                className="compare-remove-btn"
                onClick={() => toggleComparing(m.id)}
                title="移出对比"
              >✕</button>
            </div>
          ) : (
            // 普通 Tab：原有卡片 + ⊕ 按钮
            <div
              key={m.id}
              className={`mountain-card ${!m.visible ? 'is-hidden' : ''}`}
              onClick={() => toggleVisibility(m.id)}
              title="点击卡片可切换在地图上的显示/隐藏"
            >
              <div className="m-icon-wrapper">
                {m.icon.startsWith('/') || m.icon.startsWith('http')
                  ? <img src={m.icon} alt={m.name} className="m-icon-img" />
                  : <span className="m-icon">{m.icon}</span>
                }
                {!m.visible && <div className="m-hidden-mask">✕</div>}
              </div>

              <div className="m-info">
                <div className="m-title-row">
                  <span className="m-name">{m.name}</span>
                  <span className="m-province">{m.province}</span>
                </div>
                <div className="m-data-row">
                  {m.elevation && <span className="m-elevation">▲ {m.elevation}m</span>}
                  {m.climbingGain && <span className="m-climbing">↑ {m.climbingGain}m</span>}
                </div>
                <span className="m-label">{m.label}</span>
              </div>

              <div className="m-actions">
                <button
                  className={`compare-add-btn ${comparing.has(m.id) ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleComparing(m.id); }}
                  title="加入对比"
                >⊕</button>
                <div
                  className={`status-toggle ${m.status}`}
                  onClick={(e) => { e.stopPropagation(); toggleStatus(m.id); }}
                  title="点击切换: 未标记 -> 向往 -> 已达"
                >
                  {m.status === 'none' && '➕ 标记'}
                  {m.status === 'wishlist' && '★ 向往'}
                  {m.status === 'visited' && '✓ 已达'}
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
