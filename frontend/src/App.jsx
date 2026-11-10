import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Home from "./pages/Home"
import Login from "./pages/Login"
import SignUp from "./pages/SignUp"
import ProtectedRoute from './shared/ProtectedRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Books from './pages/admin/Books';
import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentBooks from './pages/student/StudentBooks';
import StudentProfile from './pages/student/StudentProfile';



function App() {
  return (
    <Routes>
      <Route path='/' element={ <Home/>}/>
      <Route path='/login' element={ <Login/>}/>
      <Route path='/signup' element={ <SignUp/>}/>

      //Protected Routes for Admin
      <Route element={<ProtectedRoute allowedRole="admin"/>}>
          <Route path="/admin" element={<AdminLayout/>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />}/>
              <Route  path='dashboard' element={<AdminDashboard />}/>
              <Route  path='books' element={<Books />}/>

          </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRole="student"/>}>
        <Route path="/student" element={<StudentLayout/>}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path='dashboard' element={<StudentDashboard/>} />
           <Route path='books' element={<StudentBooks/>} />
           <Route path='profile' element={<StudentProfile/>} />
        </Route>
      </Route>
      <Route path='*' element={<Navigate to="/" replace/>} />
    </Routes>
  )
}

export default App