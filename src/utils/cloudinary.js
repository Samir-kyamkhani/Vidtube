import {v2 as cloudinary} from "cloudinary";
import fs from 'fs'; // node file system   
import dotenv from 'dotenv';

dotenv.config({
    path: './.env' // config file path
});

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
  });

const uploadOnCloudinary = async (localFilePath) => {  
    try {
        if(!localFilePath) return "File is not found" || null
        
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        fs.unlinkSync(localFilePath); // remove the local save file as upload operation is successful
        return response;
        
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the local save file as upload operation failed
        return null; // return null as upload operation failed
    }
}


export {uploadOnCloudinary}