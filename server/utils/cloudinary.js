const cloudinary = require('cloudinary').v2;

console.log('[Cloudinary] Env check - process.env:', Object.keys(process.env).filter(k => k.startsWith('CLOUD')));

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('[Cloudinary] Config check:', {
  cloudName: cloudName ? 'set' : 'MISSING',
  apiKey: apiKey ? 'set' : 'MISSING',
  apiSecret: apiSecret ? 'set' : 'MISSING'
});

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

const uploadPdfToCloudinary = async (pdfBuffer, folder = 'cheapship/labels') => {
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('[Cloudinary] Credentials not configured, skipping upload');
    throw new Error('Cloudinary credentials not configured');
  }

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
          console.error('[Cloudinary] Upload error details:', JSON.stringify(error, null, 2));
          reject(error);
        } else {
          console.log('[Cloudinary] Upload success:', result.secure_url);
          resolve(result);
        }
      }
    );

    uploadStream.on('progress', (p) => {
      console.log('[Cloudinary] Upload progress:', p);
    });

    uploadStream.end(pdfBuffer);
  });
};

module.exports = { cloudinary, uploadPdfToCloudinary };
