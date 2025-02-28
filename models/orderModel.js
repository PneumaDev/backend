import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    userId: { type: String, required: true },
    items: { type: Array, required: true },
    checkoutRequestId: { type: String, unique: true, required: true },
    amount: { type: Number, required: true },
    shippingMethod: { type: Object, required: true },
    address: { type: Object, required: true },
    status: { type: String, required: true, default: "Pending" },
    paymentMethod: { type: String, required: true },
    payment: { type: Boolean, required: true, default: false },
    date: { type: Number, required: true },
    reviewed: { type: Boolean, default: false },
}, {
    timestamps: true
});

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema)

export default orderModel