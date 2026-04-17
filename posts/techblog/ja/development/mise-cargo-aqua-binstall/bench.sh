#!/usr/bin/env bash
# Measure mise install wall time for two configurations:
#   (a) cargo backend with binstall disabled -> cargo install from source
#   (c) aqua backend installs cargo-binstall first, cargo backend reuses it
#
# Usage: ./bench.sh
# Requires: mise, cargo, rustc in PATH (see flake.nix).

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$WORK/before" "$WORK/after"
cp "$HERE/mise.before.toml" "$WORK/before/mise.toml"
cp "$HERE/mise.toml" "$WORK/after/mise.toml"

mise trust "$WORK/before/mise.toml" >/dev/null
mise trust "$WORK/after/mise.toml" >/dev/null

run() {
  local label="$1"; shift
  local dir="$1"; shift
  local data="$1"; shift
  rm -rf "$data"; mkdir -p "$data"
  local start end
  start=$(date +%s.%N)
  (cd "$dir" && MISE_DATA_DIR="$data" "$@" mise install >/dev/null 2>&1)
  end=$(date +%s.%N)
  printf '%-32s %s sec\n' "$label" "$(echo "$end - $start" | bc)"
}

echo "=== pattern (a) cargo install from source, default parallelism ==="
run "before/parallel" "$WORK/before" "$WORK/data-a-par" env MISE_CARGO_BINSTALL=false

echo "=== pattern (c) aqua -> cargo-binstall -> 3 tools ==="
run "after/total" "$WORK/after" "$WORK/data-c"
