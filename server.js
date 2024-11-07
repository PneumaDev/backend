import express from "express";
import cors from "cors";
import 'dotenv/config'
import connectDb from "./config/mongodb.js";

// App config
const app = express()
const port = process.env.PORT || 4000;
connectDb()

// Middlewares
app.use(express.json())
app.use(cors())

// api endpoints
app.get('/', (req, res) => {
    res.send("API Working")
})

app.listen(port, () => {
    console.log('Server up and running on PORT: ' + port);
})