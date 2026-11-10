import React from 'react'
import { adminDashboardStyles as s } from '../../assets/dummyStyles';
import { Activity, AlertTriangle, ArrowRight, ShieldEllipsis, UserRound } from 'lucide-react';
import { useLibrary } from '../../shared/LibraryContext';
import { Link } from 'react-router-dom';


const icons = [ UserRound, Activity, ShieldEllipsis, AlertTriangle ];

const AdminDashboard = () => {

  const {adminStats, studentSummaries } = useLibrary();

  const overdueStudents = studentSummaries.filter((student) => student.status === "Overdue");

  const attentionRecords = overdueStudents.map((student) => {
   const topOverdueRecord = student.activeBooks
    .filter((record) => record.liveStatus === "Overdue")
    .sort((first, second) => second.liveFine - first.liveFine)[0];

    if(!topOverdueRecord){
      return null;
    }

    return {
        studentName: student.name,
        studentID: student.studentID,
        email: student.email,
        classGrade: student.classGrade,
        totalFine: student.totalFine,
        borrowedCount: student.borrowedCount,
        ...topOverdueRecord,
      };

 }).filter(Boolean).sort((first, second) => second.totalFine - first.totalFine).slice(0,10);


  return (
    <div className= {s.container}>
      <section className={s.heroSection}>
        <div className={s.heroInner}>
          <div>
            <span className={s.badge}>
              School Administration Workspace
            </span>
            <h1 className={s.heading}>
              Manage Issued Books, Student Records, Returns, Overdue Status and Fines
            </h1>
            <p className={s.heroParagraph}>
              The Admin now focuses on visual trend graphs while keeping the existing workflow unchanged
            </p>
          </div>
        </div>
      </section>
      <section className = {s.statsGrid}>
        {adminStats.map((item, index) => {
          const Icon = icons[index];
          return(
            <article key = {item.label} className = {s.statCard}>
              <span className = {s.statIcon}>
               <Icon size = {20} />
              </span>
              <p className = {s.statLabel}> { item.label } </p>
              <p className = {s.statValue}> {item.value } </p>
              <p className = {s.statNote}> { item.note } </p>
            </article>
          )
        })}
      </section>
      <section className={s.overdueSection}>
        <div className={s.overdueHeader}>
          <div>
            <h2 className={s.overdueTitle}> Overdue Attention List </h2>
            <p className={s.overdueSubtitle}>
              Top Overdue Books Ranked by Total Fines
            </p>
          </div>
          <span className={s.alertIcon}>
            <AlertTriangle size={20} />
          </span>
        </div>
        <div className={s.overdueGrid}>
          {attentionRecords.length ? (attentionRecords.map((record, index) => (
            <div key={`${record.email}-${record._id}`} className={s.overdueCard}>
              {index === 0 ? (
                    <span className={s.mostFineBadge}>
                      Most Fine Imposed
                    </span>
                  ) : null
                }
                <div className={s.overdueCardInner}>
                  <div>
                    <p className={s.studentName}>
                      {record.studentName}
                    </p>
                    <p className={s.studentDetails}>
                      {record.studentID ?? "Not assigned"} | {record.email}
                    </p>
                    <p className={s.studentFine}>
                      Ksh. {record.totalFine}
                    </p>
                  </div>
                  <div className={s.highestFineBookContainer}>
                    <p className={s.highestFineLabel}>
                      Highest Fine Book
                    </p>
                    <p className={s.highestFineTitle}>
                      {record.title}
                    </p>
                  </div>
                  <div className={s.detailsGrid}>
                  <div className={s.detailItem}>
                    {record.classGrade ?? "General"}
                  </div>
                  <div className={s.detailItem}>
                    Book Code: {record.bookCode}
                  </div>
                  <div className={s.detailItem}>
                    Highest Book Fine: Ksh. {record.liveFine}
                  </div>
                </div>
              </div>
            </div>
            )  )
           ) :
            (
            <div className={s.emptyState}>
               No overdue books need urgent attention right now
            </div>
            )
          }
        </div>
        {attentionRecords.length ? (
          <div className={s.viewMoreContainer}>
            <Link to="/admin/users?status=Overdue&sort=high-t0-low"
              className={s.viewMoreLink}> 
              View More
              <ArrowRight size={16} />
            </Link>
          </div>
         ) : null
        }
      </section>
    </div>
  )
}

export default AdminDashboard