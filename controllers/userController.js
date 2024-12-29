import userModel from "../models/userModel.js";
import validator from "validator";
import bycrypt from "bcrypt";
import jwt from "jsonwebtoken";
import uniqid from 'uniqid'
import nodemailer from "nodemailer";



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

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
});


// Controller function to send email
export const sendEmail = async (req, res) => {
    const { name, email, message, subscribe, contact } = req.body;

    // Define the email options
    const mailOptions = {
        from: `"Eridanus Mall" <${email}>`,
        to: process.env.EMAIL_USER,
        subject: `Contact Form Submission from ${name}`,
        html: `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 5px; padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #333; text-align: center; background-color: #007bff; color: #fff; padding: 10px; border-radius: 5px;">Order Confirmation</h2>
            <p style="color: #555;">Dear John Doe,</p>
            <p style="color: #555;">Thank you for your order! Here are your order details:</p>

            <h3 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px;">Order Summary</h3>
            <ul style="list-style-type: none; padding: 0; margin: 0;">
            <li style="display: flex; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
                <img src="https://via.placeholder.com/80" alt="Laptop" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; margin-right: 15px;">
            <div>
                <p style="margin: 0; font-size: 16px; font-weight: bold;">Laptop</p>
                <p style="margin: 0; font-size: 14px; color: #555;">Quantity: 1</p>
                <p style="margin: 0; font-size: 14px; color: #555;">Price: $1200</p>
            </div>
            </li>
            <li style="display: flex; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
            <img src="https://via.placeholder.com/80" alt="Wireless Mouse" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; margin-right: 15px;">
            <div>
                <p style="margin: 0; font-size: 16px; font-weight: bold;">Wireless Mouse</p>
                <p style="margin: 0; font-size: 14px; color: #555;">Quantity: 2</p>
                <p style="margin: 0; font-size: 14px; color: #555;">Price: $40</p>
            </div>
        </li>
    </ul>

            <p style="font-size: 16px; font-weight: bold; color: #333;">Order Total: $1280</p>
            <p style="font-size: 16px; font-weight: bold; color: #333;">Shipping Method: Express</p>

            <h3 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px;">Shipping Address</h3>
            <p style="color: #555;">
                123 Main Street<br>
                Springfield, IL, 62704<br>
                USA
            </p>

    <h3 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px;">Order Status</h3>
    <p style="color: #007bff; font-weight: bold; font-size: 16px;">Pending</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="font-size: 12px; color: #888; text-align: center;">
        This is an automated email. Please do not reply.
    </p>
    </div>
      </body>
    </html>
  ` // HTML body content of the email
    };


    try {
        // Send email
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send email' });
    }
};



export { loginUser, registerUser, adminLogin }