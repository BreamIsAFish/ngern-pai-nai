.PHONY: build-release-ios

build-release-ios:
	cd app && fvm flutter run --dart-define=WEB_APP_URL=https://ngern-pai-nai.kruayhom.info
