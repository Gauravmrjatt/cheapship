const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const search = "123";
    const where = { user_id: 'e6a8dd2e-b695-4aa8-bc71-7f9f3efbae08' };

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(search);
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { reference_id: { contains: search, mode: 'insensitive' } }
    ];
    if (isUUID) {
      where.OR.push({ id: search });
    }
    
    const res = await prisma.transaction.findMany({ where });
    console.log("Success:", res.length);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();
