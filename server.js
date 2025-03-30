import express from "express";
import cors from "cors";
import 'dotenv/config'
import connectDb from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import { db, notifications } from "./config/firebase/firebase.js";

// App config
const app = express()
const port = process.env.PORT || 4000;
connectDb()
connectCloudinary()
// notifications({
//     title: "Hello",
//     body: "This is a test",
//     image: "https://gratisography.com/wp-content/uploads/2024/11/gratisography-augmented-reality-800x525.jpg",
//     token: ["dFkAH3G2VV7URzzDcZcut5:APA91bHeDlivdrLG-PAFcaPgodlqHf1Kzr6ZUawHXIVPZZSy9HifLWHpWFZZvL1M71qBc2apueBZJ2qv_vi5qK6rCQ-LSGVJJbzz5rmgLvoseZE8CESA5ac"]
// });


// Middlewares
app.use(express.json())

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.url} - From: ${req.ip}`);
    next(); // Continue to next middleware/route
});

app.use(cors({
    origin: ['https://eridanusmall.vercel.app', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'https://eridanusadmin.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));

// Handle preflight requests explicitly
app.options('*', cors());


// api endpoints
app.use('/api/user', userRouter)
app.use('/api/product', productRouter)
app.use("/api/cart", cartRouter)
app.use("/api/order", orderRouter)

app.get('/', (req, res) => {
    res.send("API Working")
})

app.listen(port, () => {
    console.log('Server up and running on PORT: ' + port);
})