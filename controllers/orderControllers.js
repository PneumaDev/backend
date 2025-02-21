import orderModel from "../models/orderModel.js";
import Transaction from "../models/transactionModel.js";
import { Mpesa } from "daraja.js"
import { ObjectId } from "mongodb";
import userModel from './../models/userModel.js';
import { sendEmail } from "../config/email.js";


const app = new Mpesa({
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    initiatorPassword: "Safaricom999!*!",
    organizationShortCode: 174379,
})

const initiateStkPush = async (amount, phoneNumber, orderId) => {
    return await app
        .stkPush().description("Order").accountNumber(orderId)
        .amount(amount)
        .callbackURL("https://webhook.site/ceb463f0-ac4c-4976-b3e6-b4193dd1141b")
        .phoneNumber(phoneNumber)
        .lipaNaMpesaPassKey(process.env.MPESA_API_PASSKEY)
        .send();
}

const verifyPayment = async (checkout_id) => {
    return await app
        .stkPush()
        .shortCode("174379")
        .checkoutRequestID(checkout_id)
        .lipaNaMpesaPassKey(process.env.MPESA_API_PASSKEY)
        .queryStatus()
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));



// <<<<<<<<<<--------------------------------------------------------User Routes-------------------------------------------------------->>>>>>>>>>>>>>>
// <--------------User Order Data for Frontend-------------->
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body;

        const orders = await orderModel.find({ userId }).sort({ updatedAt: 1 });

        res.json({ success: true, orders })

    } catch (error) {
        console.log(error.message);
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
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }

}

// <--------------Cancel Order-----------------> 
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Find the order by its ID
        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (!order.payment && order.status === "Pending") {
            // Delete the order by its ID
            await orderModel.findByIdAndDelete(orderId);
            return res.json({ success: true, message: "Order removed successfully" });
        }

        // If the order cannot be deleted
        return res.json({ success: true, message: "Order already processed.", status: 500 });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};


// <<<<<<<<<<--------------------------------------------------------Mpesa Payments-------------------------------------------------------->>>>>>>>>>>>>>>
// <--------------Place Orders Using Mpesa-------------->
const placeOrderMpesa = async (req, res) => {
    const { userId, items, amount, address, shippingMethod } = req.body;

    try {
        // Validate required fields
        if (!userId) throw new Error("Missing required field: userId");
        if (!items || items.length === 0) throw new Error("Cart items cannot be empty");
        if (!amount || amount <= 0) throw new Error("Invalid amount");
        if (!shippingMethod) throw new Error("No shipping method.");
        if (!address || !address.phone || !address.firstName || !address.lastName) {
            throw new Error("Missing or incomplete address details");
        }

        // Validate and format the phone number
        const phone = address.phone.trim();
        if (phone.startsWith("07") || phone.startsWith("01")) {
            address.phone = `254${phone.slice(1)}`;
        } else if (!phone.startsWith("254") || phone.length !== 12) {
            throw new Error("Invalid phone number format");
        }

        // Generate order ID
        const orderId = new ObjectId();

        // Initiate MPesa STK Push with the generated orderId
        const mpesaResponse = await initiateStkPush(1, address.phone, orderId.toString());

        if (!mpesaResponse.isOkay()) {
            throw new Error("Transaction not processed");
        }

        const checkoutRequestId = await mpesaResponse.data.CheckoutRequestID;

        // Prepare order data
        const orderData = {
            _id: orderId,
            userId,
            address,
            items,
            amount,
            shippingMethod,
            paymentMethod: "mpesa",
            payment: false,
            date: Date.now(),
            checkoutRequestId,
        };

        // Save the order in the database
        const newOrder = new orderModel(orderData);
        const savedOrder = await newOrder.save();

        await userModel.findByIdAndUpdate(userId, { cartData: {} })


        // Respond with success
        return res.status(200).json({
            success: true,
            message: mpesaResponse.ResponseDescription || "Payment initiated successfully",
            orderId: savedOrder._id,
            checkoutId: checkoutRequestId,
        });
    } catch (error) {
        console.error("Error in placeOrderMpesa:", error.message);
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
        console.error("Error updating transaction:", error.message);
        res.status(500).send("Server Error");
    }
}

// <--------------Complete Mpesa Orders Payment-------------->
const confirmPayment = async (req, res) => {
    try {
        const { retryPurchase, order } = req.body;

        const response = await verifyPayment(order.checkoutRequestId);

        if (response.data.ResultCode === "0" && response.isOkay()) {
            // Proceed to get the order if there's an orderId
            if (order._id) {
                console.log(order._id);
                const updatedOrder = await orderModel.findByIdAndUpdate(order._id, { payment: true, status: "Confirmed" }, { new: true });
                const emailRes = await sendEmail(updatedOrder)
                console.log(emailRes);
                return res.json({ success: true, message: "Payment Successful", updatedOrder, status: 200 });
            } else {
                return res.json({ success: false, message: "No Order ID. Please Reload" });
            }
        } else {
            // Retry Purchase if order payment still pending.
            if (retryPurchase && order._id) {
                const stkResponse = await initiateStkPush(order.amount, order.address.phone, order._id);
                const newCheckoutID = stkResponse.data.CheckoutRequestID;

                delay(5000)

                const verificationResponse = (await verifyPayment(newCheckoutID));

                if (verificationResponse.data.ResultCode === 0 && verificationResponse.isOkay()) {
                    const updatedOrder = await orderModel.findByIdAndUpdate(order._id, {
                        checkoutId: stkResponse.data.CheckoutRequestID,
                        payment: true,
                        status: "Confirmed"
                    });
                    await sendEmail(updatedOrder)
                    return res.json({ success: true, message: "Payment Successful after Retry" });
                } else {
                    await orderModel.findByIdAndUpdate(order._id, {
                        checkoutId: stkResponse.data.CheckoutRequestID,
                    });
                    return res.json({ success: true, message: "Stk Push Sent after retry", status: 202 });
                }
            } else {
                return res.json({ success: false, message: response.data.ResultDesc || "Payment couldn't be verified", status: response.data.ResultCode });
            }
        }
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: "Error Verifying Payment -- ETIMEDOUT" });
    }
};


// <<<<<<<<<<--------------------------------------------------------Admin Routes-------------------------------------------------------->>>>>>>>>>>>>>>
// <--------------Get all orders for Admin Panel-------------->
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({}).sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};


const singleOrderInfo = async (req, res) => {
    try {
        const { orderId } = req.body
        const order = await orderModel.findById(orderId)
        res.json({ success: true, order })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}


export { userOrders, allOrders, updateStatus, placeOrderMpesa, mpesaWebhook, cancelOrder, confirmPayment, singleOrderInfo }