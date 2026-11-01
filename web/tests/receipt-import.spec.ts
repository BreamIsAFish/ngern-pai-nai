import { expect, test } from '@playwright/test'

test('imports gallery receipts immediately and opens one for editing', async ({ page }) => {
  await page.goto('/')
  await page.addStyleTag({ content: '.vc-switch, #__vconsole { display: none !important; }' })

  await page.getByRole('button', { name: 'Scan receipt' }).click()
  await expect(page.getByRole('dialog', { name: 'สแกนใบเสร็จ' })).toBeVisible()
  await page.getByRole('button', { name: /เลือกจากคลังรูปภาพ/ }).click()

  const results = page.getByRole('dialog', { name: 'ผลการสแกนใบเสร็จ' })
  await expect(results.getByText('เพิ่มแล้ว', { exact: true })).toHaveCount(2)
  await expect(results.getByText(/เพิ่มแล้ว 2/)).toBeVisible()

  await results.getByRole('button', { name: 'แก้ไข' }).first().click()
  const form = page.locator('.transaction-screen')
  await expect(form.getByLabel('Amount')).toHaveValue('245')
  await expect(form.getByPlaceholder('ชื่อร้าน')).toHaveValue('ร้านตัวอย่าง')
  await expect(form.getByPlaceholder('เลขที่รายการ')).toHaveValue('TX-receipt-1')
  await form.getByRole('button', { name: 'Save' }).click()
  await expect(results).toBeVisible()
})

test('shows imported uncategorized expenses in the summary', async ({ page }) => {
  await page.goto('/')
  await page.addStyleTag({ content: '.vc-switch, #__vconsole { display: none !important; }' })
  await page.getByRole('button', { name: 'Scan receipt' }).click()
  await page.getByRole('button', { name: /เลือกจากคลังรูปภาพ/ }).click()

  const results = page.getByRole('dialog', { name: 'ผลการสแกนใบเสร็จ' })
  await expect(results.getByText(/เพิ่มแล้ว 2/)).toBeVisible()
  await results.getByRole('button', { name: 'เสร็จสิ้น' }).click()
  await page.getByRole('button', { name: 'Summary' }).click()

  const uncategorized = page.locator('.breakdown-list').getByText('ไม่มีหมวดหมู่', { exact: true })
  await expect(uncategorized).toBeVisible()
  await expect(uncategorized.locator('.breakdown-color')).toBeVisible()
})

test('saves and displays multiple tags on an entry', async ({ page }) => {
  await page.goto('/?visual=profile')
  await page.getByRole('button', { name: /Manage tags/ }).click()
  await page.getByRole('button', { name: 'Add tag' }).click()
  await page.locator('.tag-editor').getByRole('textbox').fill('Trip')
  await page.locator('.tag-editor').getByRole('button', { name: 'Save tag' }).click()
  await page.getByRole('button', { name: 'Add tag' }).click()
  await page.locator('.tag-editor').getByRole('textbox').fill('Weekend')
  await page.locator('.tag-editor').getByRole('button', { name: 'Save tag' }).click()
  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByRole('button', { name: /Add entry/ }).click()

  const form = page.locator('.transaction-screen')
  await form.getByLabel('Amount').fill('25')
  await form.getByRole('button', { name: 'Choose category' }).click()
  const picker = page.getByRole('dialog', { name: 'Choose category / tag' })
  await picker.getByRole('button', { name: 'Food', exact: true }).click()
  await form.getByRole('button', { name: 'Choose tags' }).click()
  await picker.getByRole('button', { name: 'Trip', exact: true }).click()
  await picker.getByRole('button', { name: 'Weekend', exact: true }).click()
  await expect(picker.getByRole('button', { name: 'Trip', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(picker.getByRole('button', { name: 'Weekend', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await picker.getByRole('button', { name: 'Close' }).click()
  await form.getByRole('button', { name: 'Save' }).click()
  await page.getByRole('button', { name: 'Home', exact: true }).click()

  await expect(page.locator('.ledger-row').filter({ hasText: '#Trip #Weekend' }).first()).toBeVisible()
})
