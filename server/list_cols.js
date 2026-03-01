
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const prisma = require('./utils/prisma');

async function main() {
  try {
    console.log('Checking user_id and id data types...');
    const orderUserId = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'user_id'
    `;
    console.log('Order user_id:', orderUserId);

    const userId = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id'
    `;
    console.log('User id:', userId);
    
    const shippingCharge = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'shipping_charge'
    `;
    console.log('Order shipping_charge:', shippingCharge);

  } catch (error) {
    console.error('Error checking types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
