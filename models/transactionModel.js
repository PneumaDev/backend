import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: false },
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentmentMethod: { type: String },
    items: { type: Array, required: true },
    status: { type: String, default: "Pending" },
    transactionDetails: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
}, { minimize: false });

const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

export default Transaction;
