import orderModel from "../models/orderModel.js";
import Transaction from "../models/transactionModel.js";
import userModel from "../models/userModel.js";
import { stkPushRequest } from "daraja-kit";
import Daraja from "@saverious/daraja";


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
            status: "Order Placed",
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

const placeOrderMpesa = async (req, res) => {
    const { userId, items, amount, address } = req.body;

    try {
        // Validate required fields
        if (!userId || !items || !amount || !address) {
            throw new Error('Missing required fields: userId, items, amount, or address');
        }

        // Prepare STK Push request parameters
        const daraja = new Daraja({
            consumer_key: process.env.MPESA_CONSUMER_KEY,
            consumer_secret: process.env.MPESA_CONSUMER_SECRET,
            environment: 'development',
        });

        const response = await daraja.stkPush({
            sender_phone: address.phone,
            payBillOrTillNumber: '174379',
            amount: amount,
            callback_url: 'https://webhook.site/3f906d0a-28ea-4194-bad3-3fa7914978cf',
        });

        console.log('Safaricom response: ', response);

        // Prepare transaction data
        // const paymentData = {
        //     name: `${address.firstName} ${address.lastName}`,
        //     email: address.email,
        //     userId,
        //     amount,
        //     paymentMethod: 'mpesa',
        //     items,
        //     status: 'pending',
        //     transactionDetails: response,
        // };

        // console.log(`Transaction amount: ${amount}`);

        // const newTransaction = new Transaction(paymentData);
        // const savedTransaction = await newTransaction.save();

        // // Prepare order data with linked transactionId
        // const orderData = {
        //     userId,
        //     address,
        //     items,
        //     amount,
        //     paymentMethod: 'mpesa',
        //     payment: false,
        //     date: Date.now(),
        //     transactionId: savedTransaction._id,
        // };

        // const newOrder = new orderModel(orderData);
        // const savedOrder = await newOrder.save();

        // // Update transaction with orderId
        // savedTransaction.orderId = savedOrder._id;
        // await savedTransaction.save();


        // await userModel.findByIdAndUpdate(userId, { cartData: {} })


        // Respond with success
        res.json({
            success: true,
            message: response.ResponseDescription,
            response,
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
};


// <--------------Mpesa webhook----------------->
const mpesaWebhook = async (req, res) => {
    const { stkCallback } = req.body.Body;

    try {
        const transaction = await Transaction.findOneAndUpdate(
            { merchantRequestID: stkCallback.MerchantRequestID },
            {
                status: stkCallback.ResultCode === 0 ? "Success" : "Failed",
                resultDescription: stkCallback.ResultDesc,
            },
            { new: true }
        );

        if (!transaction) {
            console.error("Transaction not found:", stkCallback.MerchantRequestID);
        } else {
            console.log("Updated transaction:", transaction);
        }

        res.status(200).send("OK");
    } catch (error) {
        console.error("Error updating transaction:", error);
        res.status(500).send("Server Error");
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

export { placeOrder, placeOrderStripe, userOrders, allOrders, updateStatus, placeOrderMpesa, mpesaWebhook }