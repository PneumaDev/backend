import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import { stkPushRequest } from "daraja-kit";


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
const placeOrderMpesa = async (req, res) => {
    const { userId, items, amount, address } = req.body;


    try {
        let phoneNumber = address.phone;
        if (phoneNumber.startsWith('07') || phoneNumber.startsWith('01')) {
            phoneNumber = '254' + phoneNumber.slice(1);
        } else if (phoneNumber.startsWith('254')) {
            phoneNumber = phoneNumber;
        } else {
            throw new Error('Invalid phone number');
        }

        const reqParams = {
            phoneNumber,
            amount,
            callbackURL: "https://webhook.site/d087c2f6-efb9-4e10-9348-d2f1369f56d1",
            transactionDesc: "Payment for: " + items.length,
            accountReference: address.email
        };
        const response = await stkPushRequest(reqParams);
        console.log("STK Push Request Successful:", response);
    } catch (error) {

        console.log(error);
    }

}

// <--------------Get all orders for Admin Panel-------------->
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        res.json({ success: true, orders })

    }
    catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
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
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await orderModel.findByIdAndUpdate(orderId, { status })
        res.json({ success: true, message: "Status Updated" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }

}

export { placeOrder, placeOrderStripe, userOrders, allOrders, updateStatus, placeOrderMpesa }