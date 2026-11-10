import { generate } from "otp-generator";
import userModel from "../models/userModel.js";
import sendOTP from "../utils/sendOTP.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ---------------------------------------------------------------------------
// Shared helpers — kept at the top so every handler below relies on the
// same, single definition instead of repeating (and risking drift on)
// the same logic in multiple places.
// ---------------------------------------------------------------------------

// Canonical way to normalize an email everywhere it's looked up or stored,
// so "Jane@X.com" and "jane@x.com" are always treated as the same account.
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

// Builds a student ID like "KMS/042/26". Converts to a String before
// padStart, since Math.floor returns a Number (Numbers have no .padStart).
const generateStudentID = () => {
    const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    const year = new Date().getFullYear().toString().slice(-2);
    return `KMS/${sequence}/${year}`;
};

// Strips password (and OTP fields, when present) before a user document
// is ever sent back to a client.
const toSafeUser = (userDoc) => {
    const { password, otp, otpExpiry, ...safeUser } = userDoc.toObject();
    return safeUser;
};

// ---------------------------------------------------------------------------
// User Registration: validate → normalize → check for conflicts →
// prepare credentials/identifiers → send OTP → persist → respond.
// ---------------------------------------------------------------------------
export async function registerUser(req, res) {
    try {
        const { name, email, phone, password } = req.body;

        // 1. Validate presence of every required field up front, before
        //    doing any work (hashing, DB calls, sending email).
        if (!name || !String(name).trim()) {
            return res.status(400).json({ message: "Name is Required" });
        }
        if (!email) {
            return res.status(400).json({ message: "Email is Required" });
        }
        if (!password) {
            return res.status(400).json({ message: "Password is Required" });
        }

        const cleanPhone = phone ? phone.toString().replace(/\D/g, "") : "";
        if (cleanPhone.length !== 10) {
            return res.status(400).json({ message: "Mobile Number must have 10 Digits" });
        }

        // 2. Normalize once, use everywhere below — fixes the mismatch
        //    where lookups used raw email but storage used normalized email.
        const normalizedEmail = normalizeEmail(email);

        // 3. Check for conflicts before doing any further work.
        const existingUser = await userModel.findOne({ email: normalizedEmail });
        if (existingUser) {
            if (existingUser.isVerified) {
                return res.status(400).json({ message: "The User Already Exists" });
            }
            // Previous signup attempt was never OTP-verified — safe to replace it.
            await userModel.deleteOne({ email: normalizedEmail });
        }

        // 4. Prepare everything that doesn't have external side effects
        //    (hashing, ID generation, OTP value + expiry) BEFORE the one
        //    step that does (emailing the OTP) — so a failure here never
        //    results in a "ghost" OTP email for an account that doesn't exist.
        const hashedPassword = await bcrypt.hash(password, 10);
        const studentID = generateStudentID();
        const otp = generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        // 5. Now perform the side effect that can't be undone.
        try {
            await sendOTP(normalizedEmail, otp);
        } catch (emailError) {
            console.error("Failed to Send OTP to Email:", emailError);
            return res.status(500).json({
                message: "Failed to send OTP to your Email, Please try again later"
            });
        }

        // 6. Persist last, once everything above has succeeded.
        const user = await userModel.create({
            name,
            email: normalizedEmail,
            phone: cleanPhone,
            password: hashedPassword,
            otp,
            otpExpiry,
            studentID
        });

        // 7. Respond — never leak password/OTP back to the client.
        res.status(201).json({
            message: "User Registered Successfully, OTP sent to your Email",
            user: toSafeUser(user)
        });

    } catch (error) {
        console.error("Error Registering the User:", error);
        res.status(500).json({ message: "Error Registering the User" });
    }
}

// ---------------------------------------------------------------------------
// OTP Verification: validate → look up → check OTP validity → persist → respond
// ---------------------------------------------------------------------------
export async function verifyOTP(req, res) {
    try {
        const { email, otp } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is Required" });
        }
        if (!otp) {
            return res.status(400).json({ message: "OTP is Required" });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await userModel.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: "User Not Found" });
        }

        const isExpired = new Date() > new Date(user.otpExpiry);
        if (user.otp !== otp || isExpired) {
            return res.status(400).json({ message: "Invalid or Expired OTP" });
        }

        Object.assign(user, { isVerified: true, otp: null, otpExpiry: null });
        await user.save();

        res.status(200).json({ message: "OTP Verified Successfully" });

    } catch (error) {
        console.error("Error Verifying OTP", error);
        res.status(500).json({ message: "Error Verifying OTP" });
    }
}

// ---------------------------------------------------------------------------
// Complete the User Profile: validate → look up → verify eligibility →
// persist → respond. isProfileComplete is only ever set true once every
// required field is confirmed present.
// ---------------------------------------------------------------------------
export async function completeUserProfile(req, res) {
    try {
        const { email, stream, classGrade } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is Required" });
        }
        if (!stream || !classGrade) {
            return res.status(400).json({ message: "Stream and Class Grade are Required" });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await userModel.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: "User not Found" });
        }
        if (!user.isVerified) {
            return res.status(400).json({ message: "User is not Verified" });
        }

        Object.assign(user, { stream, classGrade, isProfileComplete: true });
        await user.save();

        res.status(200).json({ message: "Profile Completed Successfully" });

    } catch (error) {
        console.error("Error Completing the Profile:", error);
        res.status(500).json({ message: "Error Completing the Profile" });
    }
}

// ---------------------------------------------------------------------------
// Student/Admin Login: validate → look up → verify credentials →
// issue token → respond (this is the step that was previously missing).
// ---------------------------------------------------------------------------
export async function userLogin(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are Required"
            });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await userModel.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not Found" });
        }
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please Verify Account with OTP sent to your Email before logging in"
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials: Password and Email did not match"
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Response was missing entirely before — this is what actually
        // completes the login flow for the client.
        res.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            user: toSafeUser(user)
        });

    } catch (error) {
        console.error("Error during Login", error);
        res.status(500).json({ success: false, message: "Error during Login" });
    }
}

// ---------------------------------------------------------------------------
// Get the Profile of the current authenticated user
// ---------------------------------------------------------------------------
export async function getUserProfile(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select("-password").lean();
        if (!user) {
            return res.status(404).json({ message: "User not Found" });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Error Fetching User Profile", error);
        res.status(500).json({ message: "Error Fetching User Profile" });
    }
}

// ---------------------------------------------------------------------------
// Update User Profile Information: look up → validate/apply each field →
// persist → respond
// ---------------------------------------------------------------------------
export async function updateUserProfile(req, res) {
    try {
        const { name, email, phone, classGrade, stream, studentID } = req.body;

        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (email) {
            const normalizedEmail = normalizeEmail(email);
            if (normalizedEmail !== user.email.toLowerCase()) {
                if (user.role === "student") {
                    return res.status(400).json({
                        message: "Students are not allowed to change their email address"
                    });
                }
                const emailTaken = await userModel.findOne({
                    email: normalizedEmail,
                    _id: { $ne: user._id }
                });
                if (emailTaken) {
                    return res.status(400).json({ message: "Email already in use" });
                }
                user.email = normalizedEmail;
            }
        }

        if (phone) {
            const cleanPhone = phone.toString().replace(/\D/g, "");
            if (cleanPhone.length !== 10) {
                return res.status(400).json({ message: "Mobile number must be exactly 10 digits" });
            }
            user.phone = cleanPhone;
        }

        if (name) user.name = name;
        if (classGrade) user.classGrade = classGrade;
        if (stream) user.stream = stream;
        if (studentID) user.studentID = studentID;

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: toSafeUser(user)
        });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Error updating profile" });
    }
}

// ---------------------------------------------------------------------------
// Get All Users (Students) — Admin only
// ---------------------------------------------------------------------------
export async function getAllUsers(req, res) {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 50);

        const students = await userModel
            .find({ role: "student", isVerified: true, isProfileComplete: true })
            .select("-password")
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        res.status(200).json({ success: true, page, limit, students });

    } catch (error) {
        console.error("Error Fetching Students", error);
        res.status(500).json({ message: "Error Fetching Students" });
    }
}

// ---------------------------------------------------------------------------
// Admin Registration: validate → normalize → check for conflicts →
// hash password → persist → respond
// ---------------------------------------------------------------------------
export async function registerAdmin(req, res) {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        const normalizedEmail = normalizeEmail(email);
        const existingAdmin = await userModel.findOne({ email: normalizedEmail });
        if (existingAdmin) {
            return res.status(400).json({ message: "User Already Exists with this Email" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await userModel.create({
            name,
            phone,
            email: normalizedEmail,
            password: hashedPassword,
            role: "admin",
            isVerified: true
        });

        res.status(201).json({
            success: true,
            message: "Admin Registration Successful",
            user: toSafeUser(admin)
        });

    } catch (error) {
        console.error("Error Registering Admin", error);
        res.status(500).json({ message: "Error Registering Admin" });
    }
}