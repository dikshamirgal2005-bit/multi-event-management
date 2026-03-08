import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, School, BookOpen, Calendar, Users, Hash, ArrowRight } from 'lucide-react';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '', contact: '', email: '', password: '', confirmPassword: '',
        collegeName: '', role: 'Student',
        dept: '', year: '', div: '', rollno: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Save additional user details in Firestore
            const userData = {
                uid: user.uid,
                name: formData.name,
                contact: formData.contact,
                email: formData.email,
                collegeName: formData.collegeName,
                role: formData.role,
                createdAt: new Date().toISOString()
            };

            // Add student specific fields if applicable
            if (formData.role === 'Student') {
                userData.dept = formData.dept;
                userData.year = formData.year;
                userData.div = formData.div;
                userData.rollno = formData.rollno;
            }

            await setDoc(doc(db, "users", user.uid), userData);

            // 3. Navigate to login after successful registration
            navigate('/login');
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.message || "Failed to register user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <div className="auth-card glassmorphism register-card">
                <div className="animated-title-wrapper" style={{ marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
                    <h1 className="animated-text">Multi Event Management Platform</h1>
                    <p className="animated-subtitle">Join us to discover, manage, and participate in amazing academic activities.</p>
                </div>
                <div className="auth-header">
                    <h2>Create Account</h2>
                    <p>Join the Event Platform</p>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-grid">
                        <div className="input-group">
                            <label>Full Name</label>
                            <div className="input-with-icon">
                                <User className="input-icon" size={18} />
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Contact Number</label>
                            <div className="input-with-icon">
                                <Phone className="input-icon" size={18} />
                                <input type="tel" name="contact" value={formData.contact} onChange={handleChange} required placeholder="+1 (555) 000-0000" />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Email Address</label>
                            <div className="input-with-icon">
                                <Mail className="input-icon" size={18} />
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>College Name</label>
                            <div className="input-with-icon">
                                <School className="input-icon" size={18} />
                                <input type="text" name="collegeName" value={formData.collegeName} onChange={handleChange} required placeholder="University Name" />
                            </div>
                        </div>
                        <div className="input-group full-width">
                            <label>Role</label>
                            <div className="role-selector">
                                <label className={`role-option ${formData.role === 'Student' ? 'active' : ''}`}>
                                    <input type="radio" name="role" value="Student" checked={formData.role === 'Student'} onChange={handleChange} />
                                    Student
                                </label>
                                <label className={`role-option ${formData.role === 'Admin' ? 'active' : ''}`}>
                                    <input type="radio" name="role" value="Admin" checked={formData.role === 'Admin'} onChange={handleChange} />
                                    Admin
                                </label>
                            </div>
                        </div>

                        {formData.role === 'Student' && (
                            <>
                                <div className="input-group sub-animated fade-in">
                                    <label>Department</label>
                                    <div className="input-with-icon">
                                        <BookOpen className="input-icon" size={18} />
                                        <input type="text" name="dept" value={formData.dept} onChange={handleChange} required placeholder="Computer Science" />
                                    </div>
                                </div>
                                <div className="input-group sub-animated fade-in">
                                    <label>Year</label>
                                    <div className="input-with-icon">
                                        <Calendar className="input-icon" size={18} />
                                        <input type="text" name="year" value={formData.year} onChange={handleChange} required placeholder="3rd Year" />
                                    </div>
                                </div>
                                <div className="input-group sub-animated fade-in">
                                    <label>Division</label>
                                    <div className="input-with-icon">
                                        <Users className="input-icon" size={18} />
                                        <input type="text" name="div" value={formData.div} onChange={handleChange} required placeholder="A" />
                                    </div>
                                </div>
                                <div className="input-group sub-animated fade-in">
                                    <label>Roll No</label>
                                    <div className="input-with-icon">
                                        <Hash className="input-icon" size={18} />
                                        <input type="text" name="rollno" value={formData.rollno} onChange={handleChange} required placeholder="42" />
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="input-group">
                            <label>Password</label>
                            <div className="input-with-icon">
                                <Lock className="input-icon" size={18} />
                                <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Confirm Password</label>
                            <div className="input-with-icon">
                                <Lock className="input-icon" size={18} />
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" />
                            </div>
                        </div>
                    </div>

                    {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                    <button type="submit" className="btn-primary full-width-btn" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Register Account'} <ArrowRight size={20} />
                    </button>

                    <p className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Register;
