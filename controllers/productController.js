import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";

// <-------- Function to add product --------->
const addProduct = async (req, res) => {
    try {
        const { name, isOriginal, averageWeight, quantity, description, price, category, subCategory, bestSeller, sizes, sku, brand, discount, tags } = req.body;


        // Check if `req.files` exists and safely access each image
        const image1 = req.files?.image1 ? req.files.image1[0] : undefined;
        const image2 = req.files?.image2 ? req.files.image2[0] : undefined;
        const image3 = req.files?.image3 ? req.files.image3[0] : undefined;
        const image4 = req.files?.image4 ? req.files.image4[0] : undefined;

        const images = [image1, image2, image3, image4].filter(image => image !== undefined);

        // Upload images to Cloudinary
        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' })
                return result.secure_url;
            })
        )

        // Create a new product object
        const productData = {
            name,
            averageWeight,
            quantity,
            sku,
            brand,
            discount,
            tags: tags && JSON.parse(tags),
            description,
            category,
            isOriginal,
            price: Number(price),
            subCategory,
            bestSeller: bestSeller === "true" ? true : false,
            sizes: JSON.parse(sizes),
            image: imagesUrl,
            date: Date.now(),
        }

        // Save the product to the database
        const product = new productModel(productData)
        await product.save()

        res.json({ success: true, message: "Product added!" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// <-------- Function to list product --------->
const listProduct = async (req, res) => {
    try {
        // Specify only the fields to retrieve
        const products = await productModel.find({});

        // Send the response with the selected fields
        res.json({ success: true, products });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}


// <-------- Function to remove product --------->
const removeProduct = async (req, res) => {
    try {

        await productModel.findByIdAndDelete(req.body.id)
        res.json({ success: true, message: "Product Removed" })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// <-------- Function to get single product info --------->
const singleProductInfo = async (req, res) => {
    try {
        console.log('Called');
        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({ success: true, product })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export { removeProduct, singleProductInfo, listProduct, addProduct }