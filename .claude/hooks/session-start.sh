#!/bin/bash

# README:
# This hook runs at the start of each claude code session. It sets up the dev environment for claude code.
# About environment variables for claude code, view following document:
# https://code.claude.com/docs/en/settings#environment-variables
#
# If you want to debug this hook, you run `claude --debug` and view the debug log file.

set -eu

cd "$(dirname "$0")/../.."

source .claude/hooks/common.sh

if ! check_command mise; then
	curl https://mise.run | sh
	export PATH="$HOME/.local/bin:$PATH"
fi

mise trust --all

DETECTED_SHELL=${CLAUDE_CODE_SHELL:-$(basename "$SHELL")}

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
	# initialize
	echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >"$CLAUDE_ENV_FILE"
	case "$DETECTED_SHELL" in
	bash)
		mise activate bash >>"$CLAUDE_ENV_FILE"
		;;
	zsh)
		mise activate zsh >>"$CLAUDE_ENV_FILE"
		;;
	*)
		echo "Unsupported shell: $DETECTED_SHELL"
		exit 1
		;;
	esac
else
	echo "CLAUDE_ENV_FILE is not set. Skipping shell environment setup."
fi

mise settings experimental=true
mise install
