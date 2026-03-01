# DATABASE Scripts

This folder contains database backup and restore scripts for the DigiStall system.

## Scripts

### backup.cjs
Creates a backup of the MySQL database.

**Usage:**
```bash
node DATABASE/backup.cjs
```

**Output:**
- Creates a `.sql` file in the `DATABASE/backups/` directory
- Filename format: `{DB_NAME}_backup_{timestamp}.sql`
- Includes stored procedures, triggers, and all data

### restore.cjs
Restores the MySQL database from a backup file.

**Usage:**
```bash
# Interactive mode (lists available backups)
node DATABASE/restore.cjs

# Direct restore with specific file
node DATABASE/restore.cjs backup_file.sql
```

**Features:**
- Lists all available backup files
- Interactive selection of backup to restore
- Confirmation prompt before overwriting database

## Configuration

These scripts use environment variables from the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | Database host | localhost |
| DB_USER | Database username | root |
| DB_PASSWORD | Database password | (empty) |
| DB_NAME | Database name | naga_stall |
| DB_PORT | Database port | 3306 |

## Backup Directory

All backups are stored in `DATABASE/backups/` directory.

## Best Practices

1. **Regular Backups**: Schedule daily backups using cron or Task Scheduler
2. **Before Major Changes**: Always backup before schema changes or deployments
3. **Test Restores**: Periodically test restore process to ensure backups are valid
4. **Offsite Storage**: Copy important backups to external storage

## Requirements

- MySQL client tools (`mysqldump` and `mysql`) must be installed and accessible
- Node.js runtime
- Valid database credentials in `.env` file
