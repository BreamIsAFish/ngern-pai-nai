import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { visualQaScreens } from '../src/visual-qa/screens'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

for (const screen of visualQaScreens) {
  test(`@capture captures ${screen.label} with deterministic mock data`, async ({ page }) => {
    await page.goto(screen.route)
    await expect(page.locator('[data-visual-ready="true"]')).toBeVisible()
    await expect(page.locator('.mobile-status-bar')).toHaveCount(0)
    const icons = page.locator('[data-category-icon-source]')
    if (await icons.count()) {
      await expect.poll(() => icons.evaluateAll((elements) => elements.every((element) => {
        if (!(element instanceof HTMLImageElement)) return true
        return element.complete && element.naturalWidth > 0
      }))).toBe(true)
    }
    await page.addStyleTag({ content: '.vc-switch, #__vconsole { display: none !important; } * { caret-color: transparent !important; }' })
    if (screen.id === 'home-transactions') {
      await page.evaluate(() => window.scrollTo(0, (document.querySelector('.yellow-header')?.scrollHeight ?? 320) + 20))
      await expect(page.locator('.compact-dashboard-header')).toBeVisible()
    } else if (screen.id === 'summary-categories') {
      await page.locator('.breakdown-tabs').evaluate((element) => {
        window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 56)
      })
      await expect(page.locator('.breakdown-tabs')).toHaveCSS('position', 'sticky')
    } else if (screen.id === 'add-expense-picker-scrolled') {
      await page.locator('.category-picker-scroll').evaluate((element) => {
        element.scrollTop = element.scrollHeight - element.clientHeight - 40
      })
      await expect(page.getByRole('button', { name: 'Manage categories' })).toBeVisible()
    } else if (screen.id === 'receipt-results') {
      await expect(page.getByText('เพิ่มแล้ว', { exact: true })).toBeVisible()
      await expect(page.getByText('ซ้ำ ไม่ได้เพิ่ม', { exact: true })).toBeVisible()
      await expect(page.getByText('ไม่สำเร็จ', { exact: true })).toBeVisible()
    } else {
      await page.evaluate(() => window.scrollTo(0, 0))
    }
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 414)
    await page.screenshot({
      animations: 'disabled',
      path: path.join(projectRoot, 'public', 'visual-qa', 'actual', screen.actualFile),
    })
  })
}

test('visual QA gallery lists every capture and its route', async ({ page }) => {
  await page.goto('/visual-qa')
  await expect(page.getByRole('heading', { name: 'Reference and Playwright captures' })).toBeVisible()
  await expect(page.locator('.visual-qa-card')).toHaveCount(visualQaScreens.length)
  for (const screen of visualQaScreens) {
    await expect(page.getByRole('heading', { exact: true, name: screen.label })).toBeVisible()
    await expect(page.getByText(screen.route, { exact: true })).toBeVisible()
  }
  await page.screenshot({ fullPage: true, path: path.join(projectRoot, 'test-results', 'visual-qa-gallery.png') })
})

test('restores the trashed spreadsheet and returns to the dashboard', async ({ page }) => {
  await page.goto('/?visual=sheet-trash')
  await expect(page.getByRole('heading', { name: 'Your spreadsheet is in the trash' })).toBeVisible()
  await page.getByRole('button', { name: 'Restore spreadsheet' }).click()
  await expect(page.locator('.home-page')).toBeVisible()
})

test('creates a replacement spreadsheet and opens an empty dashboard', async ({ page }) => {
  await page.goto('/?visual=sheet-trash')
  await page.getByRole('button', { name: 'Create new spreadsheet' }).click()
  await expect(page.locator('.home-page')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'No entries yet' })).toBeVisible()
})

test('opens the production root at the dashboard top', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Meow logged 10 entries today')).toBeVisible()
  await expect(page.locator('.home-theme-layer')).toBeVisible()
  await expect(page.locator('.home-content-layer')).toBeVisible()
  await expect(page.getByRole('button', { name: /Food Lunch with May/ })).not.toContainText('−')
  await expect(page.locator('.compact-dashboard-header')).toHaveCount(0)
})

test('pulling down on the Google Sheet page refreshes the account status', async ({ page }) => {
  await page.goto('/?visual=profile')
  await page.getByRole('button', { name: 'Google Sheet' }).click()

  const refreshShell = page.locator('.pull-refresh-shell')
  await refreshShell.dispatchEvent('touchstart', { touches: [{ clientX: 207, clientY: 120, identifier: 1 }] })
  await refreshShell.dispatchEvent('touchmove', { touches: [{ clientX: 207, clientY: 220, identifier: 1 }] })
  await expect(page.getByText('Release to refresh')).toBeVisible()
  await refreshShell.dispatchEvent('touchend', { changedTouches: [{ clientX: 207, clientY: 220, identifier: 1 }], touches: [] })

  await expect(page.getByText('Refreshing your Sheet...')).toBeVisible()
  await expect(page.getByText('Refreshing your Sheet...')).toBeHidden()
  await expect(page.getByText('Connected', { exact: true })).toBeVisible()
})

test('month navigation shows loading, settles on the latest rapid selection, and blocks future months', async ({ page }) => {
  await page.goto('/')
  const nextMonth = page.getByRole('button', { name: 'Next month' }).first()
  const previousMonth = page.getByRole('button', { name: 'Previous month' }).first()
  const initialNextX = await nextMonth.evaluate((element) => element.getBoundingClientRect().x)

  await expect(nextMonth).toBeDisabled()
  await expect(page.locator('.coach-cat')).toHaveCSS('pointer-events', 'none')
  await previousMonth.click()
  await previousMonth.click()
  await previousMonth.click()

  await expect(page.getByRole('status')).toContainText('Loading')
  await expect(page.getByRole('status')).toBeHidden()
  await expect(nextMonth).toBeEnabled()
  expect(await nextMonth.evaluate((element) => element.getBoundingClientRect().x)).toBe(initialNextX)
  expect(await nextMonth.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest('button') === element
  })).toBe(true)
})

test('opens the month picker from Home and loads the selected month', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Select month/ }).first().click()
  const picker = page.getByRole('dialog', { name: 'Select month' })
  await expect(picker).toBeVisible()
  await picker.getByRole('button', { name: 'Aug' }).click()
  await picker.getByRole('button', { name: 'Select', exact: true }).click()
  await expect(picker).toBeHidden()
  await expect(page.getByRole('button', { name: 'Select month, Aug 2026' }).first()).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Loading Aug 2026')
  await expect(page.getByRole('status')).toBeHidden()
})

test('keeps Summary month navigation available while the newest month request loads', async ({ page }) => {
  await page.goto('/?visual=summary')
  const previousMonth = page.getByRole('button', { name: 'Previous month' })
  const nextMonth = page.getByRole('button', { name: 'Next month' })

  await previousMonth.click()
  await expect(page.locator('.summary-page')).toHaveAttribute('aria-busy', 'true')
  await expect(nextMonth).toBeEnabled()
  await previousMonth.click()
  await previousMonth.click()
  await nextMonth.click()
  await nextMonth.click()
  await expect(page.getByRole('button', { name: 'Select month, Aug 2026' })).toBeVisible()
  await expect(nextMonth).toBeEnabled()
  await expect(page.locator('.summary-page')).toHaveAttribute('aria-busy', 'false')
})

test('aligns the Home header card with the transaction card', async ({ page }) => {
  await page.goto('/')
  const headerBounds = await page.locator('.month-total').evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    return { left: bounds.left, right: bounds.right }
  })
  const dataBounds = await page.locator('.ledger-row').first().evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    return { left: bounds.left, right: bounds.right }
  })

  expect(headerBounds).toEqual(dataBounds)
})

test('shows each non-empty transaction type in the daily header', async ({ page }) => {
  await page.goto('/?visual=home-dashboard')
  const summaries = page.getByLabel('Daily totals')
  await expect(summaries).toHaveCount(3)

  await expect(summaries.nth(0)).toContainText('Income+6,383.62')
  await expect(summaries.nth(0)).toContainText('Expenses185')
  await expect(summaries.nth(0)).toContainText('and 1 transfer')

  await expect(summaries.nth(1)).not.toContainText('Income')
  await expect(summaries.nth(1)).toContainText('Expenses891')
  await expect(summaries.nth(1)).toContainText('and 2 transfers')

  await expect(summaries.nth(2)).toContainText('Income+48,000')
  await expect(summaries.nth(2)).not.toContainText('Expenses')
  await expect(summaries.nth(2)).not.toContainText('transfer')
})

test('keeps May and August fully visible without moving the Home month arrows', async ({ page }) => {
  await page.goto('/')
  const previousMonth = page.getByRole('button', { name: 'Previous month' }).first()
  const nextMonth = page.getByRole('button', { name: 'Next month' }).first()
  const monthText = page.locator('.month-nav .month-label-button strong')
  const initialNextX = await nextMonth.evaluate((element) => element.getBoundingClientRect().x)

  await previousMonth.click()
  await expect(monthText).toHaveText('Aug 2026')
  expect(await monthText.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)

  await previousMonth.click()
  await previousMonth.click()
  await previousMonth.click()
  await expect(monthText).toHaveText('May 2026')
  expect(await monthText.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  expect(await nextMonth.evaluate((element) => element.getBoundingClientRect().x)).toBe(initialNextX)
})

test('keeps the Home navigation fixed and reserves space for the entry actions', async ({ page }) => {
  await page.goto('/')
  const navigation = page.locator('.bottom-nav')
  const viewportHeight = await page.evaluate(() => window.innerHeight)
  expect(await navigation.evaluate((element) => Math.round(element.getBoundingClientRect().bottom))).toBe(viewportHeight)

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  expect(await navigation.evaluate((element) => Math.round(element.getBoundingClientRect().bottom))).toBe(viewportHeight)
  const layout = await page.locator('.date-group').last().evaluate((element) => {
    const contentBottom = element.getBoundingClientRect().bottom
    const actions = document.querySelector('.entry-fabs')?.getBoundingClientRect()
    return {
      actionHeight: Math.round(actions?.height ?? 0),
      contentClearance: Math.round((actions?.top ?? window.innerHeight) - contentBottom),
    }
  })
  expect(layout.actionHeight).toBe(109)
  expect(layout.contentClearance).toBeGreaterThanOrEqual(0)
  expect(layout.contentClearance).toBeLessThanOrEqual(20)
})

test('requires a category and accepts only numeric amount input for a new entry', async ({ page }) => {
  await page.goto('/?visual=add-expense')
  const amount = page.getByRole('textbox', { name: 'Amount' })
  const category = page.getByRole('button', { name: 'Choose category' })

  await expect(category).toBeVisible()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Choose a category.')).toBeVisible()
  await expect(page.getByText('Enter an amount greater than zero.')).toBeVisible()

  await amount.pressSequentially('12a.34-')
  await expect(amount).toHaveValue('12.34')
  await category.click()
  const picker = page.getByRole('dialog', { name: 'Choose category / tag' })
  await expect(picker).toBeVisible()
  await picker.getByRole('button', { name: 'Food', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Category, Food' })).toBeVisible()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.locator('.transaction-screen')).toBeHidden()
})

test('shows category images in transaction rows and the selected category field', async ({ page }) => {
  await page.route('https://raw.githubusercontent.com/**', async (route) => {
    await route.fulfill({
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEAQH/6f1xGQAAAABJRU5ErkJggg==', 'base64'),
      contentType: 'image/png',
    })
  })
  await page.goto('/')
  await expect(page.locator('.ledger-row .row-icon [data-category-icon-source="image"]')).toHaveCount(4)

  await page.getByRole('button', { name: 'Add entry' }).click()
  await page.getByRole('button', { name: 'Choose category' }).click()
  await page.getByRole('dialog', { name: 'Choose category / tag' }).getByRole('button', { name: 'Food', exact: true }).click()
  await expect(page.locator('.category-selection-icon [data-category-icon-source="image"]')).toHaveCount(1)
})

test('keeps category picker controls fixed while its four-column grid scrolls', async ({ page }) => {
  await page.goto('/?visual=add-expense-picker')
  const picker = page.getByRole('dialog', { name: 'Choose category / tag' })
  const scroller = picker.locator('.category-picker-scroll')
  const tagsTop = await picker.locator('.category-picker-tag-bar').evaluate((element) => element.getBoundingClientRect().top)

  await expect(picker.locator('.category-picker-grid > button')).toHaveCount(15)
  expect(await picker.locator('.category-picker-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(4)
  expect(await scroller.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true)
  await scroller.evaluate((element) => { element.scrollTop = element.scrollHeight })
  await expect(picker.getByRole('button', { name: 'Manage categories' })).toBeVisible()
  expect(await picker.locator('.category-picker-tag-bar').evaluate((element) => element.getBoundingClientRect().top)).toBe(tagsTop)
})

test('accepts Thai text in categories, tags, and transaction notes', async ({ page }) => {
  await page.goto('/?visual=categories-expense')
  await expect.poll(() => page.evaluate(() => document.fonts.check('16px "Ngern Pai Nai Thai"', 'ภาษาไทย'))).toBe(true)
  await page.getByRole('button', { name: 'Add category' }).click()
  const categoryEditor = page.locator('.manager-editor')
  await categoryEditor.getByPlaceholder('Category name').fill('อาหารและเครื่องดื่ม')
  await categoryEditor.getByRole('button', { name: 'Add category' }).click()
  await expect(page.getByText('อาหารและเครื่องดื่ม')).toBeVisible()

  await page.goto('/?visual=tags')
  await page.getByRole('button', { name: 'Add tag' }).click()
  const tagEditor = page.locator('.tag-editor')
  await tagEditor.getByPlaceholder('Tag name, up to 20 characters').fill('รายเดือนพิเศษ')
  await tagEditor.getByRole('button', { name: 'Save tag' }).click()
  await expect(page.getByText('รายเดือนพิเศษ')).toBeVisible()

  await page.goto('/?visual=add-expense')
  await page.getByRole('textbox', { name: 'Amount' }).fill('120')
  await page.getByPlaceholder('Add note').fill('ข้าวกลางวันกับแม่')
  await page.getByRole('button', { name: 'Choose category' }).click()
  await page.getByRole('dialog', { name: 'Choose category / tag' }).getByRole('button', { name: 'Food', exact: true }).click()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('ข้าวกลางวันกับแม่')).toBeVisible()
})

test('matches the compact MeowJot header geometry on category and entry screens', async ({ page }) => {
  for (const route of ['/?visual=categories-expense', '/?visual=categories-income']) {
    await page.goto(route)
    await expect(page.locator('[data-visual-ready="true"]')).toBeVisible()

    const header = await page.locator('.manager-page > header').evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return { height: bounds.height, width: bounds.width }
    })
    const tabs = await page.locator('.categories-manager-page .manager-tabs').evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return { left: bounds.left, width: bounds.width }
    })

    expect(header).toEqual({ height: 56, width: 414 })
    expect(tabs).toEqual({ left: 132, width: 150 })
    await expect(page.locator('.categories-manager-page .manager-tabs button')).toHaveCount(2)
    for (const button of await page.locator('.categories-manager-page .manager-tabs button').all()) {
      expect(await button.evaluate((element) => element.getBoundingClientRect().width)).toBe(75)
      await expect(button).toHaveCSS('font-weight', '500')
      expect(await button.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    }
  }

  for (const route of ['/?visual=add-expense', '/?visual=add-income', '/?visual=add-transfer']) {
    await page.goto(route)
    await expect(page.locator('[data-visual-ready="true"]')).toBeVisible()

    const header = await page.locator('.entry-header').evaluate((element) => element.getBoundingClientRect().height)
    const tabs = await page.locator('.entry-tabs').evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      return { left: bounds.left, width: bounds.width }
    })

    expect(header).toBe(56)
    expect(tabs.left).toBeCloseTo(98.5, 1)
    expect(tabs.width).toBe(225)
    for (const button of await page.locator('.entry-tabs button').all()) {
      expect(await button.evaluate((element) => element.getBoundingClientRect().width)).toBe(75)
      await expect(button).toHaveCSS('font-weight', '500')
      expect(await button.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    }
    await expect(page.getByRole('button', { name: 'Save' })).toHaveCSS('font-weight', '500')
  }
})

test('shows configured images on expense and income category screens', async ({ page }) => {
  await page.route('https://raw.githubusercontent.com/**', async (route) => {
    await route.fulfill({
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEAQH/6f1xGQAAAABJRU5ErkJggg==', 'base64'),
      contentType: 'image/png',
    })
  })

  for (const [route, count] of [['/?visual=categories-expense', 15], ['/?visual=categories-income', 6]] as const) {
    await page.goto(route)
    await expect(page.locator('[data-visual-ready="true"]')).toBeVisible()
    const images = page.locator('[data-category-icon-source="image"]')
    await expect(images).toHaveCount(count)
    await expect(images.first()).toHaveAttribute('src', /^https:\/\/raw\.githubusercontent\.com\//)
    await expect.poll(() => images.evaluateAll((elements) => elements.every((element) => (element as HTMLImageElement).naturalWidth > 0))).toBe(true)
    const iconBounds = await images.first().evaluate((image) => {
      const imageBounds = image.getBoundingClientRect()
      const container = image.parentElement
      if (!container) throw new Error('Category icon container is missing.')
      const containerBounds = container.getBoundingClientRect()
      return {
        containerHeight: containerBounds.height,
        containerWidth: containerBounds.width,
        imageHeight: imageBounds.height,
        imageWidth: imageBounds.width,
        overflow: getComputedStyle(container).overflow,
      }
    })
    expect(iconBounds.overflow).toBe('hidden')
    expect(iconBounds.imageHeight).toBeLessThan(iconBounds.containerHeight)
    expect(iconBounds.imageWidth).toBeLessThan(iconBounds.containerWidth)
  }
})

test('uses the built-in category icon when configured images fail', async ({ page }) => {
  await page.route('https://raw.githubusercontent.com/**', (route) => route.abort())
  await page.goto('/?visual=categories-expense')
  await expect(page.locator('[data-visual-ready="true"]')).toBeVisible()

  await expect(page.locator('[data-category-icon-source="fallback"]')).toHaveCount(15)
  await expect(page.locator('.category-list img')).toHaveCount(0)
})

test('lets the Summary category tabs stick below the header with scroll room beneath the list', async ({ page }) => {
  await page.goto('/?visual=summary-categories')
  await expect(page.locator('[data-visual-ready="true"]')).toBeVisible()
  const availableScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
  expect(availableScroll).toBeGreaterThanOrEqual(300)

  await page.locator('.breakdown-tabs').evaluate((element) => {
    window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 56)
  })
  await expect(page.locator('.breakdown-tabs')).toHaveCSS('position', 'sticky')
  expect(await page.locator('.breakdown-tabs').evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBe(56)
})

test('shows category icons and uses each pie-slice color beside its category name', async ({ page }) => {
  await page.goto('/?visual=summary')
  await expect(page.locator('[data-visual-ready="true"]')).toBeVisible()

  const rows = page.locator('.breakdown-list > div')
  await expect(rows).toHaveCount(2)
  await expect(rows.locator('[data-category-icon-source="image"]')).toHaveCount(2)

  const markerColors = await rows.locator('.breakdown-color').evaluateAll((markers) => markers.map((marker) => getComputedStyle(marker).backgroundColor))
  const pieChart = await page.locator('.donut').evaluate((element) => getComputedStyle(element).backgroundImage)
  expect(new Set(markerColors).size).toBe(markerColors.length)
  for (const markerColor of markerColors) expect(pieChart).toContain(markerColor)
})
