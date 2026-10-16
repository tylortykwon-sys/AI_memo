'use client'

import { useState, useCallback } from 'react'

export const useSummarize = () => {
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const summarize = useCallback(
    async (title: string, content: string): Promise<string | null> => {
      if (isSummarizing) return null
      setIsSummarizing(true)
      setError(null)

      try {
        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        })
        const data: { summary?: string; error?: string } = await response
          .json()
          .catch(() => ({}))

        if (!response.ok || !data.summary) {
          setError(data.error || 'AI 요약에 실패했습니다. 다시 시도해 주세요.')
          return null
        }
        return data.summary
      } catch (err) {
        console.error('Summarize failed:', err)
        setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
        return null
      } finally {
        setIsSummarizing(false)
      }
    },
    [isSummarizing]
  )

  const clearError = useCallback(() => setError(null), [])

  return { summarize, isSummarizing, error, clearError }
}
