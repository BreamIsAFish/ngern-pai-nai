# AI receipt import requirements

## Scope

Prototype 2 lets users select OpenAI or Google AI Studio, provide their own API key, select Thai receipt images, and import extracted transactions into the app's Google Sheet.

The feature supports purchase receipts only. Each image must contain exactly one receipt and produces at most one expense transaction. Multi-page receipts, images containing multiple receipts, refunds, cancellation slips, non-THB receipts, and ambiguous currencies are unsupported.

## AI provider settings

- Add an AI provider settings menu under the Account tab.
- Let users select OpenAI or Google AI Studio. Preserve each provider's API key and model when switching.
- Store the API key on the device using OS-backed secure storage. The key must never enter the WebView, Google Sheets, URLs, analytics, or logs.
- Display the active provider and its saved key entirely as dots in a disabled field. Require **Edit** before changing provider, key, or model. Save changes only after validation succeeds, and discard unsaved changes on **Cancel**. Do not reveal the key's prefix, suffix, or full value, and do not offer a copy action.
- Let users replace or delete the key. Deleting it disables receipt import but preserves the selected model.
- Keep the key on the device until the user explicitly replaces or deletes it. Disconnecting the Google account must not delete it.
- Validate a new key with a minimal request before enabling receipt import. If the device is offline, save it as unverified and allow validation later.
- Use a fixed model selector for the selected provider. OpenAI defaults to `gpt-6-luna`; Google AI Studio defaults to `gemini-3.8-flash`.
- Do not fetch the model list from the API.
- Validate access before changing the active model. Keep the last working model active if validation fails.
- Do not silently fall back when a selected model becomes unavailable. Show the error and let the user change the model.

## Home and image selection

- Add a secondary **สแกนใบเสร็จ** action beside the existing manual transaction action on Home.
- Keep the action visible when the active provider is not configured. Tapping it must open AI provider settings with a short Thai explanation.
- After tapping the action, offer **ถ่ายรูป** and **เลือกจากคลังรูปภาพ**.
- Camera capture handles one receipt at a time. Gallery selection accepts up to 10 images per batch.
- Show a one-time Thai privacy notice before the first import.

## Processing

- Process each image in a separate provider request. Use OpenAI Responses Structured Outputs with `store: false`, or Gemini `generateContent` with a JSON response schema.
- Run no more than three receipt requests concurrently.
- Retry transient provider responses with bounded backoff. Users may retry other failures explicitly from the results modal.
- Open the results modal when processing starts. Add each valid transaction as soon as its extraction and duplicate check succeed.
- Keep the modal open until all images finish processing, or until the user selects **ยกเลิกรายการที่เหลือ**.
- Cancelling stops active and queued work where possible. Transactions already added remain saved.
- Do not run receipt imports as background jobs. If the app closes or is interrupted, keep completed transactions, cancel unfinished work, discard their images, and report the completed count when the app next opens.
- Receipt images are temporary. Discard them when processing finishes or the results modal closes.
- Do not persist raw model responses, confidence scores, image data, or full request payloads.

## Extraction rules

A receipt is valid only when the model identifies a clear, positive THB grand total. The grand total is the amount actually paid after discounts, tax, and service charges. Do not use subtotal, cash tendered, change, card authorization values, or loyalty points.

Extract and map these fields:

| Extracted value | Transaction field | Rule |
| --- | --- | --- |
| Merchant or store name | `destination` | Optional. Leave empty when unreadable. |
| Short purchase summary | `note` | Optional Thai text, limited to 100 characters. Use only visible item information; do not invent a generic summary. |
| Grand total | `amount` | Required, positive, and THB. |
| Receipt date | `date` | Accept Buddhist or Gregorian years and convert to the app's stored format. Do not guess ambiguous dates. |
| Receipt time | `time` | Optional. |
| Transaction number (`เลขที่รายการ`) | `transaction_number` | Optional. Do not substitute invoice numbers, approval codes, tax IDs, phone numbers, card fragments, or other identifiers. |

Additional transaction values are fixed:

- Set `type` to `expense`.
- Set `source` to `receipt_ai`.
- Set `category` to null.
- Leave `tag` empty.

Do not extract or store individual line items.

### Date and time fallback

- When both receipt date and time are readable, use both.
- When only the receipt date is readable, use local noon for that date.
- When the receipt date is missing, use the import time and set `date_inferred` to true.
- Persist the inferred-date warning after the modal closes. Clear `date_inferred` when the user confirms or changes the date.

## Duplicate detection

- A duplicate requires an exact three-field match after normalization: transaction number, extracted receipt date, and amount.
- Normalize the transaction number for comparison without changing its displayed value.
- Run duplicate detection only when both the transaction number and the original receipt date were extracted.
- When the transaction number is missing, add the transaction, skip duplicate detection, and show a warning.
- When the date was inferred, skip duplicate detection and show a warning.
- Check both existing spreadsheet transactions and successful receipts earlier in the same batch.
- Reserve fingerprints during concurrent processing so two matching images cannot both be inserted. The first successful image wins; later matches are skipped.
- Re-run duplicate detection when a user edits the transaction number, date, or amount. Exclude the transaction being edited and block saving when another transaction matches all three fields.

## Results modal

Preserve image selection order and show each image with one of these outcomes:

- Added
- Duplicate, not added
- Failed
- Cancelled
- Deleted

Required actions:

- Tapping an added transaction opens the existing transaction editor. Saving returns to the results list without adding an "Edited" status.
- Imported transactions may be edited and saved while their category remains empty.
- Each added transaction has a delete action with confirmation. Keep a deleted result visible and mark it **ลบแล้ว**.
- Each duplicate links to the existing matching transaction. Do not allow users to override the duplicate and add it from this modal.
- Each failed receipt has **ลองใหม่**, and the modal has **ลองใหม่ทั้งหมด** for failed receipts.
- Retrying reuses the temporary image only while the modal remains open. After it closes, the user must select the image again.

Show clear Thai error messages and a provider request ID when available. Never display or log the API key, image data, full payload, or raw model response. Sanitized diagnostic logging is allowed in development builds.

## Category behavior

- Make transaction category nullable in the spreadsheet, native model, bridge contract, and web model.
- Continue requiring a category when users create a transaction manually.
- Allow receipt-imported transactions to remain uncategorized when edited.
- Store an uncategorized transaction as an empty category cell, not as an `Other` category.
- Display uncategorized expenses using the virtual Thai label **ไม่มีหมวดหมู่**.
- Include uncategorized expenses as a gray slice in the summary pie chart so the chart reconciles with total expenses.
- Do not make the virtual uncategorized label selectable in manual transaction forms.

## Manual transaction behavior

- Set `source` to `manual` for newly created manual transactions.
- Do not show `transaction_number` in the regular manual transaction form.
- Show and allow correction of `transaction_number` when viewing or editing a receipt-imported transaction.

## Spreadsheet schema and reset

Add these columns to transaction worksheets:

| Column | Values | Purpose |
| --- | --- | --- |
| `transaction_number` | Text or empty | Receipt transaction number used for duplicate detection. |
| `source` | `manual` or `receipt_ai` | Distinguishes manual entries from receipt imports. |
| `date_inferred` | Boolean | Records whether the receipt date was replaced with import time. |

The schema upgrade intentionally resets existing transaction data:

- Show a destructive-action confirmation before upgrading.
- Clear and recreate all `Transactions_YYYY_MM` worksheets using the new schema.
- Preserve the `Categories` and `Tags` worksheets and their data.
- Never delete or rebuild the entire workbook as part of this reset.

## Acceptance criteria

- A user with a verified key can import one to ten Thai receipt images and see each result independently.
- Every valid, non-duplicate receipt is saved immediately as an uncategorized expense in the correct transaction worksheet.
- A failure, cancellation, or duplicate never creates a transaction.
- A batch may partially succeed without rolling back successful transactions.
- Duplicate receipts are blocked both against existing data and within the active batch.
- Manual transactions cannot be created without a category.
- Imported transactions can remain uncategorized and are included correctly in lists, totals, and the summary pie chart.
- Secrets, receipt images, and raw model output are not persisted or exposed to the WebView.
