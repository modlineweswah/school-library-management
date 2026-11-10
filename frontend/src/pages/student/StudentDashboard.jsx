import React from 'react'
import {useAuth} from "../../shared/AuthContext";
import {useLibrary} from "../../shared/LibraryContext";
import { userDashboardPageStyles as s } from '../../assets/dummyStyles'
import { Link } from "react-router-dom"
import { AlertTriangle, BookCopy, CircleCheckBig, CircleDashed, CreditCardCheck, GraduationCap, GraduationCapIcon, IdCard, ReceiptText, ShieldCheck, Sparkles } from 'lucide-react'
import StudentBookCard from './StudentBookCard';

const StudentDashboard = () => {

    const { currentUser } = useAuth();
    const { currentUserHistory, currentUserSummary } = useLibrary();

    const activeCount = currentUserHistory.filter(
        (item) => item.liveStatus === "Borrowed",
    ).length;
    const overdueCount = currentUserHistory.filter(
        (item) => item.liveStatus === "Overdue",
    ).length;
    const pendingFine = currentUserSummary?.totalFine ?? 0;
    const clearedFine = currentUserSummary?.totalClearedFine ?? 0;

    const overviewStats = [
        {
        key: "issues",
        label: "Total Issued Books",
        value: `${currentUserHistory.length}`,
        note: "All library records attached to your student account",
        icon: BookCopy,
        },
        {
        key: "borrowed",
        label: "Active Books",
        value: `${activeCount}`,
        note: "Books currently mapped to your profile",
        icon: GraduationCap,
        },
        {
        key: "overdue",
        label: "Overdue Books",
        value: `${overdueCount}`,
        note: "Needs follow-up before more penalties are added",
        icon: AlertTriangle,
        },
        {
        key: "pending-fine",
        label: "Pending Fine",
        value: `Ksh. ${pendingFine}`,
        note: "Fine amount still pending on active records",
        icon: CircleDashed,
        },
        {
        key: "cleared-fine",
        label: "Cleared Fines",
        value: `Ksh. ${clearedFine}`,
        note: "Total fine amount already cleared on your account",
        icon: CircleCheckBig,
        },
    ];

    const recentBooks = currentUserHistory.slice(0, 3);

    return (
        <div className={s.pageContainer}>
            <section className={s.heroSection}>
                <div className={s.heroGrid}>
                    <div className={s.heroLeft}>
                        <span className={s.heroBadge}>
                            <Sparkles size={14} />
                            Student Dashboard
                        </span>
                        <h1 className={s.heroTitle}>
                            {currentUser?.name ?? "Reader"} Profile
                        </h1>
                        <p className={s.heroText}>Your Dashboard now keeps the important account
                            summary at the top and show the most recent issued books directly
                            below for faster access
                        </p>
                    </div>
                    <div className={s.rightColumnGrid}>
                        <article className={s.semesterCard}>
                            <div className={s.profileHeader}>
                                <div className="min-w-0">
                                    <p className={s.semesterLabel}> Student Profile </p>
                                   
                                </div>
                                <span className={s.profileIconWrapper}>
                                    <GraduationCapIcon size={16} />
                                </span>
                            </div>
                            <div className={s.profileDetails}>
                                <div className={s.profileDetailItem}>
                                    Student ID: {currentUserSummary?.studentID ?? "Not Assigned"}
                                </div>
                                <div className={s.profileDetailItem}>
                                    Class: {currentUserSummary?.classGrade ?? "Not Assigned"}
                                </div>
                                <div className={s.profileDetailItem}>
                                    Stream: {currentUserSummary?.stream ?? "General"}
                                </div>
                            </div>
                        </article>
                    </div>
                </div>
            </section>
            <section className={s.statsGrid}>
                {overviewStats.map((item) => {
                    const Icon = item.icon;

                    return(
                        <article key={item.key} className={s.statCard}>
                            <div className={s.statHeader}>
                                <span className={s.statIconWrapper}>
                                    <Icon size={20} />
                                </span>
                                <span classNme={s.statLiveBadge}>
                                    Live
                                </span>
                            </div>
                            <p className={s.statLabel}>
                                {item.label}
                            </p>
                            <p className={s.statValue}>
                                {item.value}
                            </p>
                            <p className={s.statNote}>
                                {item.note}
                            </p>
                        </article>
                    )
                })}
            </section>
            <section className={s.recentSection} >
                <div className={s.recentHeader} >
                    <div>
                        <h2 className={s.recentTitle} >
                            My Recent Books
                        </h2>
                        <p className={s.recentSubtitle} >
                            Details of Three Latest Records of Books Issued to You
                        </p>
                    </div>
                    <Link to="/student/books" className={s.viewMoreButton}>
                         More Details
                    </Link>
                </div>
                <div className={s.recentGrid}>
                    {recentBooks.length ? (
                        recentBooks.map((record) =>(
                            <StudentBookCard key={record.id} record={record} 
                            borrowerName={currentUser?.name?? "student"}/>
                        )
                      )
                     ):
                     (
                       <div className={s.emptyRecentState} >
                        No Books Issued to You Recently
                       </div> 
                     )
                    
                    }
                </div>
            </section>
        </div>
    )
}

export default StudentDashboard