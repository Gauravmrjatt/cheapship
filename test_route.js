const labelCustomizer = require('./server/utils/label-customizer.js');

(async () => {
  let labelUrl =
    'https://shiprocket-db-mum.s3.ap-south-1.amazonaws.com/pdfs/label_9257848_019ca340-c900-713f-b0f6-a04e278bc60b.pdf';

  labelUrl = await labelCustomizer.customize(labelUrl, "132444");

  console.log(labelUrl);
})();