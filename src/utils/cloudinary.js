import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'; // node file system   

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {  
    try {
        if(!localFilePath) return;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        return response.url;

    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the local save file as upload operation failed
        return null; // return null as upload operation failed
    }
}


export {uploadOnCloudinary}