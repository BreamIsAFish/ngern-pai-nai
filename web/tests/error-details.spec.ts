import { expect, test } from '@playwright/test'

for (const nativeDetails of [false, true]) {
  test(`opens save error details from the toast with ${nativeDetails ? 'a rebuilt' : 'the installed'} native response`, async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.clock.setFixedTime(new Date('2026-09-20T12:00:00.000Z'))
    // Exercise real serialization and response handling, mocking only Flutter's transport.
    await page.route('**/src/bridge/client.ts', (route) => route.fulfill({
      contentType: 'application/javascript',
      body: `
        import createMockBridge from '/src/bridge/createMockBridge.ts';
        import createNativeBridge from '/src/bridge/createNativeBridge.ts';
        const mock = createMockBridge();
        window.FlutterBridge = { postMessage(message) {
          const request = JSON.parse(message);
          const result = request.operation === 'transactions.update'
            ? Promise.resolve({ id: request.id, ok: false, error: {
                code: 'INVALID_REQUEST', message: 'Check the details and try again.',
                ${nativeDetails ? "data: { type: 'FormatException', message: 'FormatException: Invalid transaction fields.', extra: 'Native diagnostic <detail>\\n' + 'Long detail '.repeat(100) }," : ''}
              } })
            : mock.request(request.operation, request.payload).then(data => ({ id: request.id, ok: true, data }));
          result.then(response => window.NgernPaiNaiBridge.receive(JSON.stringify(response)));
        } };
        export default createNativeBridge();
      `,
    }))
    await page.goto('/')
    await page.addStyleTag({ content: '.vc-switch, #__vconsole { display: none !important; }' })
    await page.getByRole('button', { name: /Food Lunch with May/ }).click()
    const form = page.locator('.transaction-screen')
    await form.getByRole('button', { name: 'Transfer', exact: true }).click()
    await form.getByLabel('Destination').fill('Savings')
    await form.getByRole('button', { name: 'Save', exact: true }).click()
    const toast = page.getByRole('alert')
    await expect(toast).toContainText('Check the details and try again.')
    await expect(toast).not.toContainText('FormatException')
    await expect(page.locator('.ledger-row.expense').filter({ hasText: 'Lunch with May' })).toHaveCount(1)
    await expect(page.locator('.month-total > strong')).toHaveText('฿185')
    const detailsButton = toast.getByRole('button', { name: /Tap for details/ })
    await detailsButton.click()
    const dialog = page.getByRole('dialog', { name: 'Error details' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Check the details and try again.')
    await expect(dialog).toContainText('INVALID_REQUEST')
    await expect(dialog).toContainText('BridgeRequestError')
    await expect(dialog).toContainText('transactions.update')
    await expect(dialog).toContainText('2026-09-20T12:00:00.000Z')
    const userAgent = await page.evaluate(() => navigator.userAgent)
    await expect(dialog).toContainText(userAgent)
    await expect(dialog.locator('dd').first()).toHaveCSS('user-select', 'text')
    if (nativeDetails) {
      await expect(dialog).toContainText('FormatException: Invalid transaction fields.')
      await expect(dialog).toContainText('Native diagnostic <detail>')
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 414)
      await expect(dialog).toHaveCSS('border-radius', '28px')
      await expect(dialog.locator('pre')).toHaveCSS('user-select', 'text')
      await page.screenshot({ path: 'test-results/error-details.png' })
    } else {
      await expect(dialog.getByText('Details', { exact: true })).toHaveCount(0)
    }
    await dialog.getByRole('button', { name: 'Copy', exact: true }).click()
    await expect(dialog.getByRole('status')).toHaveText('Copied')
    const data = nativeDetails ? {
      type: 'FormatException', message: 'FormatException: Invalid transaction fields.',
      extra: 'Native diagnostic <detail>\n' + 'Long detail '.repeat(100),
    } : null
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe([
      'Message: Check the details and try again.', 'Code: INVALID_REQUEST', 'Type: BridgeRequestError',
      'Operation: transactions.update', `Details JSON: ${JSON.stringify(data, null, 2)}`,
      'App time ISO: 2026-09-20T12:00:00.000Z', `User agent: ${userAgent}`,
    ].join('\n'))
    await expect(dialog.getByRole('status')).toBeEmpty()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(detailsButton).toBeFocused()
    await detailsButton.press('Enter')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Close error details' }).click()
    await expect(dialog).toBeHidden()
    await toast.getByRole('button', { name: 'Dismiss' }).click()
    await expect(toast).toBeHidden()
    await expect(dialog).toBeHidden()
  })
}

for (const clipboard of ['unavailable', 'rejected', 'both-fail', 'fallback-throws']) {
  test(`copies an error report with clipboard access ${clipboard}`, async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.clock.setFixedTime(new Date('2026-09-20T12:00:00.000Z'))
    await page.addInitScript((mode) => {
      if (mode === 'unavailable') {
        // Leave readText available to verify the browser's real legacy clipboard write.
        Object.defineProperty(navigator.clipboard, 'writeText', { value: undefined })
      } else {
        Object.defineProperty(navigator.clipboard, 'writeText', { value: () => Promise.reject(new Error('Denied')) })
      }
      if (mode === 'both-fail') document.execCommand = () => false
      if (mode === 'fallback-throws') document.execCommand = () => { throw new Error('Unsupported') }
    }, clipboard)
    await page.goto('/?visual=edit-transaction-update-error')
    await page.addStyleTag({ content: '.vc-switch, #__vconsole { display: none !important; }' })
    await page.locator('.transaction-screen').getByRole('button', { name: 'Save', exact: true }).click()
    await page.getByRole('alert').getByRole('button', { name: /Tap for details/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Error details' })
    await expect(dialog).toContainText('transactions.update')
    const copyButton = dialog.getByRole('button', { name: 'Copy', exact: true })
    await copyButton.click()
    const failed = clipboard === 'both-fail' || clipboard === 'fallback-throws'
    await expect(dialog.getByRole('status')).toHaveText(failed ? 'Copy failed' : 'Copied')
    if (!failed) {
      const report = await page.evaluate(() => navigator.clipboard.readText())
      expect(report).toContain('Message: Could not update transaction.')
      expect(report).toContain('Operation: transactions.update')
      expect(report).toContain('Details JSON: null')
    }
    await expect(page.locator('.clipboard-textarea')).toHaveCount(0)
    await expect(copyButton).toBeFocused()
    await expect(dialog.getByRole('status')).toBeEmpty()
  })
}

for (const operation of ['transactions.create', 'transactions.update']) {
  test(`shows the Thai duplicate-receipt message and retains diagnostics for ${operation}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-20T12:00:00.000Z'))
    await page.route('**/src/bridge/client.ts', (route) => route.fulfill({
      contentType: 'application/javascript',
      body: `
        import createMockBridge from '/src/bridge/createMockBridge.ts';
        import { BridgeRequestError } from '/src/bridge/createNativeBridge.ts';
        const mock = createMockBridge();
        export default { request(operation, payload) {
          if (operation === '${operation}') return Promise.reject(new BridgeRequestError(
            'DUPLICATE_RECEIPT', 'This receipt already exists.', { id: 'receipt-1' }, operation
          ));
          return mock.request(operation, payload);
        } };
      `,
    }))
    await page.goto(operation === 'transactions.create' ? '/?visual=add-expense' : '/?visual=edit-transaction')
    await page.addStyleTag({ content: '.vc-switch, #__vconsole { display: none !important; }' })
    const form = page.locator('.transaction-screen')
    if (operation === 'transactions.create') {
      await form.getByLabel('Amount').fill('120')
      await form.getByRole('button', { name: 'Choose category', exact: true }).click()
      await page.getByRole('dialog', { name: 'Choose category / tag' }).getByRole('button', { name: 'Food', exact: true }).click()
    }
    await form.getByRole('button', { name: 'Save', exact: true }).click()
    const toast = page.getByRole('alert')
    await expect(toast).toContainText('รายการนี้ซ้ำกับรายการที่มีอยู่')
    await toast.getByRole('button', { name: /Tap for details/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Error details' })
    await expect(dialog).toContainText('รายการนี้ซ้ำกับรายการที่มีอยู่')
    await expect(dialog).toContainText('DUPLICATE_RECEIPT')
    await expect(dialog).toContainText(operation)
    await expect(dialog).toContainText('"id": "receipt-1"')
  })
}
