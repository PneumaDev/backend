import userModel from "../models/userModel.js"


// <---------Add Products To Cart------------->
const addToCart = async (req, res) => {
    try {
        const { userId, itemId, size } = req.body
        const userData = await userModel.findById(userId)
        const cartData = await userData.cartData

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1
            }
            else {
                cartData[itemId][size] = 1
            }
        }
        else {
            cartData[itemId] = {}
            cartData[itemId][size] = 1
        }

        await userModel.findByIdAndUpdate(userId, { cartData })

        res.json({ success: true, message: "Added To Cart" })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}



// <---------Update User Cart------------->
const updateCart = async (req, res) => {
    try {
        const { userId, itemId, size, quantity } = req.body;

        // Find user
        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        let cartData = userData.cartData;

        // If quantity is zero, remove the size or the item
        if (quantity === 0) {
            if (cartData[itemId]) {
                delete cartData[itemId][size]; // Remove the size
                // If the item has no sizes left, remove the item
                if (Object.keys(cartData[itemId]).length === 0) {
                    delete cartData[itemId];
                }
            }
        } else {
            // Otherwise, update the quantity
            if (!cartData[itemId]) cartData[itemId] = {}; // Initialize if it doesn't exist
            cartData[itemId][size] = quantity;
        }

        // Update the user's cart in the database
        await userModel.findByIdAndUpdate(userId, { cartData });
        res.json({ success: true, message: "Cart updated successfully" });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};


// <---------Get User Cart------------->
const getUserCart = async (req, res) => {
    try {
        const { userId } = req.body;

        // Fetch only the `cartData` field for the user
        let user = await userModel.findById(userId).lean();;

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (!user.cartData) {
            user.cartData = {};
        }
        res.json({ success: true, user });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};


export { addToCart, updateCart, getUserCart }

