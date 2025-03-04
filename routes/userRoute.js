import express from "express";
import { loginUser, adminLogin, registerUser, getAllUsers, getTotalCounts } from "../controllers/userController.js";
import adminAuth from "../middleware/adminAuth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)
userRouter.post("/admin", adminLogin)
userRouter.post("/list", adminAuth, getAllUsers)
userRouter.get("/count", getTotalCounts)


export default userRouter;