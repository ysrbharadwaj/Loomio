#!/bin/bash

# Loomio Database Export Script
# Run this script on your current system to export the database

echo "🚀 Loomio Database Export Script"
echo "================================"

# Load environment variables
if [ -f "backend/env.config" ]; then
    source backend/env.config
else
    echo "❌ Error: backend/env.config file not found!"
    exit 1
fi

# Set default values if not in env file
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-loomio_db}
DB_USER=${DB_USER:-root}

# Create exports directory
mkdir -p exports
EXPORT_DIR="exports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
EXPORT_FILE="${EXPORT_DIR}/loomio_db_${TIMESTAMP}.sql"

echo "📊 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Check if MySQL is accessible
echo "🔍 Testing MySQL connection..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME;" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Error: Cannot connect to MySQL database!"
    echo "   Please check your database credentials and ensure MySQL is running."
    exit 1
fi

echo "✅ MySQL connection successful!"
echo ""

# Export database structure and data
echo "📤 Exporting database structure and data..."
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
    --routines --triggers --single-transaction --lock-tables=false \
    --add-drop-table --create-options --extended-insert \
    "$DB_NAME" > "$EXPORT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database exported successfully to: $EXPORT_FILE"
    
    # Get file size
    FILE_SIZE=$(du -h "$EXPORT_FILE" | cut -f1)
    echo "📦 Export file size: $FILE_SIZE"
    
    # Create a compressed version
    echo "🗜️  Creating compressed backup..."
    gzip -c "$EXPORT_FILE" > "${EXPORT_FILE}.gz"
    COMPRESSED_SIZE=$(du -h "${EXPORT_FILE}.gz" | cut -f1)
    echo "✅ Compressed backup created: ${EXPORT_FILE}.gz ($COMPRESSED_SIZE)"
    
else
    echo "❌ Error: Database export failed!"
    exit 1
fi

# Create a metadata file
cat > "${EXPORT_DIR}/export_info_${TIMESTAMP}.txt" << EOF
Loomio Database Export Information
==================================
Export Date: $(date)
Database Name: $DB_NAME
Database Host: $DB_HOST:$DB_PORT
Database User: $DB_USER
Export File: loomio_db_${TIMESTAMP}.sql
Compressed File: loomio_db_${TIMESTAMP}.sql.gz
Node.js Version: $(node --version 2>/dev/null || echo "Not installed")
npm Version: $(npm --version 2>/dev/null || echo "Not installed")
MySQL Version: $(mysql --version 2>/dev/null || echo "Not available")

Project Structure:
- Frontend: React + Vite
- Backend: Node.js + Express + Sequelize
- Database: MySQL
- Authentication: JWT

Notes:
- This export includes complete database structure and data
- Use import-database.sh on the new system to restore
- Make sure to copy the entire project folder along with this export
EOF

echo ""
echo "📋 Export Summary:"
echo "   Database export: $EXPORT_FILE"
echo "   Compressed backup: ${EXPORT_FILE}.gz"
echo "   Metadata file: ${EXPORT_DIR}/export_info_${TIMESTAMP}.txt"
echo ""
echo "🎉 Export completed successfully!"
echo ""
echo "📝 Next Steps:"
echo "   1. Copy the entire project folder to your new system"
echo "   2. Copy the 'exports' folder with the database backup"
echo "   3. Run setup-project.sh on the new system"
echo "   4. Run import-database.sh to restore the database"