// ============================================
// Requirement SDK - 与 OpenCode 后端集成
// ============================================

import { getSDKClient, unwrap } from './sdk'
import { formatPathForApi } from '../utils/directoryUtils'
import type { FileContent } from './types'

// ============================================
// Types
// ============================================

export interface RequirementFile {
  path: string
  content: string
  pageId: string
  pageName: string
}

export interface GenerationResult {
  success: boolean
  outputPath?: string
  error?: string
}

// ============================================
// File Operations
// ============================================

/**
 * 读取需求 JSON 文件
 */
export async function readRequirementFile(filePath: string, directory?: string): Promise<string | null> {
  try {
    const sdk = getSDKClient()
    const result = await sdk.file.read({
      path: filePath,
      directory: formatPathForApi(directory),
    })
    const fileContent = unwrap(result) as FileContent
    if (fileContent.type === 'text' && fileContent.content) {
      return fileContent.content
    }
    return null
  } catch {
    return null
  }
}

/**
 * 列出需求目录下的所有 JSON 文件
 */
export async function listRequirementFiles(
  dirPath: string,
  directory?: string,
): Promise<RequirementFile[]> {
  try {
    const sdk = getSDKClient()
    const result = await sdk.file.list({
      path: dirPath,
      directory: formatPathForApi(directory),
    })
    const files = unwrap(result) as Array<{ path: string; type: string }>
    
    return files
      .filter(f => f.path.endsWith('.json'))
      .map(f => {
        const pageId = f.path.replace(/\\/g, '/').split('/').pop()?.replace('.json', '') || ''
        return {
          path: f.path,
          content: '',
          pageId,
          pageName: pageId.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
        }
      })
  } catch {
    return []
  }
}

// ============================================
// Session Integration
// ============================================

/**
 * 向 Session 发送消息，包含需求内容
 */
export async function sendRequirementToSession(
  sessionId: string,
  requirementJson: string,
  action: 'analyze' | 'generate_prd' | 'generate_prototype' | 'modify' = 'analyze',
  directory?: string,
): Promise<void> {
  const sdk = getSDKClient()

  let promptText = ''
  switch (action) {
    case 'analyze':
      promptText = `请分析以下需求 JSON，并给出补充建议：\n\n\`\`\`json\n${requirementJson}\n\`\`\``
      break
    case 'generate_prd':
      promptText = `请根据以下需求 JSON 生成 PRD 文档：\n\n\`\`\`json\n${requirementJson}\n\`\`\`\n\n请输出完整的 PRD 文档内容。`
      break
    case 'generate_prototype':
      promptText = `请根据以下需求 JSON 生成高保真原型 HTML：\n\n\`\`\`json\n${requirementJson}\n\`\`\`\n\n请生成完整的、可运行的 HTML 文件，使用 TailwindCSS 和 Alpine.js。`
      break
    case 'modify':
      promptText = `请根据以下需求变更更新 JSON：\n\n\`\`\`json\n${requirementJson}\n\`\`\``
      break
  }

  await sdk.session.prompt({
    sessionID: sessionId,
    directory: formatPathForApi(directory),
    parts: [
      { type: 'text', text: promptText },
    ],
  })
}

/**
 * 发送命令到 Session
 */
export async function sendCommandToSession(
  sessionId: string,
  command: string,
  directory?: string,
): Promise<void> {
  const sdk = getSDKClient()
  await sdk.session.prompt({
    sessionID: sessionId,
    directory: formatPathForApi(directory),
    parts: [
      { type: 'text', text: `/${command}` },
    ],
  })
}

// ============================================
// Skill Integration
// ============================================

/**
 * 检查 Skill 是否可用
 */
export async function checkSkillAvailable(skillName: string, directory?: string): Promise<boolean> {
  try {
    const sdk = getSDKClient()
    const result = await sdk.app.skills({ directory: formatPathForApi(directory) })
    const skills = unwrap(result) as Array<{ name: string }>
    return skills.some(s => s.name === skillName)
  } catch {
    return false
  }
}

/**
 * 触发 Skill 生成
 */
export async function triggerSkill(
  sessionId: string,
  skillName: string,
  params: Record<string, string> = {},
  directory?: string,
): Promise<void> {
  const sdk = getSDKClient()

  const paramsText = Object.entries(params)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')

  await sdk.session.prompt({
    sessionID: sessionId,
    directory: formatPathForApi(directory),
    parts: [
      { type: 'text', text: `/skill ${skillName}\n\n${paramsText}` },
    ],
  })
}

// ============================================
// Quick Actions
// ============================================

/**
 * 快速分析需求
 */
export async function quickAnalyze(sessionId: string, requirementJson: string, directory?: string) {
  return sendRequirementToSession(sessionId, requirementJson, 'analyze', directory)
}

/**
 * 快速生成 PRD
 */
export async function quickGeneratePRD(sessionId: string, requirementJson: string, directory?: string) {
  return sendRequirementToSession(sessionId, requirementJson, 'generate_prd', directory)
}

/**
 * 快速生成原型
 */
export async function quickGeneratePrototype(sessionId: string, requirementJson: string, directory?: string) {
  return sendRequirementToSession(sessionId, requirementJson, 'generate_prototype', directory)
}
