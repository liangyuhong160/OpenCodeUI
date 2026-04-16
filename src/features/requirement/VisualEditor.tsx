import { memo, useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react'
import type { Requirement } from '../../contexts/requirement'

interface VisualEditorProps {
  requirement: Requirement
  onUpdate: (updates: Partial<Requirement>) => void
  onAddElement: (element: Requirement['elements'][0]) => void
  onUpdateElement: (elementId: string, updates: Partial<Requirement['elements'][0]>) => void
  onRemoveElement: (elementId: string) => void
}

// 字段配置定义
const FIELD_CONFIG = {
  page_info: {
    label: '页面信息',
    icon: '📄',
    fields: [
      { key: 'page_id', label: '页面 ID', type: 'text', placeholder: 'pg_xxx', help: '唯一标识，格式：pg_xxx' },
      { key: 'page_name', label: '页面名称', type: 'text', placeholder: '商品列表页', help: '页面的中文名称' },
      { key: 'route_path', label: '路由路径', type: 'text', placeholder: '/pages/goods/list', help: '页面的路由地址' },
    ]
  },
  function_description: {
    label: '功能描述',
    icon: '📝',
    type: 'array',
    help: '描述页面的主要功能，每行一个功能点'
  },
  global_logic: {
    label: '全局逻辑',
    icon: '⚙️',
    type: 'array',
    help: '页面级别的全局规则，如加载时机、权限控制等',
    fields: [
      { key: 'logic_id', label: '规则 ID', type: 'text', placeholder: 'gl_xxx' },
      { key: 'rule_name', label: '规则名称', type: 'text', placeholder: '登录校验' },
      { key: 'trigger_timing', label: '触发时机', type: 'select', options: ['onLoad', 'onShow', 'onHide', 'onUnload', 'onPullDownRefresh', 'onReachBottom'] },
      { key: 'description', label: '规则描述', type: 'textarea', placeholder: '描述规则的具体逻辑' },
    ]
  },
  layout_schema: {
    label: '布局结构',
    icon: '📐',
    fields: [
      { key: 'layout_type', label: '布局类型', type: 'select', options: ['VerticalFlowLayout', 'SideBarLayout', 'GridLayout', 'TabLayout'] },
    ]
  },
  elements: {
    label: '页面元素',
    icon: '🧩',
    type: 'array',
    help: '页面上的所有组件元素',
    fields: [
      { key: 'element_id', label: '元素 ID', type: 'text', placeholder: 'el_xxx' },
      { key: 'element_type', label: '组件类型', type: 'select', options: ['Carousel', 'Grid', 'MenuList', 'GridList', 'Card', 'Image', 'Text', 'PriceText', 'Button', 'Loading', 'Empty', 'SearchBar', 'TabBar', 'NavBar'] },
      { key: 'element_name', label: '元素名称', type: 'text', placeholder: '商品卡片' },
      { key: 'parent_id', label: '父级 ID', type: 'text', placeholder: 'root' },
      { key: 'functional_logic', label: '功能逻辑', type: 'textarea', placeholder: '点击跳转到详情页' },
      { key: 'data_mapping', label: '数据映射', type: 'text', placeholder: 'img_url: 图片地址' },
      { key: 'api_reference', label: '接口引用', type: 'text', placeholder: 'GET /api/goods/list' },
      { key: 'display_condition', label: '显示条件', type: 'text', placeholder: 'isVIP == true (可选)' },
    ]
  }
}

// 输入组件
function FieldInput({ field, value, onChange }: { 
  field: any
  value: any
  onChange: (value: any) => void
}) {
  const baseClass = "w-full px-3 py-2 bg-bg-300 border border-border-200 rounded text-sm text-text-100 focus:outline-none focus:ring-2 focus:ring-accent-main-100/50 focus:border-accent-main-100 transition-colors"

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
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )
    case 'textarea':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={`${baseClass} resize-none`}
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
function ObjectArrayEditor({ items, fields, onChange, onAdd, onRemove, emptyLabel }: {
  items: any[]
  fields: any[]
  onChange: (index: number, key: string, value: any) => void
  onAdd: () => void
  onRemove: (index: number) => void
  emptyLabel: string
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
          <div key={index} className="border border-border-200 rounded-lg overflow-hidden bg-bg-300/50">
            {/* 头部 */}
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
                  {item.element_name || item.rule_name || `${emptyLabel} ${index + 1}`}
                </span>
                {item.element_type && (
                  <span className="text-xs px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded">
                    {item.element_type}
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

            {/* 内容 */}
            {expandedItems.has(index) && (
              <div className="p-4 space-y-3">
                {fields.map((field: any) => (
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
                    />
                  </div>
                ))}
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
        { logic_id: `gl_${Date.now()}`, rule_name: '', trigger_timing: 'onLoad', description: '' }
      ]
    })
  }

  const removeGlobalLogic = (index: number) => {
    onUpdate({
      global_logic: requirement.global_logic.filter((_, i) => i !== index)
    })
  }

  const updateLayoutSchema = (key: string, value: string) => {
    onUpdate({
      layout_schema: {
        ...requirement.layout_schema,
        [key]: value
      }
    })
  }

  const addElement = () => {
    onAddElement({
      element_id: `el_${Date.now()}`,
      element_type: 'Text',
      parent_id: 'root',
      display_props: {},
      element_name: '',
      functional_logic: '',
      data_mapping: '',
      api_reference: ''
    })
  }

  const handleUpdateElement = (index: number, key: string, value: any) => {
    const element = requirement.elements[index]
    onUpdateElement(element.element_id, { [key]: value })
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
      {/* 左侧导航 */}
      <div className="w-48 border-r border-border-200 bg-bg-200/50 overflow-y-auto">
        <div className="p-3">
          <h3 className="text-xs font-semibold text-text-300 uppercase tracking-wider mb-2">编辑区域</h3>
          <nav className="space-y-1">
            {sections.map(({ key, config }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors ${
                  activeSection === key
                    ? 'bg-accent-main-100/10 text-accent-main-100 font-medium'
                    : 'text-text-200 hover:bg-bg-300 hover:text-text-100'
                }`}
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

      {/* 右侧内容 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-3xl">
          {/* 页面信息 */}
          {activeSection === 'page_info' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{FIELD_CONFIG.page_info.icon}</span>
                <h2 className="text-lg font-semibold text-text-100">{FIELD_CONFIG.page_info.label}</h2>
              </div>
              {FIELD_CONFIG.page_info.fields.map((field) => (
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

          {/* 功能描述 */}
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

          {/* 全局逻辑 */}
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

          {/* 布局结构 */}
          {activeSection === 'layout_schema' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{FIELD_CONFIG.layout_schema.icon}</span>
                <h2 className="text-lg font-semibold text-text-100">{FIELD_CONFIG.layout_schema.label}</h2>
              </div>
              {FIELD_CONFIG.layout_schema.fields.map((field) => (
                <div key={field.key}>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-text-200 mb-2">
                    {field.label}
                  </label>
                  <FieldInput
                    field={field}
                    value={requirement.layout_schema[field.key as keyof typeof requirement.layout_schema]}
                    onChange={(value) => updateLayoutSchema(field.key, value)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 页面元素 */}
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
                onRemove={(index) => onRemoveElement(requirement.elements[index].element_id)}
                emptyLabel="页面元素"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
