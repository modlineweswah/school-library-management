import React, { useEffect, useState } from "react";
import { FilePlus2, Search, Trash2 } from "lucide-react";
import { useLibrary } from "../../shared/LibraryContext";
import { adminBooksPageStyles as s } from "../../assets/dummyStyles";

// Assumes Vite; use process.env.REACT_APP_API_URL if you're on CRA
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
  studentID: "",
  books: [createBookDraft()],
});

// Returns an object of field -> message; empty object means the book row is valid
const validateBook = (book) => {
  const errors = {};
  if (!book.title.trim()) errors.title = "Book name is required";
  if (!book.bookCode.trim()) errors.bookCode = "Book code is required";
  if (!book.dueDate) errors.dueDate = "Due date is required";
  else if (book.dueDate < book.issuedOn) errors.dueDate = "Due date cannot be before the issue date";
  return errors;
};

const Books = () => {
  const { issueManualBooksToStudent, fineSettings } = useLibrary();

  const [issueForm, setIssueForm] = useState(createInitialForm);
  const [formMessage, setFormMessage] = useState("");
  const [matchingStudents, setMatchingStudents] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [bookErrors, setBookErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isStudentSelected = Boolean(selectedStudent);
  const canSearchStudentID = issueForm.studentID.trim().length > 0 && !isStudentSelected;

  // Debounced student search. AbortController cancels any in-flight request when
  // the input changes or a student is selected, so stale results can't overwrite
  // newer ones or reopen the list after selection.
  useEffect(() => {
    if (!canSearchStudentID) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setSearchError("");
        const response = await fetch(
          `${API_BASE}/api/students/search-by-student-id?id=${encodeURIComponent(
            issueForm.studentID.trim()
          )}`,
          {
            signal: controller.signal,
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
          setSearchError(data.message || "Unable to search students by ID number.");
        }
      } catch (error) {
        if (error.name === "AbortError") return; // superseded by a newer search
        console.error("Student ID search error:", error);
        setMatchingStudents([]);
        setSearchError("Unable to fetch matching students.");
      } finally {
        // Only the latest, non-aborted request is allowed to stop the spinner
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [issueForm.studentID, canSearchStudentID]);

  const clearSelectedStudent = () => {
    setSelectedStudent(null);
    setMatchingStudents([]);
    setSearchError("");
    setIsSearching(false);
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
    setIsSearching(false);
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

  // Only the Student ID field is editable at form level
  const handleStudentIdChange = (event) => {
    const { value } = event.target;
    setFormMessage("");
    setSelectedStudent(null);
    setMatchingStudents([]);
    setSearchError("");
    setIsSearching(Boolean(value.trim()));
    setIssueForm((current) => ({ ...current, studentID: value }));
  };

  // Renamed from the misspelled `hanleChange`, which is what the JSX actually calls
  const handleBookChange = (bookId, field, value) => {
    setFormMessage("");
    setBookErrors((current) => {
      if (!current[bookId]?.[field]) return current;
      return { ...current, [bookId]: { ...current[bookId], [field]: "" } };
    });
    setIssueForm((current) => ({
      ...current,
      books: current.books.map((book) =>
        book.id === bookId ? { ...book, [field]: value } : book
      ),
    }));
  };

  const addBookDraft = () => {
    setIssueForm((current) => ({
      ...current,
      books: [...current.books, createBookDraft()],
    }));
  };

  const removeBookDraft = (bookId) => {
    setBookErrors((current) => {
      const { [bookId]: _removed, ...rest } = current;
      return rest;
    });
    setIssueForm((current) => ({
      ...current,
      // Always keep at least one book row
      books:
        current.books.length > 1
          ? current.books.filter((book) => book.id !== bookId)
          : current.books,
    }));
  };

  const handleIssueSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    // 1. A student must be selected
    if (!issueForm.userEmail) {
      setFormMessage("Search and select a student by ID before issuing books");
      return;
    }

    // 2. Every book row must be complete
    const errors = {};
    issueForm.books.forEach((book) => {
      const bookError = validateBook(book);
      if (Object.keys(bookError).length) errors[book.id] = bookError;
    });
    setBookErrors(errors);
    if (Object.keys(errors).length) {
      setFormMessage("Please fix the highlighted book entries");
      return;
    }

    // 3. Submit
    setSubmitting(true);
    try {
      const result = await issueManualBooksToStudent({
        userEmail: issueForm.userEmail,
        studentDetails: {
          studentID: issueForm.studentID,
          studentName: issueForm.studentName,
          classGrade: issueForm.classGrade,
          stream: issueForm.stream,
        },
        books: issueForm.books.map(({ title, bookCode, issuedOn, dueDate }) => ({
          title: title.trim(),
          bookCode: bookCode.trim(),
          issuedOn,
          dueDate,
        })),
      });

      if (!result?.ok) {
        setFormMessage(result?.error ?? "Unable to issue books now");
        return;
      }

      setFormMessage(`${result.count} manual book record(s) issued successfully!`);
      setIssueForm(createInitialForm());
      setSelectedStudent(null);
      setMatchingStudents([]);
      setSearchError("");
      setIsSearching(false);
      setBookErrors({});
    } catch (error) {
      console.error("Issue books error:", error);
      setFormMessage("Unexpected error while issuing books");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={s.pageContainer}>
      <section className={s.mainSection}>
        <div className={s.innerContainer}>
          <div className={`${s.headerFlex} flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between`}>
            <div className="min-w-0">
              <h2 className={s.title}>Issue Book To Student</h2>
              <p className={s.subtitle}>
                Select a student, add books and view overdue fines
              </p>
            </div>
            {fineSettings && (
              <div className={`${s.fineRuleBadge} self-start shrink-0`}>
                Fine Rule: Ksh. {fineSettings.amount} per {fineSettings.interval}
              </div>
            )}
          </div>

          <form className={`${s.form} flex flex-col gap-6`} onSubmit={handleIssueSubmit} noValidate>
            {/* Student details */}
            <div className={`${s.formGrid} grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4`}>
              <label className={`${s.label} flex flex-col gap-1`}>
                <span className={s.labelSpan}>Student ID</span>
                <div className={`${s.searchInputWrapper} relative`}>
                  <Search
                    className={`${s.searchIcon} pointer-events-none absolute left-3 top-1/2 -translate-y-1/2`}
                    size={16}
                  />
                  <input
                    type="text"
                    name="studentID"
                    value={issueForm.studentID}
                    readOnly={isStudentSelected}
                    onChange={handleStudentIdChange}
                    placeholder="Search Student by ID Number"
                    autoComplete="off"
                    className={`${s.textInput} w-full pl-9`}
                  />
                </div>
              </label>

              <label className={`${s.label} flex flex-col gap-1`}>
                <span className={s.labelSpan}>Student Name</span>
                <input
                  type="text"
                  value={issueForm.studentName}
                  readOnly
                  placeholder="Selected Student Name"
                  className={`${s.textInput} w-full`}
                />
              </label>

              <label className={`${s.label} flex flex-col gap-1`}>
                <span className={s.labelSpan}>Grade</span>
                <input
                  type="text"
                  value={issueForm.classGrade}
                  readOnly
                  placeholder="Grade"
                  className={`${s.textInput} w-full`}
                />
              </label>

              <label className={`${s.label} flex flex-col gap-1`}>
                <span className={s.labelSpan}>Stream</span>
                <input
                  type="text"
                  value={issueForm.stream}
                  readOnly
                  placeholder="Stream"
                  className={`${s.textInput} w-full`}
                />
              </label>
            </div>

            {/* Search results */}
            <div className={`${s.matchingContainer} flex flex-col gap-2`}>
              <p className={s.matchingTitle}>Matching Students</p>
              <div className={`${s.studentList} flex flex-wrap items-center gap-2`}>
                {isSearching ? (
                  <span className={s.searchingMessage}>Searching for students...</span>
                ) : matchingStudents.length ? (
                  matchingStudents.map((student) => (
                    <button
                      key={student.studentID || student.email}
                      type="button"
                      onClick={() => selectStudent(student)}
                      className={`${s.studentButtonBase} inline-flex items-center gap-2 ${
                        selectedStudent?.email === student.email
                          ? s.studentButtonSelected
                          : s.studentButtonUnselected
                      }`}
                    >
                      <span>{student.name}</span>
                      <span className={s.studentRollSpan}>- {student.studentID}</span>
                    </button>
                  ))
                ) : (
                  <p className={s.noMatchText}>
                    {issueForm.studentID.trim() && !isStudentSelected
                      ? "No matching students found."
                      : "Type student ID number to search registered students."}
                  </p>
                )}
              </div>

              {searchError && (
                <p className={s.errorText} role="alert">{searchError}</p>
              )}

              {selectedStudent && (
                <div className={`${s.selectedStudentContainer} flex flex-wrap items-center gap-3`}>
                  <span className={s.selectedStudentBadge}>
                    Selected: {selectedStudent.name} - {selectedStudent.studentID}
                  </span>
                  <button type="button" onClick={clearSelectedStudent} className={s.clearButton}>
                    Clear selection
                  </button>
                </div>
              )}
            </div>

            {/* Books */}
            <div className={`${s.booksSection} flex flex-col gap-4`}>
              <div className={`${s.booksHeader} flex items-center justify-between gap-3`}>
                <h3 className={s.booksTitle}>Manual Book Entries</h3>
                <button
                  type="button"
                  onClick={addBookDraft}
                  className={`${s.addBookButton} inline-flex items-center gap-2 shrink-0`}
                >
                  <FilePlus2 size={16} />
                  Add Book
                </button>
              </div>

              <div className={`${s.booksGrid} grid grid-cols-1 gap-4`}>
                {issueForm.books.map((book, index) => {
                  const errs = bookErrors[book.id] || {};
                  return (
                    <article key={book.id} className={`${s.bookCard} flex flex-col gap-4`}>
                      <div className={`${s.bookCardHeader} flex items-start justify-between gap-3`}>
                        <div className={`${s.bookIndexWrapper} min-w-0`}>
                          <p className={s.bookIndexLabel}>Manual Book {index + 1}</p>
                          <p className={s.bookIndexHelper}>
                            Add book name and code. Issue date is set automatically to today.
                          </p>
                        </div>
                        {issueForm.books.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBookDraft(book.id)}
                            aria-label={`Remove manual book ${index + 1}`}
                            className={`${s.deleteButton} shrink-0`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className={`${s.bookFieldsGrid} grid grid-cols-1 gap-4 md:grid-cols-2`}>
                        <label className={`${s.bookFieldLabel} flex flex-col gap-1`}>
                          <span className={s.labelSpan}>Book Name</span>
                          <input
                            type="text"
                            value={book.title}
                            onChange={(e) => handleBookChange(book.id, "title", e.target.value)}
                            placeholder="Write book name"
                            aria-invalid={Boolean(errs.title)}
                            className={`${s.bookFieldInput} w-full`}
                          />
                          {errs.title && <span className="text-sm text-red-600">{errs.title}</span>}
                        </label>

                        <label className={`${s.bookFieldLabel} flex flex-col gap-1`}>
                          <span className={s.labelSpan}>Book Code</span>
                          <input
                            type="text"
                            value={book.bookCode}
                            onChange={(e) => handleBookChange(book.id, "bookCode", e.target.value)}
                            placeholder="Write book code"
                            aria-invalid={Boolean(errs.bookCode)}
                            className={`${s.bookFieldInput} w-full`}
                          />
                          {errs.bookCode && <span className="text-sm text-red-600">{errs.bookCode}</span>}
                        </label>

                        <div className={`${s.dateGrid} grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-2`}>
                          <label className={`${s.bookFieldLabel} flex flex-col gap-1`}>
                            <span className={s.labelSpan}>Issue Date</span>
                            <input
                              type="date"
                              value={book.issuedOn}
                              readOnly
                              disabled
                              className={`${s.dateInputDisabled} w-full`}
                            />
                          </label>

                          <label className={`${s.bookFieldLabel} flex flex-col gap-1`}>
                            <span className={s.labelSpan}>Due Date</span>
                            <input
                              type="date"
                              value={book.dueDate}
                              onChange={(e) => handleBookChange(book.id, "dueDate", e.target.value)}
                              min={book.issuedOn}
                              aria-invalid={Boolean(errs.dueDate)}
                              className={`${s.dateInput} w-full`}
                            />
                            {errs.dueDate && <span className="text-sm text-red-600">{errs.dueDate}</span>}
                          </label>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {formMessage && (
              <div className={s.formMessage} role="status">{formMessage}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`${s.submitButton} inline-flex items-center justify-center gap-2 w-full sm:w-auto sm:self-end`}
            >
              {submitting ? "Issuing..." : "Issue Book"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Books;