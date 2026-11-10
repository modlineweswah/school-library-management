import React, { useEffect, useState } from 'react'
import { userEditProfilePageStyles as s } from '../../assets/dummyStyles'
import { classGrades, classStreams } from '../../SchoolClassesData/schoolClasses'
import { CheckCircle2, Pencil } from 'lucide-react';
import { useAuth } from '../../shared/AuthContext';

const StudentProfile = () => {

    const { currentUser, updateProfile } = useAuth();
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        classGrade: "",
        stream: "",
        //semester: "",
        //academicYear: "",
        studentID: "",
    });
    const [toast, setToast] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        setForm({
        name: currentUser.name ?? "",
        email: currentUser.email ?? "",
        phone: currentUser.phone ?? "",
        department: currentUser.classGrade ?? "",
        stream: currentUser.stream ?? "",
        //semester: currentUser.semester ?? "",
        //academicYear: currentUser.academicYear ?? "",
        studentID: currentUser.studentID ?? "",
        });
        setIsEditing(false);
        setError("");
    }, [currentUser]);

    useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(""), 2400);
        return () => clearTimeout(timer);
    }, [toast]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError("");
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setForm((current) => ({ ...current, [name]: digitsOnly }));
    } else {
      setForm((current) => ({ ...current, [name]: value }));
    }
  };

  const handleSubmit = async(event) => {
    event.preventDefault();
    setError("");
    
    if (form.phone.trim().replace(/\D/g,"").length !==10) {
        setError("Mobile number has be exactly 10 digits");
        return;
    }

    try {
        const result = await updateProfile(form);
        setLoading(false);

        if (result.ok) {
            setToast("Profile Updated Successfully.");
            setIsEditing(false);
        } 
        else {
            setError(result.error || "Profile update failed.Please try again");
        }
    } 
    catch (err) {
        setLoading(false);
        setError("An unexpected connection error occured");
    }
  }

  return (
    <div className={s.pageContainer}>
        {toast && (
            <div className={s.toastWrapper}>
                <div className={s.toastContent}>
                    <CheckCircle2 size={16}/>
                </div>
            </div>
        )}
        <section className={s.mainSection}>
            <div className={s.headerFlex}>
                <div>
                    <h1 className={s.title}>
                        Edit Your Student Details
                    </h1>
                    <p className={s.subtitle}>
                        Update your student details and latest profile infomation
                    </p>
                </div>
                {!isEditing &&(
                    <button type='button' onClick={()=>setIsEditing(true)} className={s.editButton}>
                        <Pencil size={18}/>
                    </button>
                )}
            </div>

            <form className={s.formContainer} onSubmit={handleSubmit}>
                <label className={s.label}>
                    <span className={s.labelSpan}>Name</span>
                    <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={s.input}
                    />
                </label>

                 <label className={s.label}>
                    <span className={s.labelSpan}>Student ID Number</span>
                    <input
                        name="studentID"
                        value={form.studentID}
                        onChange={handleChange}
                        disabled={true}
                        className={s.inputDisabled}
                    />
                    <span className={s.helperText}>
                    ID Number cannot be changed.
                    </span>
                </label>

                <label className={s.label}>
                    <span className={s.labelSpan}>Email</span>
                    <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={true}
                    className={s.inputDisabled}
                    />
                    <span className={s.helperText}>
                    Email address cannot be changed.
                    </span>
                </label>

                <label className={s.label}>
                    <span className={s.labelSpan}>Mobile Number</span>
                    <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={s.input}
                    />
                </label>

                

                <label className={s.label}>
                    <span className={s.labelSpan}>Class</span>
                    <select
                        name="classGrade"
                        value={form.classGrade}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={s.select}
                    >
                    {classGrades.map((grade) => (
                        <option key={grade} value={grade}>
                        {grade}
                        </option>
                    ))}
                    </select>
                </label>

                <label className={s.label}>
                    <span className={s.labelSpan}>Stream</span>
                    <select
                        name="stream"
                        value={form.stream}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={s.select}
                    >
                    {classStreams.map((stream) => (
                        <option key={stream} value={stream}>
                        {stream}
                        </option>
                    ))}
                    </select>
                </label>

               

                {error && <div className={s.errorMessage}>{error}</div>}

                {isEditing && (
                    <div className={s.buttonGroup}>
                    <button type="submit" disabled={loading} className={s.saveButton}>
                        {loading ? "Saving Profile..." : "Save Profile"}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                        setError("");
                        setIsEditing(false);
                        setForm({
                            name: currentUser.name ?? "",
                            email: currentUser.email ?? "",
                            phone: currentUser.phone ?? "",
                            department: currentUser.department ?? "",
                            stream: currentUser.stream ?? "",
                            semester: currentUser.semester ?? "",
                            academicYear: currentUser.academicYear ?? "",
                            rollNumber: currentUser.rollNumber ?? "",
                        });
                        }}
                        disabled={loading}
                        className={s.cancelButton}
                    >
                        Cancel
                    </button>
                    </div>
                )}
            </form>

        </section>
    </div>
  )
}

export default StudentProfile