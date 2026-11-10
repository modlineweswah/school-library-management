import {createTransport} from "nodemailer";

const sendOTP = async(email, otp) =>{
    const transporter = createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject:"SomaLib OTP Code",
        html: `<h2> Your OTP is ${otp}</h2>`
    });
}

export default sendOTP;
