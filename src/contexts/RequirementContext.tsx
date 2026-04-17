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
          promptText = '请根据以下需求 JSON 生成高保真原型 HTML，保存到 output/prototype/' + requirement.page_info.page_id + '.html：\n\n```json\n' + jsonContent + '\n```\n\n要求：\n1. 使用 TailwindCSS CDN\n2. 使用 Alpine.js CDN\n3. 高保真微信小程序风格\n4. 完整可运行'
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
