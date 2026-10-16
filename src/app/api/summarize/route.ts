import { NextResponse } from 'next/server'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const REQUEST_TIMEOUT_MS = 15000
const MAX_CONTENT_LENGTH = 20000

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
}

const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status })

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return errorResponse('AI 요약 기능이 설정되지 않았습니다.', 500)
  }

  let title = ''
  let content = ''
  try {
    const body: unknown = await request.json()
    if (typeof body === 'object' && body !== null) {
      const { title: t, content: c } = body as Record<string, unknown>
      title = typeof t === 'string' ? t : ''
      content = typeof c === 'string' ? c : ''
    }
  } catch {
    return errorResponse('잘못된 요청입니다.', 400)
  }

  if (!content.trim()) {
    return errorResponse('요약할 내용이 없습니다.', 400)
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return errorResponse('메모가 너무 길어 요약할 수 없습니다.', 413)
  }

  const prompt = `다음 메모를 한국어로 1~3문장으로 간결하게 요약하세요. 메모에 적힌 사실(날짜, 시간, 이름, 항목 등)만 그대로 사용하고, 없는 내용을 추가하거나 바꾸지 마세요. 요약문만 출력하고 머리말이나 마크다운 서식은 쓰지 마세요.\n\n제목: ${title}\n\n본문:\n${content}`

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (response.status === 429) {
      return errorResponse(
        '요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
        429
      )
    }
    if (!response.ok) {
      console.error('Gemini API error:', response.status)
      return errorResponse('AI 요약에 실패했습니다. 다시 시도해 주세요.', 502)
    }

    const data = (await response.json()) as GeminiResponse
    const summary = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text ?? '')
      .join('')
      .trim()

    if (!summary) {
      return errorResponse(
        '요약 결과를 받지 못했습니다. 다시 시도해 주세요.',
        502
      )
    }

    return NextResponse.json({ summary })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return errorResponse(
        '요약 시간이 초과되었습니다. 다시 시도해 주세요.',
        504
      )
    }
    console.error('Summarize request failed:', error)
    return errorResponse('AI 요약에 실패했습니다. 다시 시도해 주세요.', 502)
  }
}
