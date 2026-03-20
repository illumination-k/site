#!/bin/bash

set -eu

cd "$(dirname "$0")/../.."

CLAUDE_CODE_FEEDBACK_EXIT_CODE=2

source .claude/hooks/common.sh

if ! check_command mise; then
	echo "mise command not found. Please install mise to use this hook."
	exit 1
fi

mise run fmt && mise run lint
status=$?

if [ $status -ne 0 ]; then
	echo "Formatting or linting failed. Please fix the issues above."
	exit $CLAUDE_CODE_FEEDBACK_EXIT_CODE
fi
