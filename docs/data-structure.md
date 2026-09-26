# Google Sheet data structure

The app stores schema version 3 in a private spreadsheet named `NgernPaiNai_data`.

| Worksheet | Columns | Purpose |
| --- | --- | --- |
| `Transactions_YYYY_MM` | `id`, `date`, `time`, `type`, `category`, `tag`, `amount`, `note`, `destination`, `transaction_number`, `source`, `date_inferred`, `created_at`, `updated_at` | One transaction worksheet per UTC month. |
| `Categories` | `id`, `name`, `type`, `icon_url`, `is_default`, `created_at`, `updated_at` | Default and custom categories. |
| `Tags` | `id`, `name`, `created_at`, `updated_at` | Tags shared by income and expense entries. |
| `_Metadata` | `key`, `value` | Hidden sheet containing `schema_version` and `initialized_at`. |

## Field rules

- Dates use `YYYY-MM-DD`. Dates, times, and audit timestamps use UTC.
- `type` is `expense`, `income`, or `transfer`.
- `amount` is a positive THB value. Transfers do not change income, expense, or balance totals.
- `category` may be empty only for an AI-imported receipt. Manual income and expense entries require a category.
- `tag`, `icon_url`, `destination`, and `transaction_number` are optional and stored as empty cells when absent.
- `source` is `manual` or `receipt_ai`. `date_inferred` records that a receipt had no readable date and the import time was used.
- Receipt duplicates are detected by normalized transaction number, extracted receipt date, and amount. Detection is skipped when the transaction number or extracted date is missing.
- IDs are UUIDs. `created_at` and `updated_at` are ISO 8601 timestamps.
- Category names are case-insensitively unique within each type. Tag names are unique across all types. Both are limited to 20 characters.
- Custom categories are capped at 50 per type. Tags are capped at 100.
- A transaction can have one category and at most one tag. Notes are limited to 160 characters.

## Version 3 reset

Upgrading an existing workbook to schema version 3 requires confirmation because the app deletes and recreates every `Transactions_YYYY_MM` worksheet. Category and tag worksheets are preserved. The app never deletes the workbook as part of this upgrade.
