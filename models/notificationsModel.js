import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['like', 'comment', 'follow', 'mention', 'system'],
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
