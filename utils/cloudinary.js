import { v2 as cloudinary } from 'cloudinary'

// Return "https" URLs by setting secure: true
cloudinary.config({
  cloud_name: "dlmmbvsir",
  api_key: "318122474438856",
  api_secret: "2HPYE35_CPP2bMnjd2F8BntHFYE",
});

export const imagesUploader = async (images) => {
  try {
    for (const image of images) {
      const uploadedImages = await cloudinary.uploader.upload(image, {folder: 'Task Submit Screenshots', resource_type: 'image'})
      console.log(uploadedImages)
      return uploadedImages.secure_url
    }
  } catch (error) {
    throw new Error(error)
  }
  
}



export default cloudinary
