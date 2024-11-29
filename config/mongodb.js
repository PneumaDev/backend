import mongoose from "mongoose";

const connectDb = async () => {

    try {
        mongoose.connection.on("connected", async () => {
            console.log("Connected to database😎");
        })

        await mongoose.connect(`${process.env.MONGODB_URI}/eridanus-mall`);

    } catch (error) {
        console.log(error.message);
    }
}


export default connectDb