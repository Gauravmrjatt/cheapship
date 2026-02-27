const { getServiceability } = require('./server/utils/shiprocket.js');
async function test() {
  try {
    const res = await getServiceability({
      pickup_postcode: "335526",
      delivery_postcode: "110001",
      weight: 1,
      cod: 0,
      declared_value: 500,
      is_return: 0,
      length: 10,
      breadth: 10,
      height: 10,
      mode: "Surface"
    });
    console.log("Total Couriers Returned:", res.data?.available_courier_companies?.length || res);
  } catch(e) {
    console.error(e);
  }
}
test();
