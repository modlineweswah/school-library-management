import React, { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginStyles as s } from "../assets/dummyStyles";
import { useAuth } from "../shared/AuthContext";

// Module scope: no need to rebuild this on every render
const roleChoice = [
  { value: "student", label: "Student", icon: UserRound },
  { value: "admin", label: "Admin", icon: ShieldCheck },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const validateEmail = (value) => {
  const email = value.trim();
  if (!email) return "Email address is required";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address";
  return "";
};

const validatePassword = (value) => {
  if (!value) return "Password is required";
  //if (value.length < 6) return "Password must be at least 6 characters";
  //if (!/[A-Z]/.test(value)) return "Password must include at least one uppercase letter";
  //if (!/\d/.test(value)) return "Password must include at least one digit";
  //if (!/[^A-Za-z0-9]/.test(value)) return "Password must include at least one special character";
  return "";
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "", role: "student" });
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.signupEmail || location.state?.signupPassword) {
      setForm((current) => ({
        ...current,
        email: location.state?.signupEmail ?? "",
        password: location.state?.signupPassword ?? "",
      }));
    }
  }, [location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError("");
    // Clear this field's error as soon as the user starts correcting it
    if (name === "email" || name === "password") {
      setFieldErrors((current) => ({ ...current, [name]: "" }));
    }
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    if (name === "email") {
      setFieldErrors((current) => ({ ...current, email: validateEmail(value) }));
    }
    if (name === "password") {
      setFieldErrors((current) => ({ ...current, password: validatePassword(value) }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();        // <-- was missing its call parentheses
    setError("");

    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);
    setFieldErrors({ email: emailError, password: passwordError });
    if (emailError || passwordError) return;

    setLoading(true);
    try {
      const result = await login({ ...form, email: form.email.trim() });

      if (!result?.ok) {
        setError(result?.error || "Login failed");
        return;
      }

      const fallbackPath =
        form.role === "admin" ? "/admin/dashboard" : "/student/dashboard";
      let target = location.state?.from || fallbackPath;

      // Stop a student landing on an admin route (and vice versa)
      if (typeof target === "string") {
        if (form.role === "student" && target.startsWith("/admin")) target = fallbackPath;
        if (form.role === "admin" && target.startsWith("/student")) target = fallbackPath;
      }

      navigate(target, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError("Unexpected connection error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.pageContainer}>
      <div className={`${s.mainCard} items-stretch`}>
        <section className={`${s.infoPanel} flex flex-col gap-4`}>
          <span className={`${s.roleBadge} self-start`}>School Role Login</span>
          <h1 className={s.infoTitle}>
            Choose Student or Admin to open the correct library panel
          </h1>
          <p className={s.infoDescription}>
            Select a role, then log in with the matching account
          </p>

          {/* One container, two boxes — spacing now applies between them */}
          <div className={`${s.infoBoxesContainer} flex flex-col gap-3`}>
            <div className={s.infoBox}>
              <p className={`${s.infoBoxTitle} flex items-center gap-2`}>
                <UserRound size={16} className="shrink-0" />
                Student Sign In
              </p>
              <p className={s.infoBoxText}>
                Register a new student using "Create Account"
              </p>
            </div>
            <div className={s.infoBox}>
              <p className={`${s.infoBoxTitle} flex items-center gap-2`}>
                <ShieldCheck size={16} className="shrink-0" />
                Admin Access
              </p>
              <p className={s.infoBoxText}>Log in using admin credentials</p>
            </div>
          </div>
        </section>

        <section className={s.formPanel}>
          <div className={`${s.formInner} flex flex-col gap-4`}>
            <Link to="/" className={`${s.backLink} self-start`}>Back Home</Link>
            <h2 className={s.formTitle}>Login Account</h2>
            <p className={s.formSubtitle}>Select your role, provide login credentials</p>

            <form className={`${s.form} flex flex-col gap-4`} onSubmit={handleSubmit} noValidate>
              <div className={`${s.roleContainer} flex flex-col gap-2`}>
                <p className={s.roleLabel}>Choose Login Role</p>
                <div className={`${s.roleGrid} grid grid-cols-2 gap-3`}>
                  {roleChoice.map((choice) => {
                    const Icon = choice.icon;
                    const selected = form.role === choice.value;
                    return (
                      <label
                        key={choice.value}
                        className={`${s.roleOption} flex items-center justify-center gap-2 ${
                          selected ? s.roleOptionSelected : s.roleOptionUnselected
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={choice.value}
                          checked={selected}
                          onChange={handleChange}
                          className={s.roleRadio}
                        />
                        <span className={`${s.roleIconLabel} flex items-center gap-2`}>
                          <Icon size={16} className="shrink-0" />
                          {choice.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className={`${s.fieldLabel} flex items-center gap-2`}>
                  <Mail size={16} className="shrink-0" />
                  Email Address
                </span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  placeholder="student@school.ac.ke"
                  className={`${s.input} w-full`}
                />
                {fieldErrors.email && (
                  <span id="email-error" className="mt-1 block text-sm text-red-600">
                    {fieldErrors.email}
                  </span>
                )}
              </label>

              <label className="block">
                <span className={`${s.fieldLabel} flex items-center gap-2`}>
                  <LockKeyhole size={16} className="shrink-0" />
                  Password
                </span>
                <div className={`${s.passwordWrapper} flex items-center`}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="current-password"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                    placeholder="Enter Your Password"
                    className={`${s.passwordInput} w-full`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className={`${s.togglePasswordButton} shrink-0`}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                 {fieldErrors.password && (
                  <span id="password-error" className="mt-1 block text-sm text-red-600">
                    {fieldErrors.password}
                  </span>
                )}
              </label>

              {error && <div className={s.errorMessage} role="alert">{error}</div>}

              <div className={`${s.footerFlex} flex flex-wrap items-center justify-between gap-2`}>
                <span className={s.footerText}>
                  {form.role === "admin"
                    ? "Admin accounts use existing credentials"
                    : "Student signup is available below"}
                </span>
                {form.role === "student" && (
                  <Link to="/signup" className={s.signupLink}>Create Account</Link>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`${s.submitButton} inline-flex items-center justify-center gap-2`}
              >
                {loading ? "Loading..." : "Login Now"}
                {!loading && <ArrowRight size={15} />}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;