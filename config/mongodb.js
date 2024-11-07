import mongoose from "mongoose";

const connectDb = async () => {

    mongoose.connection.on("connected", async () => {
        console.log("Connected to database😎");
    })

    await mongoose.connect(`${process.env.MONGODB_URI}/eridanus-mall`);

}


export default connectDb