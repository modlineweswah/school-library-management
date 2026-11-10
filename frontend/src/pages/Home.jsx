import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ArrowRight, BookMarked, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../shared/AuthContext';
import { homeStyles as s } from '../assets/dummyStyles';

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
    title: "Manual book issue",
    text: "Track manual books issued, due dates, returns, and fine calculations.",
  },
  {
    icon: Users,
    title: "Student self-service",
    text: "Students can view borrowed books, Overdue Books and  Pending fines, .",
  },
  {
    icon: ShieldCheck,
    title: "Admin desk controls",
    text: "Library staff can manage book records, manual book issues, overdue books, and fine settings.",
  },
];

const Home = () => {
  const { currentUser, logout } = useAuth();
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
        { label: "Sign Up", href: "/signup", icon: "signup", kind: "secondary" },
      ];

  return (
    <div className={s.layoutContainer}>
      <Sidebar
        title="Somalib"
        subtitle="School library system"
        badge="Beautiful theme"
        navItems={navItems}
        footerItems={footerItems}
      />

      <main className={s.mainContent}>
        <div className={s.innerContainer}>
          <section className={s.heroSection}>
            <div className={`${s.heroGrid} items-center`}>
              <div className="flex flex-col gap-4">
                <span className={s.heroBadge}>The Komarock School Library</span>
                <h1 className={s.heroTitle}>
                  Manage Students, Books, Returns and Fines
                </h1>
                <p className={s.heroText}>
                  This library portal gives students a focused borrowing
                  dashboard and admin a practical workspace for book
                  circulation, user records, and overdue tracking.
                </p>
                <div className={`${s.heroButtons} flex flex-wrap items-center gap-3`}>
                  {currentUser ? (
                    <Link
                      to={currentUser.role === "admin" ? "/admin/dashboard" : "/student/dashboard"}
                      className={`${s.heroButtonPrimary} inline-flex items-center gap-2`}
                    >
                      Go To Dashboard
                      <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <>
                      <Link to="/signup" className={`${s.heroButtonPrimary} inline-flex items-center gap-2`}>
                        Create Account
                        <ArrowRight size={16} />
                      </Link>
                      <Link to="/login" className={`${s.heroButtonSecondary} inline-flex items-center gap-2`}>
                        Login Now
                        <ArrowRight size={16} />
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                <div className={s.infoCard}>
                  <p className={s.infoCardLabel}>Library Workflow</p>
                  <p className={s.infoCardTitle}>
                    Separate student and admin dashboards built for daily
                    library operations
                  </p>
                  <p className={s.infoCardText}>
                    Monitor issued books, keep records updated, and track
                    overdue books
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={`${s.featuresGrid} grid gap-6`}>
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className={`${s.featureCard} flex flex-col gap-3`}>
                <span className={`${s.featureIconWrapper} flex items-center justify-center shrink-0`}>
                  <Icon size={22} />
                </span>
                <h2 className={s.featureTitle}>{title}</h2>
                <p className={s.featureText}>{text}</p>
              </article>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;