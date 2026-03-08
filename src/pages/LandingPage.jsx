import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Zap, Shield, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container bg-slate-900 text-white min-h-screen relative overflow-hidden">
            {/* Background elements */}
            <div className="landing-bg-element landing-bg-top-left"></div>
            <div className="landing-bg-element landing-bg-bottom-right"></div>

            {/* Navbar */}
            <nav className="landing-navbar glassmorphism">
                <div className="landing-logo-container">
                    <div className="landing-logo-icon">
                        <Calendar size={24} color="white" />
                    </div>
                    <span className="landing-logo-text">
                        EventHub
                    </span>
                </div>
                <div className="landing-nav-buttons">
                    <button
                        onClick={() => navigate('/login')}
                        className="landing-btn-ghost"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => navigate('/register')}
                        className="landing-btn-primary"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="landing-main">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="landing-hero-content"
                >
                    <span className="landing-badge">
                        ✨ The ultimate platform for campuses
                    </span>
                    <h1 className="landing-title">
                        Manage Events. <br />
                        <span className="landing-title-highlight">
                            Zero Friction.
                        </span>
                    </h1>
                    <p className="landing-subtitle">
                        The all-in-one OS for student clubs, hackathons, and university events. Handle ticketing, networking, and resources in one beautiful place.
                    </p>
                    <div className="landing-cta-group">
                        <button
                            onClick={() => navigate('/register')}
                            className="landing-btn-hero-primary"
                        >
                            Start for Free <ChevronRight size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="landing-btn-hero-secondary glassmorphism"
                        >
                            Sign In to Dashboard
                        </button>
                    </div>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="landing-features-grid"
                >
                    <div className="landing-feature-card glassmorphism">
                        <div className="landing-feature-icon icon-zap">
                            <Zap size={24} />
                        </div>
                        <h3>Lightning Fast</h3>
                        <p>Create events in seconds. Instant QR code ticketing and real-time dashboard updates.</p>
                    </div>
                    <div className="landing-feature-card glassmorphism">
                        <div className="landing-feature-icon icon-users">
                            <Users size={24} />
                        </div>
                        <h3>Smart Matchmaking</h3>
                        <p>Our recommendation engine connects the right students to the right technical workshops and hackathons.</p>
                    </div>
                    <div className="landing-feature-card glassmorphism">
                        <div className="landing-feature-icon icon-shield">
                            <Shield size={24} />
                        </div>
                        <h3>Enterprise Security</h3>
                        <p>Secure Firebase authentication, role-based access control, and robust privacy out of the box.</p>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default LandingPage;
