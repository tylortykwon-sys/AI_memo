'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import rehypeSanitize from 'rehype-sanitize'
import { Memo, MEMO_CATEGORIES, MEMO_CATEGORY_COLORS } from '@/types/memo'
import { useSummarize } from '@/hooks/useSummarize'

const MarkdownPreview = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default.Markdown),
  { ssr: false }
)

interface MemoViewerProps {
  memo: Memo | null
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
  onSummaryChange: (id: string, summary: string) => void
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function MemoViewer({
  memo,
  onClose,
  onEdit,
  onDelete,
  onSummaryChange,
}: MemoViewerProps) {
  const { summarize, isSummarizing, error, clearError } = useSummarize()
  const memoId = memo?.id

  // 다른 메모로 바뀌거나 닫히면 이전 오류 메시지 제거
  useEffect(() => {
    clearError()
  }, [memoId, clearError])

  // ESC 키로 닫기
  useEffect(() => {
    if (!memo) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [memo, onClose])

  if (!memo) return null

  const handleDelete = () => {
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      onDelete(memo.id)
      onClose()
    }
  }

  const handleSummarize = async () => {
    const summary = await summarize(memo.title, memo.content)
    if (summary) onSummaryChange(memo.id, summary)
  }

  const categoryColor =
    MEMO_CATEGORY_COLORS[memo.category as keyof typeof MEMO_CATEGORY_COLORS] ||
    MEMO_CATEGORY_COLORS.other

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50"
      onClick={onClose}
      data-testid="memo-viewer-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="memo-viewer-title"
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        data-testid="memo-viewer"
      >
        <div className="p-4 sm:p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h2
                id="memo-viewer-title"
                className="text-xl font-semibold text-gray-900 mb-2 break-words"
              >
                {memo.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColor}`}
                >
                  {MEMO_CATEGORIES[
                    memo.category as keyof typeof MEMO_CATEGORIES
                  ] || memo.category}
                </span>
                <span className="text-xs text-gray-500">
                  수정: {formatDate(memo.updatedAt)}
                </span>
                <span className="text-xs text-gray-500">
                  작성: {formatDate(memo.createdAt)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="memo-viewer-close-btn"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* AI 요약 */}
          <section
            className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg"
            aria-label="AI 요약"
            data-testid="memo-viewer-summary"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-semibold text-blue-900">
                ✨ AI 요약
              </h3>
              <button
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="px-3 py-1 text-xs font-medium text-blue-700 border border-blue-300 bg-white hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed rounded-md transition-colors"
                data-testid="memo-viewer-summarize-btn"
              >
                {isSummarizing
                  ? '요약 중...'
                  : memo.summary
                    ? '다시 요약'
                    : '요약하기'}
              </button>
            </div>
            {memo.summary ? (
              <p
                className="text-sm text-gray-800 whitespace-pre-wrap break-words"
                data-testid="memo-viewer-summary-text"
              >
                {memo.summary}
              </p>
            ) : (
              !isSummarizing &&
              !error && (
                <p className="text-sm text-gray-500">
                  아직 요약이 없습니다. 버튼을 눌러 AI 요약을 만들어 보세요.
                </p>
              )
            )}
            {error && (
              <p
                role="alert"
                className="mt-2 text-sm text-red-600"
                data-testid="memo-viewer-summary-error"
              >
                {error}
              </p>
            )}
          </section>

          {/* 내용 */}
          <div
            data-color-mode="light"
            className="mb-6 break-words"
            data-testid="memo-viewer-content"
          >
            <MarkdownPreview
              source={memo.content}
              rehypePlugins={[[rehypeSanitize]]}
              className="!bg-transparent !text-sm"
            />
          </div>

          {/* 태그 */}
          {memo.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {memo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              data-testid="memo-viewer-delete-btn"
            >
              삭제
            </button>
            <button
              onClick={() => onEdit(memo)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              data-testid="memo-viewer-edit-btn"
            >
              편집
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
