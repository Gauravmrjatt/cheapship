
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log('Checking commission_withdrawals table columns...');
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'commission_withdrawals'
    `);
    console.log('Columns:', cols.rows.map(r => r.column_name).join(', '));
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

main();
