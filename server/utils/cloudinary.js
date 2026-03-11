const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadPdfToCloudinary = async (pdfBuffer, folder = 'cheapship/labels') => {
  console.log(`[Cloudinary] Starting PDF upload to folder: ${folder}, buffer size: ${pdfBuffer ? pdfBuffer.length : 0} bytes`);
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw',
        format: 'pdf',
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Error uploading label:', error);
          reject(error);
        } else {
          console.log('[Cloudinary] Label uploaded successfully:', result);
          resolve(result);
        }
      }
    );

    uploadStream.end(pdfBuffer);
  });
};

module.exports = { cloudinary, uploadPdfToCloudinary };
