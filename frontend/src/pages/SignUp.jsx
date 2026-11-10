import React, { useEffect, useState } from 'react';
import { signupStyles as s } from '../assets/dummyStyles';
import { useAuth } from '../shared/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, BadgeCheck, CheckCircle, Eye, EyeOff,KeyRound, LockKeyhole, Mail, Phone, Sparkles, UserRound} from 'lucide-react';
import { classGrades, classStreams } from '../SchoolClassesData/schoolClasses';

const stepList = [
  { id: 1, title: "Account" },
  { id: 2, title: "OTP" },
  { id: 3, title: "Profile" },
];

const signupHighlights = [
  "Step 1: collects student account details and checks immediately if the email already exists.",
  "Step 2: verifies the OTP before moving forward.",
  "Step 3: saves department, stream, semester, year, and roll number.",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const validators = {
  name: (validateName) => {
    if (!validateName.trim()) return "Full name is required";
    if (validateName.trim().length < 2) return "Full name must be at least 2 characters";
    return "";
  },
  email: (validateEmail) => {
    if (!validateEmail.trim()) return "Email address is required";
    if (!EMAIL_PATTERN.test(validateEmail.trim())) return "Enter a valid email address";
    return "";
  },
  phone: (validatePhone) => {
    const digits = validatePhone.replace(/\D/g, "");
    if (!digits) return "Mobile number is required";
    if (digits.length !== 10) return "Mobile number must be exactly 10 digits";
    return "";
  },
  password: (validatePassword) => {
    if (!validatePassword) return "Password is required";
    if (validatePassword.length < 6) return "Password must be at least 6 characters";
    if (!/[A-Z]/.test(validatePassword)) return "Password must include at least one uppercase letter";
    if (!/\d/.test(validatePassword)) return "Password must include at least one digit";
    if (!/[^A-Za-z0-9]/.test(validatePassword)) return "Password must include at least one special character";
    return "";
  },
  otp: (validateOtp) => {
    if (!validateOtp.trim()) return "OTP code is required";
    if (!/^\d{6}$/.test(validateOtp.trim())) return "OTP must be exactly 6 digits";
    return "";
  },
  stream: (validateStream) => (validateStream.trim() ? "" : "Stream is required"),
  classGrade: (validateGrade) => (validateGrade.trim() ? "" : "Grade is required"),
  studentID: (validateStudentID) => (validateStudentID.trim() ? "" : "Student Registration number is required"),
};

const STEP_FIELDS = {
  1: ["name", "email", "phone", "password"],
  2: ["otp"],
  3: ["stream", "classGrade", "studentID"],
};

const SignUp = () => {
  const { registerStudent, verifyOtpCode, completeProfileData, logout } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", otp: "",
    role: "student", classGrade: "", stream: "", studendID: "",
  });

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, tone = "success") => setToast({ message, tone });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError("");
    setFieldErrors((current) => ({ ...current, [name]: "" }));

    if (name === "phone") {
      setForm((current) => ({ ...current, phone: value.replace(/\D/g, "").slice(0, 10) }));
    } else if (name === "otp") {
      setForm((current) => ({ ...current, otp: value.replace(/\D/g, "").slice(0, 6) }));
    } else {
      setForm((current) => ({ ...current, [name]: value }));
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    const validate = validators[name];
    if (validate) setFieldErrors((current) => ({ ...current, [name]: validate(value) }));
  };

  // Validates every field belonging to a step; returns true when all pass
  const validateStep = (stepNumber) => {
    const nextErrors = {};
    STEP_FIELDS[stepNumber].forEach((field) => {
      const message = validators[field](form[field] ?? "");
      if (message) nextErrors[field] = message;
    });
    setFieldErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = async () => {
    setError("");
    if (!validateStep(step)) return;

    setLoading(true);
    try {
      if (step === 1) {
        const res = await registerStudent({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone,
          password: form.password,
        });
        if (!res?.ok) {
          const message = res?.error || "Registration failed";
          showToast(message, "error");
          setError(message);
          return;
        }
        showToast("OTP sent to your email successfully!");
      }

      if (step === 2) {
        const res = await verifyOtpCode({ email: form.email.trim(), otp: form.otp });
        if (!res?.ok) {
          const message = res?.error || "OTP verification failed";
          showToast(message, "error");
          setError(message);
          return;
        }
        showToast("OTP verified successfully!");
      }

      setStep((current) => Math.min(3, current + 1));
    } catch (err) {
      console.error("Signup step error:", err);
      setError("Unexpected connection error occurred");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError("");
    setStep((current) => Math.max(1, current - 1));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();          
    setError("");

    const allValid = [1, 2, 3].every((n) => validateStep(n));
    if (!allValid) {
      setError("Please complete all steps correctly");
      return;
    }

    setLoading(true);
    try {
      const result = await completeProfileData({
        email: form.email.trim(),
        // NOTE: backend currently expects `department` — map or rename, see below
        classGrade: form.classGrade,
        stream: form.stream,
        studentID: form.studendID.trim(),
      });

      if (!result?.ok) {
        const message = result?.error || "Could not complete profile";
        showToast(message, "error");
        setError(message);
        return;
      }

      showToast("Student profile completed. Redirecting to login page...");
      setTimeout(() => {
        logout();
        navigate("/login", {
          replace: true,
          state: { signupEmail: form.email.trim(), signupPassword: form.password },
        });
      }, 1000);
    } catch (err) {
      console.error("Profile completion error:", err);
      setError("Unexpected connection error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Small helper so every field renders its error identically
  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <span id={`${name}-error`} className="mt-1 block text-sm text-red-600">
        {fieldErrors[name]}
      </span>
    ) : null;

  const inputProps = (name) => ({
    name,
    value: form[name],
    onChange: handleChange,
    onBlur: handleBlur,
    "aria-invalid": Boolean(fieldErrors[name]),
    "aria-describedby": fieldErrors[name] ? `${name}-error` : undefined,
  });

  return (
    <div className={s.pageContainer}>
      {toast && (
        <div className={`${s.toastBase} ${toast.tone === "error" ? s.toastError : s.toastSuccess}`}>
          <div className={`${s.toastContent} flex items-center gap-2`}>
            {toast.tone === "error" ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            {toast.message}
          </div>
        </div>
      )}

      <div className={`${s.mainCard} items-stretch`}>
        <section className={`${s.infoPanel} flex flex-col gap-4`}>
          <span className={`${s.infoBadge} inline-flex items-center gap-2 self-start`}>
            <Sparkles size={14} className="shrink-0" />
            Step Wise Signup
          </span>
          <h2 className={s.infoTitle}>
            Create Student Account, Verify OTP, Complete Profile Details
          </h2>
          <div className={`${s.infoList} flex flex-col gap-3`}>
            {signupHighlights.map((item) => (
              <div key={item} className={`${s.infoListItem} flex items-start gap-2`}>
                <BadgeCheck size={18} className={`${s.infoIcon} shrink-0 mt-0.5`} />
                <span className="min-w-0">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={s.formPanel}>
          <div className={`${s.formInner} flex flex-col gap-4`}>
            <Link to="/" className={`${s.backLink} self-start`}>Back Home</Link>
            <h1 className={s.panelTitle}>Create Student Account</h1>

            <div className={`${s.stepGrid} grid grid-cols-3 gap-3`}>
              {stepList.map((item) => (
                <div
                  key={item.id}
                  className={`${s.stepCard} flex flex-col items-center text-center gap-1 ${
                    step >= item.id ? s.stepCardCompleted : s.stepCardPending
                  }`}
                >
                  <p className={s.stepLabel}>Step {item.id}</p>
                  <p className={s.stepTitle}>{item.title}</p>
                </div>
              ))}
            </div>

            <form className={`${s.form} flex flex-col gap-4`} onSubmit={handleSubmit} noValidate>
              {step === 1 && (
                <>
                  <label className="block">
                    <span className={`${s.fieldLabel} flex items-center gap-2`}>
                      <UserRound size={15} className="shrink-0" />
                      Full Name
                    </span>
                    <input type="text" {...inputProps("name")} autoComplete="name"
                      placeholder="Enter Your Full Name" className={`${s.input} w-full`} />
                    <FieldError name="name" />
                  </label>

                  <label className="block">
                    <span className={`${s.fieldLabel} flex items-center gap-2`}>
                      <Mail size={15} className="shrink-0" />
                      Email Address
                    </span>
                    <input type="email" {...inputProps("email")} autoComplete="email"
                      placeholder="student@school.ac.ke" className={`${s.input} w-full`} />
                    <FieldError name="email" />
                  </label>

                  <label className="block">
                    <span className={`${s.fieldLabel} flex items-center gap-2`}>
                      <Phone size={15} className="shrink-0" />
                      Phone Number
                    </span>
                    <input type="tel" inputMode="numeric" {...inputProps("phone")} autoComplete="tel"
                      placeholder="0722000000" className={`${s.input} w-full`} />
                    <FieldError name="phone" />
                  </label>

                  <label className="block">
                    <span className={`${s.fieldLabel} flex items-center gap-2`}>
                      <LockKeyhole size={15} className="shrink-0" />
                      Password
                    </span>
                    <div className={`${s.passwordWrapper} flex items-center`}>
                      <input type={showPassword ? "text" : "password"} {...inputProps("password")}
                        autoComplete="new-password" placeholder="Enter Your Preferred Password"
                        className={`${s.passwordInput} w-full`} />
                      <button type="button" onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className={`${s.toggleButton} shrink-0`}>
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    <FieldError name="password" />
                    <span className="mt-1 block text-xs text-gray-500">
                      At least 6 characters, with one uppercase letter, one digit, and one special character.
                    </span>
                  </label>
                </>
              )}

              {step === 2 && (
                <>
                  <div className={s.otpInfoBox}>
                    <p className={s.otpInfoLabel}>Verification Sent</p>
                    <p className={s.otpInfoText}>
                      We have sent a 6-digit OTP verification code to{" "}
                      <span className={s.emailHighlight}>{form.email}</span>. Please check your
                      inbox and enter the code below to verify your account.
                    </p>
                  </div>

                  <label className="block">
                    <span className={`${s.fieldLabel} flex items-center gap-2`}>
                      <KeyRound size={15} className="shrink-0" />
                      OTP Verification
                    </span>
                    <input type="text" inputMode="numeric" maxLength={6} {...inputProps("otp")}
                      autoComplete="one-time-code" placeholder="Enter 6-digit OTP"
                      className={`${s.input} w-full`} />
                    <FieldError name="otp" />
                  </label>
                </>
              )}

              {step === 3 && (
                <>
                  <div className={`${s.twoColumnGrid} grid grid-cols-1 sm:grid-cols-2 gap-4`}>
                    <label className="block">
                      <span className={s.fieldLabelBlock}>Grade</span>
                      <select {...inputProps("classGrade")} className={`${s.select} w-full`}>
                        <option value="">Select grade</option>
                        {classGrades.map((grade) => (
                          <option key={grade} value={grade}>{grade}</option>
                        ))}
                      </select>
                      <FieldError name="classGrade" />
                    </label>

                    <label className="block">
                      <span className={s.fieldLabelBlock}>Stream</span>
                      <select {...inputProps("stream")} className={`${s.select} w-full`}>
                        <option value="">Select stream</option>
                        {classStreams.map((stream) => (
                          <option key={stream} value={stream}>{stream}</option>
                        ))}
                      </select>
                      <FieldError name="stream" />
                    </label>

                    
                  </div>

                  <label className="block">
                    <span className={s.fieldLabelBlock}>Registration Number</span>
                    <input type="text" {...inputProps("studentID")}
                      placeholder="Write your roll number" className={`${s.input} w-full`} />
                    <FieldError name="studentId" />
                  </label>
                </>
              )}

              {error && <div className={s.errorMessage} role="alert">{error}</div>}

              <div className={`${s.buttonGroup} flex flex-wrap items-center gap-3`}>
                {step > 1 && (
                  <button type="button" onClick={goBack} disabled={loading}
                    className={`${s.backButton} inline-flex items-center justify-center gap-2`}>
                    Back
                  </button>
                )}

                {step < 3 ? (
                  <button type="button" onClick={goNext} disabled={loading}
                    className={`${s.nextButton} inline-flex items-center justify-center gap-2 ml-auto`}>
                    {loading ? "Please Wait..." : "Continue"}
                    {!loading && <ArrowRight size={15} />}
                  </button>
                ) : (
                  <button type="submit" disabled={loading}
                    className={`${s.submitButton} inline-flex items-center justify-center gap-2 ml-auto`}>
                    {loading ? "Completing Profile..." : "Complete Profile"}
                    {!loading && <ArrowRight size={15} />}
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SignUp;