import React, { useEffect, useState } from 'react'
import {ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound} from "lucide-react"
import {Link, useLocation, useNavigate} from "react-router-dom"
import {loginStyles as s} from "../assets/dummyStyles";
import {useAuth} from "../shared/AuthContext"

const Login = () => {

    const roleChoice = [
        {
            value: "student",
            label: "Student",
            icon: UserRound
        },
        {
            value: "admin",
            label: "Admin",
            icon: ShieldCheck
        }
    ]

    const{login} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({
        email: "",
        password: "",
        role: "student"
    });
    
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false)

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
    const {name, value} = event.target;
    setError("");
    setForm((current) => ({
        ...current,[name] : value
    }))
  }

  const handleSubmit = async(event) => {
    event.preventDefault;
    setError("");
    setLoading(true);

    try {
        console.log("Attempted Login Failed:", {
            email: form.email,
            role: form.role,
        });

        const result = await login(form);
        console.log("Login Result:", result);

        if (!result.ok) {
            setLoading(false);
            setError(result.error || "Login Failed");
            console.error("Login Failed:", result.error)

            return;
        }

        console.log("Login successful, navigating to dashboard...");
        await new Promise((resolve) => setTimeout(resolve, 100));
        setLoading(false);

        const fallbackPath =
            form.role === "admin" ? "/admin/dashboard" : "/user/dashboard";
        let target = location.state?.from || fallbackPath;

        if (
            form.role === "student" &&
            typeof target === "string" &&
            target.startsWith("/admin")
        ) {
            console.warn(
            "Login: preventing navigation to admin route for student; using fallback",
            );
            target = fallbackPath;
        } else if (
            form.role === "admin" &&
            typeof target === "string" &&
            target.startsWith("/student")
        ) {
            console.warn(
            "Login: preventing navigation to user route for admin; using fallback",
            );
            target = fallbackPath;
        }

        console.log("Navigating to:", target);
        navigate(target, { replace: true });
        
    } 
    
    catch (err) {
        setLoading(false);
        console.error("Login Error:", err);
        setError("Unexpected connection error occured");
    }
  }

  return (
    <div className={s.pageContainer}>
        <div className={s.mainCard}>
            <section className={s.infoPanel}>
                <span className={s.roleBadge}>School Role Login</span>
                <h1 className={s.infoTitle}>
                    Choose Student or Admin to pen correct Library Panel
                </h1>
                <p className={s.infoDescription}>
                    Select Role, then login the Matching Account
                </p>
                <div className={s.infoBoxesContainer}>
                    <div className={s.infoBox}>
                        <p className={s.infoBoxTitle}>
                            <UserRound size={16}/>
                            Student Sign In
                        </p>
                        <p className={s.infoBoxText}>
                            Register New Student using "Create Account" 
                        </p>
                    </div>
                </div>
                <div className={s.infoBoxesContainer}>
                    <div className={s.infoBox}>
                        <p className={s.infoBoxTitle}>
                            <ShieldCheck size={16}/>
                            Admin Access
                        </p>
                        <p className={s.infoBoxText}>
                            Login using Admin Credentials
                        </p>
                    </div>
                </div>
            </section>
            <section className={s.formPanel}>
                <div className={s.formInner}>
                    <Link to="/" className={s.backLink}> Back Home</Link>
                    <h2 className={s.formTitle}>Login Account</h2>
                    <p className={s.formSubtitle}>Select Your Role, Provide Login Credentials</p>
                    <form action="" className={s.form} onSubmit={handleSubmit}>
                        <div className={s.roleContainer}>
                            <p className={s.roleLabel} >
                                Choose Login Role
                            </p>
                            <div className={s.roleGrid}>
                                {roleChoice.map((choice) =>{
                                    const Icon =choice.icon;
                                    return(
                                        <label key={choice.value} className={
                                            `${s.roleOption} ${form.role === choice.value ?
                                            s.roleOptionSelected : s.roleOptionUnselected}`
                                        }>
                                            <input type="radio" name="role" value={choice.value}
                                            checked={form.role===choice.value} onChange={handleChange}
                                            className={s.roleRadio} />
                                            <span className={s.roleIconLabel}>
                                                <Icon size={16}/>
                                                {choice.label}
                                            </span>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>
                        <label className="block">
                            <span className={s.fieldLabel}>
                                <Mail size={16}/>
                                Email Address
                            </span>
                            <input type="email" name="email" value={form.email}
                            onChange={handleChange} placeholder="student@school.ac.ke" className={s.input} />
                        </label>
                        <label className="block">
                            <span className={s.fieldLabel}>
                                <LockKeyhole size={16}/>
                                Password
                            </span>
                            <div className={s.passwordWrapper}>
                                <input type={showPassword ? "text" : "password"} 
                                    name="password" value={form.password}
                                    onChange={handleChange} placeholder="Enter Your Password" className={s.passwordInput} />
                                <button type='button' onClick={()=>setShowPassword((current)=>!current)}
                                    className={s.togglePasswordButton}>
                                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                </button>    
                            </div>
                        </label>

                        {error && (
                            <div className={s.errorMessage}> {error} </div>

                        )}
                        <div className={s.footerFlex}>
                           <span className={s.footerText}>
                             {form.role==="admin" ? "Admin Accounts use existing Credentials" :
                                "Student Signup is Available Below"
                            }
                           </span>
                           {form.role==="student" &&(
                            <Link to="/signup" className={s.signupLink}>
                                Create Account
                            </Link>
                           )}
                        </div>
                        <button type='submit' disabled={loading} className={s.submitButton}>
                            {loading ? "Loading..." : "Login Now"}
                            {!loading && <ArrowRight size={15}/>}
                        </button>
                    </form>
                </div>
            </section>
        </div>
    </div>
  )
}

export default Login