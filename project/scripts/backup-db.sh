#!/usr/bin/env bash
#
# AdCraft: SQLite Database Backup Script
#
# Creates a timestamped copy of the SQLite database file.
# Safe to run while the app is running (SQLite allows concurrent reads).
# For full consistency, uses the SQLite backup API via the sqlite3 CLI.
#
# Usage:
#   ./scripts/backup-db.sh                    # Default: backs up to ./backups/
#   ./scripts/backup-db.sh /path/to/backup/   # Custom backup directory
#
# Add to crontab for daily backups:
#   0 3 * * * /path/to/adcraft/scripts/backup-db.sh >> /var/log/adcraft-backup.log 2>&1
#

set -euo pipefail

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_PATH="${PROJECT_DIR}/db/custom.db"
BACKUP_DIR="${1:-${PROJECT_DIR}/backups}"
RETENTION_DAYS=30

# --- Pre-flight checks ---
if [ ! -f "$DB_PATH" ]; then
  echo "ERROR: Database file not found at $DB_PATH"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/adcraft_${TIMESTAMP}.db"

echo "[$(date -Iseconds)] Starting backup..."

# --- Backup ---
# Try sqlite3 backup API first (safest, handles concurrent writes)
if command -v sqlite3 &>/dev/null; then
  sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
  echo "[$(date -Iseconds)] Backup created via sqlite3 backup API: $BACKUP_FILE"
else
  # Fallback: file copy (safe if no writes are happening)
  cp "$DB_PATH" "$BACKUP_FILE"
  echo "[$(date -Iseconds)] Backup created via file copy (install sqlite3 for safer backups): $BACKUP_FILE"
fi

# Compress the backup
if command -v gzip &>/dev/null; then
  gzip "$BACKUP_FILE"
  echo "[$(date -Iseconds)] Compressed: ${BACKUP_FILE}.gz"
  BACKUP_FILE="${BACKUP_FILE}.gz"
fi

# Show backup size
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date -Iseconds)] Backup size: $SIZE"

# --- Cleanup old backups ---
if [ "$RETENTION_DAYS" -gt 0 ]; then
  DELETED=$(find "$BACKUP_DIR" -name "adcraft_*.db*" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
  if [ "$DELETED" -gt 0 ]; then
    echo "[$(date -Iseconds)] Cleaned up $DELETED backup(s) older than $RETENTION_DAYS days"
  fi
fi

echo "[$(date -Iseconds)] Backup complete!"
