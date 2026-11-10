import userModel from "../models/userModel.js";
import 'dotenv/config';
import jwt from "jsonwebtoken";


// Fail fast at startup rather than 500-ing on every request in production
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in the environment");
}



export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        //code added start
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required"
            });
        }
        //end


        const token = authHeader && authHeader.split(" ")[1];
        if(!token){
            return res.status(401).json({
                success: false,
                message: "Authentication token is required"
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //Added code start
        // Guard against a malformed/tampered payload before hitting the DB
        if (!decoded?.id) {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }
        //end


        const user = await userModel.findById(decoded.id).select("-password").lean();
        if(!user){
            return res.status(401).json({
                message: "Token is not Valid or User no longer exists"
            });
        }
        req.user = user;
        next();

    } catch (error) {
        console.error("JWT Auth Error", error);
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token has expired"
            });
        }

        //Added code start
        // Covers JsonWebTokenError and its subclasses (e.g. NotBeforeError)
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }
        //end


        if (error.name === "CastError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}


//Middleware to Authorize specific roles
export const authorizeRoles = (...roles) =>{
    return(req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if(!roles.includes(req.user.role)){
            return res.status(403).json({
                success: false,
                message: "Access Denied"
            });
        }
        next();
    }
}