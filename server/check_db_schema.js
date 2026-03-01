
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log('Checking orders table columns...');
    const orderCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `);
    console.log('Orders columns:', orderCols.rows.map(r => r.column_name).join(', '));

    console.log('Checking users table columns...');
    const userCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('Users columns:', userCols.rows.map(r => r.column_name).join(', '));
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

main();
