import express from "express";
import { loginUser, adminLogin, registerUser, getAllUsers, updateUser } from "../controllers/userController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from './../middleware/auth.js';

const userRouter = express.Router();

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)
userRouter.post("/admin", adminLogin)
userRouter.post("/update", authUser, updateUser)
userRouter.post("/list", adminAuth, getAllUsers)


export default userRouter;