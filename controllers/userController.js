import userModel from "../models/userModel.js";
import validator from "validator";
import bycrypt from "bcrypt";
import jwt from "jsonwebtoken";
import uniqid from 'uniqid'



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

                res.json({ success: true, message: "User Created", token })
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


const getUser = async (req, res) => {
    const { userId } = req.body

    try {
        const user = await userModel.findById(userId)
        res.json({ success: true, user })
    } catch (error) {
        console.log(error.message);
    }
}


export { loginUser, registerUser, adminLogin, getUser }