import { v2 as cloudinary } from "cloudinary";

// Function to configure Cloudinary with environment variables
const connectCloudinary = async () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });
};

// Function to upload an image to Cloudinary
export const uploadImage = async (filePath) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            // Set transformation options for image processing
            transformation: [
                { width: 1000, crop: "scale" },
                { quality: "auto" },
            ],
            format: "webp",
        });

        return result;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};

// Export the configuration function for connecting to Cloudinary
export default connectCloudinary;
