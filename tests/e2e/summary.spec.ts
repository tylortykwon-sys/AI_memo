import { test, expect, Page } from '@playwright/test'

const openFirstMemo = async (page: Page) => {
  await page.goto('/')
  await page.getByRole('heading', { level: 3 }).first().click()
  await expect(page.getByTestId('memo-viewer')).toBeVisible()
}

test.describe('AI 요약', () => {
  test('요약하기 → 표시 → 새로고침 후 유지 → 다시 요약', async ({ page }) => {
    let call = 0
    await page.route('**/api/summarize', route => {
      call += 1
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ summary: `테스트 요약 ${call}` }),
      })
    })

    await openFirstMemo(page)
    await page.getByTestId('memo-viewer-summarize-btn').click()
    await expect(page.getByTestId('memo-viewer-summary-text')).toHaveText(
      '테스트 요약 1'
    )

    await page.reload()
    await openFirstMemo(page)
    await expect(page.getByTestId('memo-viewer-summary-text')).toHaveText(
      '테스트 요약 1'
    )

    await page.getByTestId('memo-viewer-summarize-btn').click()
    await expect(page.getByTestId('memo-viewer-summary-text')).toHaveText(
      '테스트 요약 2'
    )
  })

  test('실패하면 오류 메시지를 보여주고 기존 요약은 유지한다', async ({
    page,
  }) => {
    let fail = false
    await page.route('**/api/summarize', route =>
      fail
        ? route.fulfill({
            status: 502,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'AI 요약에 실패했습니다.' }),
          })
        : route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ summary: '기존 요약' }),
          })
    )

    await openFirstMemo(page)
    await page.getByTestId('memo-viewer-summarize-btn').click()
    await expect(page.getByTestId('memo-viewer-summary-text')).toHaveText(
      '기존 요약'
    )

    fail = true
    await page.getByTestId('memo-viewer-summarize-btn').click()
    await expect(page.getByTestId('memo-viewer-summary-error')).toHaveText(
      'AI 요약에 실패했습니다.'
    )
    await expect(page.getByTestId('memo-viewer-summary-text')).toHaveText(
      '기존 요약'
    )
  })
})
