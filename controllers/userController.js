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
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #333333; border-bottom: 2px solid #ff9800; padding-bottom: 10px;">Contact Form Submission</h1>
          <p style="font-size: 16px; color: #666666;"><strong>Name:</strong> <span style="color: #333333;">${name}</span></p>
          <p style="font-size: 16px; color: #666666;"><strong>Email:</strong> <span style="color: #333333;">${email}</span></p>
          <p style="font-size: 16px; color: #666666;"><strong>Contact:</strong> <span style="color: #333333;">${contact}</span></p>
          <p style="font-size: 16px; color: #666666;"><strong>Message:</strong></p>
          <p style="font-size: 16px; color: #333333; background-color: #f2f2f2; padding: 10px; border-radius: 5px;">${message}</p>
          <p style="font-size: 16px; color: #666666;"><strong>Subscribe to Newsletter:</strong>
            <span style="color: ${subscribe ? '#4caf50' : '#f44336'};">
              ${subscribe ? 'Yes' : 'No'}
            </span>
          </p>
          <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999999;">This is an automated message. Please do not reply directly to this email.</p>
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