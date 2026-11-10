import mongoose from 'mongoose';

 const userSchema = mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    phone:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    otp:String,
    otpExpiry:Date,
    isVerified:{
        type:Boolean,
        default: false
    },
    classGrade:{
        type:String,
        //required:true
    },  
    stream:{
        type:String,
        //required:true
    },
    isProfileComplete:{
        type:Boolean,
        default:false
    },
    studentID:{
        type:String,
        unique:true,
        sparse:true,
        //required:true
    },
    role:{
        type:String,
        enum:["student", "admin"],
        default:"student"
    }
    
 }, 
{
    timestamps:true
})

 export default mongoose.model("user", userSchema);