import { v2 as cloudinary } from 'cloudinary';

import multer from 'multer';
import logger from '../utils/logger.js';
import stream from 'stream';

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

logger.info(`[Cloudinary Config] Cloud Name: ${cloudName ? 'Set' : 'Missing'}`);
logger.info(`[Cloudinary Config] API Key: ${apiKey ? 'Set' : 'Missing'}`);
logger.info(`[Cloudinary Config] API Secret: ${apiSecret ? 'Set' : 'Missing'}`);

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
});

// Configure Multer Storage (Memory Storage for processing buffer)
const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB limit
});

export const uploadToCloudinary = (fileBuffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'aibase_uploads',
                resource_type: 'auto',
                ...options
            },
            (error, result) => {
                if (error) {
                    logger.error(`[Cloudinary Stream Error]: ${JSON.stringify(error)}`);
                    return reject(error);
                }
                resolve(result);
            }
        );
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileBuffer);
        bufferStream.pipe(uploadStream);
    });
};

export default { cloudinary, upload, uploadToCloudinary };
