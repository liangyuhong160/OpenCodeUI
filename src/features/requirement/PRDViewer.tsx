import { memo, useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import { MarkdownRenderer } from 'D:/repo/lyh/prdtest/OpenCodeUI/src/components'
import type { Requirement } from '../../contexts/requirement'

// 组件类型中文映射
const ELEMENT_TYPE_LABELS: Record<string, string> = {
  Carousel: '轮播图',
  Grid: '网格',
  MenuList: '菜单列表',
  GridList: '网格列表',
  Card: '卡片',
  Image: '图片',
  Text: '文本',
  PriceText: '价格文本',
  Button: '按钮',
  Loading: '加载中',
  Empty: '空状态',
  SearchBar: '搜索栏',
  TabBar: '标签栏',
  NavBar: '导航栏',
  SideBarLayout: '侧边栏布局',
}

// 触发时机中文映射
const TRIGGER_TIMING_LABELS: Record<string, string> = {
  onLoad: '页面加载时',
  onShow: '页面显示时',
  onHide: '页面隐藏时',
  onUnload: '页面卸载时',
  onPullDownRefresh: '下拉刷新时',
  onReachBottom: '滚动到底部时',
}

// 显示条件中文映射
const DISPLAY_CONDITION_LABELS: Record<string, string> = {
  '': '始终显示',
  login_required: '用户已登录时显示',
  vip_only: '仅VIP用户可见',
  not_login: '未登录时显示',
  has_data: '有数据时显示',
  no_data: '无数据时显示',
  stock_available: '有库存时显示',
}

// 布局类型中文映射
const LAYOUT_TYPE_LABELS: Record<string, string> = {
  VerticalFlowLayout: '垂直流式布局（从上到下）',
  SideBarLayout: '侧边栏布局',
  GridLayout: '网格布局',
  TabLayout: '标签页布局',
}

// 区域中文映射
const REGION_LABELS: Record<string, string> = {
  top_region: '顶部区域',
  middle_region: '中部区域',
  bottom_region: '底部区域',
}

interface PRDViewerProps {
  requirement: Requirement
}

// 将 JSON 转换为 PRD Markdown
function generatePRDMarkdown(req: Requirement): string {
  const lines: string[] = []

  // 标题
  lines.push('# ' + (req.page_info.page_name || '产品需求文档'))
  lines.push('')

  // 页面信息
  lines.push('## 页面信息')
  lines.push('')
  lines.push('| 属性 | 值 |')
  lines.push('|------|-----|')
  lines.push('| 页面 ID | ' + (req.page_info.page_id || '-') + ' |')
  lines.push('| 页面名称 | ' + (req.page_info.page_name || '-') + ' |')
  lines.push('| 路由路径 | ' + (req.page_info.route_path || '-') + ' |')
  lines.push('')

  // 功能描述
  if (req.function_description && req.function_description.length > 0) {
    lines.push('## 功能描述')
    lines.push('')
    req.function_description.forEach((desc, i) => {
      lines.push((i + 1) + '. ' + desc)
    })
    lines.push('')
  }

  // 全局逻辑
  if (req.global_logic && req.global_logic.length > 0) {
    lines.push('## 全局逻辑')
    lines.push('')
    req.global_logic.forEach((logic, i) => {
      lines.push('### ' + (i + 1) + '. ' + (logic.rule_name || '未命名规则'))
      lines.push('')
      lines.push('| 属性 | 值 |')
      lines.push('|------|-----|')
      lines.push('| 触发时机 | ' + (TRIGGER_TIMING_LABELS[logic.trigger_timing] || logic.trigger_timing || '-') + ' |')
      lines.push('| 规则说明 | ' + (logic.description || '-') + ' |')
      if (logic.api_reference) {
        lines.push('| 接口地址 | ' + logic.api_reference + ' |')
      }
      lines.push('')
    })
  }

  // 布局结构
  lines.push('## 布局结构')
  lines.push('')
  lines.push('| 属性 | 值 |')
  lines.push('|------|-----|')
  lines.push('| 布局方式 | ' + (LAYOUT_TYPE_LABELS[req.layout_schema.layout_type] || req.layout_schema.layout_type || '-') + ' |')
  lines.push('')

  if (req.layout_schema.regions && Object.keys(req.layout_schema.regions).length > 0) {
    lines.push('### 区域划分')
    lines.push('')
    Object.entries(req.layout_schema.regions).forEach(([regionKey, elements]) => {
      const label = REGION_LABELS[regionKey] || regionKey
      const elementNames = (Array.isArray(elements) ? elements : []).map(id => {
        const el = req.elements.find(e => e.element_id === id)
        return el ? el.element_name || el.element_id : id
      }).join('、')
      lines.push('- **' + label + '**：' + (elementNames || '暂无元素'))
    })
    lines.push('')
  }

  // 页面元素
  if (req.elements && req.elements.length > 0) {
    lines.push('## 页面元素清单')
    lines.push('')
    lines.push('共 ' + req.elements.length + ' 个元素')
    lines.push('')

    // 按层级树形展示
    const renderElementTree = (parentId: string, indent: number) => {
      const children = (Array.isArray(req.elements) ? req.elements : []).filter(el => el.parent_id === parentId)
      children.forEach((el, idx) => {
        const prefix = '  '.repeat(indent) + (idx + 1) + '. '
        lines.push(prefix + '**' + (el.element_name || el.element_id) + '** ' + '(' + (ELEMENT_TYPE_LABELS[el.element_type] || el.element_type) + ')')
        lines.push('')

        // 元素详情
        const detailIndent = '  '.repeat(indent + 1)
        if (el.behavior_rules) {
          lines.push(detailIndent + '- **行为规则**：' + el.behavior_rules)
        }
        if (el.data_mapping) {
          lines.push(detailIndent + '- **数据来源**：' + el.data_mapping)
        }
        if (el.api_reference) {
          lines.push(detailIndent + '- **接口地址**：' + el.api_reference)
        }
        if (el.display_condition) {
          const condLabel = DISPLAY_CONDITION_LABELS[el.display_condition] || el.display_condition
          lines.push(detailIndent + '- **显示条件**：' + condLabel)
        }
        if (el.display_props && Object.keys(el.display_props).length > 0) {
          const propsStr = Object.entries(el.display_props).map(([k, v]) => k + ': ' + v).join(', ')
          lines.push(detailIndent + '- **显示属性**：' + propsStr)
        }
        lines.push('')

        // 递归子元素
        renderElementTree(el.element_id, indent + 1)
      })
    }

    renderElementTree('root', 0)
  }

  return lines.join('\n')
}

export const PRDViewer = memo(function PRDViewer({ requirement }: PRDViewerProps) {
  const [copied, setCopied] = useState(false)

  const markdown = generatePRDMarkdown(requirement)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const handleExport = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (requirement.page_info.page_name || 'PRD') + '.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-200 bg-bg-200/50">
        <span className="text-xs text-text-300">PRD 文档预览</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs text-text-200 hover:text-text-100 hover:bg-bg-300 rounded transition-colors"
            title="复制 Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已复制' : '复制'}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2 py-1 text-xs text-text-200 hover:text-text-100 hover:bg-bg-300 rounded transition-colors"
            title="导出 Markdown 文件"
          >
            <Download className="w-3.5 h-3.5" />
            导出
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <MarkdownRenderer content={markdown} />
        </div>
      </div>
    </div>
  )
})
