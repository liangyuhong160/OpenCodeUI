import { memo, useRef, useEffect, useState } from 'react'
import { Smartphone, Monitor, RotateCw, Copy, Check, Sparkles } from 'lucide-react'
import type { Requirement } from '../../contexts/requirement'
import { useRequirement } from '../../contexts/RequirementContext'
import { paneLayoutStore } from '../../store/paneLayoutStore'

interface PrototypeViewerProps {
  requirement: Requirement
}

const ELEMENT_TYPE_LABELS: Record<string, string> = {
  Carousel: '轮播图', Grid: '网格', MenuList: '菜单列表', GridList: '网格列表',
  Card: '卡片', Image: '图片', Text: '文本', PriceText: '价格文本',
  Button: '按钮', Loading: '加载中', Empty: '空状态',
  SearchBar: '搜索栏', TabBar: '标签栏', NavBar: '导航栏', SideBarLayout: '侧边栏布局',
}

  function generatePrototypeHTML(req: Requirement): string {
    const elements = req.elements || []
    const layoutSchema = req.layout_schema
    const rootElements = elements.filter(el => el.parent_id === 'root')

    function getStyleProps(displayProps: Record<string, any> = {}): string {
      const styles: string[] = []
      if (displayProps.backgroundColor) styles.push(`background-color: ${displayProps.backgroundColor}`)
      if (displayProps.width) styles.push(`width: ${typeof displayProps.width === 'number' ? displayProps.width + 'px' : displayProps.width}`)
      if (displayProps.height) styles.push(`height: ${displayProps.height}px`)
      if (displayProps.borderRadius) styles.push(`border-radius: ${displayProps.borderRadius}px`)
      if (displayProps.marginTop) styles.push(`margin-top: ${displayProps.marginTop}px`)
      if (displayProps.marginBottom) styles.push(`margin-bottom: ${displayProps.marginBottom}px`)
      if (displayProps.fontSize) styles.push(`font-size: ${displayProps.fontSize}px`)
      if (displayProps.fontWeight) styles.push(`font-weight: ${displayProps.fontWeight}`)
      if (displayProps.color) styles.push(`color: ${displayProps.color}`)
      if (displayProps.textAlign) styles.push(`text-align: ${displayProps.textAlign}`)
      if (displayProps.padding) styles.push(`padding: ${displayProps.padding}px`)
      if (displayProps.shadow) styles.push('box-shadow: 0 2px 8px rgba(0,0,0,0.08)')
      return styles.length > 0 ? ` style="${styles.join('; ')}"` : ''
    }

    function renderElement(el: any): string {
      const children = elements.filter(e => e.parent_id === el.element_id)
      switch (el.element_type) {
        case 'NavBar': return renderNavBar(el)
        case 'SearchBar': return renderSearchBar(el)
        case 'Carousel': return renderCarousel(el)
        case 'Grid': return renderGrid(el)
        case 'MenuList': return renderMenuList(el, children)
        case 'GridList': return renderGridList(el, children)
        case 'Card': return renderCard(el, children)
        case 'Image': return renderImage(el)
        case 'Text': return renderText(el)
        case 'PriceText': return renderPrice(el)
        case 'Button': return renderButton(el)
        case 'Loading': return renderLoading(el)
        case 'Empty': return renderEmpty(el)
        case 'TabBar': return renderTabBar(el)
        case 'SideBarLayout': return renderSideBarLayout(el, children)
        default: return '<div class="generic-element"><div class="generic-label">' + (ELEMENT_TYPE_LABELS[el.element_type] || el.element_type) + '</div><div class="generic-name">' + (el.element_name || el.element_id) + '</div></div>'
      }
    }

    function renderNavBar(el: any): string {
      return '<div class="navbar"><div class="navbar-content"><div class="navbar-back"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></div><div class="navbar-title">' + (el.element_name || '页面标题') + '</div><div class="navbar-action"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></div></div></div>'
    }

    function renderSearchBar(el: any): string {
      return '<div class="search-bar"><svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><span class="search-placeholder">搜索' + (el.element_name || '内容') + '...</span></div>'
    }

    function renderCarousel(el: any): string {
      const maxItems = el.display_props?.max_items || 3
      const dots = Array.from({ length: maxItems }, (_, i) => '<span class="dot' + (i === 0 ? ' active' : '') + '"></span>').join('')
      const items = Array.from({ length: maxItems }, (_, i) => '<div class="carousel-item"><img src="https://picsum.photos/seed/banner' + i + '/400/150" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.background=\'linear-gradient(135deg, ' + getGradient(i) + ')\'; this.alt=\'Banner ' + (i + 1) + '\';" /></div>').join('')
      return '<div class="carousel"><div class="carousel-track">' + items + '</div><div class="carousel-dots">' + dots + '</div></div>'
    }

    function renderGrid(el: any): string {
      const columns = el.display_props?.columns || 2
      const maxItems = el.display_props?.max_items || 4
      const items = Array.from({ length: maxItems }, (_, i) => '<div class="grid-item"><img src="https://picsum.photos/seed/grid' + i + '/200/100" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;" onerror="this.style.background=\'linear-gradient(135deg, ' + getGradient(i) + ')\'; this.alt=\'广告 ' + (i + 1) + '\';" /></div>').join('')
      return '<div class="grid-container" style="grid-template-columns: repeat(' + columns + ', 1fr);">' + items + '</div>'
    }

    function renderMenuList(el: any, children: any[]): string {
      const defaultCategories = ['推荐', '热销', '新品', '食品', '数码', '服饰', '家居', '美妆']
      const items = children.length > 0 ? children : defaultCategories.map((name, i) => ({ element_name: name, element_id: 'cat_' + i }))
      // 强制菜单列表宽度 100%（由父布局决定）
      const styleProps = getStyleProps({ ...(el.display_props || {}), width: '100%' })
      const html = items.map((item: any, i: number) => '<div class="menu-item' + (i === 0 ? ' active' : '') + '" onclick="document.querySelectorAll(\'.menu-item\').forEach(el=>el.classList.remove(\'active\'));this.classList.add(\'active\')">' + (item.element_name || '分类 ' + (i + 1)) + '</div>').join('')
      return '<div class="menu-list"' + styleProps + '>' + html + '</div>'
    }

  function renderGridList(el: any, children: any[]): string {
    const columns = el.display_props?.grid_columns || el.display_props?.columns || 2
    const spacing = el.display_props?.item_spacing || el.display_props?.gap || 10
    // 强制 GridList 自身宽度为 100%（由父布局决定），内部卡片也强制 100%
    const styleProps = getStyleProps({ ...(el.display_props || {}), width: '100%' })
    
    const listChildren = children.length > 0 ? children : [{ element_name: '商品 1' }, { element_name: '商品 2' }, { element_name: '商品 3' }, { element_name: '商品 4' }]
    
    // 【关键修复】：网格内的卡片必须 100% 填充网格单元格
    const html = listChildren.map((item: any, i: number) => 
      renderCard({ ...item, display_props: { ...(item.display_props || {}), width: '100%' } }, [])
    ).join('')
    
    return '<div class="grid-list" style="grid-template-columns: repeat(' + columns + ', 1fr); gap: ' + spacing + 'px;' + styleProps.replace(' style="', '').replace('"', '') + '">' + html + '</div>'
  }

  function renderCard(el: any, children: any[]): string {
    const hasImage = children.some((c: any) => c.element_type === 'Image')
    const hasName = children.some((c: any) => c.element_type === 'Text')
    const hasButton = children.some((c: any) => c.element_type === 'Button')
    // 强制卡片宽度 100%（由网格或父容器决定）
    const styleProps = getStyleProps({ ...(el.display_props || {}), width: '100%' })
    
    // 随机商品数据
    const randomId = Math.floor(Math.random() * 1000)
    const productNames = ['精选好物', '品质生活', '限时特惠', '爆款推荐', '新品上市', '人气热卖']
    const productName = productNames[randomId % productNames.length]
    
    let cardContent = ''
    if (hasImage) {
      cardContent += renderImage(children.find((c: any) => c.element_type === 'Image'))
    } else {
      // 使用真实图片占位
      cardContent += '<div class="card-image-placeholder"><img src="https://picsum.photos/seed/' + randomId + '/300/200" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display=\'none\'; this.parentElement.innerHTML=\'<svg width=24 height=24 viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=1.5><rect x=3 y=3 width=18 height=18 rx=2/><circle cx=8.5 cy=8.5 r=1.5/><path d=M21 15l-5-5L5 21/></svg>\';" /></div>'
    }
    
    cardContent += '<div class="card-body">'
    if (hasName) {
      cardContent += renderText(children.find((c: any) => c.element_type === 'Text'))
    } else {
      cardContent += '<div class="card-title">' + (el.element_name || productName) + '</div>'
    }
    
    const priceChildren = children.filter((c: any) => c.element_type === 'PriceText')
    if (priceChildren.length > 0) {
      priceChildren.forEach((p: any) => { cardContent += renderPrice(p) })
    } else {
      const randomPrice = (Math.random() * 200 + 50).toFixed(2)
      cardContent += '<div class="price">¥' + randomPrice + '</div>'
    }
    
    if (hasButton) {
      const btnEl = children.find((c: any) => c.element_type === 'Button')
      // 【关键修复】：卡片内的按钮必须 100% 宽度
      cardContent += renderButton({ ...btnEl, display_props: { ...(btnEl.display_props || {}), width: '100%' } })
    } else {
      cardContent += '<button class="btn-primary" style="margin-top: 8px; width: 100%;">立即购买</button>'
    }
    
    cardContent += '</div>'
    
    return '<div class="card"' + styleProps + '>' + cardContent + '</div>'
  }

  function renderImage(el: any): string {
    const styleProps = getStyleProps(el.display_props)
    // 使用 picsum.photos 获取真实随机图片
    const randomId = Math.floor(Math.random() * 1000)
    return '<div class="image-container"' + styleProps + '><img src="https://picsum.photos/seed/' + randomId + '/300/200" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" alt="' + (el.element_name || '图片') + '" onerror="this.style.display=\'none\'; this.parentElement.innerHTML=\'<div class=image-placeholder><svg width=32 height=32 viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=1.5><rect x=3 y=3 width=18 height=18 rx=2/><circle cx=8.5 cy=8.5 r=1.5/><path d=M21 15l-5-5L5 21/></svg><span>' + (el.element_name || '图片') + '</span></div>\';" /></div>'
  }

  function renderText(el: any): string {
    const styleProps = getStyleProps(el.display_props)
    const maxLines = el.display_props?.numberOfLines || 1
    const lineClamp = maxLines > 1 ? '-webkit-line-clamp: ' + maxLines + '; -webkit-box-orient: vertical; overflow: hidden;' : ''
    return '<div class="text-content" style="' + lineClamp + '"' + styleProps + '>' + (el.element_name || '文本') + '</div>'
  }

  function renderPrice(el: any): string {
    const styleProps = getStyleProps(el.display_props)
    const price = el.element_name === '会员价格' ? '会员价 88.00' : '+99.00'
    const priceClass = el.element_name === '会员价格' ? 'member-price' : 'price'
    return '<div class="' + priceClass + '"' + styleProps + '>' + price + '</div>'
  }

  function renderButton(el: any): string {
    const styleProps = getStyleProps(el.display_props)
    return '<button class="btn-primary"' + styleProps + '>' + (el.element_name || '按钮') + '</button>'
  }

  function renderLoading(_el: any): string {
    return '<div class="loading-container"><div class="loading-spinner"></div><div class="loading-text">加载中...</div></div>'
  }

  function renderEmpty(_el: any): string {
    return '<div class="empty-container"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg><div class="empty-text">暂无数据</div></div>'
  }

  function renderTabBar(_el: any): string {
    return '<div class="tab-bar"><div class="tab-item active"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg><span>首页</span></div><div class="tab-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><span>发现</span></div><div class="tab-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span>购物车</span></div><div class="tab-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>我的</span></div></div>'
  }

  function renderSideBarLayout(el: any, children: any[]): string {
    const menuList = children.find((c: any) => c.element_type === 'MenuList')
    const gridList = children.find((c: any) => c.element_type === 'GridList')
    return '<div class="sidebar-layout"><div class="sidebar-menu">' + (menuList ? renderMenuList(menuList, []) : renderMenuList(el, [])) + '</div><div class="sidebar-content">' + (gridList ? renderGridList(gridList, []) : '<div class="content-placeholder">内容区域</div>') + '</div></div>'
  }

  function renderHorizontalSplitLayout(): string {
    const menuElement = elements.find(el => el.element_type === 'MenuList' && el.parent_id === 'root')
    const gridListElement = elements.find(el => el.element_type === 'GridList' && el.parent_id === 'root')
    
    const menuWidth = menuElement?.display_props?.width || '30%'
    const gridWidth = gridListElement?.display_props?.width || '70%'
    
    const menuChildren = menuElement ? elements.filter(el => el.parent_id === menuElement.element_id) : []
    const gridChildren = gridListElement ? elements.filter(el => el.parent_id === gridListElement.element_id) : []
    
    // 【关键修复】：布局容器已分配宽度，内部子元素应强制 100% 填充，避免 30% * 30% 的错误计算
    const menuElForRender = menuElement ? { ...menuElement, display_props: { ...(menuElement.display_props || {}), width: '100%' } } : null
    const gridElForRender = gridListElement ? { ...gridListElement, display_props: { ...(gridListElement.display_props || {}), width: '100%' } } : null
    
    return '<div class="horizontal-split-layout">' +
      '<div class="split-left" style="width: ' + menuWidth + ';">' +
      (menuElForRender ? renderMenuList(menuElForRender, menuChildren) : '<div style="padding: 20px; text-align: center; color: #999;">无菜单数据</div>') +
      '</div>' +
      '<div class="split-right" style="width: ' + gridWidth + ';">' +
      (gridElForRender ? renderGridList(gridElForRender, gridChildren) : '<div style="padding: 20px; text-align: center; color: #999;">无商品数据</div>') +
      '</div>' +
      '</div>'
  }

  function renderSideBarLayout(el: any, children: any[]): string {
    const menuList = children.find((c: any) => c.element_type === 'MenuList')
    const gridList = children.find((c: any) => c.element_type === 'GridList')
    
    // 【关键修复】：侧边栏内部子元素强制 100% 宽度
    const menuEl = menuList ? { ...menuList, display_props: { ...(menuList.display_props || {}), width: '100%' } } : null
    const gridEl = gridList ? { ...gridList, display_props: { ...(gridList.display_props || {}), width: '100%' } } : null

    return '<div class="sidebar-layout"><div class="sidebar-menu">' + 
      (menuEl ? renderMenuList(menuEl, []) : renderMenuList({ ...el, display_props: { ...(el.display_props || {}), width: '100%' } }, [])) + 
      '</div><div class="sidebar-content">' + 
      (gridEl ? renderGridList(gridEl, []) : '<div class="content-placeholder">内容区域</div>') + 
      '</div></div>'
  }

  function renderSideBarLayout(el: any, children: any[]): string {
    const menuList = children.find((c: any) => c.element_type === 'MenuList')
    const gridList = children.find((c: any) => c.element_type === 'GridList')
    
    // 【关键修复】：侧边栏内部子元素强制 100% 宽度
    const menuEl = menuList ? { ...menuList, display_props: { ...menuList.display_props, width: '100%' } } : null
    const gridEl = gridList ? { ...gridList, display_props: { ...gridList.display_props, width: '100%' } } : null

    return '<div class="sidebar-layout"><div class="sidebar-menu">' + 
      (menuEl ? renderMenuList(menuEl, []) : renderMenuList({ ...el, display_props: { ...el.display_props, width: '100%' } }, [])) + 
      '</div><div class="sidebar-content">' + 
      (gridEl ? renderGridList(gridEl, []) : '<div class="content-placeholder">内容区域</div>') + 
      '</div></div>'
  }

  function getGradient(index: number): string {
    const gradients = ['#667eea 0%, #764ba2 100%', '#f093fb 0%, #f5576c 100%', '#4facfe 0%, #00f2fe 100%', '#43e97b 0%, #38f9d7 100%', '#fa709a 0%, #fee140 100%', '#a18cd1 0%, #fbc2eb 100%']
    return gradients[index % gradients.length]
  }

  function buildPageContent(): string {
    // 优先使用 layout_schema 来渲染布局 - 支持多种命名
    const layoutType = layoutSchema?.layout_type || ''
    if (layoutType === 'HorizontalSplitLayout' || layoutType === 'HorizontalLayout') {
      return renderHorizontalSplitLayout()
    }
    
    // 检查是否有 SideBarLayout 元素
    const sideBarElement = rootElements.find(el => el.element_type === 'SideBarLayout')
    if (sideBarElement) {
      const children = elements.filter(el => el.parent_id === sideBarElement.element_id)
      return renderSideBarLayout(sideBarElement, children)
    }
    
    // 默认渲染所有 root 元素
    let html = ''
    rootElements.forEach(el => { html += renderElement(el) })
    if (rootElements.length === 0) {
      html = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg><p>暂无页面元素</p><p class="hint">请在编辑器中添加元素后查看</p></div>'
    }
    return html
  }

  const pageContent = buildPageContent()
  const pageTitle = req.page_info?.page_name || '原型预览'

  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + pageTitle + '</title><script src="https://cdn.tailwindcss.com"><' + '/script><style>' + getCSS() + '</style></head><body><div class="phone-frame"><div class="status-bar"><span>9:41</span><span>+100%</span></div>' + pageContent + '</div></body></html>'
}

function getCSS(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; background: #f5f5f5; color: #333; }
    .phone-frame { max-width: 375px; margin: 0 auto; background: #fff; min-height: 100vh; box-shadow: 0 0 40px rgba(0,0,0,0.1); position: relative; overflow: hidden; }
    .status-bar { height: 44px; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; font-size: 12px; color: #333; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
    
    /* 导航栏 */
    .navbar { height: 44px; background: #fff; display: flex; align-items: center; justify-content: center; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
    .navbar-content { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 12px; }
    .navbar-title { font-size: 17px; font-weight: 600; color: #333; }
    .navbar-back, .navbar-action { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #666; }
    
    /* 搜索栏 */
    .search-bar { margin: 12px; height: 36px; background: #f5f5f5; border-radius: 18px; display: flex; align-items: center; padding: 0 14px; gap: 8px; flex-shrink: 0; }
    .search-icon { color: #999; flex-shrink: 0; }
    .search-placeholder { color: #999; font-size: 14px; }
    
    /* 轮播图 */
    .carousel { margin: 12px; border-radius: 12px; overflow: hidden; position: relative; flex-shrink: 0; }
    .carousel-track { display: flex; }
    .carousel-item { min-width: 100%; height: 150px; display: flex; align-items: center; justify-content: center; }
    .carousel-dots { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.5); }
    .dot.active { background: #fff; width: 16px; border-radius: 3px; }
    
    /* 网格 */
    .grid-container { display: grid; gap: 8px; padding: 12px; }
    .grid-item { height: 100px; border-radius: 10px; overflow: hidden; }
    
    /* 左右分栏布局 - 优化适配 */
    .horizontal-split-layout { display: flex; height: calc(100vh - 44px); overflow: hidden; }
    .split-left { background: #f5f5f5; overflow-y: auto; border-right: 1px solid #e8e8e8; flex-shrink: 0; }
    .split-right { flex: 1; overflow-y: auto; background: #fff; padding: 12px; min-width: 0; }
    
    /* 侧边栏布局 */
    .sidebar-layout { display: flex; height: calc(100vh - 200px); overflow: hidden; }
    .sidebar-menu { width: 90px; background: #f5f5f5; overflow-y: auto; border-right: 1px solid #e8e8e8; flex-shrink: 0; }
    .sidebar-content { flex: 1; overflow-y: auto; padding: 12px; min-width: 0; }
    
    /* 菜单列表 - 优化窄宽度适配 */
    .menu-list { width: 100%; }
    .menu-item { 
      padding: 12px 6px; 
      font-size: 12px; 
      color: #666; 
      text-align: center; 
      border-left: 3px solid transparent; 
      cursor: pointer; 
      transition: all 0.2s;
      word-break: keep-all;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }
    .menu-item:hover { background: #ebebeb; }
    .menu-item.active { background: #fff; color: #ff6b35; border-left-color: #ff6b35; font-weight: 600; }
    
    /* 网格列表 */
    .grid-list { display: grid; gap: 10px; }
    
    /* 卡片 - 优化尺寸 */
    .card { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); transition: box-shadow 0.2s; }
    .card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
    .card-image-placeholder { width: 100%; height: 120px; background: #f5f7fa; display: flex; align-items: center; justify-content: center; color: #bbb; overflow: hidden; }
    .card-body { padding: 10px; }
    .card-title { font-size: 13px; color: #333; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 6px; }
    .card-price-row { display: flex; align-items: center; justify-content: space-between; }
    
    /* 图片 */
    .image-container { width: 100%; overflow: hidden; }
    .image-placeholder { width: 100%; height: 120px; background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #bbb; font-size: 12px; }
    
    /* 文本 */
    .text-content { font-size: 13px; color: #333; line-height: 1.5; }
    
    /* 价格 */
    .price { color: #ff4d4f; font-weight: 700; font-size: 16px; margin-top: 4px; }
    .member-price { color: #ff6600; font-size: 12px; margin-top: 2px; }
    .price-wrapper { display: flex; align-items: baseline; color: #ff4d4f; }
    .price-symbol { font-size: 11px; }
    .price-value { font-size: 18px; font-weight: 700; }
    .price-decimal { font-size: 11px; }
    
    /* 按钮 */
    .btn-primary { background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%); color: white; border: none; border-radius: 16px; padding: 6px 12px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(255,107,53,0.3); width: 100%; margin-top: 6px; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(255,107,53,0.4); }
    .btn-primary:active { transform: translateY(0); }
    
    /* 加载状态 */
    .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; gap: 12px; }
    .loading-spinner { width: 28px; height: 28px; border: 3px solid #f3f3f3; border-top: 3px solid #ff6b35; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .loading-text { color: #999; font-size: 13px; }
    
    /* 空状态 */
    .empty-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 12px; color: #ccc; }
    .empty-text { color: #999; font-size: 14px; }
    
    /* 底部标签栏 */
    .tab-bar { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 375px; height: 56px; background: #fff; display: flex; align-items: center; justify-content: space-around; border-top: 1px solid #f0f0f0; z-index: 100; }
    .tab-item { display: flex; flex-direction: column; align-items: center; gap: 2px; color: #999; font-size: 10px; }
    .tab-item.active { color: #ff6b35; }
    
    /* 通用元素 */
    .generic-element { margin: 12px; padding: 16px; background: #fff; border-radius: 12px; border: 2px dashed #e0e0e0; }
    .generic-label { font-size: 11px; color: #999; margin-bottom: 4px; }
    .generic-name { font-size: 14px; color: #333; font-weight: 500; }
    
    /* 空状态页面 */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; color: #ccc; gap: 12px; }
    .empty-state p { color: #999; font-size: 14px; }
    .empty-state .hint { font-size: 12px; color: #bbb; }
    
    /* 内容占位 */
    .content-placeholder { display: flex; align-items: center; justify-content: center; height: 200px; color: #999; font-size: 14px; }
    
    /* 桌面模式 */
    .desktop-mode .phone-frame { max-width: 100%; min-height: auto; border-radius: 12px; margin: 20px; overflow: hidden; }
    .desktop-mode .horizontal-split-layout { height: 600px; }
    .desktop-mode .sidebar-layout { height: auto; min-height: 400px; }
  `
}

export const PrototypeViewer = memo(function PrototypeViewer({ requirement }: PrototypeViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')
  const [copied, setCopied] = useState(false)
  const [aiGeneratedHtml, setAiGeneratedHtml] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { sendToAI, jsonContent } = useRequirement()
  const [scale, setScale] = useState(100)

  const html = generatePrototypeHTML(requirement)
  const displayHtml = aiGeneratedHtml || html

  useEffect(() => {
    const iframe = iframeRef.current
    if (iframe) { iframe.srcdoc = displayHtml }
  }, [displayHtml])

  const handleRefresh = () => {
    const iframe = iframeRef.current
    if (iframe) { iframe.srcdoc = displayHtml }
  }

  const handleCopyHTML = async () => {
    try {
      await navigator.clipboard.writeText(displayHtml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  const handleAIGenerate = async () => {
    const sessionId = paneLayoutStore.getFocusedSessionId()
    if (!sessionId) {
      console.warn('[PrototypeViewer] 未找到活跃会话，无法生成原型')
      return
    }
    setIsGenerating(true)
    try {
      await sendToAI(sessionId, 'generate_prototype')
    } catch (error) {
      console.error('AI 生成失败:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleLoadAIPrototype = async () => {
    const pageId = requirement.page_info?.page_id || 'pg_001'
    const fileName = `${pageId}.html`
    try {
      const response = await fetch(`/api/file/read?path=output/prototype/${fileName}`)
      if (response.ok) {
        const data = await response.json()
        setAiGeneratedHtml(data.content)
      } else {
        alert('未找到 AI 生成的原型文件，请先点击"AI 生成原型"')
      }
    } catch {
      alert('加载失败，请确认 AI 已生成原型文件')
    }
  }

  // 计算手机容器的实际尺寸
  const phoneWidth = 375
  const phoneHeight = 812
  const scaledWidth = Math.round(phoneWidth * scale / 100)
  const scaledHeight = Math.round(phoneHeight * scale / 100)

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setDevice('mobile')} className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-all ${device === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              <Smartphone className="w-3.5 h-3.5" /> 手机
            </button>
            <button onClick={() => setDevice('desktop')} className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-all ${device === 'desktop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              <Monitor className="w-3.5 h-3.5" /> 桌面
            </button>
          </div>
          
          {device === 'mobile' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">缩放</span>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                {[75, 100, 125, 150].map(s => (
                  <button key={s} onClick={() => setScale(s)} className={`px-2 py-0.5 text-xs rounded-md transition-all ${scale === s ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                    {s}%
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={handleAIGenerate} disabled={isGenerating} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> {isGenerating ? '生成中...' : 'AI 生成'}
          </button>
          <button onClick={handleLoadAIPrototype} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors">
            加载 AI 原型
          </button>
          {aiGeneratedHtml && (
            <button onClick={() => setAiGeneratedHtml(null)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              本地预览
            </button>
          )}
          <div className="w-px h-4 bg-gray-200" />
          <button onClick={handleCopyHTML} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleRefresh} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* 预览区域 */}
      <div className="flex-1 overflow-auto bg-gradient-to-b from-gray-100 to-gray-200 flex items-start justify-center p-8">
        {device === 'mobile' ? (
          <div className="relative" style={{ width: scaledWidth, height: scaledHeight }}>
            {/* 手机外壳 */}
            <div className="absolute inset-0 bg-gray-900 rounded-[3rem] shadow-2xl" style={{ padding: '12px' }}>
              {/* 屏幕 */}
              <div className="w-full h-full bg-white rounded-[2.25rem] overflow-hidden relative">
                {/* 刘海 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-10" />
                {/* iframe */}
                <iframe ref={iframeRef} className="w-full h-full border-0" sandbox="allow-scripts" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-white rounded-xl shadow-lg overflow-hidden">
            <iframe ref={iframeRef} className="w-full h-full border-0" sandbox="allow-scripts" />
          </div>
        )}
      </div>
    </div>
  )
})
