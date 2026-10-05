import { test, expect } from '@playwright/test'

test('production WebP conversion works on WebKit, including native capability fallback', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/tests/browser/submission-webp.html')
  await page.getByRole('button', { name: '运行自动检查', exact: true }).click()
  const results = page.getByRole('status')
  await expect(results).toContainText(/ALL CHECKS PASSED|FAIL /, { timeout: 60000 })
  const text = await results.innerText()
  await testInfo.attach('conversion-results', { body: text, contentType: 'text/plain' })
  await page.screenshot({ path: testInfo.outputPath('conversion-results.png'), fullPage: true })
  expect(text).not.toContain('FAIL ')
  expect(text).toContain('PASS native / jpeg-sample')
  expect(text).toContain('PASS native / png-sample')
  expect(text).toContain('PASS native / webp-sample')
  expect(text).toContain('PASS native / jpeg-rotated-6')
  expect(text).toContain('PASS worker / jpeg-sample')
  expect(text).toContain('PASS dom / png-sample')
  expect(text).toContain('PASS corrupt image / IMAGE_DECODE_FAILED')
  expect(text).toContain('PASS cancel / AbortError')
  expect(errors).toEqual([])
})
