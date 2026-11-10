import { generate } from "otp-generator";
import userModel from "../models/userModel.js";
import sendOTP from  "../utils/sendOTP.js";
import bcrypt from "bcrypt";
//import {v4 as uuidv4} from "uuid";
import jwt from "jsonwebtoken";

//User Registration: Register a User and Sent OTP
export async function registerUser(req,res){
    try {
            const{name, email, phone, password} = req.body;

        if(!email){
            return res.status(400).json({
                message: "Email is Required"
            });
        }

        const cleanPhone = phone? phone.toString().replace(/\D/g, "") : "";
        if(cleanPhone.length !==10){
            return res.status(400).json({
                message: "Mobile Number must have 10 Digits"
            });
        }

        const existingUser = await userModel.findOne({email});
        if(existingUser){
            if(existingUser.isVerified){
                return res.status(400).json({
                    message: "The User Already Exists"
                });
            }
            await userModel.deleteOne({email});
        }

        const otp = generate(6, {lowerCaseAlphabets:false, specialChars:false});
        try {
            await sendOTP(email, otp);
        } 
        catch (emailError) {
            console.error("Failed to Send OTP to Email:", emailError);
            return res.status(500).json({
                message:"Failed to send OTP to your Email, Please again later"
            });
        }

        //Encrypt or Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        const otpExpiry = new Date(Date.now() + 5*60*1000);

        const studentID = `KMS/${Math.floor(Math.random() * 1000).padStart(3, "0")}/${new Date().getFullYear().toString().slice(-2)}`;

        const user = await userModel.create({
            name, email:email.trim().toLowerCase(), phone:cleanPhone, password:hashedPassword, otp, otpExpiry, studentID
        });
        res.status(200).json({
            message: "User Registered Successfully, OTP sent to your Email", user
        });

    } 
    catch (error) {
        console.error("Error Registering the User:", error);
        res.status(500).json({
            message: "Error Registering the User", error:error.message
        });
    }
}

//OTP Verification
export async function verifyOTP(req, res){
    try {
      const {email, otp} = req.body;
      if(!email){
        return res.status(400).json({
            message: "Email is Required"
        });
      } 
      
      const user = await userModel.findOne({email});
      if(!user){
        return res.status(400).json({
            message: "User Not Found"
        });
      }
      if(user.otp!== otp||new Date()>new Date(user.otpExpiry)){
        return res.status(400).json({
            message: "Invalid or Expired OTP"
        });
      }

      Object.assign(user, {isVerified:true, otp:null, otpExpiry:null});
      await user.save();
      res.status(200).json({
        message: "OTP Verified Successfully"
      });

    } 
    catch (error) {
        console.error("Error Verifying OTP", error);
        res.status(500).json({
            message: "Error Verifying OTP", error:error.message
        });
        
    }
}

//Complete the User Profile
export async function completeUserProfile(req,res){
    try {
        const{email, stream, classGrade,} = req.body;
        if (!email) {
            return res.status(400).json({
                message: "Email is Required"
            });
        } 
        const user = await userModel.findOne({email});
        if (!user) {
            return res.status(400).json({
                message: "User not Found"
            });
        }
        if (!user.isVerified) {
            return res.status(400).json({
                message: "User is not Verified"
            });
        }
        Object.assign(user, { stream, classGrade, isProfileComplete:true});
        await user.save();
        res.status(200).json({
            message: "Profile Complete Successful"
        });
    } 
    catch (error) {
        console.error("Error Completinf the Profile:", error);
        res.status(500).json({
            message: "Error Completing the Profile", error:error.message
        });
    }
}

//Student Login/Admin
export async function userLogin(req,res) {
    try {
        const{email, password} = req.body;
        if (!email||!password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are Required"
            });
        }
        const user = await userModel.findOne({email});
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not Found"
            })
        }
        if(!user.isVerified){
            return res.status(403).json({
                success: false,
                message: "Please Verify Account with OTP sent to your Email before logging in"
            });
        }
        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials: Password and Email did not match"
            });
        }

        const token = jwt.sign({id:user._id, role:user.role}, process.env.JWT_SECRET, {expiresIn: "7d"})
    } 
    catch (error) {
        console.error("Error during Login", error);
        res.status(500).json({
            success: false,
            message: "Error during Login", error:error.message
        });    
    }
}


//Get the Profile of the current user
export async function getUserProfile(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select("-password");
        if(!user){
            return res.status(404).json({
                message: "User not Found"
            });
        }
        res.status(200).json({
            success: true, user
        });
    } 
    catch (error) {
        console.error("Error Fetching User Profile", error);
        res.status(500).json({
            message: "Error Fetching User Profile", error:error.message
        });
    }
}


//Upate User Profile Information
export async function updateUserProfile(req, res) {
  try {
    const { name, email, phone, classGrade, stream, studentID} = req.body;
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email.toLowerCase()) {
        if (user.role === "student") {
          return res.status(400).json({ message: "Students are not allowed to change their email address" });
        }
        if (await userModel.findOne({ email: normalizedEmail, _id: { $ne: user._id } })) {
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
    //if (semester) user.semester = semester;
    //if (academicYear) user.academicYear = academicYear;
    //if (rollNumber) user.rollNumber = rollNumber;

    await user.save();
    res.status(200).json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
}


//Get All Users(Students)
export async function getAllUsers(req, res) {
    try {
        const students = await userModel.find({role:"student", isVerified:true, isProfileComplete:true}).select("-password");
        res.status(200).json({
            success:true, students
        });
    } 
    catch (error) {
        console.error("Error Fetching Students", error);
        res.status(500).json({
            message: "Error Fetching Students", error:error.message
        });
    }
}


//Registration of Admin
export async function registerAdmin(req, res) {
    try {
        const{name, email, phone, password} = req.body;
        if(!name||!email||!phone||!password){
            return res.status(400).json({
                message: "Please All Required Fields"
            });
        }
        if(await userModel.findOne({email})){
            return res.status(400).json({
                message: "User Already Exists with this Email"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await userModel.create({
            name,
            phone,
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role: "admin",
            isVerified: true
        });
        const{password:_, ...userResponse} = admin.toObject();
        res.status(201).json({
            success: true,
            message: "Admin Registration Successful",
            user: userResponse
        });
    } 
    catch (error) {
        console.error("Error Registering Admin", error);
        res.status(500).json({
            message: "Error Registering Admin", error:error.message
        });
    }
}