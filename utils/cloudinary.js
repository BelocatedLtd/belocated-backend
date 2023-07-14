import { v2 as cloudinary } from 'cloudinary'


// Return "https" URLs by setting secure: true
cloudinary.config({
  cloud_name: "dlmmbvsir",
  api_key: "318122474438856",
  api_secret: "2HPYE35_CPP2bMnjd2F8BntHFYE",
});

const opts = {
  overwrite: true,
  invalidate: true,
  resource_type: "auto"
}

// Function to upload multiple images to Cloudinary
export const uploadMultipleImages = async(images) => {
  try {
    const uploadPromises = images.map((image) =>
      cloudinary.uploader.upload(image.path, { folder: 'uploads' })
    );

    const results = await Promise.all(uploadPromises);
    return results.secure_url;
  } catch (error) {
    throw new Error(`Error uploading images: ${error.message}`);
  }
}
  

  // return new Promise((resolve, reject) => {
  //   cloudinary.uploader.upload(image, opts, (error, result) => {
  //     if (result && result.secure_url) {
  //       console.log(result.secure_url);
  //       return resolve(result.secure_url)
  //     }
  //     console.log(error.message);
  //     return reject({message: error.message})
  //   })
  // })


