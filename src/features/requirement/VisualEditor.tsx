import { memo, useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight, HelpCircle, GripVertical } from 'lucide-react'
import type { Requirement } from '../../contexts/requirement'

interface VisualEditorProps {
  requirement: Requirement
  onUpdate: (updates: Partial<Requirement>) => void
  onAddElement: (element: Requirement['elements'][0]) => void
  onUpdateElement: (elementId: string, updates: Partial<Requirement['elements'][0]>) => void
  onRemoveElement: (elementId: string) => void
}

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

// 显示条件预设（大白话）
const DISPLAY_CONDITION_PRESETS = [
  { value: '', label: '始终显示' },
  { value: 'login_required', label: '用户已登录时显示' },
  { value: 'vip_only', label: '仅VIP用户可见' },
  { value: 'not_login', label: '未登录时显示' },
  { value: 'has_data', label: '有数据时显示' },
  { value: 'no_data', label: '无数据时显示' },
  { value: 'stock_available', label: '有库存时显示' },
  { value: 'custom', label: '自定义条件...' },
]

// 布局区域预设
const DEFAULT_REGIONS = ['top_region', 'middle_region', 'bottom_region']
const REGION_LABELS: Record<string, string> = {
  top_region: '顶部区域',
  middle_region: '中部区域',
  bottom_region: '底部区域',
}

// 字段配置定义
const FIELD_CONFIG = {
  page_info: {
    label: '页面信息',
    icon: '\ud83d\udcc4',
    fields: [
      { key: 'page_id', label: '页面 ID', type: 'text', placeholder: 'pg_xxx', help: '唯一标识，系统自动生成' },
      { key: 'page_name', label: '页面名称', type: 'text', placeholder: '商品列表页', help: '页面的中文名称' },
      { key: 'route_path', label: '路由路径', type: 'text', placeholder: '/pages/goods/list', help: '页面的路由地址' },
    ]
  },
  function_description: {
    label: '功能描述',
    icon: '\ud83d\udcdd',
    type: 'array',
    help: '描述页面的主要功能，每行一个功能点'
  },
  global_logic: {
    label: '全局逻辑',
    icon: '\u2699\ufe0f',
    type: 'array',
    help: '页面级别的全局规则，如加载时机、权限控制等',
    fields: [
      { key: 'logic_id', label: '规则 ID', type: 'text', hidden: true },
      { key: 'rule_name', label: '规则名称', type: 'text', placeholder: '登录校验' },
      { key: 'trigger_timing', label: '什么时候触发', type: 'select', options: [
        { value: 'onLoad', label: '页面加载时' },
        { value: 'onShow', label: '页面显示时' },
        { value: 'onHide', label: '页面隐藏时' },
        { value: 'onUnload', label: '页面卸载时' },
        { value: 'onPullDownRefresh', label: '下拉刷新时' },
        { value: 'onReachBottom', label: '滚动到底部时' },
      ]},
      { key: 'description', label: '规则说明', type: 'textarea', placeholder: '用大白话描述这个规则，比如：用户打开页面时检查是否登录' },
      { key: 'api_reference', label: '接口地址', type: 'text', placeholder: '比如：GET /api/v1/user/info（选填）' },
    ]
  },
  layout_schema: {
    label: '布局结构',
    icon: '\ud83d\udcd0',
    fields: [
      { key: 'layout_type', label: '布局方式', type: 'select', options: [
        { value: 'VerticalFlowLayout', label: '垂直流式布局（从上到下）' },
        { value: 'SideBarLayout', label: '侧边栏布局' },
        { value: 'GridLayout', label: '网格布局' },
        { value: 'TabLayout', label: '标签页布局' },
      ]},
    ]
  },
  elements: {
    label: '页面元素',
    icon: '\ud83e\udde9',
    type: 'array',
    help: '页面上的所有组件元素',
    fields: [
      { key: 'element_id', label: '元素 ID', type: 'text', hidden: true },
      { key: 'element_type', label: '组件类型', type: 'select', options: [
        { value: 'Text', label: '文本' },
        { value: 'Image', label: '图片' },
        { value: 'Button', label: '按钮' },
        { value: 'Card', label: '卡片' },
        { value: 'Carousel', label: '轮播图' },
        { value: 'Grid', label: '网格' },
        { value: 'MenuList', label: '菜单列表' },
        { value: 'GridList', label: '网格列表' },
        { value: 'PriceText', label: '价格文本' },
        { value: 'Loading', label: '加载中' },
        { value: 'Empty', label: '空状态' },
        { value: 'SearchBar', label: '搜索栏' },
        { value: 'TabBar', label: '标签栏' },
        { value: 'NavBar', label: '导航栏' },
        { value: 'SideBarLayout', label: '侧边栏布局' },
      ]},
      { key: 'element_name', label: '元素名称', type: 'text', placeholder: '商品卡片' },
      { key: 'parent_id', label: '放在哪个元素里面', type: 'parent_select' },
      { key: 'behavior_rules', label: '行为规则', type: 'textarea', placeholder: '用大白话描述，包括：\n- 交互逻辑（点击跳转、滑动刷新等）\n- 展示限制（最多两行、超出省略等）\n- 条件渲染（VIP才显示、库存为0时置灰等）\n- 其他特殊说明' },
      { key: 'data_mapping', label: '数据来源', type: 'text', placeholder: '比如：商品图片、商品名称' },
      { key: 'api_reference', label: '接口地址', type: 'text', placeholder: '比如：GET /api/goods/list（选填）' },
      { key: 'display_condition', label: '什么时候显示', type: 'display_condition' },
      { key: 'display_props', label: '显示属性', type: 'display_props' },
    ]
  }
}

// 输入组件
function FieldInput({ field, value, onChange, elements }: { 
  field: any
  value: any
  onChange: (value: any) => void
  elements?: Requirement['elements']
}) {
  const baseClass = "w-full px-3 py-2 bg-bg-300 border border-border-200 rounded text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-accent-main-100/50 focus:border-accent-main-100 transition-colors"

  // 父元素选择器
  if (field.type === 'parent_select') {
    const options = [
      { value: 'root', label: '根目录（最外层）' },
      ...(elements || []).map(el => ({
        value: el.element_id,
        label: el.element_name || '未命名'
      }))
    ]
    return (
      <select
        value={value || 'root'}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  // 显示条件选择器
  if (field.type === 'display_condition') {
    return (
      <DisplayConditionEditor
        value={value || ''}
        onChange={onChange}
      />
    )
  }

  // 显示属性编辑器
  if (field.type === 'display_props') {
    return (
      <DisplayPropsEditor
        value={value || {}}
        onChange={onChange}
      />
    )
  }

  // 带中文标签的选择器
  if (field.type === 'select' && field.options && typeof field.options[0] === 'object') {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={baseClass}
      >
        <option value="">请选择</option>
        {field.options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  switch (field.type) {
    case 'select':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        >
          <option value="">请选择</option>
          {field.options?.map((opt: string) => (
            <option key={opt} value={opt}>{ELEMENT_TYPE_LABELS[opt] || opt}</option>
          ))}
        </select>
      )
    case 'textarea':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={baseClass + ' resize-none'}
        />
      )
    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseClass}
        />
      )
  }
}

// 显示条件编辑器（大白话）
function DisplayConditionEditor({ value, onChange }: {
  value: string
  onChange: (value: string) => void
}) {
  const [preset, setPreset] = useState(() => {
    const found = DISPLAY_CONDITION_PRESETS.find(p => value === p.value)
    return found ? found.value : (value ? 'custom' : '')
  })
  const [customText, setCustomText] = useState(() => {
    const isPreset = DISPLAY_CONDITION_PRESETS.some(p => value === p.value)
    return isPreset ? '' : value
  })

  const handlePresetChange = (newPreset: string) => {
    setPreset(newPreset)
    if (newPreset === 'custom') {
      onChange(customText || '')
    } else {
      onChange(newPreset)
    }
  }

  const handleCustomChange = (text: string) => {
    setCustomText(text)
    if (preset === 'custom') {
      onChange(text)
    }
  }

  return (
    <div className="space-y-2">
      <select
        value={preset}
        onChange={(e) => handlePresetChange(e.target.value)}
        className="w-full px-3 py-2 bg-bg-300 border border-border-200 rounded text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-accent-main-100/50"
      >
        {DISPLAY_CONDITION_PRESETS.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
      {preset === 'custom' && (
        <input
          type="text"
          value={customText}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder="用大白话描述，比如：用户是VIP且购物车有商品时"
          className="w-full px-3 py-2 bg-bg-300 border border-border-200 rounded text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-accent-main-100/50"
        />
      )}
      {preset && preset !== 'custom' && (
        <p className="text-xs text-text-400">
          系统会自动转换为代码逻辑，您只需选择条件即可
        </p>
      )}
    </div>
  )
}

// 显示属性编辑器
function DisplayPropsEditor({ value, onChange }: {
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}) {
  const [entries, setEntries] = useState<Array<{ key: string; value: string }>>(() => {
    return Object.entries(value || {}).map(([k, v]) => ({ key: k, value: String(v) }))
  })

  const updateEntries = () => {
    const obj: Record<string, unknown> = {}
    entries.forEach(e => {
      if (e.key.trim()) {
        // 尝试转换数字和布尔值
        const num = Number(e.value)
        if (e.value === 'true') obj[e.key] = true
        else if (e.value === 'false') obj[e.key] = false
        else if (!isNaN(num) && e.value !== '') obj[e.key] = num
        else obj[e.key] = e.value
      }
    })
    onChange(obj)
  }

  const addEntry = () => {
    const newEntries = [...entries, { key: '', value: '' }]
    setEntries(newEntries)
    // Also update parent
    const obj: Record<string, unknown> = {}
    newEntries.forEach(e => { if (e.key.trim()) obj[e.key] = e.value })
    onChange(obj)
  }

  const removeEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index)
    setEntries(newEntries)
    const obj: Record<string, unknown> = {}
    newEntries.forEach(e => { if (e.key.trim()) obj[e.key] = e.value })
    onChange(obj)
  }

  const updateEntry = (index: number, field: 'key' | 'value', val: string) => {
    const newEntries = [...entries]
    newEntries[index] = { ...newEntries[index], [field]: val }
    setEntries(newEntries)
    const obj: Record<string, unknown> = {}
    newEntries.forEach(e => { if (e.key.trim()) obj[e.key] = e.value })
    onChange(obj)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-400 mb-2">配置组件的显示属性，如最大数量、列数、自动播放等</p>
      {entries.map((entry, index) => (
        <div key={index} className="flex gap-2 items-center">
          <input
            type="text"
            value={entry.key}
            onChange={(e) => updateEntry(index, 'key', e.target.value)}
            placeholder="属性名，如：columns"
            className="flex-1 px-2 py-1.5 bg-bg-300 border border-border-200 rounded text-xs text-text-100 focus:outline-none focus:ring-1 focus:ring-accent-main-100/50"
          />
          <input
            type="text"
            value={entry.value}
            onChange={(e) => updateEntry(index, 'value', e.target.value)}
            placeholder="值，如：2 或 true"
            className="flex-1 px-2 py-1.5 bg-bg-300 border border-border-200 rounded text-xs text-text-100 focus:outline-none focus:ring-1 focus:ring-accent-main-100/50"
          />
          <button
            onClick={() => removeEntry(index)}
            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={addEntry}
        className="flex items-center gap-1 px-2 py-1 text-xs text-accent-main-100 hover:bg-accent-main-100/10 rounded transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        添加属性
      </button>
    </div>
  )
}

// 布局区域编辑器
function LayoutRegionsEditor({ regions, onChange }: {
  regions: Record<string, string[]>
  onChange: (regions: Record<string, string[]>) => void
}) {
  const allRegionKeys = [...new Set([...DEFAULT_REGIONS, ...Object.keys(regions)])]
  
  const updateRegion = (regionKey: string, elements: string) => {
    const newRegions = { ...regions }
    newRegions[regionKey] = elements.split(',').map(s => s.trim()).filter(Boolean)
    onChange(newRegions)
  }

  const addRegion = () => {
    const key = 'region_' + Date.now()
    onChange({ ...regions, [key]: [] })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-300">配置每个布局区域包含哪些元素（填写元素 ID，多个用逗号分隔）</p>
      {allRegionKeys.map(key => (
        <div key={key} className="flex items-center gap-2">
          <label className="text-xs font-medium text-text-200 w-24 shrink-0">
            {REGION_LABELS[key] || key}
          </label>
          <input
            type="text"
            value={(regions[key] || []).join(', ')}
            onChange={(e) => updateRegion(key, e.target.value)}
            placeholder="元素 ID，多个用逗号分隔"
            className="flex-1 px-3 py-2 bg-bg-300 border border-border-200 rounded text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-accent-main-100/50"
          />
        </div>
      ))}
      <button
        onClick={addRegion}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-accent-main-100 hover:bg-accent-main-100/10 rounded transition-colors"
      >
        <Plus className="w-4 h-4" />
        添加自定义区域
      </button>
    </div>
  )
}

// 数组编辑器（功能描述）
function ArrayEditor({ items, onChange, placeholder }: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
}) {
  const addItem = () => {
    onChange([...items, ''])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index] = value
    onChange(newItems)
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 bg-bg-300 border border-border-200 rounded text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-accent-main-100/50"
          />
          <button
            onClick={() => removeItem(index)}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-accent-main-100 hover:bg-accent-main-100/10 rounded transition-colors"
      >
        <Plus className="w-4 h-4" />
        添加
      </button>
    </div>
  )
}

// 对象数组编辑器（全局逻辑、页面元素）
function ObjectArrayEditor({ items, fields, onChange, onAdd, onRemove, emptyLabel, elements }: {
  items: any[]
  fields: any[]
  onChange: (index: number, key: string, value: any) => void
  onAdd: () => void
  onRemove: (index: number) => void
  emptyLabel: string
  elements?: Requirement['elements']
}) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]))

  const toggleExpand = (index: number) => {
    const newSet = new Set(expandedItems)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setExpandedItems(newSet)
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="text-center py-8 text-text-300 text-sm">
          暂无{emptyLabel}，点击下方按钮添加
        </div>
      ) : (
        items.map((item, index) => (
          <div key={item.element_id || item.logic_id || index} className="border border-border-200 rounded-lg overflow-hidden bg-bg-300/50">
            <div
              className="flex items-center justify-between px-4 py-3 bg-bg-300 cursor-pointer hover:bg-bg-400 transition-colors"
              onClick={() => toggleExpand(index)}
            >
              <div className="flex items-center gap-2">
                {expandedItems.has(index) ? (
                  <ChevronDown className="w-4 h-4 text-text-300" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-text-300" />
                )}
                <span className="text-sm font-medium text-text-100">
                  {item.element_name || item.rule_name || emptyLabel + ' ' + (index + 1)}
                </span>
                {item.element_type && (
                  <span className="text-xs px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded">
                    {ELEMENT_TYPE_LABELS[item.element_type] || item.element_type}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(index)
                }}
                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {expandedItems.has(index) && (
              <div className="p-4 space-y-3">
                {fields.map((field: any) => {
                  if (field.hidden) return null
                  return (
                    <div key={field.key}>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-text-200 mb-1.5">
                        {field.label}
                        {field.help && (
                          <span className="group relative">
                            <HelpCircle className="w-3.5 h-3.5 text-text-400" />
                            <span className="hidden group-hover:block absolute left-0 top-full mt-1 w-48 p-2 bg-bg-100 border border-border-200 rounded shadow-lg text-text-200 text-xs z-10">
                              {field.help}
                            </span>
                          </span>
                        )}
                      </label>
                      <FieldInput
                        field={field}
                        value={item[field.key]}
                        onChange={(value) => onChange(index, field.key, value)}
                        elements={elements}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))
      )}
      <button
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm text-accent-main-100 hover:bg-accent-main-100/10 border border-dashed border-border-200 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        添加{emptyLabel}
      </button>
    </div>
  )
}

// 主可视化编辑器
export const VisualEditor = memo(function VisualEditor({
  requirement,
  onUpdate,
  onAddElement,
  onUpdateElement,
  onRemoveElement
}: VisualEditorProps) {
  const [activeSection, setActiveSection] = useState<string>('page_info')

  const updatePageInfo = (key: string, value: string) => {
    onUpdate({
      page_info: {
        ...requirement.page_info,
        [key]: value
      }
    })
  }

  const updateFunctionDescription = (items: string[]) => {
    onUpdate({ function_description: items })
  }

  const updateGlobalLogic = (index: number, key: string, value: any) => {
    const newLogic = [...requirement.global_logic]
    newLogic[index] = { ...newLogic[index], [key]: value }
    onUpdate({ global_logic: newLogic })
  }

  const addGlobalLogic = () => {
    onUpdate({
      global_logic: [
        ...requirement.global_logic,
        { logic_id: 'gl_' + Date.now(), rule_name: '', trigger_timing: 'onLoad', description: '', api_reference: null }
      ]
    })
  }

  const removeGlobalLogic = (index: number) => {
    onUpdate({
      global_logic: requirement.global_logic.filter((_, i) => i !== index)
    })
  }

  const updateLayoutSchema = (key: string, value: any) => {
    onUpdate({
      layout_schema: {
        ...requirement.layout_schema,
        [key]: value
      }
    })
  }

  const updateRegions = (regions: Record<string, string[]>) => {
    onUpdate({
      layout_schema: {
        ...requirement.layout_schema,
        regions
      }
    })
  }

  const addElement = () => {
    onAddElement({
      element_id: 'el_' + Date.now(),
      element_type: 'Text',
      parent_id: 'root',
      display_props: {},
      element_name: '',
      behavior_rules: '',
      data_mapping: '',
      api_reference: null,
      display_condition: ''
    })
  }

  const handleUpdateElement = (index: number, key: string, value: any) => {
    const element = requirement.elements[index]
    onUpdateElement(element.element_id, { [key]: value })
  }

  const handleRemoveElement = (index: number) => {
    const element = requirement.elements[index]
    onRemoveElement(element.element_id)
  }

  const sections = [
    { key: 'page_info', config: FIELD_CONFIG.page_info },
    { key: 'function_description', config: FIELD_CONFIG.function_description },
    { key: 'global_logic', config: FIELD_CONFIG.global_logic },
    { key: 'layout_schema', config: FIELD_CONFIG.layout_schema },
    { key: 'elements', config: FIELD_CONFIG.elements },
  ]

  return (
    <div className="flex h-full">
      <div className="w-48 border-r border-border-200 bg-bg-200/50 overflow-y-auto">
        <div className="p-3">
          <h3 className="text-xs font-semibold text-text-300 uppercase tracking-wider mb-2">编辑区域</h3>
          <nav className="space-y-1">
            {sections.map(({ key, config }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={'w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ' + (
                  activeSection === key
                    ? 'bg-accent-main-100/10 text-accent-main-100 font-medium'
                    : 'text-text-200 hover:bg-bg-300 hover:text-text-100'
                )}
              >
                <span>{config.icon}</span>
                <span className="truncate">{config.label}</span>
                {key === 'elements' && requirement.elements.length > 0 && (
                  <span className="ml-auto text-xs px-1.5 py-0.5 bg-bg-300 rounded">
                    {requirement.elements.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-3xl">
          {activeSection === 'page_info' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{FIELD_CONFIG.page_info.icon}</span>
                <h2 className="text-lg font-semibold text-text-100">{FIELD_CONFIG.page_info.label}</h2>
              </div>
              {FIELD_CONFIG.page_info.fields.filter(f => !f.hidden).map((field) => (
                <div key={field.key}>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-text-200 mb-2">
                    {field.label}
                    {field.help && (
                      <span className="group relative">
                        <HelpCircle className="w-4 h-4 text-text-400" />
                        <span className="hidden group-hover:block absolute left-0 top-full mt-1 w-64 p-2 bg-bg-100 border border-border-200 rounded shadow-lg text-text-200 text-xs z-10">
                          {field.help}
                        </span>
                      </span>
                    )}
                  </label>
                  <FieldInput
                    field={field}
                    value={requirement.page_info[field.key as keyof typeof requirement.page_info]}
                    onChange={(value) => updatePageInfo(field.key, value)}
                  />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'function_description' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{FIELD_CONFIG.function_description.icon}</span>
                <h2 className="text-lg font-semibold text-text-100">{FIELD_CONFIG.function_description.label}</h2>
              </div>
              <p className="text-sm text-text-300 mb-4">{FIELD_CONFIG.function_description.help}</p>
              <ArrayEditor
                items={requirement.function_description}
                onChange={updateFunctionDescription}
                placeholder="输入功能描述，如：展示商品列表"
              />
            </div>
          )}

          {activeSection === 'global_logic' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{FIELD_CONFIG.global_logic.icon}</span>
                <h2 className="text-lg font-semibold text-text-100">{FIELD_CONFIG.global_logic.label}</h2>
              </div>
              <p className="text-sm text-text-300 mb-4">{FIELD_CONFIG.global_logic.help}</p>
              <ObjectArrayEditor
                items={requirement.global_logic}
                fields={FIELD_CONFIG.global_logic.fields}
                onChange={updateGlobalLogic}
                onAdd={addGlobalLogic}
                onRemove={removeGlobalLogic}
                emptyLabel="全局规则"
              />
            </div>
          )}

          {activeSection === 'layout_schema' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{FIELD_CONFIG.layout_schema.icon}</span>
                <h2 className="text-lg font-semibold text-text-100">{FIELD_CONFIG.layout_schema.label}</h2>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-text-200 mb-2">
                  布局方式
                </label>
                <FieldInput
                  field={FIELD_CONFIG.layout_schema.fields[0]}
                  value={requirement.layout_schema.layout_type}
                  onChange={(value) => updateLayoutSchema('layout_type', value)}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-text-200 mb-2">
                  区域划分
                  <span className="group relative">
                    <HelpCircle className="w-4 h-4 text-text-400" />
                    <span className="hidden group-hover:block absolute left-0 top-full mt-1 w-64 p-2 bg-bg-100 border border-border-200 rounded shadow-lg text-text-200 text-xs z-10">
                      定义页面从上到下分为哪些区域，每个区域包含哪些元素
                    </span>
                  </span>
                </label>
                <LayoutRegionsEditor
                  regions={requirement.layout_schema.regions || {}}
                  onChange={updateRegions}
                />
              </div>
            </div>
          )}

          {activeSection === 'elements' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{FIELD_CONFIG.elements.icon}</span>
                <h2 className="text-lg font-semibold text-text-100">{FIELD_CONFIG.elements.label}</h2>
                <span className="text-sm text-text-300">({requirement.elements.length} 个元素)</span>
              </div>
              <p className="text-sm text-text-300 mb-4">{FIELD_CONFIG.elements.help}</p>
              <ObjectArrayEditor
                items={requirement.elements}
                fields={FIELD_CONFIG.elements.fields}
                onChange={handleUpdateElement}
                onAdd={addElement}
                onRemove={handleRemoveElement}
                emptyLabel="页面元素"
                elements={requirement.elements}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
