#!/bin/bash

# Simple backup script for monthly snapshot data
# Usage: ./scripts/backup-monthly-data.sh

# Get current timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_monthly_snapshot_${TIMESTAMP}.sql"

echo "Creating backup: $BACKUP_FILE"

# Create backup using pg_dump (PostgreSQL 17)
pg_dump -h ep-morning-recipe-a8egjvqz-pooler.eastus2.azure.neon.tech \
        -U neondb_owner \
        -d neondb \
        --table=monthly_snapshot \
        --table=yearly_data \
        --table=holdings \
        --data-only \
        --no-owner \
        --no-privileges \
        > "backups/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: backups/$BACKUP_FILE"
    echo "📊 Backup size: $(du -h backups/$BACKUP_FILE | cut -f1)"
else
    echo "❌ Backup failed"
    exit 1
fi 