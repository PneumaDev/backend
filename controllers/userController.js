import userModel from "../models/userModel.js";
import validator from "validator";
import bycrypt from "bcrypt";
import jwt from "jsonwebtoken";
import uniqid from 'uniqid'
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

// <--------- Route for user login ---------->
const loginUser = async (req, res) => {
    try {
        const { email, password, isGoogleAuthenticated, name } = req.body;

        if (!isGoogleAuthenticated) {
            const user = await userModel.findOne({ email });
            if (!user) { return res.json({ success: false, message: "User doesn't exist" }) }
            const isMatch = await bycrypt.compare(password, user.password)

            if (isMatch) {

                const token = createToken(user.id)
                res.json({ success: true, message: "Login Successfull!", token })
            } else {
                res.json({ success: false, message: "Incorrect Credentials!" })
            }
        }
        else {
            if (!validator.isEmail(email)) { return res.json({ success: false, message: "Please enter a valid email!" }) }
            const user = await userModel.findOne({ email });
            if (user) {
                const token = createToken(user.id)
                res.json({ success: true, message: "Login Successfull!", token })
            }
            else {
                const salt = await bycrypt.genSalt(10);
                const hashedPassword = await bycrypt.hash(email + uniqid(), salt)

                const newUser = new userModel({
                    name, email, password: hashedPassword
                })

                const user = await newUser.save()

                const token = createToken(user._id)

                res.json({ success: true, message: "Signed In", token })
            }
        }

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}


// <---------- Route for register user ---------->
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // checking if user already exists
        const exists = await userModel.findOne({ email });
        if (exists) { return res.json({ success: false, message: "User already exists!" }) }

        // validating email format and strong password
        if (!validator.isEmail(email)) { return res.json({ success: false, message: "Please enter a valid email!" }) }
        if (password.length < 8) { return res.json({ success: false, message: "Please enter a strong password!" }) }

        // hashing the password
        const salt = await bycrypt.genSalt(10);
        const hashedPassword = await bycrypt.hash(password, salt)

        const newUser = new userModel({
            name, email, password: hashedPassword
        })

        const user = await newUser.save()

        const token = createToken(user._id)

        res.json({ success: true, message: "User Created", token })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}


// <---------- Route for admin login ---------->
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            res.json({ success: true, message: "Welcome, Admin!", token })
        }
        else {
            res.json({ success: false, message: 'Invalid Credentials' })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const getTotalCounts = async (req, res) => {
    try {
        const result = await Promise.all([
            userModel.aggregate([{ $count: "total" }]),
            productModel.aggregate([{ $count: "total" }]),
            orderModel.aggregate([{ $count: "total" }]),
            orderModel.aggregate([
                { $match: { payment: true } },
                { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
            ]),
            orderModel.aggregate([
                { $group: { _id: null, totalRevenue: { $sum: "$amount" } } } // All orders
            ])
        ]);

        // Extract values with default 0 if empty
        const counts = [
            { category: "users", total: result[0][0]?.total || 0 },
            { category: "products", total: result[1][0]?.total || 0 },
            { category: "orders", total: result[2][0]?.total || 0 },
            { category: "actualRevenue", total: result[3][0]?.totalRevenue || 0 },
            { category: "potentialRevenue", total: result[4][0]?.totalRevenue || 0 }
        ];

        res.json({ success: true, counts });
    } catch (error) {
        console.error("Error fetching document counts:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


const getUser = async (req, res) => {
    const { userId } = req.body

    try {
        const user = await userModel.findById(userId)
        res.json({ success: true, user })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({})
        res.json({ success: true, users })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const updateUser = async (req, res) => {
    try {
        const { userId, ...updateData } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

export { loginUser, registerUser, adminLogin, getUser, getAllUsers, getTotalCounts, updateUser }