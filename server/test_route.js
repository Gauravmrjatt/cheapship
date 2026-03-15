// const labelCustomizer = require('./server/utils/label-customizer.js');
const { getShipRocketUserToken } = require('./utils/shiprocket.js');
(async () => {
  console.log(await getShipRocketUserToken());
})();