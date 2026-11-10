import express  from 'express';
import cors  from 'cors';
import 'dotenv/config';
import connectDB from  './config/dbConnect.js';
import authRouter from './routes/authRoutes.js';
import studentRouter from './routes/studentRoute.js';
import bookRouter from './routes/bookRoutes.js';


const PORT = process.env.PORT||5000;
const app = express();

//MIDDLEWARE
app.use(cors());
app.use(express.json());

//DATABASE
connectDB();

//ROUTES
app.use("/api/auth", authRouter);
app.use("/api/students", studentRouter);
app.use("/api/books", bookRouter);



//START EXPRESS SERVER
app.listen(PORT, ()=>{
    console.log(`Server is Running on http: ${PORT}`);
});
