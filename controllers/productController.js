import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";

// <-------- Function to add product --------->
const addProduct = async (req, res) => {
    try {
        const { name, isOriginal, averageWeight, bestSeller, quantity, description, price, category, subCategory, sizes, sku, brand, discount, tags } = req.body;


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
            bestSeller,
            category,
            isOriginal,
            price: Number(price),
            subCategory,
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


// <-------- Function to update product --------->
const updateProduct = async (req, res) => {
    const productId = req.body.id
    await productModel.findByIdAndUpdate()
}


// <-------- Function to list product --------->
const listProduct = async (req, res) => {
    try {
        let query = {};

        // Apply filters
        if (req.query.name) {
            query.$text = { $search: req.query.name };
        }
        if (req.query.category && req.query.category !== "All") {
            query.category = req.query.category;
        }
        if (req.query.subCategory && req.query.subCategory !== "All") {
            query.subCategory = req.query.subCategory;
        }
        if (req.query.minPrice) {
            query.price = { ...query.price, $gte: Number(req.query.minPrice) };
        }
        if (req.query.maxPrice) {
            query.price = { ...query.price, $lte: Number(req.query.maxPrice) };
        }
        if (req.query.bestSeller) {
            query.bestSeller = req.query.bestSeller === "true";
        }
        if (req.query.inStock) {
            query.inStock = req.query.inStock === "true";
        }

        // Add `ids` filter
        if (req.query.ids) {
            const idsArray = req.query.ids.split(",");
            query._id = { $in: idsArray };
        }

        // Pagination
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        // Extract fields from request (handle both array and string cases)
        let fields = req.query.fields || (req.body ? req.body.fields : "");
        let projection = {};

        if (Array.isArray(fields)) {
            // If fields is an array, join it into a comma-separated string
            fields = fields.join(",");
        }

        if (typeof fields === "string" && fields.length > 0) {
            fields.split(",").forEach(field => {
                projection[field.trim()] = 1; // Include only requested fields
            });
        }

        // Fetch products with projection
        const products = await productModel
            .find(query, projection)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({ success: true, products });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};


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
        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({ success: true, product })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export { removeProduct, singleProductInfo, listProduct, addProduct, updateProduct }