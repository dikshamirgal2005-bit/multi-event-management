import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, School, BookOpen, Calendar, Users, Hash, ArrowRight } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(location.pathname === '/register');

    // Login State
    const [loginCreds, setLoginCreds] = useState({ email: '', password: '' });
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState(null);

    // Register State
    const [regData, setRegData] = useState({
        name: '', contact: '', email: '', password: '', confirmPassword: '',
        collegeName: '', role: 'Student',
        dept: '', year: '', div: '', rollno: ''
    });
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState(null);

    useEffect(() => {
        setIsSignUp(location.pathname === '/register');
    }, [location.pathname]);

    const togglePanel = () => {
        if (isSignUp) {
            navigate('/login');
        } else {
            navigate('/register');
        }
    };

    const handleLoginChange = (e) => setLoginCreds({ ...loginCreds, [e.target.name]: e.target.value });
    const handleRegChange = (e) => setRegData({ ...regData, [e.target.name]: e.target.value });

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError(null);
        setLoginLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, loginCreds.email, loginCreds.password);
            const user = userCredential.user;
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && (docSnap.data().role === 'Admin' || docSnap.data().role === 'admin')) {
                navigate('/admin-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        } catch (err) {
            setLoginError("Invalid email or password");
        } finally {
            setLoginLoading(false);
        }
    };

    const handleRegSubmit = async (e) => {
        e.preventDefault();
        setRegError(null);
        if (regData.password !== regData.confirmPassword) {
            setRegError("Passwords do not match"); return;
        }
        setRegLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, regData.email, regData.password);
            const user = userCredential.user;
            const userData = {
                uid: user.uid, name: regData.name, contact: regData.contact, email: regData.email,
                collegeName: regData.collegeName, role: regData.role, createdAt: new Date().toISOString()
            };
            if (regData.role === 'Student') {
                userData.dept = regData.dept; userData.year = regData.year;
                userData.div = regData.div; userData.rollno = regData.rollno;
            }
            await setDoc(doc(db, "users", user.uid), userData);
            togglePanel(); // Toggle to login on success
            setLoginError("Account created! Please sign in.");
        } catch (err) {
            setRegError(err.message || "Failed to register user");
        } finally {
            setRegLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className={`sliding-auth-container ${isSignUp ? 'right-panel-active' : ''}`}>
                {/* Sign Up Form */}
                <div className="form-container sign-up-container custom-scrollbar">
                    <form onSubmit={handleRegSubmit} className="sliding-form">
                        <div className="auth-header">
                            <h2>Create Account</h2>
                        </div>
                        <div className="form-grid">
                            <div className="input-group">
                                <div className="input-with-icon">
                                    <User className="input-icon" size={18} />
                                    <input type="text" name="name" value={regData.name} onChange={handleRegChange} required placeholder="Full Name" />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="input-with-icon">
                                    <Phone className="input-icon" size={18} />
                                    <input type="tel" name="contact" value={regData.contact} onChange={handleRegChange} required placeholder="Contact Number" />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="input-with-icon">
                                    <Mail className="input-icon" size={18} />
                                    <input type="email" name="email" value={regData.email} onChange={handleRegChange} required placeholder="Email Address" />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="input-with-icon">
                                    <School className="input-icon" size={18} />
                                    <input type="text" name="collegeName" value={regData.collegeName} onChange={handleRegChange} required placeholder="College Name" />
                                </div>
                            </div>

                            <div className="input-group full-width">
                                <div className="role-selector">
                                    <label className={`role-option ${regData.role === 'Student' ? 'active' : ''}`}>
                                        <input type="radio" name="role" value="Student" checked={regData.role === 'Student'} onChange={handleRegChange} />
                                        Student
                                    </label>
                                    <label className={`role-option ${regData.role === 'Admin' ? 'active' : ''}`}>
                                        <input type="radio" name="role" value="Admin" checked={regData.role === 'Admin'} onChange={handleRegChange} />
                                        Admin
                                    </label>
                                </div>
                            </div>

                            {regData.role === 'Student' && (
                                <>
                                    <div className="input-group">
                                        <div className="input-with-icon">
                                            <BookOpen className="input-icon" size={18} />
                                            <input type="text" name="dept" value={regData.dept} onChange={handleRegChange} required placeholder="Department" />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <div className="input-with-icon">
                                            <Calendar className="input-icon" size={18} />
                                            <input type="text" name="year" value={regData.year} onChange={handleRegChange} required placeholder="Year" />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <div className="input-with-icon">
                                            <Users className="input-icon" size={18} />
                                            <input type="text" name="div" value={regData.div} onChange={handleRegChange} required placeholder="Division" />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <div className="input-with-icon">
                                            <Hash className="input-icon" size={18} />
                                            <input type="text" name="rollno" value={regData.rollno} onChange={handleRegChange} required placeholder="Roll No" />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="input-group">
                                <div className="input-with-icon">
                                    <Lock className="input-icon" size={18} />
                                    <input type="password" name="password" value={regData.password} onChange={handleRegChange} required placeholder="Password" />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="input-with-icon">
                                    <Lock className="input-icon" size={18} />
                                    <input type="password" name="confirmPassword" value={regData.confirmPassword} onChange={handleRegChange} required placeholder="Confirm Password" />
                                </div>
                            </div>
                        </div>

                        {regError && <div className="error-message" style={{ color: '#ef4444', marginTop: '1rem', textAlign: 'center' }}>{regError}</div>}
                        <button type="submit" className="btn-primary full-width" style={{ marginTop: '1.5rem' }} disabled={regLoading}>
                            {regLoading ? 'Creating...' : 'Sign Up'} <ArrowRight size={20} />
                        </button>

                        {/* Mobile Toggle Button */}
                        <div className="mobile-toggle-btn">
                            Already have an account? <span onClick={togglePanel}>Sign In</span>
                        </div>
                    </form>
                </div>

                {/* Sign In Form */}
                <div className="form-container sign-in-container custom-scrollbar">
                    <form onSubmit={handleLoginSubmit} className="sliding-form">
                        <div className="auth-header">
                            <h2>Welcome Back</h2>
                        </div>
                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <div className="input-with-icon">
                                <Mail className="input-icon" size={20} />
                                <input type="email" name="email" value={loginCreds.email} onChange={handleLoginChange} required placeholder="Email Address" />
                            </div>
                        </div>
                        <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                            <div className="input-with-icon">
                                <Lock className="input-icon" size={20} />
                                <input type="password" name="password" value={loginCreds.password} onChange={handleLoginChange} required placeholder="Password" />
                            </div>
                        </div>

                        {loginError && <div className="error-message" style={{ color: loginError.includes('created') ? '#10b981' : '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{loginError}</div>}

                        <button type="submit" className="btn-primary" disabled={loginLoading}>
                            {loginLoading ? 'Signing In...' : 'Sign In'} <ArrowRight size={20} />
                        </button>

                        {/* Mobile Toggle Button */}
                        <div className="mobile-toggle-btn">
                            Don't have an account? <span onClick={togglePanel}>Sign Up</span>
                        </div>
                    </form>
                </div>

                {/* Overlay Area connecting them (Visible only on Desktop) */}
                <div className="overlay-container">
                    <div className="overlay">
                        {/* Left Overlay - Active when Sign Up shown */}
                        <div className="overlay-panel overlay-left">
                            <div className="premium-badge">
                                <span>✨ Welcome Back</span>
                            </div>
                            <h1 className="animated-text" style={{ fontSize: '2.5rem' }}>One of Us?</h1>
                            <p className="intro-subtext" style={{ marginBottom: '2rem' }}>
                                If you already have an account, just sign in. We've missed you!
                            </p>
                            <button className="btn-outline" onClick={togglePanel}>Sign In</button>
                        </div>

                        {/* Right Overlay - Active when Sign In shown */}
                        <div className="overlay-panel overlay-right">
                            <div className="premium-badge">
                                <span>✨ Next-Gen Platform</span>
                            </div>
                            <h1 className="animated-text" style={{ fontSize: '2.5rem' }}>New Here?</h1>
                            <p className="intro-subtext" style={{ marginBottom: '2rem' }}>
                                Sign up and discover a great amount of new opportunities!
                            </p>
                            <button className="btn-outline" onClick={togglePanel}>Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
