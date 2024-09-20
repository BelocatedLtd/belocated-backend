import { v2 as cloudinary } from 'cloudinary'

// Cloudinary configuration
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
})

const opts = {
	overwrite: true,
	invalidate: true,
	resource_type: 'auto' as 'auto', // Type assertion for resource_type
}

// Type for an image object
interface Image {
	path: string
}

// Function to upload multiple images to Cloudinary
export const uploadMultipleImages = async (
	images: Image[],
): Promise<string[]> => {
	try {
		const uploadPromises = images.map((image) =>
			cloudinary.uploader.upload(image.path, { folder: 'uploads', ...opts }),
		)

		// Wait for all uploads to complete
		const results = await Promise.all(uploadPromises)

		// Return an array of secure URLs
		return results.map((result) => result.secure_url)
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Error uploading images: ${error.message}`)
		} else {
			throw new Error('Unknown error occurred while uploading images')
		}
	}
}
