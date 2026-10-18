.PHONY: build-release-ios import-csv-ios setup-agent-install-skill

export CSV

# Run ios release mode (with deployed webapp)
run-release-ios:
	cd app && fvm flutter run --release --dart-define=WEB_APP_URL=https://ngern-pai-nai.kruayhom.info

# Copy a CSV into Files > On My iPhone on the booted iOS simulator.
# EXAMPLE: make import-csv-ios CSV="$HOME/Downloads/meowjot.csv"
import-csv-ios:
	@set -eu; \
	: "$${CSV:?Usage: make import-csv-ios CSV=/path/to/file.csv}"; \
	test -f "$$CSV" || { printf 'CSV file not found: %s\n' "$$CSV" >&2; exit 1; }; \
	files_group="$$(xcrun simctl get_app_container booted com.apple.DocumentsApp groups | awk '$$1 == "group.com.apple.FileProvider.LocalStorage" { sub(/^[^[:space:]]+[[:space:]]+/, ""); print; exit }')"; \
	test -n "$$files_group" || { printf 'Could not find Files storage for the booted simulator.\n' >&2; exit 1; }; \
	rsync -- "$$CSV" "$$files_group/File Provider Storage/"; \
	printf 'Copied %s to Files > On My iPhone.\n' "$$CSV"

# Initialize local settings for the iPhone installation skill.
setup-agent-install-skill:
	@set -eu; \
	preferences=".agents/skills/install-ngern-pai-nai/preferences.json"; \
	if test -e "$$preferences"; then \
		printf 'Keeping existing %s\n' "$$preferences"; \
	else \
		python3 -c 'import json, sys; from pathlib import Path; preferences = Path(sys.argv[1]); settings = json.loads(preferences.with_name("preferences.example.json").read_text()); settings["repo_path"] = str(Path.cwd().resolve()); preferences.open("x").write(json.dumps(settings, indent=2) + "\n")' "$$preferences"; \
		printf 'Created %s\n' "$$preferences"; \
	fi
