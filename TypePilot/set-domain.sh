#!/usr/bin/env bash
# Usage: ./set-domain.sh https://www.yourdomain.com   (no trailing slash)
set -e
[ -z "$1" ] && { echo "Usage: $0 https://your-domain.com"; exit 1; }
D="${1%/}"
grep -rl "https://YOUR-DOMAIN.com" --include=*.html --include=*.xml --include=*.txt . | while read f; do
  sed -i.bak "s#https://YOUR-DOMAIN.com#$D#g" "$f" && rm -f "$f.bak"
done
echo "Domain set to $D"
