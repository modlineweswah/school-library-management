import React, { useEffect, useRef, useState } from 'react'
import { FilePlus2, Search, Trash2 } from "lucide-react"
import { useLibrary } from "../../shared/LibraryContext"
import { adminBooksPageStyles as s } from "../../assets/dummyStyles"


const getTodayIso = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const createBookDraft = () => ({
    id: `draft-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    title: "",
    bookCode: "",
    issuedOn: getTodayIso(),
    dueDate: "",
});

const createInitialForm = () => ({
    studentName: "",
    userEmail: "",
    classGrade: "",
    stream: "",
    //academicYear: "",
    //semester: "",
    studentID: "",
    books: [createBookDraft()],
});


const Books = () => {

    const { issueManualBooksToStudent, fineSettings } = useLibrary();
    const [issueForm, setIssueForm] = useState(createInitialForm);
    const [formMessage, setFormMessage] = useState("");
    const [matchingStudents, setMatchingStudents] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [searchError, setSearchError] = useState("");
    const searchTimeoutRef = useRef(null);
    const isStudentSelected = Boolean(selectedStudent);
    const canSearchStudentID = issueForm.studentID.trim().length > 0 && !isStudentSelected;

    useEffect(() => {
        if (!canSearchStudentID) return;
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = window.setTimeout(async () => {
            try {
                setSearchError("");
                const response = await fetch(
                    `http://localhost:3000/api/students/search-by-student-id?id=${encodeURIComponent(
                        issueForm.studentID.trim(),
                    )}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("library-auth-token")}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                const data = await response.json();
                if (response.ok && data.success) {
                    setMatchingStudents(data.students || []);
                } else {
                    setMatchingStudents([]);
                    setSearchError(
                        data.message || "Unable to search students by ID number."
                    );
                }
            } catch (error) {
                console.error("Student ID search error:", error);
                setMatchingStudents([]);
                setSearchError("Unable to fetch matching students.");
            } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [issueForm.studentID, canSearchStudentID]);

    const clearSelectedStudent = () => {
        setSelectedStudent(null);
        setMatchingStudents([]);
        setSearchError("");
        setIssueForm((current) => ({
            ...current,
            studentName: "",
            userEmail: "",
            classGrade: "",
            stream: "",
            studentID: "",
        }));
    };

    const selectStudent = (student) => {
        setFormMessage("");
        setSearchError("");
        setMatchingStudents([]);
        setSelectedStudent(student);
        setIssueForm((current) => ({
            ...current,
            studentName: student.name,
            userEmail: student.email,
            classGrade: student.classGrade || "",
            stream: student.stream || "",
            studentID: student.studentID || "",
        }));
    };

    const handleIssueChange = (event) => {
        const { name, value } = event.target;
        setFormMessage("");
        if (name === "studentID") {
            setSelectedStudent(null);
            setMatchingStudents([]);
            setSearchError("");
            setIsSearching(Boolean(value.trim()));
        }

        setIssueForm((current) => ({
            ...current,
            [name]: value,
        }))
    }

    const hanleChange = (bookId, field, value) => {
        setFormMessage("");
        setIssueForm((current) => ({
            ...current,
            books: current.books.map((book) => book.id === bookId ?
                { ...book, [field]: value } : book,),
        }));
    }

    const addBookDraft = () => {
        setIssueForm((current) => ({
            ...current,
            books: [...current.books, createBookDraft()],
        }))
    }

    const removeBookDraft = (book) => {
        setIssueForm((current) => ({
            ...current,
            books: current.books > 1 ? current.books.filter((book) => book.id !== bookId) : current.books,
        }))
    }

    const handleIssueSubmit = async (event) => {
        event.preventDefault();

        if (!issueForm.userEmail) {
            setFormMessage("Search and select a student by Id before issuing books");
            return;
        }

        const result = await issueManualBooksToStudent({
            userEmail: issueForm.userEmail,
            studentDetails: issueForm,
            books: issueForm.books
        });

        if (!result.ok) {
            setFormMessage(result.error ?? "Unable to issue books now");
            return;
        }

        setFormMessage(`${result.count} Manual Book record(s) issued successfully!`);

        setIssueForm(createInitialForm());
        setSelectedStudent(null);
        setMatchingStudents([]);
        setSearchError("");
    }

    return (
        <div className={s.pageContainer}>
            <section className={s.mainSection}>
                <div className={s.innerContainer}>
                    <div className={s.headerFlex}>
                        <div>
                            <h2 className={s.title}> Issue Book To Student </h2>
                            <p className={s.subtitle}>
                                Select a student, add books and view overdue  fines
                            </p>
                        </div>
                        <div className={s.fineRuleBadge}>
                            Fine Rule: Ksh. {fineSettings.amount} per {fineSettings.interval}
                        </div>
                    </div>

                    <form className={s.form} onSubmit={handleIssueSubmit}>
                        <div className={s.formGrid}>
                            <label className={s.label}>
                                <span className={s.labelSpan}>
                                   Student ID
                                </span>
                                 <div className={s.searchInputWrapper}>
                                    <Search className={s.searchIcon} size={16} />
                                    <input type="text" name="studentID" value={issueForm.studentID}
                                            readOnly={isStudentSelected}
                                            onChange={handleIssueChange}
                                            placeholder='Search Student by ID Number' 
                                            className={s.readonlyInput}
                                    />
                                </div>    
                            </label>
                            <label className={s.label}>
                                <span className={s.labelSpan}>
                                    Student Name
                                </span>
                                <input type="text" name="studentName" value={issueForm.studentName}
                                    readOnly placeholder='Selected Student Name' className={s.textInput}
                                />
                            </label>
                            <label className={s.label}>
                                <span className={s.labelSpan}>
                                   Grade
                                </span>
                                 <input type="text" name="classGrade" value={issueForm.classGrade}
                                        readOnly={isStudentSelected}
                                        onChange={handleIssueChange}
                                         placeholder='Grade' 
                                         className={s.textInput}
                                />
                            </label>
                            <label className={s.label}>
                                <span className={s.labelSpan}>
                                   Stream
                                </span>
                                 <input type="text" name="stream" value={issueForm.stream}
                                        readOnly={isStudentSelected}
                                        onChange={handleIssueChange}
                                         placeholder='Stream' 
                                         className={s.textInput}
                                />
                            </label>
                        </div>

                        <div className={s.matchingContainer}>
                            <p className={s.matchingTitle}>Matching Students</p>
                            <div className={s.studentList}>
                                {isSearching ? (
                                <span className={s.searchingMessage}>
                                    Searching for students...
                                </span>
                                ) : matchingStudents.length ? (
                                matchingStudents.map((student) => (
                                    <button
                                        key={student.email}
                                        type="button"
                                        onClick={() => selectStudent(student)}
                                        className={`${s.studentButtonBase} ${
                                            selectedStudent?.email === student.email
                                            ? s.studentButtonSelected
                                            : s.studentButtonUnselected
                                        }`}
                                        >
                                        <span>{student.name}</span>
                                        <span className={s.studentRollSpan}>
                                            - {student.studentID}
                                        </span>
                                    </button>
                                ))
                                ) : (
                                <p className={s.noMatchText}>
                                    {issueForm.studentID.trim()
                                    ? "No matching students found."
                                    : "Type student ID number to search registered students."}
                                </p>
                                )}
                            </div>
                            {searchError && <p className={s.errorText}>{searchError}</p>}

                            {selectedStudent && (
                                <div className={s.selectedStudentContainer}>
                                    <span className={s.selectedStudentBadge}>
                                        Selected: {selectedStudent.name} - {selectedStudent.studentID}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={clearSelectedStudent}
                                        className={s.clearButton}>
                                        Clear selection
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className={s.booksSection}>
                            <div className={s.booksHeader}>
                                <h3 className={s.booksTitle}>Manual Book Entries</h3>
                                <button
                                type="button"
                                onClick={addBookDraft}
                                className={s.addBookButton}
                                >
                                <FilePlus2 size={16} />
                                Add Book
                                </button>
                            </div>

                            <div className={s.booksGrid}>
                                {issueForm.books.map((book, index) => (
                                <article key={book.id} className={s.bookCard}>
                                    <div className={s.bookCardHeader}>
                                    <div className={s.bookIndexWrapper}>
                                        <p className={s.bookIndexLabel}>Manual Book {index + 1}</p>
                                        <p className={s.bookIndexHelper}>
                                        Add book name and code. Issue date is set automatically to today.
                                        </p>
                                    </div>
                                    {issueForm.books.length > 1 && (
                                        <button
                                        type="button"
                                        onClick={() => removeBookDraft(book.id)}
                                        className={s.deleteButton}
                                        >
                                        <Trash2 size={16} />
                                        </button>
                                    )}
                                    </div>

                                    <div className={s.bookFieldsGrid}>
                                    <label className={s.bookFieldLabel}>
                                        <span className={s.labelSpan}>Book Name</span>
                                        <input
                                        type="text"
                                        value={book.title}
                                        onChange={(event) =>
                                            handleBookChange(book.id, "title", event.target.value)
                                        }
                                        placeholder="Write book name"
                                        className={s.bookFieldInput}
                                        />
                                    </label>

                                    <label className={s.bookFieldLabel}>
                                        <span className={s.labelSpan}>Book Code</span>
                                        <input
                                        type="text"
                                        value={book.bookCode}
                                        onChange={(event) =>
                                            handleBookChange(book.id, "bookCode", event.target.value)
                                        }
                                        placeholder="Write book code"
                                        className={s.bookFieldInput}
                                        />
                                    </label>

                                    <div className={s.dateGrid}>
                                        <label className={s.bookFieldLabel}>
                                        <span className={s.labelSpan}>Issue Date</span>
                                        <input
                                            type="date"
                                            value={book.issuedOn}
                                            readOnly
                                            disabled
                                            className={s.dateInputDisabled}
                                        />
                                        </label>

                                        <label className={s.bookFieldLabel}>
                                        <span className={s.labelSpan}>Due Date</span>
                                        <input
                                            type="date"
                                            value={book.dueDate}
                                            onChange={(event) =>
                                            handleBookChange(book.id, "dueDate", event.target.value)
                                            }
                                            min={getTodayIso()}
                                            className={s.dateInput}
                                        />
                                        </label>
                                    </div>
                                    </div>
                                </article>
                                ))}
                            </div>
                        </div>
                        {formMessage && <div className={s.formMessage}>{formMessage}</div> }
                        <button type='submit' className={s.submitButton}> Issue Book</button>
                    </form>
                </div>
            </section>
        </div>
    )
}

export default Books