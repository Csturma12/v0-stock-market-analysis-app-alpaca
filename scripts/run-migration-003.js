const { Pool } = require('pg');
const fs = require('fs');

async function runMigration() {
  const pool = new Pool({ 
    connectionString: process.env.POSTGRES_URL 
  });

  try {
    const sql = fs.readFileSync('scripts/003-stock-patterns.sql', 'utf8');
    await pool.query(sql);
    console.log('[v0] ✓ Pattern table created successfully');
  } catch (error) {
    console.log('[v0] Error:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();
