import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { collection, addDoc, getDocs, orderBy, query, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { CalendarPlus, History, Calendar, Clock, MapPin, LogOut, Trash2, FileUp, Loader2, X, Link, Download, Plus, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminEventDetails from './AdminEventDetails';

const AdminDashboard = () => {
    const [activeView, setActiveView] = useState('create');
    const [userData, setUserData] = useState(null);
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [localDummyEvents, setLocalDummyEvents] = useState([
        { id: 'dummy-1', eventName: 'Tech Nova Hackathon', date: '2026-04-15' },
        { id: 'dummy-2', eventName: 'AI/ML Workshop', date: '2026-04-20' },
        { id: 'dummy-3', eventName: 'Annual Cultural Fest', date: '2025-05-10' }
    ]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                    }
                } catch (error) {
                    console.error("Error fetching admin data:", error);
                }
            } else {
                navigate('/login');
            }
        };

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchUserData();
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const fetchEventsList = async () => {
        try {
            const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const eventsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(eventsList);
        } catch (error) {
            console.error("Error fetching events: ", error);
        } finally {
            setLoadingEvents(false);
        }
    };

    useEffect(() => {
        fetchEventsList();
    }, []);

    const handleDeleteEvent = async (e, eventId) => {
        e.stopPropagation();
        if (eventId.startsWith('dummy-')) {
            if (window.confirm("Delete this dummy event? (Local only)")) {
                setLocalDummyEvents(prev => prev.filter(event => event.id !== eventId));
                if (activeView === eventId) setActiveView('create');
            }
            return;
        }

        if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, 'events', eventId));
                setEvents(prev => prev.filter(event => event.id !== eventId));
                if (activeView === eventId) setActiveView('create');
                alert("Event deleted successfully!");
            } catch (error) {
                console.error("Error deleting event:", error);
                alert("Failed to delete event.");
            }
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (!userData) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading Admin Dashboard...</div>;
    }

    const displayedEvents = [...events, ...localDummyEvents];

    const isUpcoming = (eventDate) => {
        if (!eventDate) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eDate = new Date(eventDate);
        return eDate >= today;
    };

    return (
        <div className="dashboard-layout bg-slate-900 text-white">
            {/* Sidebar / Top Nav on Mobile */}
            <div className="dashboard-sidebar">
                <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin Panel</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Welcome, {userData.name}</p>
                </div>

                <div className="dashboard-nav" style={{ flex: 1 }}>
                    <button
                        onClick={() => setActiveView('create')}
                        className={`dashboard-nav-item ${activeView === 'create' ? 'active' : ''}`}
                    >
                        <CalendarPlus size={18} /> Create Event
                    </button>
                    <button
                        onClick={() => setActiveView('analytics')}
                        className={`dashboard-nav-item ${activeView === 'analytics' ? 'active' : ''}`}
                    >
                        <BarChart2 size={18} /> Analytics
                    </button>

                    <h2 className="hide-on-mobile" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', color: 'var(--text-muted)', margin: '1rem 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1rem' }}>
                        <History size={16} /> Event History
                    </h2>

                    {/* Rendering event buttons directly inside dashboard-nav so they layout horizontally on mobile and vertically on desktop */}
                    {loadingEvents ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>Loading events...</div>
                    ) : (
                        displayedEvents.map(event => (
                            <button
                                key={event.id}
                                onClick={() => setActiveView(event.id)}
                                className={`dashboard-nav-item ${activeView === event.id ? 'active' : ''}`}
                                style={{
                                    textAlign: 'left',
                                    backgroundColor: activeView === event.id ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                                    border: '1px solid',
                                    borderColor: activeView === event.id ? 'var(--primary)' : 'transparent',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    gap: '0.25rem'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeView !== event.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    if (activeView !== event.id) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <span style={{ fontWeight: activeView === event.id ? '600' : '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.95rem' }}>
                                        {event.eventName}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            padding: '0.15rem 0.4rem',
                                            borderRadius: '4px',
                                            backgroundColor: isUpcoming(event.date) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                                            color: isUpcoming(event.date) ? '#34d399' : '#9ca3af',
                                            border: `1px solid ${isUpcoming(event.date) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`
                                        }}>
                                            {isUpcoming(event.date) ? 'Upcoming' : 'Past'}
                                        </span>
                                        <div
                                            onClick={(e) => handleDeleteEvent(e, event.id)}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.3rem', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                        >
                                            <Trash2 size={14} />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="dashboard-main">
                <header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </header>
                {activeView === 'create' ? <CreateEvent creatorId={userData.uid} onEventCreated={fetchEventsList} /> :
                    activeView === 'analytics' ? <AdminAnalytics events={displayedEvents} /> :
                        <AdminEventDetails embeddedEventId={activeView} onClose={() => setActiveView('create')} />}
            </div>
        </div>
    );
};

const CreateEvent = ({ creatorId, onEventCreated }) => {
    const [formData, setFormData] = useState({
        posterUrl: '',
        eventName: '',
        category: 'Hackathon',
        teamMembers: '',
        dept: '',
        year: '',
        prizePool: '',
        description: '',
        venue: '',
        time: '',
        date: '',
        mode: 'Offline',
        registrationFields: {
            name: true,
            email: true,
            contact: true,
            dept: false,
            rollno: false,
            div: false,
            year: false
        },
        resources: []
    });
    const [uploadingResource, setUploadingResource] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');

    const handleReset = () => {
        if (window.confirm("Are you sure you want to discard this event?")) {
            setFormData({
                posterUrl: '', eventName: '', category: 'Hackathon', teamMembers: '',
                dept: '', year: '', prizePool: '', description: '',
                venue: '', time: '', date: '', mode: 'Offline',
                registrationFields: { name: true, email: true, contact: true, dept: false, rollno: false, div: false, year: false },
                resources: []
            });
            setMessage('');
            setGeneratedLink('');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                registrationFields: {
                    ...prev.registrationFields,
                    [name]: checked
                }
            }));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({ ...prev, posterUrl: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const [newResourceName, setNewResourceName] = useState('');
    const [newResourceUrl, setNewResourceUrl] = useState('');

    const handleAddLinkResource = (e) => {
        e.preventDefault();
        if (!newResourceName.trim() || !newResourceUrl.trim()) {
            alert("Please enter both a name and a link URL.");
            return;
        }

        const newResource = {
            name: newResourceName,
            url: newResourceUrl,
            type: 'link', // Identifying as a direct link
            publicId: `link_${Date.now()}`
        };

        setFormData(prev => ({
            ...prev,
            resources: [...prev.resources, newResource]
        }));

        setNewResourceName('');
        setNewResourceUrl('');
    };

    const removeResource = (index) => {
        setFormData(prev => ({
            ...prev,
            resources: prev.resources.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setGeneratedLink('');
        try {
            const docRef = await addDoc(collection(db, 'events'), {
                ...formData,
                creatorId,
                createdAt: new Date()
            });

            const registrationLink = `${window.location.origin}/register/${docRef.id}`;
            setGeneratedLink(registrationLink);
            setMessage('Event created successfully!');

            if (onEventCreated) onEventCreated();
            setFormData({
                posterUrl: '',
                eventName: '',
                category: 'Hackathon',
                teamMembers: '',
                dept: '',
                year: '',
                prizePool: '',
                description: '',
                venue: '',
                time: '',
                date: '',
                mode: 'Offline',
                registrationFields: {
                    name: true,
                    email: true,
                    contact: true,
                    dept: false,
                    rollno: false,
                    div: false,
                    year: false
                },
                resources: []
            });
        } catch (error) {
            console.error("Error adding event: ", error);
            setMessage('Failed to create event.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-card auth-box-pad glassmorphism fade-in" style={{ maxWidth: '800px', margin: '0' }}>
            <div className="auth-header" style={{ textAlign: 'left' }}>
                <h2>Create New Event</h2>
                <p>Fill in the details to publish a new event.</p>
            </div>

            {message && <p style={{ color: message.includes('success') ? '#10b981' : '#ef4444', marginBottom: '1rem', fontWeight: 'bold' }}>{message}</p>}

            {generatedLink && (
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <p style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Public Registration Link:</p>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                            readOnly
                            value={generatedLink}
                            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', border: 'none', padding: '0.5rem', borderRadius: '6px', color: '#34d399', fontSize: '0.85rem' }}
                        />
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(generatedLink);
                                alert("Link copied to clipboard!");
                            }}
                            style={{ padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            Copy Link
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form form-grid">
                <div className="input-group full-width">
                    <label>Add Poster (File)</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ width: '100%', padding: '0.875rem 1rem', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.95rem', cursor: 'pointer' }} />
                </div>

                <div className="input-group">
                    <label>Event Name</label>
                    <input type="text" name="eventName" value={formData.eventName} onChange={handleChange} placeholder="Enter event name" required />
                </div>
                <div className="input-group">
                    <label>Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} style={{ width: '100%', padding: '0.875rem 1rem', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }}>
                        <option value="Hackathon">Hackathon</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Sports">Sports</option>
                    </select>
                </div>

                <div className="input-group">
                    <label>Event Mode</label>
                    <select name="mode" value={formData.mode} onChange={handleChange} style={{ width: '100%', padding: '0.875rem 1rem', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }}>
                        <option value="Offline">Offline</option>
                        <option value="Online">Online</option>
                    </select>
                </div>

                {formData.category === 'Hackathon' && (
                    <div className="input-group">
                        <label>Team Members Range (e.g., 2-4)</label>
                        <input type="text" name="teamMembers" value={formData.teamMembers} onChange={handleChange} placeholder="e.g., 2-4" required style={{ width: '100%', padding: '0.875rem 1rem', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.95rem' }} />
                    </div>
                )}

                <div className="input-group">
                    <label>Department</label>
                    <input type="text" name="dept" value={formData.dept} onChange={handleChange} placeholder="Applicable Department" />
                </div>

                <div className="input-group">
                    <label>Year</label>
                    <input type="text" name="year" value={formData.year} onChange={handleChange} placeholder="Applicable Year" />
                </div>

                <div className="input-group">
                    <label>Prize Pool</label>
                    <input type="text" name="prizePool" value={formData.prizePool} onChange={handleChange} placeholder="e.g., ₹50,000" />
                </div>

                <div className="input-group">
                    <label>Venue</label>
                    <input type="text" name="venue" value={formData.venue} onChange={handleChange} placeholder="Event Location" required />
                </div>

                <div className="input-group">
                    <label>Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} style={{ width: '100%', padding: '0.875rem 1rem', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.95rem' }} required />
                </div>

                <div className="input-group">
                    <label>Time</label>
                    <input type="time" name="time" value={formData.time} onChange={handleChange} style={{ width: '100%', padding: '0.875rem 1rem', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.95rem' }} required />
                </div>

                <div className="input-group full-width">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Event details and rules..." style={{ width: '100%', padding: '0.875rem 1rem', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.95rem', resize: 'vertical' }} required></textarea>
                </div>

                {/* Registration Form Builder */}
                <div className="full-width" style={{ marginTop: '1rem', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#c4b5fd' }}>Set Registration Form Fields</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Select which fields students should fill out for this event.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        {Object.keys(formData.registrationFields).map(field => (
                            <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                                <input
                                    type="checkbox"
                                    name={field}
                                    checked={formData.registrationFields[field]}
                                    onChange={handleChange}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                {field === 'dept' ? 'Department' : field === 'rollno' ? 'Roll No' : field === 'div' ? 'Division' : field === 'year' ? 'Year' : field}
                            </label>
                        ))}
                    </div>
                </div>



                <button type="submit" className="btn-primary full-width-btn" disabled={loading} style={{ marginTop: '1rem' }}>
                    {loading ? 'Creating Event...' : 'Create Event & Generate Link'}
                </button>
            </form>
        </div>
    );
};

const AdminAnalytics = ({ events }) => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRegistrations = async () => {
            try {
                const q = query(collection(db, 'registrations'));
                const querySnapshot = await getDocs(q);
                const regs = querySnapshot.docs.map(doc => doc.data());
                setRegistrations(regs);
            } catch (error) {
                console.error("Error fetching registrations:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRegistrations();
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>Loading analytics...</div>;

    // Calculate aggregated data
    const chartData = events.map(event => {
        const eventRegs = registrations.filter(r => r.eventId === event.id).length;
        // fallback dummy check
        const dummyRegs = event.id.startsWith('dummy-') ? Math.floor(Math.random() * 50) + 10 : 0;
        const total = eventRegs + dummyRegs;
        return {
            name: event.eventName.length > 15 ? event.eventName.substring(0, 15) + '...' : event.eventName,
            fullName: event.eventName,
            registrations: total
        };
    }).filter(d => d.registrations > 0); // Only show events with some registrations

    const totalEvents = events.length;
    const totalRegs = chartData.reduce((acc, curr) => acc + curr.registrations, 0);

    return (
        <div className="auth-card auth-box-pad glassmorphism fade-in" style={{ maxWidth: '900px', margin: '0' }}>
            <div className="auth-header" style={{ textAlign: 'left', marginBottom: '2rem' }}>
                <h2>Analytics Overview</h2>
                <p>Track your platform registrations and event turnout.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '2.5rem', color: '#a5b4fc', margin: 0 }}>{totalEvents}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>Total Events</p>
                </div>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '2.5rem', color: '#34d399', margin: 0 }}>{totalRegs}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>Total Registrations</p>
                </div>
            </div>

            {chartData.length > 0 ? (
                <>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#c4b5fd' }}>Registrations per Event</h3>
                    <div style={{ width: '100%', height: '350px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem', paddingTop: '2rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} angle={-15} textAnchor="end" />
                                <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#fff', marginBottom: '5px' }}
                                />
                                <Bar dataKey="registrations" fill="url(#colorPv)" radius={[4, 4, 0, 0]} barSize={40}>
                                </Bar>
                                <defs>
                                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Not enough data to display registration charts.</p>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
