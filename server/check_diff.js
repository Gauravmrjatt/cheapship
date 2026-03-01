const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = require('./utils/prisma');

async function main() {
  try {
    const schemaContent = fs.readFileSync(path.join(__dirname, 'prisma/schema.prisma'), 'utf8');
    const orderModelMatch = schemaContent.match(/model Order \{([\s\S]+?)\}/);
    if (!orderModelMatch) {
      console.log('Could not find Order model in schema');
      return;
    }
    const modelFields = orderModelMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//') && !line.startsWith('@@'))
      .map(line => line.split(/\s+/)[0]);

    const orderCols = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `;
    const dbCols = orderCols.map(r => r.column_name);

    const missingInDb = modelFields.filter(f => !dbCols.includes(f) && !['user', 'order_pickup_address', 'order_receiver_address', 'referral_commissions', 'rto_dispute', 'shipment_history', 'weight_dispute'].includes(f));
    const extraInDb = dbCols.filter(f => !modelFields.includes(f));

    console.log('Missing in DB:', missingInDb);
    console.log('Extra in DB:', extraInDb);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
