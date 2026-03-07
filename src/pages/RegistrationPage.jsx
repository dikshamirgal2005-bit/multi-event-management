import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { Calendar, MapPin, Clock, CheckCircle, Plus, X } from 'lucide-react';

const RegistrationPage = () => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({});
    const [teamMembers, setTeamMembers] = useState([{ name: '', email: '', contact: '', dept: '', rollno: '', div: '', year: '' }]);
    const [teamName, setTeamName] = useState('');
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const docRef = doc(db, 'events', eventId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setEvent({ id: docSnap.id, ...docSnap.data() });
                    // Initialize form data with empty strings for required fields
                    const initialData = {};
                    if (docSnap.data().registrationFields) {
                        Object.keys(docSnap.data().registrationFields).forEach(field => {
                            if (docSnap.data().registrationFields[field]) {
                                initialData[field] = '';
                            }
                        });
                    }
                    setFormData(initialData);
                } else {
                    setError('Event not found.');
                }
            } catch (err) {
                console.error("Error fetching event:", err);
                setError('Failed to load event details.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();

        const unsubscribe = auth.onAuthStateChanged((u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, [eventId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMemberChange = (index, e) => {
        const newMembers = [...teamMembers];
        newMembers[index][e.target.name] = e.target.value;
        setTeamMembers(newMembers);
    };

    const getMaxMembers = () => {
        if (!event || !event.teamMembers) return 5;
        const parts = event.teamMembers.toString().split('-');
        return parseInt(parts[parts.length - 1]) || 5;
    };

    const addMember = () => {
        const maxMembers = getMaxMembers();
        if (teamMembers.length < maxMembers) {
            setTeamMembers([...teamMembers, { name: '', email: '', contact: '', dept: '', rollno: '', div: '', year: '' }]);
        } else {
            alert(`Maximum ${maxMembers} members allowed for this event.`);
        }
    };

    const removeMember = (index) => {
        if (index === 0) return;
        const newMembers = teamMembers.filter((_, i) => i !== index);
        setTeamMembers(newMembers);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setError('You must be logged in to register for an event.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await addDoc(collection(db, 'registrations'), {
                eventId,
                eventName: event.eventName,
                userId: user.uid,
                checkedIn: false,
                category: event.category,
                venue: event.venue || '',
                date: event.date || '',
                time: event.time || '',
                ...(event.category === 'Hackathon' ? { teamName, members: teamMembers } : formData),
                registeredAt: new Date()
            });
            alert(`Successfully registered for ${event.eventName}! 🎉`);
            setSubmitted(true);
        } catch (err) {
            console.error("Error submitting registration:", err);
            setError(`Submission failed: ${err.message || 'Unknown error'}. Please check if you are logged in or if the database is accessible.`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0f172a', color: 'white' }}>
                <div className="fade-in">Loading registration form...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0f172a', color: 'white' }}>
                <div className="glassmorphism" style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0f172a', color: 'white' }}>
                <div className="glassmorphism fade-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
                    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                        <CheckCircle size={64} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Success!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        You have successfully registered for <strong>{event.eventName}</strong>. We'll send further details to your email.
                    </p>
                    <button
                        onClick={() => navigate('/student-dashboard')}
                        className="btn-primary"
                        style={{ width: '100%' }}
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const fields = event.registrationFields || {};

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', padding: '2rem 1rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Event Summary Card */}
                <div className="glassmorphism fade-in" style={{ padding: '2rem', marginBottom: '2.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        {event.posterUrl && (
                            <div style={{ width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                                <img src={event.posterUrl} alt={event.eventName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', backgroundColor: 'rgba(79, 70, 229, 0.2)', borderRadius: '6px', color: '#a5b4fc', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {event.category}
                            </span>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.75rem 0', background: 'linear-gradient(135deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {event.eventName}
                            </h1>
                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> {event.date}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> {event.time}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={16} /> {event.venue}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registration Form */}
                <div className="auth-card glassmorphism fade-in" style={{ maxWidth: '100%', margin: '0' }}>
                    {!user ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Login Required</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You must be logged in as a student to register for this event.</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary"
                                style={{ width: '100%' }}
                            >
                                Login Now
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="auth-header" style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem' }}>Registration Form</h2>
                                <p>Fill in the required details to participate in this event.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="auth-form">
                                {event.category === 'Hackathon' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                        <div className="input-group full-width">
                                            <label>Team Name</label>
                                            <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Enter team name" required style={{ width: '100%', padding: '0.875rem 1rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <h3 style={{ fontSize: '1.1rem', color: '#c4b5fd' }}>Team Members ({teamMembers.length})</h3>
                                                <button type="button" onClick={addMember} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Plus size={16} /> Add Member
                                                </button>
                                            </div>

                                            {teamMembers.map((member, index) => (
                                                <div key={index} className="glassmorphism" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', position: 'relative' }}>
                                                    {index > 0 && (
                                                        <button type="button" onClick={() => removeMember(index)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                            <X size={18} />
                                                        </button>
                                                    )}
                                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.7 }}>Member {index + 1} {index === 0 && '(Leader)'}</h4>
                                                    <div className="form-grid">
                                                        {fields.name && (
                                                            <div className="input-group">
                                                                <label>Full Name</label>
                                                                <input type="text" name="name" value={member.name} onChange={(e) => handleMemberChange(index, e)} placeholder="Name" required />
                                                            </div>
                                                        )}
                                                        {fields.email && (
                                                            <div className="input-group">
                                                                <label>Email</label>
                                                                <input type="email" name="email" value={member.email} onChange={(e) => handleMemberChange(index, e)} placeholder="Email" required />
                                                            </div>
                                                        )}
                                                        {fields.contact && (
                                                            <div className="input-group">
                                                                <label>Contact</label>
                                                                <input type="tel" name="contact" value={member.contact} onChange={(e) => handleMemberChange(index, e)} placeholder="Contact" required />
                                                            </div>
                                                        )}
                                                        {fields.dept && (
                                                            <div className="input-group">
                                                                <label>Department</label>
                                                                <input type="text" name="dept" value={member.dept} onChange={(e) => handleMemberChange(index, e)} placeholder="Dept" required />
                                                            </div>
                                                        )}
                                                        {fields.year && (
                                                            <div className="input-group">
                                                                <label>Year</label>
                                                                <input type="text" name="year" value={member.year} onChange={(e) => handleMemberChange(index, e)} placeholder="Year" required />
                                                            </div>
                                                        )}
                                                        {fields.rollno && (
                                                            <div className="input-group">
                                                                <label>Roll No</label>
                                                                <input type="text" name="rollno" value={member.rollno} onChange={(e) => handleMemberChange(index, e)} placeholder="Roll No" required />
                                                            </div>
                                                        )}
                                                        {fields.div && (
                                                            <div className="input-group">
                                                                <label>Division</label>
                                                                <input type="text" name="div" value={member.div} onChange={(e) => handleMemberChange(index, e)} placeholder="Div" required />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="form-grid">
                                        {fields.name && (
                                            <div className="input-group">
                                                <label>Full Name</label>
                                                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="John Doe" required />
                                            </div>
                                        )}
                                        {fields.email && (
                                            <div className="input-group">
                                                <label>Email Address</label>
                                                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} placeholder="john@example.com" required />
                                            </div>
                                        )}
                                        {fields.contact && (
                                            <div className="input-group">
                                                <label>Contact Number</label>
                                                <input type="tel" name="contact" value={formData.contact || ''} onChange={handleChange} placeholder="+91 98765 43210" required />
                                            </div>
                                        )}
                                        {fields.dept && (
                                            <div className="input-group">
                                                <label>Department</label>
                                                <input type="text" name="dept" value={formData.dept || ''} onChange={handleChange} placeholder="Computer Science" required />
                                            </div>
                                        )}
                                        {fields.year && (
                                            <div className="input-group">
                                                <label>Year</label>
                                                <input type="text" name="year" value={formData.year || ''} onChange={handleChange} placeholder="3rd Year" required />
                                            </div>
                                        )}
                                        {fields.rollno && (
                                            <div className="input-group">
                                                <label>Roll Number</label>
                                                <input type="text" name="rollno" value={formData.rollno || ''} onChange={handleChange} placeholder="20BCS123" required />
                                            </div>
                                        )}
                                        {fields.div && (
                                            <div className="input-group">
                                                <label>Division</label>
                                                <input type="text" name="div" value={formData.div || ''} onChange={handleChange} placeholder="Div A" required />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="full-width" style={{ marginTop: '2rem' }}>
                                    <button type="submit" className="btn-primary full-width-btn" disabled={submitting}>
                                        {submitting ? 'Registering...' : 'Complete Registration'}
                                    </button>
                                </div>
                                {error && <p style={{ color: '#ef4444', marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</p>}
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegistrationPage;
