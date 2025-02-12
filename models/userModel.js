import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String },
        avatar: { type: String },
        password: { type: String, required: true },
        cartData: { type: Object, default: {} },
        addresses: [
            {
                fullName: { type: String },
                street: { type: String },
                city: { type: String },
                state: { type: String },
                zipCode: { type: String },
                country: { type: String },
                phone: { type: String },
                isDefault: { type: Boolean, default: false }
            }
        ],
        isActive: { type: Boolean, default: true },
        isVerified: { type: Boolean, default: false },
        resetToken: { type: String },
        resetTokenExpiry: { type: Date },
        socialLogin: {
            googleId: { type: String },
            facebookId: { type: String }
        }
    },
    { timestamps: true }, { minimize: false }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
