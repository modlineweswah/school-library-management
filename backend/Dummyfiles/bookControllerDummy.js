import userModel from "../models/userModel.js";
import issueBookModel from "../models/issueBookModel.js";
import { json } from "body-parser";
import fineSettingModel from "../models/fineSettingModel.js";


//Helper functions
const getLocalIsoDate = (value = new Date()) => {
const d = new Date(value);
return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getStartOfDay = (value) => new Date(new Date(value).setHours(0, 0, 0, 0));

const getDiffInDays = (targetDateString) => 
Math.round((getStartOfDay(targetDateString) - getStartOfDay(new Date())) / 86400000);

const getOverdueUnits = (overdueDays, interval) => {
if (overdueDays <= 0) return 0;
const divisor = { week: 7, month: 30, year: 365 }[interval] || 1;
return Math.ceil(overdueDays / divisor);
};

const calculateFine = (issue, fineRate = 10, fineInterval = "day") => {
if (!issue || issue.fineCleared || issue.returnedOn) return 0;
const overdueDays = Math.max(0, -getDiffInDays(issue.dueDate));
return getOverdueUnits(overdueDays, fineInterval) * fineRate + (Number(issue.manualFine) || 0);
};


//issue manual book to student
export async function issueManualBook(req, res) {
    try {
        const{studentDetails, books} = req.body;
        if (!Array.isArray(books)||books.length===0) {
            return res.status(400).json({
                message: "No book was entered"
            });
        }
        const student = await userModel.findOne({studentID:student.studentID});
        if (!student) {
            return res.status(404).json({
                success: false,
                message:"No student found"
            });

            const todayIso = getLocalIsoDate();
            const validBooks = books.filter(b=>b.tittle && b.bookCode && b.dueDate)
        }

            const createdIssues = await Promise.all(validBooks.map(book => Issue.create({
        source: "manual",
        bookCode: book.bookCode.trim(),
        title: book.title.trim(),
        userEmail: student.email,
        userName: student.name,
        issuedOn: todayIso,
        dueDate: book.dueDate,
        returnedOn: null,
        fineRate: Number(book.fineRate ?? req.body.fineRate ?? 10),
        fineInterval: book.fineInterval ?? req.body.fineInterval ?? "day",
        manualFine: 0,
        fineCleared: false,
        clearedFineAmount: 0,
        classGrade: studentDetails.classGrade?.trim() || student.classGrade || "General",
        stream: studentDetails.stream?.trim() || student.stream || "General",
        //year: studentDetails.academicYear?.trim() || student.year || "1st Year",
        //semester: studentDetails.semester?.trim() || student.semester || "Semester 1",
        //rollNumber: studentDetails.rollNumber?.trim() || student.rollNo || "Not assigned",
        //studentId: student.rollNo || `ST-${student._id.toString().slice(-4)}`
        studentId: student._id.toString(),
        studentID: student.studentID
        })));
        res.status(201).json({
            success: true,
            messahe:`${createdIssues.length} manual book issued successfully `,
            count: createdIssues.length,
            issues: createdIssues
        })
                
    } 
    catch (error) {
        console.error("Error issuing manual books", error);
        res.status(500).json({
            message: "Error issuing manual books",
            error: error.message
        });
    }
}


//Get all manualbooks issued(Admin)
export async function getAllBooksIssued(req, res) {
    try {
        const booksIssued = (await issueBookModel.find({})).sort({createdAt: -1});
        res.status(200).json({
            success: true,
            booksIssued
        });
    } 
    catch (error) {
        console.error("Error fetching manual books issued", error);
        res.status(500).json({
            message: "Error fetching manual books issued",
            error: error.message
        });
    }
}


//Get manual books issued to a logged in student
export async function getStudentIssuedBooks(req, res) {
    try {
        const studentBooks = await issueBookModel.find({
            userEmail: req.user.toLowerCase().trim().sort({createdAt:-1})
        })
    } 
    catch (error) {
        console.error("Error fetching manual book issued to the student", error);
        res.status(500).json({
            message: "Error fetching manual book issued to the student",
            error: error.message
        });
    }
}


//Return manual issued book
export async function returnIssuedBook(req, res) {
  try {
    const issuedBook = await issueBookModel.findById(req.params.id);
    if (!issuedBook) {
        return res.status(404).json({
            message: "Issued book record not found"
        });
    }  
    if (issuedBook.returnedOn) {
        return res.status(400).json({
            message:"Book already return"
        });
    }

    issuedBook.returnedOn = getLocalIsoDate();
    res.status(200).json({
        message:"Book returned successfully"
    });
  } 
  catch (error) {
    console.error("Error returning manual issued book", error);
        res.status(500).json({
            message: "Error returning manual issued book",
            error: error.message
        });
  }  
}


//app fine
export async function applyFine(req, res) {
    try {
        const fineAmount = Number(req.body.amount);
        if (Number.isNaN(fineAmount)) {
            return res.status(400).json({
                message: "Invalid fine amount"
            });
        }
        const issuedBook = await issueBookModel.findById(req.params.id);
        if(!issuedBook){
            return res.status(404).json({
                message: "Issued book record not found"
            });
        }
        if (fineAmount>0) {
            issuedBook.fineCleared = false;
        }
        await issuedBook.save();
        res.status(200).json({
            success: true,
            message: "Manual fine applied successfully",
            issuedBook
        });

    } 
    catch (error) {
        console.error("Error applying manual fine", error);
        res.status(500).json({
            message: "Error applying manual fine",
            error: error.message
        });
    }
}


//Clear manual fine
export async function clearFine(req, res) {
    try {
        const issuedBook = await issueBookModel.findById(req.params.id);
        if(!issuedBook){
            return res.status(404).json({
                message: "issued Book record not found"
            });
        }
        Object.assign(issuedBook, {
            manualFine:0,
            fineCleared: true,
            clearedFineAmount: calculateFine(issuedBook, issuedBook.fineCleared, issuedBook.fineInterval)
        });
        await issuedBook.save();
        res.status(200).json({
            success:true,
            message: "Fine cleared successfully",
            issuedBook
        });
    } catch (error) {
        console.error("Error clearing the manual fine", error);
        res.status(500).json({
            message: "Error clearing the manual fine",
            error: error.message
        });
    }
}


//Get actve fine settings
export async function getFineSettings(req, res) {
    try {
        const settings = (await fineSettingModel.findOne({})||(await fineSettingModel.create({
            amount: 10,
            interval: "day"
        })));
        res.status(200).json({ success: true, settings });
    } 
    catch (error) {
        console.error("Error fetching fine settings", error);
        res.status(500).json({
            message: "Error fetching fine settings",
            error: error.message
        });
    }
}


//Get update fine setting
export async function updateFineSetting(req, res) {
    try {
        const{ amount, interval } = req.body;
        let settings = await fineSettingModel.findOne({});
        if (settings) {
            if( amount!== undefined){
                settings.amount = Number(amount);
            }
            if (interval!== undefined ) {
                settings.interval = interval;
            }

            await settings.save();
        } 
        

        else {
            settings = await fineSettingModel.create({
                amount: Number(amount)||10,
                interval: interval||"day"
            });    
        }

        res.status(200).json({
            success: true,
            message: "Fine update successfully", settings
        });
    } 
    catch (error) {
        console.error("Error updating fine settings", error);
        res.status(500).json({
            message: "Error updating fine settings",
            error: error.message
        });
    }
}