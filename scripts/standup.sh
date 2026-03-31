#!/bin/bash
# scripts/standup.sh — run via OpenClaw heartbeat or cron at 9 AM + 7 PM UTC
# Reads memory files, formats standup, posts to Telegram

set -euo pipefail

TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-8794306096}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
MEMORY_DIR="/home/openclaw/.openclaw/workspace/memory"

YESTERDAY=$(date -u -d 'yesterday' +'%Y-%m-%d')
TODAY=$(date -u +'%Y-%m-%d')
HOUR=$(date -u +'%H')

if [ "$HOUR" = "09" ]; then
  TYPE="Morning Standup 🌅"
elif [ "$HOUR" = "19" ]; then
  TYPE="Evening Recap 🌙"
else
  echo "Not a standup hour (hour=$HOUR) — exiting"
  exit 0
fi

YESTERDAY_LOG="${MEMORY_DIR}/${YESTERDAY}.md"
TODAY_LOG="${MEMORY_DIR}/${TODAY}.md"

if [ ! -f "$YESTERDAY_LOG" ] && [ ! -f "$TODAY_LOG" ]; then
  echo "No memory files found for yesterday ($YESTERDAY) or today ($TODAY) — skipping standup"
  exit 0
fi

# Extract key lines from memory files
DONE=$(grep -hE "✅|Done|deployed|passed|completed" "$YESTERDAY_LOG" "$TODAY_LOG" 2>/dev/null | head -8 | sed 's/.*\.md://')
PLANNED=$(grep -hE "🚧|Doing|planned|TODO|Next" "$TODAY_LOG" 2>/dev/null | head -8 | sed 's/.*\.md://')
BLOCKERS=$(grep -hiE "blocker|blocked|stuck" "$YESTERDAY_LOG" "$TODAY_LOG" 2>/dev/null | head -5 | sed 's/.*\.md://')

# Format the message
MSG="*${TYPE} — $(date -u +'%Y-%m-%d %H:%M UTC')}*\n\n"

if [ "$TYPE" = "Morning Standup 🌅" ]; then
  MSG+="📋 *Yesterday:*\n${DONE:-None noted}\n\n"
  MSG+="📋 *Today:*\n${PLANNED:-See sprint board}"
else
  MSG+="✅ *Done today:*\n${DONE:-None noted}\n\n"
  MSG+="🚧 *Blockers:*\n${BLOCKERS:-None}"
fi

if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
  RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    -d "text=${MSG}" \
    -d "parse_mode=Markdown" \
    -d "disable_web_page_preview=true")
  if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Standup posted to Telegram"
  else
    echo "❌ Telegram API error: $RESPONSE"
    exit 1
  fi
else
  echo "TELEGRAM_BOT_TOKEN not set — printing standup instead:"
  echo -e "$MSG"
fi
