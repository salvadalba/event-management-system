import { test, expect } from '@playwright/test'

test('public browse page builds', async ({ page }) => {
  await page.goto('/browse')
  const title = await page.title()
  expect(title).toContain('Browse')
})
