const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use PostgreSQL in production (Render), MySQL locally
const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  process.env.DATABASE_URL || process.env.DB_NAME || 'loomio_db',
  process.env.DB_USER || (isProduction ? 'loomio_user' : 'root'),
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || (isProduction ? 5432 : 3306),
    dialect: isProduction ? 'postgres' : 'mysql',
    dialectOptions: isProduction
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      : {},
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
