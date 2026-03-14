import React from 'react';
import { categories } from '../data/mountains';
import './Sidebar.css';

function Sidebar({ mountains, setMountains, activeCategory, setActiveCategory }) {
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

  // 过滤当前显示的列表
  const displayedMountains = activeCategory === 'all'
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
          <h2>足迹日记</h2>
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
        </div>
      </div>

      <div className="mountain-list">
        {displayedMountains.map(m => (
          <div
            key={m.id}
            className={`mountain-card ${!m.visible ? 'is-hidden' : ''}`}
            onClick={() => toggleVisibility(m.id)}
            title="点击卡片可切换在地图上的显示/隐藏"
          >
            <div className="m-icon-wrapper">
              <span className="m-icon">{m.icon}</span>
              {!m.visible && <div className="m-hidden-mask">✕</div>}
            </div>

            <div className="m-info">
              <div className="m-title-row">
                <span className="m-name">{m.name}</span>
                <span className="m-province">{m.province}</span>
              </div>
              <span className="m-label">{m.label}</span>
            </div>

            {/* 状态切换徽章，阻止冒泡防止触发父级卡片的隐藏逻辑 */}
            <div
              className={`status-toggle ${m.status}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleStatus(m.id);
              }}
              title="点击切换: 未标记 -> 向往 -> 已达"
            >
              {m.status === 'none' && '➕ 标记'}
              {m.status === 'wishlist' && '★ 向往'}
              {m.status === 'visited' && '✓ 已达'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
