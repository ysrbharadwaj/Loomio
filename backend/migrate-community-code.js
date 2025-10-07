const sequelize = require('./src/config/database');
require('dotenv').config();

async function migrateCommunityCode() {
  try {
    console.log('🔄 Starting migration to add community_code column...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Check if community_code column exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'loomio_db'}' 
      AND TABLE_NAME = 'communities' 
      AND COLUMN_NAME = 'community_code'
    `);

    if (results.length === 0) {
      console.log('⚡ Adding community_code column...');
      
      // Add the community_code column
      await sequelize.query(`
        ALTER TABLE communities 
        ADD COLUMN community_code VARCHAR(6) UNIQUE
      `);
      
      console.log('✅ community_code column added successfully.');
      
      // Generate community codes for existing communities
      const [communities] = await sequelize.query('SELECT community_id FROM communities WHERE community_code IS NULL');
      
      for (const community of communities) {
        let code;
        let isUnique = false;
        
        while (!isUnique) {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          code = '';
          for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          
          // Check if code already exists
          const [existing] = await sequelize.query('SELECT community_id FROM communities WHERE community_code = ?', {
            replacements: [code]
          });
          
          if (existing.length === 0) {
            isUnique = true;
          }
        }
        
        // Update the community with the generated code
        await sequelize.query('UPDATE communities SET community_code = ? WHERE community_id = ?', {
          replacements: [code, community.community_id]
        });
        
        console.log(`✅ Generated code ${code} for community ${community.community_id}`);
      }
      
      // Make the column NOT NULL after populating data
      await sequelize.query(`
        ALTER TABLE communities 
        MODIFY COLUMN community_code VARCHAR(6) NOT NULL UNIQUE
      `);
      
      console.log('✅ community_code column is now NOT NULL and UNIQUE.');
      
    } else {
      console.log('✅ community_code column already exists.');
    }

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
migrateCommunityCode();