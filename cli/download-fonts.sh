#!/bin/bash
# Download and prepare Noto Sans JP fonts for OG image generation
# Downloads variable font and strips variation tables to make it compatible with satori
set -euo pipefail

FONT_DIR="$(dirname "$0")/fonts"
mkdir -p "$FONT_DIR"

REGULAR_FILE="$FONT_DIR/NotoSansJP-Regular.ttf"
BOLD_FILE="$FONT_DIR/NotoSansJP-Bold.ttf"

if [ -f "$REGULAR_FILE" ] && [ -f "$BOLD_FILE" ]; then
  REGULAR_SIZE=$(stat -c%s "$REGULAR_FILE" 2>/dev/null || stat -f%z "$REGULAR_FILE" 2>/dev/null)
  if [ "$REGULAR_SIZE" -lt 5000000 ]; then
    echo "Fonts already exist (static), skipping download"
    exit 0
  fi
fi

VARIABLE_FONT="$FONT_DIR/NotoSansJP-Variable.ttf"
if [ ! -f "$VARIABLE_FONT" ]; then
  echo "Downloading Noto Sans JP variable font..."
  curl -fsSL --retry 3 -o "$VARIABLE_FONT" \
    "https://github.com/google/fonts/raw/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf"
fi

echo "Converting variable font to static (removing fvar/gvar tables)..."
python3 -c "
from fontTools.ttLib import TTFont

font = TTFont('$VARIABLE_FONT')
# Remove variable font tables so satori's opentype.js can parse it
for table in ['fvar', 'gvar', 'STAT', 'cvar', 'HVAR', 'MVAR', 'VVAR']:
    if table in font:
        del font[table]
font.save('$REGULAR_FILE')
font.save('$BOLD_FILE')
font.close()
"

rm -f "$VARIABLE_FONT"
echo "Fonts ready in $FONT_DIR"
ls -lh "$FONT_DIR"
