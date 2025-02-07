import express from "express";
import cors from "cors";
import 'dotenv/config'
import connectDb from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";

// App config
const app = express()
const port = process.env.PORT || 4000;
connectDb()
connectCloudinary()

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