const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'presensi_magang',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true // Required for running schema.sql
});

pool.getConnection()
  .then(async (connection) => {
    console.log('Database connected successfully');
    
    // Auto-migrate if database is empty (e.g. fresh cloud database on Railway)
    try {
      const [rows] = await connection.query("SHOW TABLES LIKE 'users'");
      if (rows.length === 0) {
        console.log('No tables found. Running auto-migration...');
        const schemaPath = path.join(__dirname, '../../../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await connection.query(schema);
        console.log('Auto-migration completed successfully!');
      }
    } catch (migrateErr) {
      console.error('Error during auto-migration:', migrateErr.message);
    }

    connection.release();
  })
  .catch((err) => {
    console.error('Error connecting to database:', err.message);
  });

module.exports = pool;
