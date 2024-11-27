import orderModel from "../models/orderModel.js";
import Transaction from "../models/transactionModel.js";
import userModel from "../models/userModel.js";
import Daraja from "@saverious/daraja";
import { Mpesa } from "daraja.js"

const app = new Mpesa({
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    initiatorPassword: "Safaricom999!*!",
    organizationShortCode: 174379,
    // certificatePath: "some/path", // optional
    // securityCredential: "someSecureCredential"
})

const initiateStkPush = async (amount, phoneNumber) => {
    return await app
        .stkPush()
        .amount(amount)
        .callbackURL("https://webhook.site/ceb463f0-ac4c-4976-b3e6-b4193dd1141b")
        .phoneNumber(phoneNumber)
        .lipaNaMpesaPassKey(process.env.MPESA_API_PASSKEY)
        .send();
}


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
        if (!userId) throw new Error("Missing required field: userId");
        if (!items || items.length === 0) throw new Error("Cart items cannot be empty");
        if (!amount || amount <= 0) throw new Error("Invalid amount");
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

        // Initiate MPesa STK Push
        const mpesaResponse = await initiateStkPush(amount, address.phone)

        if (!mpesaResponse.isOkay()) {
            throw new Error("Transaction not processed");
        }

        console.log("Safaricom response: ", mpesaResponse.data.CheckoutRequestID);

        const checkoutRequestId = mpesaResponse.data.CheckoutRequestID

        // // Prepare transaction data
        // const paymentData = {
        //     name: `${address.firstName} ${address.lastName}`,
        //     email: address.email || null,
        //     userId,
        //     amount,
        //     paymentMethod: "mpesa",
        //     items,
        //     status: "pending",
        //     transactionDetails: mpesaResponse,
        // };

        // // Save the transaction in the database
        // const newTransaction = new Transaction(paymentData);
        // const savedTransaction = await newTransaction.save();

        // Prepare order data
        const orderData = {
            userId,
            address,
            items,
            amount,
            paymentMethod: "mpesa",
            payment: false,
            date: Date.now(),
            checkoutRequestId,
        };

        // Save the order in the database
        const newOrder = new orderModel(orderData);
        const savedOrder = await newOrder.save();

        // // Link order to transaction
        // savedTransaction.orderId = savedOrder._id;
        // await savedTransaction.save();

        // Clear user cart
        // await userModel.findByIdAndUpdate(userId, { cartData: {} });

        // Respond with success
        return res.status(200).json({
            success: true,
            message: mpesaResponse.ResponseDescription || "Payment initiated successfully",
            // transactionId: savedTransaction._id,
            orderId: savedOrder._id,
        });
    } catch (error) {
        console.error("Error in placeOrderMpesa:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};


// <--------------Complete Added Orders Payment-------------->
const completePayment = async (req, res) => {
    const { orderId, checkoutRequestId } = req.body;

    const response = await app
        .stkPush()
        .shortCode("174379")
        .checkoutRequestID(checkoutRequestId)
        .lipaNaMpesaPassKey(process.env.MPESA_API_PASSKEY)
        .queryStatus(); //


    console.log(response);
    // Proceed to get the order if there's an orderId
    if (orderId) {
        const order = await orderModel.findById(orderId)
    }

    // First Confirm The Order hasn't been paid yet
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
        return res.json({ success: true, message: "Order already processed. Reloading...", status: 500 });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
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

export { placeOrder, placeOrderStripe, userOrders, allOrders, updateStatus, placeOrderMpesa, mpesaWebhook, cancelOrder, completePayment }