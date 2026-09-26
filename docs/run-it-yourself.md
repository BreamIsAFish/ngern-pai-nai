# Run it yourself

The command blocks below start from the repository root.

## Prerequisites

- Node.js 22.19.0 through nvm
- pnpm 10
- Flutter 3.47.0 through FVM
- A Google Cloud project for Android or iOS builds

Run these commands from the repository root:

```bash
cd web
nvm use
corepack enable

cd ../app
fvm use
cd ..
```

## Run the web app

The browser build uses an in-memory mock. It does not need Flutter or Google credentials.

```bash
cd web
pnpm install
pnpm dev
```

## Configure Google Cloud

1. Create or select a Google Cloud project.
2. Enable the Google Sheets API and Google Drive API.
3. Configure the OAuth consent screen. Add test accounts while the app is in testing.
4. Create separate OAuth client IDs for Android and iOS. Do not add a web client secret to the app.
5. Request only `https://www.googleapis.com/auth/drive.file`.

### Android

1. Create an Android OAuth client for application ID `info.kruayhom.ngernpainai` and the SHA-1 fingerprint of each signing certificate.
2. Add `google-services.json` to `app/android/app/` if your Google configuration requires it. Do not commit project-specific credentials.
3. Add the release certificate fingerprint before testing a release build.

Get the debug fingerprint with:

```bash
cd app/android
./gradlew signingReport
```

### iOS

1. Create an iOS OAuth client for bundle identifier `info.kruayhom.ngernpainai`.
2. If you use Firebase-backed configuration, add `GoogleService-Info.plist` to `app/ios/Runner/`. Do not commit the project-specific file.
3. Add the reversed client ID as a URL scheme in `app/ios/Runner/Info.plist`.
4. Confirm that the bundle identifier in Xcode matches the OAuth client.

## Run the Flutter app

Keep the web development server running. In another terminal, pass its address to Flutter:

```bash
cd app
fvm flutter pub get
fvm flutter run --dart-define=WEB_APP_URL=http://10.0.2.2:5173
```

Android emulators use `10.0.2.2` to reach the host. An iOS simulator can usually use `http://localhost:5173`. A physical device needs your development machine's LAN address. Start Vite with `pnpm dev --host 0.0.0.0` so the device can connect.

In debug builds, raw AI provider responses are written through the Vite development server to `logs/ai-responses.jsonl`. The file keeps the latest 10 responses with UTC timestamps and is ignored by Git. It can contain personal or financial information from scanned documents. Release builds do not create this log.

## Build a release

Release builds require an HTTPS web origin.

```bash
cd app
fvm flutter build apk --release --dart-define=WEB_APP_URL=https://money.example.com
fvm flutter build ipa --release --dart-define=WEB_APP_URL=https://money.example.com
```

The Flutter shell allows navigation within the configured origin and opens other HTTP or HTTPS links in the system browser.

## Verify your changes

```bash
cd web
pnpm test
pnpm typecheck
pnpm build

cd ../app
fvm dart format --set-exit-if-changed lib test
fvm flutter analyze
fvm flutter test
```
