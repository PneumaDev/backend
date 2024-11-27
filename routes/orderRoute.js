import express from "express";
import { placeOrder, placeOrderStripe, userOrders, allOrders, updateStatus, placeOrderMpesa, mpesaWebhook, cancelOrder, completePayment } from "../controllers/orderControllers.js";
import adminAuth from './../middleware/adminAuth.js';
import authUser from './../middleware/auth.js';

const orderRouter = express.Router();

// <--------Admin feautures---------->
orderRouter.post('/list', adminAuth, allOrders)
orderRouter.post('/status', adminAuth, updateStatus)

// <--------Payment Feautures---------->
orderRouter.post("/place", authUser, placeOrder)
orderRouter.post("/stripe", authUser, placeOrderStripe)
orderRouter.post("/mpesa", authUser, placeOrderMpesa)
orderRouter.post("/mpesa-webhook", authUser, mpesaWebhook)

// <----------User Feautures----------->
orderRouter.post("/userorders", authUser, userOrders)
orderRouter.post("/cancelorder", authUser, cancelOrder)
orderRouter.post("/confirmpayment", authUser, completePayment)


export default orderRouter;



