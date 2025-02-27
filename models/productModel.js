import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, index: "text" },
    isOriginal: { type: Boolean, required: true },
    quantity: { type: Number, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: Array, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    sizes: { type: Array, required: true },
    totalSold: { type: Number, default: 0 },
    bestSeller: { type: Boolean, default: false },
    date: { type: Number, required: true },
    sku: { type: String, unique: true },
    ratings: { type: Number, min: 0, max: 5 },
    reviews: [
        {
            userId: mongoose.Schema.Types.ObjectId,
            userName: String,
            review: String,
            rating: Number
        }
    ],
    discount: { type: Number, default: 0 },
    tags: { type: Array }
}, {
    timestamps: true
});

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
