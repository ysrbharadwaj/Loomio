require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');

  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));

    console.log(`\nFound ${files.length} migration file(s):\n`);

    // Run each migration
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`📝 Running: ${file}...`);
      
      try {
        // Skip empty files
        if (!sql.trim()) {
          console.log(`   ⚠️  Empty file (skipping)\n`);
          continue;
        }

        await connection.query(sql);
        console.log(`   ✅ Success\n`);
      } catch (error) {
        // Check if error is "already exists" which is okay
        if (error.code === 'ER_DUP_FIELDNAME' || 
            error.code === 'ER_DUP_KEYNAME' ||
            error.code === 'ER_TABLE_EXISTS_ERROR' ||
            error.message.includes('already exists') ||
            error.message.includes('Duplicate')) {
          console.log(`   ⚠️  Already applied (skipping)\n`);
        } else {
          throw error;
        }
      }
    }

    await connection.end();
    console.log('✅ All migrations completed!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

runMigrations();
