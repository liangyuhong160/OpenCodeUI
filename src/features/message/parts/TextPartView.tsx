import { memo } from 'react'
import { MarkdownRenderer } from '../../../components'
import type { TextPart } from '../../../types/message'

interface TextPartViewProps {
  part: TextPart
  isStreaming?: boolean
}

export const TextPartView = memo(function TextPartView({ part, isStreaming = false }: TextPartViewProps) {
  const rawText = part.text || ''
  const displayText = rawText.replace(new RegExp('```silent-json\\s*[\\s\\S]*?```', 'g'), '').trim()

  if (!displayText.trim() && !isStreaming) return null
  if (part.synthetic) return null

  return (
    <div>
      <MarkdownRenderer content={displayText} isStreaming={isStreaming} />
    </div>
  )
})
