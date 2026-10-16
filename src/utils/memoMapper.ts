import { Memo, MemoFormData } from '@/types/memo'

// memos 테이블 row (snake_case)
export interface MemoRow {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  created_at: string
  updated_at: string
  summary: string | null
  summarized_at: string | null
}

export const rowToMemo = (row: MemoRow): Memo => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  tags: row.tags ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  summary: row.summary ?? undefined,
  summarizedAt: row.summarized_at ?? undefined,
})

export const formDataToRow = (formData: MemoFormData) => ({
  title: formData.title,
  content: formData.content,
  category: formData.category,
  tags: formData.tags,
})
