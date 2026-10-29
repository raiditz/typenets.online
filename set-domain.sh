#!/usr/bin/env bash
# Usage: ./set-domain.sh https://www.yourdomain.com   (no trailing slash)
# Replaces the current site URL (https://typenets.online) in canonicals, OG tags, JSON-LD, sitemap.xml, robots.txt.
set -e
[ -z "$1" ] && { echo "Usage: $0 https://your-domain.com"; exit 1; }
D="${1%/}"
OLD="https://typenets.online"
grep -rl "$OLD" --include=*.html --include=*.xml --include=*.txt . | while read f; do
  sed -i.bak "s#$OLD#$D#g" "$f" && rm -f "$f.bak"
done
echo "Domain set to $D"
