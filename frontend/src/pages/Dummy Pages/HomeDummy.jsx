import React, { createElement } from 'react'
import Sidebar from '../../components/Sidebar'
import { ArrowRight, BookMarked, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../../shared/AuthContext';
import { homeStyles as s } from '../../assets/dummyStyles';
import { useNavigate, Link } from 'react-router-dom';


const navItems = [
    {
      label: "Student Dashboard",
      description: "Open issued books, fines, and profile details",
      href: "/student/dashboard",
      match: "/student",
      icon: "dashboard",
    },
    {
      label: "Admin Dashboard",
      description: "Manage student issues, returns, and fines",
      href: "/admin/dashboard",
      match: "/admin",
      icon: "admin",
    },
];

const features = [
    {
      icon: BookMarked,
      title: "Manual book issuing",
      text: "Track manual book issues, due dates, returns, and dynamic fine calculations in one workflow.",
    },
    {
      icon: Users,
      title: "Student self-service",
      text: "Students can review borrowed books, pending fines, academic details, and recent activity quickly.",
    },
    {
      icon: ShieldCheck,
      title: "Admin desk controls",
      text: "Library staff can manage student records, manual book issues, overdue items, and fine settings from the admin area.",
    },
];
const Home= ()=> {

    const{ currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const footerItems = currentUser
        ? [
            {
            label: "Logout",
            icon: "login",
            kind: "primary",
            action: () => {
                logout();
                navigate("/");
            },
            },
        ]
        : [
            { label: "Login", href: "/login", icon: "login", kind: "primary" },
            {
            label: "Sign Up",
            href: "/signup",
            icon: "signup",
            kind: "secondary",
            },
        ];

    return (
        <div className = {s.layoutContainer}>
            < Sidebar 
                title= "Somalib"
                subtitle= "School library system" 
                badge= "Beautiful theme"
                navItems= { navItems } 
                footerItems= { footerItems }

            />

            <main className= {s.mainContent} >
              <div className= {s.innerContainer} >
                <section className = {s.heroSection} >
                  <div className = {s.heroGrid} >
                    <div>
                      <span className = {s.heroBadge} > The Komarock School Library </span>
                      <h1 className = {s.heroTitle}>Manage Students, Books, Returns and Fines</h1>
                      <p className = {s.heroBadge}>
                        This  Lbrary  portal  gives  Students  a  focused  borrowing  dashboard 
                        and  Admin  a  practical  workspace  for  Book  circulation,  user  records
                        and  overdue  tracking.
                      </p>
                      <div className = {s.heroButtons} >
                        {currentUser ? (
                          <Link to = {
                            currentUser.role === "admin" ? "/admin/dashboard" : "/student/dashboard"}
                            className = {s.heroButtonPrimary} >
                              Go To Dashboard 
                              <ArrowRight size = {16} />  
                          </Link>
                        ) :
                        (
                          <>
                            <Link to = "/signup" className = {s.heroButtonPrimary}>
                              Create Account
                              <ArrowRight size = {16} />
                            </Link>

                            <Link to = "/login" className = {s.heroButtonSecondary}>
                              Login Now
                              <ArrowRight size = {16} />
                            </Link>
                          </>
                        )} 
                      </div>
                    </div>
                    <div className = "grid gap-4">
                      <div className= {s.infoCard} >
                        <p className = {s.infoCardLabel}>
                          Library Workflow
                        </p>
                        <p className = {s.infoCardTitle}> Separate Student and Admin 
                          Dashboards bulid for daily Library Operations
                        </p>
                        <p className = {s.infoCardText}> 
                          Monitor Issued Books, Keep records Updated and Track Overdue Books
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
                <section className = {s.featuresGrid}>
                  {features.map((icon, title, text) =>{
                    <article key = {title} className = {s.featureCard}>
                      <span className = {s.featureIconWrapper}>
                        {createElement(icon, {size:22})}
                      </span>
                      <h2 className = {s.featureTitle}> {title} </h2>
                      <p className = {s.featureText}> {text} </p>
                    </article>
                  })}

                </section>
              </div>
            </main>
        </div>
    )
}

export default Home