import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

/**
 * Configure the SDK once. Credentials deliberately remain server-only: the
 * browser receives a delivered image URL, never an API secret or upload token.
 */
if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export const cloudinaryFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || "gate-da/questions";

export function isCloudinaryConfigured(): boolean {
  return Boolean(cloudName && apiKey && apiSecret);
}

export default cloudinary;
