import express from "express";
import { authenticateToken, authorizeRoles } from "../middlewares/authMiddleware.js";
import { applyFine, clearFine, getAllBooksIssued, getFineSettings, issueManualBook, returnIssuedBook, updateFineSetting } from "../controllers/bookController.js";


const bookRouter = express.Router();

bookRouter.get("/fine-settings", authenticateToken, getFineSettings);
bookRouter.get("/issued-books/student", authenticateToken, authorizeRoles("student"));

//Admin
bookRouter.get("/issued-books", authenticateToken, authorizeRoles("admin"), getAllBooksIssued);
bookRouter.put("/issue-manual-book", authenticateToken, authorizeRoles("admin"), issueManualBook);
bookRouter.put("/issued-book/:id/return", authenticateToken, authorizeRoles("admin"), returnIssuedBook);
bookRouter.put("/issued-book/:id/fine", authenticateToken, authorizeRoles("admin"), applyFine);
bookRouter.put("/issued-book/:id/clear-fine", authenticateToken, authorizeRoles("admin"), clearFine);
bookRouter.put("/fine-setting", authenticateToken, authorizeRoles("admin"), updateFineSetting);


export default bookRouter;


