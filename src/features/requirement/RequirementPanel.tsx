import { memo, useCallback, useEffect, useState, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { 
  PanelRightClose, Save, FileJson, FileText, Eye, Download, 
  RefreshCw, Loader2, Copy, Check, AlertCircle, FilePlus, Sparkles, Bot, ChevronDown, Code, Layout
} from 'lucide-react'
import { useRequirement } from '../../contexts/requirement'
import { paneLayoutStore } from '../../store/paneLayoutStore'
import { messageStore } from '../../store'
import { getSDKClient } from '../../api/sdk'
import { formatPathForApi } from '../../utils/directoryUtils'
import { getSelectableAgents } from '../../api/agent'
import { VisualEditor } from './VisualEditor'

interface RequirementPanelProps {
  className?: string
}

const REQUIREMENT_AGENT = 'requirement-analyst'

export const RequirementPanel = memo(function RequirementPanel({ className = '' }: RequirementPanelProps) {
  const {
    requirement,
    jsonContent,
    isOpen,
    isDirty,
    isGenerating,
    setJsonContent,
    open,
    toggle,
    save,
    saveToFile,
    newFile,
    sendToAI
  } = useRequirement()

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [panelWidth, setPanelWidth] = useState(800)
  const [isResizing, setIsResizing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [jsonValid, setJsonValid] = useState(true)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string>(REQUIREMENT_AGENT)
  const [showAgentDropdown, setShowAgentDropdown] = useState(false)
  const [editMode, setEditMode] = useState<'visual' | 'json'>('visual')
  const [availableAgents, setAvailableAgents] = useState<Array<{ name: string; label: string }>>([
    { name: REQUIREMENT_AGENT, label: '需求梳理助手' },
    { name: 'build', label: '默认助手' }
  ])
  
  const panelRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  const lastJsonRef = useRef<string>('')

  useEffect(() => {
    const unsubscribe = paneLayoutStore.subscribe(() => {
      const snapshot = paneLayoutStore.getSnapshot()
      setCurrentSessionId(snapshot.focusedSessionId)
    })
    
    const snapshot = paneLayoutStore.getSnapshot()
    setCurrentSessionId(snapshot.focusedSessionId)

    return () => { unsubscribe() }
  }, [])

  useEffect(() => {
    try {
      JSON.parse(jsonContent)
      setJsonValid(true)
    } catch {
      setJsonValid(false)
    }
  }, [jsonContent])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message })
  }, [])

  const syncJSONFromMessages = useCallback(() => {
    if (!currentSessionId) return false

    const messages = messageStore.getVisibleMessages(currentSessionId)
    if (messages.length === 0) return false

    const assistantMessages = messages.filter(m => m.info.role === 'assistant')
    for (let i = assistantMessages.length - 1; i >= 0; i--) {
      const msg = assistantMessages[i]
      const text = msg.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('\n')
      
      const jsonMatch = text.match(/```(?:json|silent-json)\s*([\s\S]*?)```/)
      if (jsonMatch) {
        try {
          const json = JSON.parse(jsonMatch[1])
          const newContent = JSON.stringify(json, null, 2)
          
          if (newContent !== lastJsonRef.current) {
            lastJsonRef.current = newContent
            setJsonContent(newContent)
            // 静默同步，不显示通知
            return true
          }
        } catch {
          // 解析失败
        }
        break
      }
    }
    return false
  }, [currentSessionId, setJsonContent, showNotification])

  useEffect(() => {
    if (!currentSessionId) return

    const handleStoreChange = () => {
      setTimeout(() => {
        syncJSONFromMessages()
      }, 100)
    }

    handleStoreChange()

    const unsubscribe = messageStore.subscribe(handleStoreChange)
    return () => {
      unsubscribe()
    }
  }, [currentSessionId, syncJSONFromMessages])

  useEffect(() => {
    if (!currentSessionId) return
    
    const loadAgents = async () => {
      try {
        const agents = await getSelectableAgents(formatPathForApi(undefined))
        const agentList = agents.map((a: any) => ({
          name: a.name,
          label: a.name === REQUIREMENT_AGENT ? '需求梳理助手' : a.name
        }))
        if (agentList.length > 0) {
          setAvailableAgents(agentList)
        }
      } catch {
        // 忽略错误
      }
    }
    
    loadAgents()
  }, [currentSessionId])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = panelWidth
    e.preventDefault()
  }, [panelWidth])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const diff = startXRef.current - e.clientX
      const newWidth = Math.min(Math.max(300, startWidthRef.current + diff), 800)
      setPanelWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!value) return
    setJsonContent(value)
  }, [setJsonContent])

  const handleSave = useCallback(() => {
    try {
      JSON.parse(jsonContent)
      save()
      showNotification('success', '已保存到本地存储')
    } catch {
      showNotification('error', 'JSON 格式错误，无法保存')
    }
  }, [jsonContent, save, showNotification])

  const handleSaveToFile = useCallback(async () => {
    if (!currentSessionId) {
      showNotification('info', '请先选择一个会话')
      return
    }
    try {
      JSON.parse(jsonContent)
      const success = await saveToFile(currentSessionId)
      if (success) {
        showNotification('success', '已发送保存指令到 AI')
      } else {
        showNotification('error', '保存失败')
      }
    } catch {
      showNotification('error', 'JSON 格式错误，无法保存')
    }
  }, [jsonContent, saveToFile, currentSessionId, showNotification])

  const handleStartAnalysis = useCallback(async () => {
    if (!currentSessionId) {
      showNotification('info', '请先选择一个会话')
      return
    }
    const sdk = getSDKClient()
    await sdk.session.prompt({
      sessionID: currentSessionId,
      agent: REQUIREMENT_AGENT,
      parts: [{
        type: 'text',
        text: '请开始帮我梳理需求，先询问我要做什么页面？'
      }],
    })
    showNotification('info', '已开始需求梳理，请回复 AI 的问题')
  }, [currentSessionId, showNotification])

  const handleSyncJSON = useCallback(() => {
    const success = syncJSONFromMessages()
    if (!success) {
      showNotification('info', '未找到可同步的 JSON')
    }
  }, [syncJSONFromMessages, showNotification])

  const handleGeneratePRD = useCallback(async () => {
    if (!currentSessionId) {
      showNotification('info', '请先选择一个会话')
      return
    }
    await sendToAI(currentSessionId, 'generate_prd')
    showNotification('info', '已发送 PRD 生成请求到 AI')
  }, [currentSessionId, sendToAI, showNotification])

  const handleGeneratePrototype = useCallback(async () => {
    if (!currentSessionId) {
      showNotification('info', '请先选择一个会话')
      return
    }
    await sendToAI(currentSessionId, 'generate_prototype')
    showNotification('info', '已发送原型生成请求到 AI')
  }, [currentSessionId, sendToAI, showNotification])

  const handleExport = useCallback(() => {
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${requirement.page_info.page_id}.json`
    a.click()
    URL.revokeObjectURL(url)
    showNotification('success', '已导出 JSON 文件')
  }, [jsonContent, requirement.page_info.page_id, showNotification])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showNotification('success', '已复制到剪贴板')
  }, [jsonContent, showNotification])

  const handleReset = useCallback(() => {
    if (confirm('确定要重置为默认模板吗？当前修改将丢失。')) {
      newFile()
      showNotification('success', '已重置为默认模板')
    }
  }, [newFile, showNotification])

  const handleAgentSelect = useCallback((agentName: string) => {
    setSelectedAgent(agentName)
    setShowAgentDropdown(false)
  }, [])

  if (!isOpen) {
    return (
      <button
        onClick={open}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-accent-main-100 text-white rounded-l-lg shadow-lg hover:bg-accent-main-200 transition-all ${className}`}
        title="打开需求编辑器"
      >
        <FileJson className="w-5 h-5" />
      </button>
    )
  }

  return (
    <>
      <div
        ref={panelRef}
        className={`h-full shrink-0 bg-bg-100 border-l border-border-200 flex flex-col z-30 transition-all duration-200 ${isResizing ? 'opacity-90' : ''} ${className}`}
        style={{ width: panelWidth }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-200 bg-bg-200">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-accent-main-100" />
            <h2 className="font-semibold text-text-100">需求编辑器</h2>
            {isDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-500" title="有未保存的修改" />
            )}
            {!jsonValid && (
              <span className="text-red-500" title="JSON 格式错误">
                <AlertCircle className="w-4 h-4" />
              </span>
            )}
            {isGenerating && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center bg-bg-300 rounded p-0.5 mr-2">
              <button
                onClick={() => setEditMode('visual')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                  editMode === 'visual' ? 'bg-accent-main-100 text-white' : 'text-text-300 hover:text-text-100'}`}
                title="可视化编辑"
              >
                <Layout className="w-3.5 h-3.5" />
                表单
              </button>
              <button
                onClick={() => setEditMode('json')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                  editMode === 'json' ? 'bg-accent-main-100 text-white' : 'text-text-300 hover:text-text-100'}`}
                title="JSON 编辑"
              >
                <Code className="w-3.5 h-3.5" />
                JSON
              </button>
            </div>
            <button
              onClick={toggle}
              className="p-1.5 hover:bg-bg-300 rounded transition-colors"
              title="折叠面板"
            >
              <PanelRightClose className="w-5 h-5 text-text-300" />
            </button>
          </div>
        </div>

        <div className="px-4 py-2 border-b border-border-200 bg-bg-200/50">
          <div className="relative">
            <button
              onClick={() => setShowAgentDropdown(!showAgentDropdown)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-bg-300 hover:bg-bg-400 rounded text-xs text-text-100 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                {availableAgents.find(a => a.name === selectedAgent)?.label || selectedAgent}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAgentDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showAgentDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-bg-200 border border-border-200 rounded shadow-lg z-10">
                {availableAgents.map(agent => (
                  <button
                    key={agent.name}
                    onClick={() => handleAgentSelect(agent.name)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-bg-300 transition-colors ${
                      selectedAgent === agent.name ? 'bg-accent-main-100/10 text-accent-main-100' : 'text-text-100'}`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    {agent.label}
                    {agent.name === REQUIREMENT_AGENT && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-purple-600/20 text-purple-400 rounded">推荐</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {editMode === 'visual' ? (
            <VisualEditor
              requirement={requirement}
              onUpdate={(updates) => {
                const newReq = { ...requirement, ...updates }
                setJsonContent(JSON.stringify(newReq, null, 2)) }}
              onAddElement={(element) => {
                const newReq = { ...requirement, elements: [...requirement.elements, element] }
                setJsonContent(JSON.stringify(newReq, null, 2)) }}
              onUpdateElement={(elementId, updates) => {
                const newReq = {
                  ...requirement,
                  elements: requirement.elements.map(el =>
                    el.element_id === elementId ? { ...el, ...updates } : el
                  )
                }
                setJsonContent(JSON.stringify(newReq, null, 2)) }}
              onRemoveElement={(elementId) => {
                const newReq = {
                  ...requirement,
                  elements: requirement.elements.filter(el => el.element_id !== elementId)
                }
                setJsonContent(JSON.stringify(newReq, null, 2)) }}
            />
          ) : (
            <Editor
              height="100%"
              defaultLanguage="json"
              value={jsonContent}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
                folding: true,
                formatOnPaste: true,
                formatOnType: true, }}
            />
          )}
        </div>

        <div className="p-3 border-t border-border-200 bg-bg-200 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleStartAnalysis}
              disabled={isGenerating || !currentSessionId}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
              title="开始需求梳理"
            >
              <Sparkles className="w-3.5 h-3.5" />
              开始梳理
            </button>
            <button
              onClick={handleSyncJSON}
              disabled={!currentSessionId}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
              title="从聊天同步 JSON"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              同步 JSON
            </button>
            <button
              onClick={handleGeneratePRD}
              disabled={isGenerating || !currentSessionId || !jsonValid}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
              title="生成 PRD 文档"
            >
              <FileText className="w-3.5 h-3.5" />
              生成 PRD
            </button>
            <button
              onClick={handleGeneratePrototype}
              disabled={isGenerating || !currentSessionId || !jsonValid}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
              title="生成高保真原型"
            >
              <Eye className="w-3.5 h-3.5" />
              生成原型
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSave}
              disabled={!jsonValid}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-main-100 hover:bg-accent-main-200 disabled:bg-accent-main-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
              title="保存到本地存储"
            >
              <Save className="w-3.5 h-3.5" />
              保存本地
            </button>
            <button
              onClick={handleSaveToFile}
              disabled={!currentSessionId || !jsonValid}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
              title="通过 AI 保存到文件"
            >
              <FilePlus className="w-3.5 h-3.5" />
              保存文件
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-300 hover:bg-bg-400 text-text-100 text-xs font-medium rounded transition-colors border border-border-200"
              title="复制 JSON"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '已复制' : '复制'}
            </button>
            <button
              onClick={handleExport}
              disabled={!jsonValid}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-300 hover:bg-bg-400 text-text-100 text-xs font-medium rounded transition-colors border border-border-200"
              title="导出 JSON 文件"
            >
              <Download className="w-3.5 h-3.5" />
              导出
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-300 hover:bg-bg-400 text-text-200 text-xs font-medium rounded transition-colors border border-border-200"
              title="重置为默认模板"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重置
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-border-200 bg-bg-200/50">
          <div className="flex items-center justify-between text-xs">
            <div className="text-text-300">
              <span className="text-text-100 font-medium">{requirement.page_info.page_name}</span>
              <span className="mx-1 text-border-200">|</span>
              <span className="text-text-200">{requirement.elements.length} 元素</span>
            </div>
            {!currentSessionId && (
              <span className="text-amber-500">需选择会话</span>
            )}
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right ${
            notification.type === 'success' ? 'bg-green-600 text-white' :
            notification.type === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'}`}
        >
          {notification.type === 'success' && <Check className="w-4 h-4" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
          {notification.type === 'info' && <Sparkles className="w-4 h-4" />}
          {notification.message}
        </div>
      )}
    </>
  )
})