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
      promptText = `请根据以下需求 JSON 生成高保真原型 HTML：

\`\`\`json
${requirementJson}
\`\`\`

【重要：必须严格按照 JSON 结构生成，不得遗漏任何元素！】

## 元素渲染规则

1. **严格遵循 parent_id 层级**：parent_id 为 "root" 的是顶级元素，其他元素根据 parent_id 嵌套在父元素内
2. **必须渲染所有元素**：遍历 elements 数组，每个元素都必须出现在 HTML 中
3. **元素类型映射**：
   - MenuList → 左侧分类导航（垂直列表，支持点击切换 active）
   - GridList → 右侧商品网格（grid 布局）
   - Card → 商品卡片容器
   - Image → 图片（使用 https://picsum.photos/seed/{随机数}/300/200）
   - Text → 文本（根据 element_name 显示内容）
   - PriceText → 价格（element_name 含"会员"用橙色#ff6600，否则用红色#ff4d4f）
   - Button → 按钮（根据 display_props 设置样式）
   - NavBar/SearchBar/Carousel/TabBar → 对应组件

4. **display_props 必须应用**：
   - backgroundColor → background-color
   - width/height → width/height
   - borderRadius → border-radius
   - fontSize/fontWeight/color → 对应 CSS
   - marginTop/marginBottom → margin-top/margin-bottom
   - padding → padding
   - shadow → box-shadow: 0 2px 8px rgba(0,0,0,0.08)
   - numberOfLines → -webkit-line-clamp

5. **布局处理**：
   - HorizontalSplitLayout/HorizontalLayout → 左右分栏（左侧 MenuList，右侧 GridList）
   - 左侧宽度根据 display_props.width 或 layout_schema 中的 width_ratio

6. **价格特殊处理**：
   - element_name 含"会员" → 会员价样式（橙色，14px）
   - 否则 → 原价样式（红色，18px，粗体）
   - 格式：¥XX.XX

## 高保真规范

- 技术栈：TailwindCSS CDN + 内联 CSS，单 HTML 文件
- 色彩：主色 #FF6B35，背景 #F5F7FA/#FFF，文字 #333/#666/#999
- 间距：页面 16px，卡片 12px，元素 8/12/16px
- 圆角：卡片 12px，按钮 20px，图片 8px
- 阴影：卡片 0 2px 8px rgba(0,0,0,0.06)
- 字体：标题 14-16px/600，正文 14px，价格 18px/700
- 手机框架：max-width 375px

请生成严格遵循 JSON 结构的高保真原型。`
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
