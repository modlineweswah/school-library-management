import express from "express";
import { authenticateToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import { searchStudentsByStudentID } from "../controllers/studentController.js";


const studentRouter = express.Router();

studentRouter.get("/search-by-student-id", authenticateToken, authorizeRoles("admin"), searchStudentsByStudentID);

export default studentRouter;