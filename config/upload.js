const multer = require('multer');
const ImageKit = require('imagekit');
const sharp = require('sharp');

const upload = multer({ storage: multer.memoryStorage() });

let imagekit;
if (process.env.IMAGEKIT_PUBLIC_KEY) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
  });
}

exports.uploadAndOptimize = async (file) => {
  if (!imagekit) {
    console.warn("ImageKit not configured. Returning mock URL.");
    return "https://placehold.co/600x400?text=ImageKit+Not+Configured";
  }
  const optimized = await sharp(file.buffer).resize(1200).webp({ quality: 80 }).toBuffer();
  const result = await imagekit.upload({ file: optimized, fileName: file.originalname });
  return result.url;
};

exports.upload = upload;
