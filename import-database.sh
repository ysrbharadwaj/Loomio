#!/bin/bash

# Loomio Database Import Script
# Run this script on your new system to import the database backup

echo "🚀 Loomio Database Import Script"
echo "================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: This doesn't appear to be the Loomio project directory."
    echo "   Make sure you're running this script from the root of the Loomio project."
    exit 1
fi

# Check if exports directory exists
if [ ! -d "exports" ]; then
    echo "❌ Error: 'exports' directory not found!"
    echo "   Make sure you've copied the database export from your old system."
    exit 1
fi

# Load environment variables
if [ -f "backend/.env" ]; then
    source backend/.env
elif [ -f "backend/env.config" ]; then
    source backend/env.config
else
    echo "❌ Error: No environment configuration found!"
    echo "   Make sure backend/.env or backend/env.config exists."
    exit 1
fi

# Set default values
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-loomio_db}
DB_USER=${DB_USER:-loomio_user}

echo "📊 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"  
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Find the most recent SQL backup file
LATEST_SQL=$(find exports -name "*.sql" -type f | sort | tail -n 1)
LATEST_GZ=$(find exports -name "*.sql.gz" -type f | sort | tail -n 1)

if [ -z "$LATEST_SQL" ] && [ -z "$LATEST_GZ" ]; then
    echo "❌ Error: No database backup files found in exports directory!"
    echo "   Expected files: *.sql or *.sql.gz"
    exit 1
fi

# Determine which file to use
IMPORT_FILE=""
if [ -n "$LATEST_GZ" ]; then
    echo "📦 Found compressed backup: $LATEST_GZ"
    read -p "Use compressed backup? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        IMPORT_FILE="$LATEST_GZ"
        USE_COMPRESSED=true
    fi
fi

if [ -z "$IMPORT_FILE" ] && [ -n "$LATEST_SQL" ]; then
    IMPORT_FILE="$LATEST_SQL"
    USE_COMPRESSED=false
    echo "📄 Using SQL backup: $IMPORT_FILE"
fi

if [ -z "$IMPORT_FILE" ]; then
    echo "❌ Error: No suitable backup file found!"
    exit 1
fi

# Check file size
if [ "$USE_COMPRESSED" = true ]; then
    FILE_SIZE=$(du -h "$IMPORT_FILE" | cut -f1)
    echo "📦 Backup file size (compressed): $FILE_SIZE"
else
    FILE_SIZE=$(du -h "$IMPORT_FILE" | cut -f1)
    echo "📦 Backup file size: $FILE_SIZE"
fi

# Check MySQL connection
echo "🔍 Testing MySQL connection..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Error: Cannot connect to MySQL database!"
    echo "   Please check your database credentials and ensure MySQL is running."
    echo ""
    echo "💡 Troubleshooting:"
    echo "   1. Make sure MySQL is installed and running"
    echo "   2. Verify database credentials in backend/.env"
    echo "   3. Ensure the database '$DB_NAME' exists"
    echo "   4. Check if user '$DB_USER' has proper permissions"
    exit 1
fi

echo "✅ MySQL connection successful!"

# Check if database exists
DB_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SHOW DATABASES LIKE '$DB_NAME';" | grep "$DB_NAME")
if [ -z "$DB_EXISTS" ]; then
    echo "❌ Error: Database '$DB_NAME' does not exist!"
    echo "   Please create the database first or run setup-project.sh"
    exit 1
fi

# Warn about data overwrite
echo "⚠️  WARNING: This will replace all data in the '$DB_NAME' database!"
echo "   All existing tables and data will be dropped and recreated."
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Import cancelled by user"
    exit 1
fi

# Create backup of current database (if it has tables)
TABLES_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SHOW TABLES;" | wc -l)
if [ $TABLES_COUNT -gt 1 ]; then
    echo "💾 Creating backup of current database..."
    BACKUP_FILE="exports/pre_import_backup_$(date +%Y%m%d_%H%M%S).sql"
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
        --routines --triggers --single-transaction \
        "$DB_NAME" > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Current database backed up to: $BACKUP_FILE"
    else
        echo "⚠️  Warning: Failed to backup current database"
    fi
fi

# Import the database
echo "📥 Importing database from backup..."
echo "   This may take several minutes depending on the backup size..."

if [ "$USE_COMPRESSED" = true ]; then
    # Import compressed file
    gunzip -c "$IMPORT_FILE" | mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
else
    # Import regular SQL file  
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$IMPORT_FILE"
fi

if [ $? -eq 0 ]; then
    echo "✅ Database imported successfully!"
else
    echo "❌ Error: Database import failed!"
    if [ -f "$BACKUP_FILE" ]; then
        echo "   You can restore the previous database using: $BACKUP_FILE"
    fi
    exit 1
fi

# Verify import
echo "🔍 Verifying database import..."
TABLES_AFTER=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SHOW TABLES;" | wc -l)

if [ $TABLES_AFTER -gt 1 ]; then
    echo "✅ Database verification successful!"
    echo "   Tables imported: $((TABLES_AFTER - 1))"
    
    # Show table list
    echo ""
    echo "📋 Imported Tables:"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SHOW TABLES;" | tail -n +2 | sed 's/^/   - /'
    
else
    echo "❌ Error: Database verification failed - no tables found!"
    exit 1
fi

# Check for critical tables
CRITICAL_TABLES=("Users" "Communities" "Tasks" "TaskAssignments" "UserCommunity")
MISSING_TABLES=()

for table in "${CRITICAL_TABLES[@]}"; do
    TABLE_EXISTS=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME; SHOW TABLES LIKE '$table';" | grep "$table")
    if [ -z "$TABLE_EXISTS" ]; then
        MISSING_TABLES+=("$table")
    fi
done

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo "⚠️  Warning: Some critical tables are missing:"
    for table in "${MISSING_TABLES[@]}"; do
        echo "   - $table"
    done
    echo "   The application may not work correctly."
else
    echo "✅ All critical tables found!"
fi

# Run database migrations/sync if needed
if [ -f "backend/src/models/index.js" ]; then
    echo "🔄 Syncing database models..."
    cd backend
    node -e "
        require('dotenv').config();
        const db = require('./src/models');
        db.sequelize.sync({ alter: false })
            .then(() => {
                console.log('✅ Database models synced successfully');
                process.exit(0);
            })
            .catch(err => {
                console.error('❌ Error syncing models:', err.message);
                process.exit(1);
            });
    "
    cd ..
fi

echo ""
echo "🎉 Database Import Complete!"
echo "============================"
echo ""
echo "📋 Import Summary:"
echo "   ✅ Database: $DB_NAME"
echo "   ✅ Source: $IMPORT_FILE"
echo "   ✅ Tables: $((TABLES_AFTER - 1))"
echo "   ✅ Host: $DB_HOST:$DB_PORT"
echo ""
echo "📝 Next Steps:"
echo "   1. Start the application: ./start-loomio.sh"
echo "   2. Open your browser to: http://localhost:3000"
echo "   3. Log in with your existing credentials"
echo ""
echo "🔧 If you encounter issues:"
echo "   - Check backend/.env for correct database settings"
echo "   - Ensure all dependencies are installed: npm install"
echo "   - Check application logs for any errors"
echo ""
if [ -f "$BACKUP_FILE" ]; then
    echo "💾 Backup of previous database: $BACKUP_FILE"
    echo ""
fi