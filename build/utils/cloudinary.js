"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleImages = void 0;
const cloudinary_1 = require("cloudinary");
// Cloudinary configuration
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const opts = {
    overwrite: true,
    invalidate: true,
    resource_type: 'auto', // Type assertion for resource_type
};
// Function to upload multiple images to Cloudinary
const uploadMultipleImages = async (images) => {
    try {
        const uploadPromises = images.map((image) => cloudinary_1.v2.uploader.upload(image.path, { folder: 'uploads', ...opts }));
        // Wait for all uploads to complete
        const results = await Promise.all(uploadPromises);
        // Return an array of secure URLs
        return results.map((result) => result.secure_url);
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error uploading images: ${error.message}`);
        }
        else {
            throw new Error('Unknown error occurred while uploading images');
        }
    }
};
exports.uploadMultipleImages = uploadMultipleImages;
//# sourceMappingURL=cloudinary.js.map