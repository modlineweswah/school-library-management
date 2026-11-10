import express from "express"
import { authenticateToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import { completeUserProfile, getAllUsers, getUserProfile, registerAdmin, registerUser, updateUserProfile, userLogin, verifyOTP } from "../controllers/userController.js";


const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/verify-otp", verifyOTP);
authRouter.post("/complete-profile", completeUserProfile);
authRouter.post("/login-user", userLogin);
authRouter.post("/register-admin", registerAdmin);

 //protected routes
 authRouter.get("/current-user", authenticateToken, getUserProfile);
 authRouter.put("/update-profile", authenticateToken, updateUserProfile);
 authRouter.get("/get-users", authenticateToken, authorizeRoles("admin"), getAllUsers);

 export default authRouter;