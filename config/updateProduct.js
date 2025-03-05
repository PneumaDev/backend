import productModel from "../models/productModel.js"; // Import the product model

export default async function updateOrder(items) {
    try {
        // Loop through each item in the order
        for (const item of items) {
            const { _id, sizes } = item;

            // Calculate total quantity ordered for this product
            const totalOrderedQuantity = sizes.reduce((sum, size) => sum + size.quantity, 0);

            // Find the product by ID
            const product = await productModel.findById(_id);
            if (!product) {
                console.error(`Product with ID ${_id} not found.`);
                continue; // Skip to the next item
            }

            // Deduct ordered quantity from total stock
            product.quantity -= totalOrderedQuantity;
            if (product.quantity < 0) {
                product.quantity = 0; // Prevent negative stock
            }

            // Track total sold items
            product.totalSold = (product.totalSold || 0) + totalOrderedQuantity;

            // Save the updated product
            await product.save();
        }

        return { success: true, message: "Order items updated" };

    } catch (error) {
        console.error("Error updating order:", error);
        return { success: false, message: "Error updating order", error };
    }
}
