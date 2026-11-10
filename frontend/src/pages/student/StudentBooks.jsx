import React, { useMemo, useState } from 'react'
import { userBooksPageStyles as s } from '../../assets/dummyStyles'
import { Search } from 'lucide-react'
import { useAuth } from '../../shared/AuthContext'
import { useLibrary } from '../../shared/LibraryContext'
import { useDebugValue } from 'react'
import StudentBookCard from './StudentBookCard'

const StudentBooks = () => {

    const {currentUser} = useAuth();
    const {currentUserHistory} = useLibrary();
    const [filters, setFilters] = useState({
        search:"",
        status:"All"
    });

    const filteredIssuedBooks = useMemo(() => {
        return currentUserHistory.filter((record) => {
        const term = filters.search.toLowerCase();
        const matchesSearch =
            !filters.search ||
            record.title.toLowerCase().includes(term) ||
            record.author.toLowerCase().includes(term) ||
            record.bookCode.toLowerCase().includes(term) ||
            currentUser?.name?.toLowerCase().includes(term);

        const matchesStatus =
            filters.status === "All" || record.liveStatus === filters.status;

        return matchesSearch && matchesStatus;
        });
    }, [currentUser?.name, currentUserHistory, filters]);

    const handleFilterChange = (event) => {
        const {name, value} = event.target;
        setFilters((current) => ({
            ...current, 
            [name]:useDebugValue
        }) )
    }

  return (
    <div className={s.pageContainer}>
        <section className={s.heroSection}>
            <div className={s.heroFlex}>
                <div>
                    <span className={s.heroBadge}>
                        Student Books Page
                    </span>
                    <h1 className={s.heroTitle}>
                        Books Card Content and Cleaner Details
                    </h1>
                    <p className={s.heroText}>
                        Each card shows a cleaner summary, status badge and a better layout so that
                        details feel more structured and elegant
                    </p>
                </div>
            </div>
        </section>
        <section className={s.mainSection}>
            <div className={s.sectionHeader}>
                <div>
                    <h2 className={s.sectionTitle}>My Boorrowed(Issued) Books</h2>
                    <p className={s.sectionSubtitle}>supporting record data</p>
                </div>
            </div>
            <div className={s.filtersContainer}>
                    <label className={s.filterLabel}>
                        <span className={s.filterLabelSpan}>
                            Search My Books
                        </span>
                        <div className={s.searchWrapper}>
                            <Search size={16} className={s.searchIcon}/>
                            <input type="text" name="search" value={filters.Search}
                                onChange={handleFilterChange}
                                placeholder='Search Book By Code, Name, Author or Borrower'
                                className={s.searchInput}
                             />
                        </div>
                    </label>
                    <label className={s.filterLabel}>
                        <span className={s.filterLabelSpan} > Status </span>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className={s.selectInput}>
                            <option value="All">All Status</option>
                                <option value="Borrowed">Borrowed</option>
                                <option value="Overdue">Overdue</option>
                                <option value="Returned">Returned</option>
                        </select>
                    </label>
                </div>
                <div classNme={s.booksGrid}>
                    {filteredIssuedBooks.length ? (
                        filteredIssuedBooks.map((record) => (
                            <StudentBookCard Key={record.id} record={record}
                                borrowerName={currentUser?.name ??"student"} />
                         )
                      )
                     ):(
                        <div className={s.emptyState}>
                            No Issued Book Matched Your Search
                        </div>
                     )
                    }
                </div>
        </section>
    </div>
  )
}

export default StudentBooks