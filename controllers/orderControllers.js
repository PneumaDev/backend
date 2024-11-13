import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";


// <--------------Placing Order Using COD method-------------->
const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        const orderData = {
            userId,
            address,
            items,
            amount,
            paymentMethod: "COD",
            payment: "false",
            date: Date.now(),
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        // After making the order, clear the user's cart data in the db
        await userModel.findByIdAndUpdate(userId, { cartData: {} })

        res.json({ success: true, message: "Order Placed!" })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })

    }
}

// <--------------Placing Order Using Stripe-------------->
const placeOrderStripe = async () => {

}

// <---------------Placing Order Using Mpesa--------------->
const placeOrderMpesa = async () => {

}

// <--------------Get all orders for Admin Panel-------------->
const allOrders = async () => {

}

// <--------------User Order Data for Frontend-------------->
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body;

        const orders = await orderModel.find({ userId })
        res.json({ success: true, orders })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }

}

// <--------------User Order Data for Frontend-------------->
const updateStatus = async () => {

}

export { placeOrder, placeOrderStripe, userOrders, allOrders, updateStatus, placeOrderMpesa }