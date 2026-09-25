import { expect, test } from '@playwright/test'

test('imports gallery receipts immediately and opens one for editing', async ({ page }) => {
  await page.goto('/')
  await page.addStyleTag({ content: '.vc-switch, #__vconsole { display: none !important; }' })

  await page.getByRole('button', { name: 'สแกนใบเสร็จ' }).click()
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
  await page.getByRole('button', { name: 'สแกนใบเสร็จ' }).click()
  await page.getByRole('button', { name: /เลือกจากคลังรูปภาพ/ }).click()

  const results = page.getByRole('dialog', { name: 'ผลการสแกนใบเสร็จ' })
  await expect(results.getByText(/เพิ่มแล้ว 2/)).toBeVisible()
  await results.getByRole('button', { name: 'เสร็จสิ้น' }).click()
  await page.getByRole('button', { name: 'Summary' }).click()

  const uncategorized = page.locator('.breakdown-list').getByText('ไม่มีหมวดหมู่', { exact: true })
  await expect(uncategorized).toBeVisible()
  await expect(uncategorized.locator('.breakdown-color')).toBeVisible()
})
