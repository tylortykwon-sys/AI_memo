import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 서버 액션 전용 클라이언트 (키는 서버에서만 사용되며 브라우저로 노출되지 않는다)
export const createSupabaseServerClient = (): SupabaseClient => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY 환경변수가 설정되지 않았습니다.'
    )
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
