# Ngern Pai Nai

Ngern Pai Nai is a backend-free personal money journal for income, expenses, and transfers. Flutter owns authentication, Google Sheets access, native security, and the WebView bridge. React renders the interface and never receives Google credentials.

## Prototype 1 scope

Prototype 1 includes:

- Google Sign-In on Android and iOS with the `drive.file` scope
- one private Google spreadsheet named `NgernPaiNai_data` per Google account
- UTC-month transaction worksheets with create, read, update, delete, and cross-month move operations
- type-specific categories and shared tags stored in dedicated worksheets
- a typed request and response bridge with correlation IDs
- a MeowJot-inspired English mobile interface for the home ledger, editor, search, monthly summary, profile, categories, and tags
- a browser mock bridge for web development without Flutter or Google credentials
- WebView origin allow-listing and external-link handling

OpenAI transaction parsing and API-key management are intentionally deferred. No OpenAI bridge operations, screens, dependencies, or secret-storage code are part of Prototype 1.

## Deferred AI requirement

A later prototype may accept the user's own OpenAI API key in a native Flutter settings screen. Flutter must store that key with `flutter_secure_storage`, make OpenAI requests through a Dart HTTP client, and expose only a narrow `ai.parseTransaction` bridge operation. The key must never enter WebView JavaScript, browser storage, URLs, logs, source code, or Google Sheets. Parsed text must produce a draft that the user reviews before saving. AI must never write directly to the sheet.

## Repository layout

```text
app/   Flutter shell, Google authentication, Sheets gateway, and WebView bridge
web/   React and Vite interface
```

Both applications use flat modules. Business modules such as `transactions` sit beside technical modules such as `bridge` and `ui`.

## Prerequisites

- Node.js 22.19.0 through nvm
- pnpm 10
- Flutter 3.47.0 through FVM
- a Google Cloud project for device builds

```bash
nvm use
corepack enable
fvm use
```

## Run the React app

The browser build automatically uses an in-memory mock bridge with seeded transactions, default categories, and a sample tag. Desktop and tablet browsers retain a centered phone-width canvas.

```bash
cd web
pnpm install
pnpm dev
```

Run its checks with:

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Run the Flutter app

Start the React development server on an address the simulator or device can reach. Pass that origin to Flutter:

```bash
cd app
fvm flutter pub get
fvm flutter run --dart-define=WEB_APP_URL=http://10.0.2.2:5173
```

Android emulators use `10.0.2.2` to reach the host. An iOS simulator can usually use `http://localhost:5173`. A physical device needs the development machine's LAN address and a Vite server started with `pnpm dev --host 0.0.0.0`.

Production builds must pass an HTTPS URL. Release builds reject HTTP and show
an on-screen configuration error. Debug builds allow HTTP for local development
and print a prominent warning to the Flutter log:

```bash
fvm flutter build apk --release --dart-define=WEB_APP_URL=https://money.example.com
fvm flutter build ipa --release --dart-define=WEB_APP_URL=https://money.example.com
```

The Flutter shell only permits navigation within the configured origin. It opens other HTTP and HTTPS links in the system browser.

## Google Cloud configuration

1. Create or select a Google Cloud project.
2. Enable the Google Sheets API and Google Drive API.
3. Configure the OAuth consent screen. Add test accounts while the app remains in testing.
4. Create separate OAuth client IDs for Android and iOS. Do not put a web client secret in either app.
5. Keep the requested scope limited to `https://www.googleapis.com/auth/drive.file`.

### Android

1. Choose the final Android application ID. The scaffold currently uses `com.example.ngern_pai_nai` and should be changed before release.
2. Create an Android OAuth client with that package name and the SHA-1 fingerprint for each signing certificate.
3. Add the generated `google-services.json` to `app/android/app/` if your Google configuration requires it. This file is ignored and must not be committed when it contains project-specific credentials.
4. Add the release signing certificate fingerprint before testing a release build.

Get the debug fingerprint with:

```bash
cd app/android
./gradlew signingReport
```

### iOS

1. Create an iOS OAuth client for the Runner bundle identifier.
2. Download `GoogleService-Info.plist` when using Firebase-backed configuration and place it in `app/ios/Runner/`. Do not commit a project-specific file.
3. Add the reversed client ID as a URL scheme in `app/ios/Runner/Info.plist`.
4. Confirm the bundle identifier in Xcode matches the OAuth client.

The app contains no real client IDs. Google authentication and live Sheets access cannot be verified end to end until these platform credentials are supplied.

## Spreadsheet format

Flutter creates a private spreadsheet named `NgernPaiNai_data`. Version 2 intentionally replaces the earlier prototype layout; it does not migrate old rows. On first bootstrap against the old schema, the app removes the old transaction/category/tag tabs and initializes the following layout.

Transaction tabs are divided by UTC month and created only when needed. Their names use `Transactions_YYYY_MM`, for example `Transactions_2026_09`. Each has these exact English columns:

```text
id, date, time, type, category, tag, amount, note, destination, created_at, updated_at
```

- `date` and `time` are UTC. The UI accepts local date/time, converts it to UTC for storage, and converts it back for display.
- `type` is `expense`, `income`, or `transfer`.
- amounts are positive THB values. Transfers do not affect income, expense, or balance totals.
- `tag` and `destination` are nullable and use empty cells in Sheets. Destination is hidden from manual entry and reserved for the future receipt reader.
- `created_at` and `updated_at` are UTC audit timestamps and are not shown in the UI.
- future transaction timestamps are rejected.

`Categories` uses:

```text
id, name, type, icon_url, is_default, created_at, updated_at
```

Categories belong to one transaction type. Default expense and income categories, plus the fixed Transfer category, are seeded and cannot be edited or deleted. Custom category names are trimmed, case-insensitively unique within a type, limited to 20 characters, and limited to 50 per type. An optional custom icon must be a public HTTPS URL. HTTP is rejected because unencrypted image requests can be intercepted or changed in transit; remote credentials are never attached. Broken or absent images use the built-in fallback icon.

`Tags` uses:

```text
id, name, created_at, updated_at
```

Tags are shared across transaction types, case-insensitively unique, limited to 20 characters, and capped at 100. A transaction has at most one tag. Renaming or deleting a category or tag does not rewrite historical transaction text.

The hidden `_Metadata` tab records `schema_version` and `initialized_at`. If a user manually changes an expected header, the app reports that the format needs attention instead of overwriting it. Malformed transaction rows are skipped and reported without being deleted.

The spreadsheet ID is cached per Google account in native preferences. The app searches files visible through `drive.file` before creating a replacement. If the cached spreadsheet is in Google Drive trash, the app stops bootstrap and lets the user restore it or create a new spreadsheet. Creating a replacement leaves the old file in trash and updates the cached ID only after the new schema is ready. The app never writes access tokens or API keys to the spreadsheet.

## Interface behavior

- Home is grouped by local calendar date and defaults to the current local month. Pull down to refresh from Google Sheets.
- Search covers at most 12 UTC month tabs per request. It defaults to the latest 12 months and can move backward through calendar years. It matches category, tag, note, destination, and amount case-insensitively.
- Tapping a row opens the edit screen. Its top-left overflow menu contains the confirmed delete action.
- Profile exposes only Google Sheet/account management, category management, and tag management.
- Wallets, budgets, trends, and recurring entries remain visible for orientation but only show a “Coming later” message.
- Currency is THB only.

## Deployment checklist

- deploy `web/dist` to an HTTPS origin
- set `WEB_APP_URL` to that exact origin for release builds
- configure Android and iOS OAuth clients for production identifiers and signing keys
- verify Google Sign-In on physical Android and iOS devices
- verify first-run spreadsheet creation and returning-user reuse
- verify restore and replacement flows with the cached spreadsheet in Drive trash
- verify CRUD operations against a test Google account
- run all checks listed below

```bash
cd web && pnpm test && pnpm typecheck && pnpm build
cd app && fvm dart format --set-exit-if-changed lib test
cd app && fvm flutter analyze && fvm flutter test
```
