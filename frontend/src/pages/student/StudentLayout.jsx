import React from 'react'
import { userLayoutStyles as s } from '../../assets/dummyStyles'
import Sidebar from "../../components/Sidebar"
import { useAuth } from '../../shared/AuthContext';
import { Outlet, useNavigate } from 'react-router-dom';


const navItems = [
  {
    label: "Student Dashboard",
    description: "Your school library overview",
    href: "/student/dashboard",
    match: "/student/dashboard",
    icon: "dashboard",
  },
  {
    label: "Books",
    description: "Issued books, fines, and due dates",
    href: "/student/books",
    match: "/student/books",
    icon: "books",
  },
  {
    label: "My Profile",
    description: "Update student information",
    href: "/student/profile",
    match: "/student/profile",
    icon: "users",
  },
];


const StudentLayout = () => {
   
   const {currentUser, logout} = useAuth();
   const navigate = useNavigate();

   const footerItems = currentUser
    ? [
        {
          label: "Logout",
          icon: "login",
          kind: "primary",
          action: () => {
            logout();
            navigate("/login");
          },
        },
      ]
    : [];

  return (
    <div className={s.layoutContainer}>
        <Sidebar title="Student Desk" subtitle="school library access" badge="Student Section" 
            navItems={navItems} footerItems={footerItems} logout={logout} />

        <main className={s.mainContent}>
            <div className={s.innerContainer}>
                <Outlet/>
            </div>
        </main>
    </div>
  )
}

export default StudentLayout