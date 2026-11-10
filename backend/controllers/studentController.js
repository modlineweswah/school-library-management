import userModel from "../models/userModel.js";


const MAX_STUDENTID_LENGTH = 32;

export async function searchStudentsByStudentID(req, res) {
    try {
        const studentID = String(req.query.studentID || "").trim();
        if(!studentID){
            return res.status(200).json({
                success: true, students:[]
            });
        }
        if (studentID.length > MAX_STUDENTID_LENGTH) {
            return res.status(400).json({
                success: false,
                message: "Student ID query is too long",
            });
        }

        const escapedStudentID = studentID.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        
        const studentRegex = new RegExp("^"+escapedStudentID, "i");
        const students = await userModel.find({
            role: "student",
            isVerified: true,
            isProfileComplete: true,
            studentID: {$regex: studentRegex}
        }).select("name email classGrade studentID").limit(12).lean();
        const mappedStudents = students.map((student) =>({
            name: student.name,
            email: student.email,
            classGrade: student.classGrade,
            studentID: student.studentID
        }));
        res.status(200).json({
            success:true,
            students:mappedStudents 
        });
    } catch (error) {
        console.error("Error Searching Students by studentID", error);
        res.status(500).json({
            success:false,
            message: "Error Searching Students by studentID",
            //error: error.message
        });
    }
} 