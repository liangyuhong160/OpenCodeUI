import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from 'react'
import { getSDKClient, unwrap } from '../api/sdk'
import { formatPathForApi } from '../utils/directoryUtils'
import type { FileContent } from '../api/types'

export interface Requirement {
  page_info: {
    page_id: string
    page_name: string
    route_path: string
  }
  function_description: string[]
  global_logic: Array<{
    logic_id: string
    rule_name: string
    trigger_timing: string
    description: string
    api_reference: string | null
  }>
  layout_schema: {
    layout_type: string
    regions: Record<string, string[]>
  }
  elements: Array<{
    element_id: string
    element_type: string
    parent_id: string
    display_props: Record<string, unknown>
    element_name: string
    behavior_rules: string
    data_mapping: string
    api_reference: string | null
    display_condition?: string
  }>
}

const DEFAULT_REQUIREMENT: Requirement = {
  page_info: {
    page_id: 'pg_001',
    page_name: '新页面',
    route_path: '/pages/new/index'
  },
  function_description: [],
  global_logic: [],
  layout_schema: {
    layout_type: 'VerticalFlowLayout',
    regions: {
      top_region: [],
      middle_region: [],
      bottom_region: []
    }
  },
  elements: []
}

interface RequirementContextValue {
  requirement: Requirement
  jsonContent: string
  isOpen: boolean
  isDirty: boolean
  currentFile: string | null
  isGenerating: boolean
  
  setJsonContent: (content: string) => void
  updatePageInfo: (info: Partial<Requirement['page_info']>) => void
  addElement: (element: Requirement['elements'][0]) => void
  updateElement: (elementId: string, updates: Partial<Requirement['elements'][0]>) => void
  removeElement: (elementId: string) => void
  
  open: () => void
  close: () => void
  toggle: () => void
  
  save: () => void
  saveToFile: (sessionId: string, directory?: string) => Promise<boolean>
  load: (filePath: string) => void
  loadFromFile: (filePath: string, directory?: string) => Promise<boolean>
  newFile: () => void
  
  markClean: () => void
  
  sendToAI: (sessionId: string, action: 'analyze' | 'generate_prd' | 'generate_prototype', directory?: string) => Promise<void>
}

const RequirementContext = createContext<RequirementContextValue | null>(null)

const STORAGE_KEY = 'requirement-json'
const CURRENT_FILE_KEY = 'requirement-current-file'

export function RequirementProvider({ children }: { children: ReactNode }) {
  const [requirement, setRequirementState] = useState<Requirement>(DEFAULT_REQUIREMENT)
  const [jsonContent, setJsonContentState] = useState(JSON.stringify(DEFAULT_REQUIREMENT, null, 2))
  const [isOpen, setIsOpen] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const savedFile = localStorage.getItem(CURRENT_FILE_KEY)
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setRequirementState(parsed)
        setJsonContentState(JSON.stringify(parsed, null, 2))
        setCurrentFile(savedFile)
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  const setJsonContent = useCallback((content: string) => {
    setJsonContentState(content)
    setIsDirty(true)
    
    try {
      const parsed = JSON.parse(content)
      setRequirementState(parsed)
    } catch {
      // Invalid JSON, don't update requirement
    }
  }, [])

  const updatePageInfo = useCallback((info: Partial<Requirement['page_info']>) => {
    setRequirementState((prev) => ({
      ...prev,
      page_info: { ...prev.page_info, ...info }
    }))
    setIsDirty(true)
  }, [])

  const addElement = useCallback((element: Requirement['elements'][0]) => {
    setRequirementState((prev) => ({
      ...prev,
      elements: [...prev.elements, element]
    }))
    setIsDirty(true)
  }, [])

  const updateElement = useCallback((elementId: string, updates: Partial<Requirement['elements'][0]>) => {
    setRequirementState((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => 
        el.element_id === elementId ? { ...el, ...updates } : el
      )
    }))
    setIsDirty(true)
  }, [])

  const removeElement = useCallback((elementId: string) => {
    setRequirementState((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.element_id !== elementId)
    }))
    setIsDirty(true)
  }, [])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const save = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, jsonContent)
    if (currentFile) {
      localStorage.setItem(CURRENT_FILE_KEY, currentFile)
    }
    setIsDirty(false)
  }, [jsonContent, currentFile])

  const saveToFile = useCallback(async (_sessionId: string, directory?: string): Promise<boolean> => {
    try {
      const sdk = getSDKClient()
      await sdk.session.prompt({
        sessionID: _sessionId,
        directory: formatPathForApi(directory),
        parts: [{
          type: 'text',
          text: '请帮我创建/更新文件 data/pages/' + requirement.page_info.page_id + '.json，内容如下：\n\n```json\n' + jsonContent + '\n```'
        }],
      })
      setCurrentFile('data/pages/' + requirement.page_info.page_id + '.json')
      localStorage.setItem(STORAGE_KEY, jsonContent)
      localStorage.setItem(CURRENT_FILE_KEY, 'data/pages/' + requirement.page_info.page_id + '.json')
      setIsDirty(false)
      return true
    } catch (error) {
      console.error('Failed to save to file:', error)
      return false
    }
  }, [jsonContent, requirement.page_info.page_id])

  const load = useCallback((filePath: string) => {
    setCurrentFile(filePath)
    localStorage.setItem(CURRENT_FILE_KEY, filePath)
  }, [])

  const loadFromFile = useCallback(async (filePath: string, directory?: string): Promise<boolean> => {
    try {
      const sdk = getSDKClient()
      const result = await sdk.file.read({
        path: filePath,
        directory: formatPathForApi(directory),
      })
      const fileContent = unwrap(result) as FileContent
      if (fileContent.type === 'text' && fileContent.content) {
        const parsed = JSON.parse(fileContent.content)
        setRequirementState(parsed)
        setJsonContentState(JSON.stringify(parsed, null, 2))
        setCurrentFile(filePath)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed, null, 2))
        localStorage.setItem(CURRENT_FILE_KEY, filePath)
        setIsDirty(false)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to load from file:', error)
      return false
    }
  }, [])

  const newFile = useCallback(() => {
    setRequirementState(DEFAULT_REQUIREMENT)
    setJsonContentState(JSON.stringify(DEFAULT_REQUIREMENT, null, 2))
    setCurrentFile(null)
    setIsDirty(false)
  }, [])

  const markClean = useCallback(() => setIsDirty(false), [])

  const sendToAI = useCallback(async (
    sessionId: string,
    action: 'analyze' | 'generate_prd' | 'generate_prototype',
    directory?: string,
  ) => {
    setIsGenerating(true)
    
    try {
      const sdk = getSDKClient()
      let promptText = ''

      switch (action) {
        case 'analyze':
          promptText = '请分析以下需求 JSON，并给出补充建议（只修改 JSON，不要生成其他文件）：\n\n```json\n' + jsonContent + '\n```\n\n如果需要修改 JSON，请直接在回复中给出完整的更新后的 JSON。'
          break
        case 'generate_prd':
          promptText = '请根据以下需求 JSON 生成 PRD 文档，保存到 output/prd/' + requirement.page_info.page_id + '.md：\n\n```json\n' + jsonContent + '\n```\n\n请输出完整的 PRD 文档。'
          break
        case 'generate_prototype':
          promptText = `请根据以下需求 JSON 生成高保真原型 HTML，保存到 output/prototype/${requirement.page_info.page_id}.html：

\`\`\`json
${jsonContent}
\`\`\`

【重要：必须严格按照 JSON 结构生成，不得遗漏任何元素！】

## 元素渲染规则（必须遵守）

1. **严格遵循 parent_id 层级关系**：
   - parent_id: "root" 的元素是顶级元素
   - 其他元素根据 parent_id 找到父元素，作为子元素渲染
   - 例如：el_product_image 的 parent_id 是 el_product_card，所以图片必须放在卡片内部

2. **必须渲染 JSON 中定义的所有元素**：
   - 遍历 elements 数组，每个元素都必须渲染
   - 根据 element_type 选择对应的 HTML 组件
   - 根据 element_name 显示文字内容
   - 根据 display_props 应用样式

3. **元素类型映射**：
   - MenuList → 左侧分类导航菜单（垂直列表）
   - GridList → 右侧商品网格列表
   - Card → 商品卡片容器
   - Image → 商品图片（使用 picsum.photos 随机图片）
   - Text → 文本内容（如商品名称）
   - PriceText → 价格显示（根据 element_name 区分原价/会员价）
   - Button → 按钮（如"立即购买"）
   - NavBar → 顶部导航栏
   - SearchBar → 搜索栏
   - Carousel → 轮播图
   - TabBar → 底部标签栏

4. **display_props 必须应用**：
   - backgroundColor → CSS background-color
   - width/height → CSS width/height
   - borderRadius → CSS border-radius
   - fontSize → CSS font-size
   - fontWeight → CSS font-weight
   - color → CSS color
   - marginTop/marginBottom → CSS margin-top/margin-bottom
   - padding → CSS padding
   - shadow → box-shadow: 0 2px 8px rgba(0,0,0,0.08)
   - textAlign → CSS text-align
   - numberOfLines → -webkit-line-clamp（多行文本截断）

5. **布局类型处理**：
   - HorizontalSplitLayout / HorizontalLayout → 左右分栏布局
     - 左侧：MenuList（宽度根据 display_props.width 或 layout_schema.regions.left_menu.width_ratio）
     - 右侧：GridList（宽度根据 display_props.width 或 layout_schema.regions.right_content.width_ratio）
   - VerticalFlowLayout → 垂直流式布局（从上到下排列）

6. **价格元素特殊处理**：
   - 如果 element_name 包含"会员" → 显示为会员价样式（橙色 #ff6600，较小字号）
   - 否则 → 显示为原价样式（红色 #ff4d4f，较大字号）
   - 价格格式：¥XX.XX

7. **图片处理**：
   - 使用 https://picsum.photos/seed/{随机数}/300/200 获取真实图片
   - 设置 object-fit: cover 保持比例
   - 添加 onerror 回退到渐变占位

8. **按钮处理**：
   - 根据 display_props.backgroundColor 设置按钮背景色
   - 根据 display_props.color 设置文字颜色
   - 根据 display_props.borderRadius 设置圆角
   - 默认样式：渐变橙色背景，白色文字，胶囊圆角

## 高保真设计规范

1. 技术栈：TailwindCSS CDN + 内联 CSS，完整可运行的单 HTML 文件
2. 色彩：电商主色 #FF6B35，背景 #F5F7FA/#FFFFFF，文字 #333/#666/#999
3. 间距：页面 16px，卡片 12px，元素 8/12/16px
4. 圆角：卡片 12px，按钮 20px，图片 8px
5. 阴影：卡片 0 2px 8px rgba(0,0,0,0.06)，hover 时 0 4px 16px
6. 字体：标题 14-16px/600，正文 14px，价格 18px/700
7. 手机框架：max-width 375px，状态栏 44px

## 输出要求

1. 生成完整的 HTML 文件，包含 <!DOCTYPE html>
2. 使用 <style> 标签包含所有 CSS
3. 使用 picsum.photos 作为图片源
4. 左侧菜单支持点击切换 active 状态（使用 onclick 内联 JS）
5. 不要使用 Alpine.js（简化依赖）
6. 确保所有 JSON 中定义的元素都出现在 HTML 中

请生成严格遵循 JSON 结构的高保真原型。`
          break
      }

      await sdk.session.prompt({
        sessionID: sessionId,
        directory: formatPathForApi(directory),
        parts: [{ type: 'text', text: promptText }],
      })
    } catch (error) {
      console.error('Failed to send to AI:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [jsonContent, requirement.page_info.page_id])

  const value: RequirementContextValue = {
    requirement,
    jsonContent,
    isOpen,
    isDirty,
    currentFile,
    isGenerating,
    setJsonContent,
    updatePageInfo,
    addElement,
    updateElement,
    removeElement,
    open,
    close,
    toggle,
    save,
    saveToFile,
    load,
    loadFromFile,
    newFile,
    markClean,
    sendToAI
  }

  return (
    <RequirementContext.Provider value={value}>
      {children}
    </RequirementContext.Provider>
  )
}

export function useRequirement() {
  const context = useContext(RequirementContext)
  if (!context) {
    throw new Error('useRequirement must be used within RequirementProvider')
  }
  return context
}

export { DEFAULT_REQUIREMENT }
