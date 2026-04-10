#!/bin/bash

set -eu

cd "$(dirname "$0")/../.."

source .claude/hooks/common.sh

if ! check_command mise; then
	echo "mise command not found. Please install mise to use this hook."
	exit 1
fi

# Fast path: if no source files have been modified since the last successful
# fmt/lint run, skip running the expensive formatters and linters entirely.
# The sentinel lives under node_modules/ so it is naturally invalidated when
# dependencies are wiped and does not need to be gitignored separately.
SENTINEL="node_modules/.claude-stop-sentinel"
if [ -f "$SENTINEL" ]; then
	CHANGED=$(find . \
		\( -path ./node_modules \
		-o -path ./.git \
		-o -path ./web/.next \
		-o -path ./web/out \
		-o -path ./web/dump \
		-o -path ./web/src/styled-system \
		-o -path ./.turbo \
		\) -prune \
		-o -type f -newer "$SENTINEL" -print -quit 2>/dev/null || true)
	if [ -z "$CHANGED" ]; then
		exit 0
	fi
fi

# Feedback exit code: tells Claude Code to surface stderr back to the model so
# it can fix the reported issues on the next turn.
CLAUDE_CODE_FEEDBACK_EXIT_CODE=2

# Temporarily disable errexit so we can capture failures and return the
# dedicated feedback exit code instead of propagating the raw status. Running
# fmt before lint is intentional: fmt may fix issues that lint would otherwise
# report, and lint reads files that fmt rewrites.
set +e
mise run fmt
status=$?
if [ $status -eq 0 ]; then
	mise run lint
	status=$?
fi
set -e

if [ $status -ne 0 ]; then
	echo "Formatting or linting failed. Please fix the issues above."
	exit $CLAUDE_CODE_FEEDBACK_EXIT_CODE
fi

# Touch sentinel last so any files rewritten by fmt have mtime <= sentinel
# mtime, and will not be seen as "changed" on the next invocation.
mkdir -p "$(dirname "$SENTINEL")"
touch "$SENTINEL"
