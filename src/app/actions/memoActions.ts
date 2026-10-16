'use server'

import { v4 as uuidv4 } from 'uuid'
import { Memo, MemoFormData } from '@/types/memo'
import { createSupabaseServerClient } from '@/utils/supabaseServer'
import { MemoRow, formDataToRow, rowToMemo } from '@/utils/memoMapper'

const TABLE = 'memos'

export async function getMemos(): Promise<Memo[]> {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`메모 조회 실패: ${error.message}`)
  return (data as MemoRow[]).map(rowToMemo)
}

export async function createMemo(formData: MemoFormData): Promise<Memo> {
  const supabase = createSupabaseServerClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      id: uuidv4(),
      ...formDataToRow(formData),
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw new Error(`메모 생성 실패: ${error.message}`)
  return rowToMemo(data as MemoRow)
}

export async function updateMemo(
  id: string,
  formData: MemoFormData
): Promise<Memo> {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      ...formDataToRow(formData),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`메모 수정 실패: ${error.message}`)
  return rowToMemo(data as MemoRow)
}

// 요약 저장 (본문 수정 시각 updated_at 은 변경하지 않음)
export async function setMemoSummary(
  id: string,
  summary: string
): Promise<Memo> {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from(TABLE)
    .update({ summary, summarized_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`요약 저장 실패: ${error.message}`)
  return rowToMemo(data as MemoRow)
}

export async function deleteMemo(id: string): Promise<void> {
  const supabase = createSupabaseServerClient()
  const { error } = await supabase.from(TABLE).delete().eq('id', id)

  if (error) throw new Error(`메모 삭제 실패: ${error.message}`)
}

export async function clearMemos(): Promise<void> {
  const supabase = createSupabaseServerClient()
  // 필터 없는 delete 는 허용되지 않으므로 모든 uuid 를 대상으로 하는 조건을 사용
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) throw new Error(`메모 전체 삭제 실패: ${error.message}`)
}
