import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { LogOut, User, Calendar, Bell, Folder, UserPlus, CheckCircle, Github, Linkedin, ExternalLink, Save, Clock, MapPin, Info, Trash2, AlertTriangle, Timer, X, Link, Download, Copy, FileText } from 'lucide-react';

const dummyEvents = [
    {
        id: 'dummy-1',
        eventName: 'Global AI Summit 2026',
        category: 'Conference',
        date: '2026-05-15',
        time: '10:00 AM',
        venue: 'Convention Center, Tech City',
        posterUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800',
        description: 'A global summit bringing together leaders in artificial intelligence.',
        resources: [
            { name: 'AI Summit - Agenda.pdf', url: 'https://pdfobject.com/pdf/sample.pdf' },
            { name: 'Speaker Lineup.csv', url: 'https://raw.githubusercontent.com/datapackage-examples/sample-csv/master/sample.csv' }
        ]
    },
    {
        id: 'dummy-2',
        eventName: 'React Native Workshop',
        category: 'Workshop',
        date: '2026-04-10',
        time: '02:00 PM',
        venue: 'Room 302, Engineering Block',
        posterUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
        description: 'Hands-on workshop on building mobile apps with React Native.',
        resources: [
            { name: 'Workshop Handbook.pdf', url: 'https://pdfobject.com/pdf/sample.pdf' },
            { name: 'Code Samples.zip', url: 'https://github.com/flybywiresim/a32nx/releases/download/v0.7.0/fbw-a32nx-v0.7.0.zip' }
        ]
    },
    {
        id: 'dummy-3',
        eventName: 'Innovation Hackathon',
        category: 'Hackathon',
        date: '2026-06-21',
        time: '09:00 AM',
        venue: 'Main Auditorium',
        posterUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800',
        description: '24-hour hackathon to solve real-world problems.',
        resources: [
            { name: 'Hackathon Rules.pdf', url: 'https://pdfobject.com/pdf/sample.pdf' }
        ]
    }
];

const MOCK_REGISTRATIONS = [
    {
        id: 'mock-reg-1',
        eventId: 'dummy-1',
        eventName: 'Global AI Summit 2026',
        date: '2026-05-15',
        time: '10:00 AM',
        venue: 'Convention Center, Tech City',
        checkedIn: false
    }
];

const StudentDashboard = () => {
    const [userData, setUserData] = useState(null);
    const [events, setEvents] = useState(dummyEvents);
    const [registrations, setRegistrations] = useState(MOCK_REGISTRATIONS);
    const [activeTab, setActiveTab] = useState('events');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedEventDetails, setSelectedEventDetails] = useState(null);
    const [showDebugInfo, setShowDebugInfo] = useState(false);

    // Timeout safety for loading
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.warn("Loading timeout reached. Forcing dashboard visible.");
                setLoading(false);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [loading]);

    // Profile Edit State
    const [githubLink, setGithubLink] = useState('');
    const [linkedinLink, setLinkedinLink] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [uploading, setUploading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        let unsubscribeEvents;
        let unsubscribeReg;

        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            console.log("Auth State Changed: ", user ? "Logged In" : "Logged Out");
            if (user) {
                try {
                    // Fetch User Data
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserData(data);
                        setGithubLink(data.githubLink || '');
                        setLinkedinLink(data.linkedinLink || '');
                        setPhotoURL(data.photoURL || '');
                    }

                    // real-time Events Listener
                    unsubscribeEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
                        const eventsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setEvents([...eventsList, ...dummyEvents]);
                    }, (error) => {
                        console.error("Error in events listener:", error);
                        setEvents(dummyEvents);
                    });

                    // Fetch My Registrations Real-time
                    const qReg = query(collection(db, 'registrations'), where('userId', '==', user.uid));
                    unsubscribeReg = onSnapshot(qReg, (snapshot) => {
                        const myRegs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        console.log("Fetched registrations from Firestore:", myRegs.length);
                        setRegistrations([...myRegs, ...MOCK_REGISTRATIONS]);
                        setLoading(false);
                    }, (error) => {
                        console.error("Error in registrations listener:", error);
                        setLoading(false);
                    });

                } catch (error) {
                    console.error("Error in auth state change:", error);
                    setLoading(false);
                }
            } else {
                navigate('/login');
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeEvents) unsubscribeEvents();
            if (unsubscribeReg) unsubscribeReg();
        };
    }, [navigate]);

    useEffect(() => {
        // Compute dynamic notifications
        const list = [];

        registrations.forEach(reg => {
            // ONLY process if the event actually still exists in the system
            const eventExists = events.some(e => e.id === reg.eventId);
            if (!eventExists) return;
            // Check-in success
            if (reg.checkedIn) {
                list.push({
                    id: `checkedin-${reg.id}`,
                    title: "Check-in Successful!",
                    message: `You have successfully checked in for ${reg.eventName}. Enjoy the event!`,
                    time: "Just now",
                    type: "success"
                });
            } else {
                // Not checked in yet = Successfully registered
                list.push({
                    id: `registered-${reg.id}`,
                    title: "Registration Confirmed!",
                    message: `You are officially registered for ${reg.eventName}. We look forward to seeing you there!`,
                    time: "Recent",
                    type: "info"
                });
            }

            // Upcoming reminder (24h)
            if (isWithin24Hours(reg.date, reg.time) && !reg.checkedIn) {
                list.push({
                    id: `upcoming-${reg.id}`,
                    title: "Event Starting Soon!",
                    message: `Reminder: ${reg.eventName} starts within 24 hours. Be ready!`,
                    time: "Reminder",
                    type: "warning"
                });
            }
        });

        // Add a default welcome if no regs
        if (registrations.length === 0) {
            list.push({
                id: 'welcome',
                title: "Welcome to Student Hub",
                message: "Explore upcoming events and register to get started!",
                time: "System",
                type: "info"
            });
        }

        setNotifications(list);
    }, [registrations, events]);

    const markAsRead = async (notificationId) => {
        if (!userData || !auth.currentUser) return;
        const currentRead = userData.readNotifications || [];
        if (currentRead.includes(notificationId)) return;

        const newRead = [...currentRead, notificationId];
        setUserData(prev => ({ ...prev, readNotifications: newRead }));

        try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                readNotifications: newRead
            });
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    const markAllRead = async () => {
        if (!userData || !auth.currentUser) return;
        const allIds = notifications.map(n => n.id);

        setUserData(prev => ({ ...prev, readNotifications: allIds }));
        try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                readNotifications: allIds
            });
        } catch (err) {
            console.error("Error marking all as read:", err);
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

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        // Realistic simulation: using local URL for demo
        const mockPhotoURL = URL.createObjectURL(file);

        try {
            const user = auth.currentUser;
            await updateDoc(doc(db, 'users', user.uid), {
                photoURL: mockPhotoURL
            });
            setPhotoURL(mockPhotoURL);
            setUserData(prev => ({ ...prev, photoURL: mockPhotoURL }));
            alert("Profile picture updated!");
        } catch (error) {
            console.error("Error uploading photo:", error);
            alert("Failed to update photo.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePhoto = async () => {
        if (!window.confirm("Are you sure you want to delete your profile photo?")) return;

        setUploading(true);
        try {
            const user = auth.currentUser;
            await updateDoc(doc(db, 'users', user.uid), {
                photoURL: ''
            });
            setPhotoURL('');
            setUserData(prev => ({ ...prev, photoURL: '' }));
            alert("Profile photo removed!");
        } catch (error) {
            console.error("Error deleting photo:", error);
            alert("Failed to remove photo.");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!githubLink || !linkedinLink) {
            alert("GitHub and LinkedIn links are mandatory!");
            return;
        }

        setSaving(true);
        try {
            const user = auth.currentUser;
            await updateDoc(doc(db, 'users', user.uid), {
                githubLink,
                linkedinLink
            });
            setUserData(prev => ({ ...prev, githubLink, linkedinLink }));
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleRegister = (event) => {
        console.log("handleRegister started for:", event.eventName);
        if (registrations.some(r => r.eventId === event.id)) {
            alert("You are already registered for this event!");
            return;
        }

        if (event.id.startsWith('dummy-')) {
            const mockReg = {
                id: `mock-reg-${Date.now()}`,
                eventId: event.id,
                eventName: event.eventName,
                date: event.date,
                time: event.time,
                venue: event.venue,
                checkedIn: false
            };
            setRegistrations(prev => [mockReg, ...prev]);
            alert(`Succesfully registered for ${event.eventName}! Check the 'Registered Events' tab.`);
            return;
        }

        navigate(`/register/${event.id}`);
    };

    const handleShowTicket = (reg) => {
        console.log("handleShowTicket triggered for:", reg?.eventName);
        if (!reg) {
            console.warn("handleShowTicket called with no registration data");
            return;
        }
        setSelectedTicket(reg);
    };

    const runDiagnostics = () => {
        setRegistrations(prev => {
            const live = prev.filter(r => !r.id.startsWith('mock'));
            return [...live, ...MOCK_REGISTRATIONS];
        });
        setActiveTab('my-events');
        setLoading(false);
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return "N/A";
        try {
            // Handle common formats like "HH:MM" or "HH:MM AM/PM"
            const [time, modifier] = timeStr.split(' ');
            if (modifier) return timeStr; // Already formatted

            let [hours, minutes] = time.split(':');
            hours = parseInt(hours);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            return `${hours}:${minutes} ${ampm}`;
        } catch (e) {
            return timeStr;
        }
    };

    const isWithin24Hours = (dateStr, timeStr) => {
        if (!dateStr) return false;

        try {
            const now = new Date();
            let eventDate;

            if (timeStr) {
                eventDate = new Date(`${dateStr.replace(/-/g, '/')} ${timeStr}`);
            } else {
                eventDate = new Date(`${dateStr.replace(/-/g, '/')} 23:59:59`);
            }

            if (isNaN(eventDate.getTime())) return false;

            const diffInMs = eventDate.getTime() - now.getTime();
            const diffInHours = diffInMs / (1000 * 60 * 60);
            return diffInHours > 0 && diffInHours <= 24;
        } catch (e) {
            return false;
        }
    };

    const getDownloadUrl = (url) => {
        return url || '#';
    };

    const getViewerUrl = (url) => {
        if (!url) return '#';
        // Google PDF Viewer fallback
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    };

    const copyToClipboard = (text) => {
        try {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text);
                alert("Link copied! You can paste it in a new tab.");
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                alert("Link copied! (Legacy method)");
            }
        } catch (err) {
            console.error("Clipboard error:", err);
            prompt("Please copy the link below manually:", text);
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading Dashboard...</div>;
    }

    const navItems = [
        { id: 'events', label: 'Upcoming Events', icon: Calendar },
        { id: 'my-events', label: 'Registered Events', icon: CheckCircle },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'resources', label: 'Resources', icon: Folder },
        { id: 'invite', label: 'Invite Friends', icon: UserPlus },
        { id: 'profile', label: 'My Profile', icon: User }, // Moved to bottom
    ];

    return (
        <div className="dashboard-layout bg-slate-900 text-white">
            {/* Sidebar / Top Nav on Mobile */}
            <div className="dashboard-sidebar">
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4f46e5', overflow: 'hidden', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {photoURL ? (
                            <img src={photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
                        ) : (
                            <span style={{ fontWeight: 'bold', color: 'white' }}>{userData?.name?.[0]}</span>
                        )}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                            Student Hub
                        </h2>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{userData?.name}</p>
                    </div>
                </div>

                <nav className="dashboard-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`dashboard-nav-item ${activeTab === item.id ? 'active' : ''}`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="dashboard-main">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 className="responsive-title" style={{ margin: 0 }}>
                        {navItems.find(i => i.id === activeTab)?.label}
                    </h1>
                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </header>

                {showDebugInfo && (
                    <div className="glassmorphism" style={{ padding: '1rem', marginBottom: '2rem', maxHeight: '300px', overflowY: 'auto', fontSize: '0.7rem', fontFamily: 'monospace', color: '#34d399' }}>
                        <h3>[SYSTEM DEBUG]</h3>
                        <p>Total Events: {events.length}</p>
                        <p>Total Registrations: {registrations.length}</p>
                        <details>
                            <summary>Raw JSON Data</summary>
                            <pre>{JSON.stringify({ registrations, eventsListCount: events.length }, null, 2)}</pre>
                        </details>
                    </div>
                )}

                {/* PINNED UPCOMING EVENT REMINDER MOVED TO 'events' TAB */}

                <div className="fade-in">
                    {activeTab === 'profile' && (
                        <div className="glassmorphism" style={{ padding: '2rem', maxWidth: '800px' }}>
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid #4f46e5', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '3rem', fontWeight: 'bold', overflow: 'hidden' }}>
                                        {photoURL ? (
                                            <img src={photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
                                        ) : (
                                            userData?.name?.[0]
                                        )}
                                    </div>
                                    <label style={{ position: 'absolute', bottom: '0', right: '0', backgroundColor: '#4f46e5', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 2 }} title="Change Profile Picture">
                                        <Calendar size={14} color="white" />
                                        <input type="file" hidden accept="image/*" onChange={handlePhotoChange} disabled={uploading} />
                                    </label>
                                    {photoURL && (
                                        <button
                                            onClick={handleDeletePhoto}
                                            style={{ position: 'absolute', top: '0', right: '0', backgroundColor: '#ef4444', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 2 }}
                                            title="Delete Profile Picture"
                                        >
                                            <Trash2 size={12} color="white" />
                                        </button>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{userData?.name}</h2>
                                    <p style={{ color: 'var(--text-muted)' }}>{userData?.role} • {userData?.collegeName}</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{userData?.dept} - {userData?.year}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.9 }}>Academic Details</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px' }}>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Roll Number</p>
                                            <p>{userData?.rollno}</p>
                                        </div>
                                        <div style={{ padding: '1rem', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px' }}>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Division / Year</p>
                                            <p>{userData?.div} / {userData?.year}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.9 }}>Social Profiles <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>(Mandatory)</span></h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ padding: '0.75rem', backgroundColor: '#333', borderRadius: '10px' }}><Github size={20} /></div>
                                            <input
                                                value={githubLink}
                                                onChange={(e) => setGithubLink(e.target.value)}
                                                placeholder="GitHub Profile URL *"
                                                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', border: githubLink ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(239, 68, 68, 0.4)', padding: '0.75rem', borderRadius: '10px', color: 'white' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ padding: '0.75rem', backgroundColor: '#0077b5', borderRadius: '10px' }}><Linkedin size={20} /></div>
                                            <input
                                                value={linkedinLink}
                                                onChange={(e) => setLinkedinLink(e.target.value)}
                                                placeholder="LinkedIn Profile URL *"
                                                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', border: linkedinLink ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(239, 68, 68, 0.4)', padding: '0.75rem', borderRadius: '10px', color: 'white' }}
                                            />
                                        </div>
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={saving}
                                            className="btn-primary"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}
                                        >
                                            <Save size={18} /> {saving ? 'Saving...' : 'Update & Save Details'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'events' && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div className="responsive-grid">
                                {events.length > 0 ? (
                                    events.map((event) => (
                                        <div key={event.id} className="glassmorphism" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ height: '160px', borderRadius: '8px', overflow: 'hidden' }}>
                                                <img src={event.posterUrl || 'https://via.placeholder.com/400x200'} alt={event.eventName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(99, 102, 241, 0.2)', borderRadius: '4px', color: '#818cf8', fontWeight: '600' }}>
                                                        {event.category}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: event.mode === 'Online' ? '#10b981' : '#f59e0b' }}></div> {event.mode || 'Offline'}
                                                    </span>
                                                </div>
                                                <h3 style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>{event.eventName}</h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                        <Calendar size={14} /> {event.date}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                        <Clock size={14} /> {formatTime(event.time)}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                        <MapPin size={14} /> {event.venue}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                                                {registrations.some(r => r.eventId === event.id) ? (
                                                    <button
                                                        onClick={() => handleShowTicket(registrations.find(r => r.eventId === event.id))}
                                                        className="btn-primary"
                                                        style={{ flex: 1, padding: '0.6rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                                                    >
                                                        View Ticket
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleRegister(event)} className="btn-primary" style={{ flex: 1, padding: '0.6rem' }}>Register</button>
                                                )}
                                                <button onClick={() => setSelectedEventDetails(event)} className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: '0.6rem' }}>Details</button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', opacity: 0.5, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                        <p>No upcoming events found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'my-events' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* PINNED REGISTERED EVENT REMINDER */}
                            {(() => {
                                const upcomingRegs = registrations.filter(r => {
                                    const eventExists = events.some(e => e.id === r.eventId);
                                    return eventExists && isWithin24Hours(r.date, r.time) && !r.checkedIn;
                                });
                                if (upcomingRegs.length > 0) {
                                    return (
                                        <div className="fade-in" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', color: '#ef4444', animation: 'pulse 2s infinite' }}>
                                            <AlertTriangle size={24} />
                                            <div>
                                                <p style={{ fontWeight: 'bold', margin: 0 }}>Pinned: Action Required!</p>
                                                <p style={{ fontSize: '0.9rem', margin: '0.25rem 0 0 0', opacity: 0.9 }}>
                                                    {upcomingRegs.length === 1
                                                        ? `Your registered event "${upcomingRegs[0].eventName}" starts within 24 hours. Don't forget to check in!`
                                                        : `You have ${upcomingRegs.length} registered events starting within 24 hours. Don't forget to check in!`}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {registrations.filter(r => events.some(e => e.id === r.eventId)).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                                    <CheckCircle size={48} style={{ marginBottom: '1rem' }} />
                                    <p>You haven't registered for any currently active events yet.</p>
                                </div>
                            ) : (
                                registrations.filter(r => events.some(e => e.id === r.eventId)).map((reg) => (
                                    <div key={reg.id} className="glassmorphism" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Calendar size={24} color="#818cf8" />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem' }}>{reg.eventName}</h3>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{reg.date} • {formatTime(reg.time)} • {reg.venue}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                {reg.checkedIn ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 'bold' }}>
                                                        <CheckCircle size={18} /> Checked In
                                                    </span>
                                                ) : (
                                                    <button onClick={() => handleShowTicket(reg)} className="btn-primary" style={{ backgroundColor: '#6366f1', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', width: 'auto', padding: '0.5rem 1rem' }}>
                                                        View Ticket
                                                    </button>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setActiveTab('resources')}
                                                style={{ fontSize: '0.85rem', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.2)', color: '#a5b4fc', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                            >
                                                <Folder size={14} /> Event Resources
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="glassmorphism" style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                <p style={{ color: 'var(--text-muted)' }}>Recent Alerts</p>
                                <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: '0.9rem' }}>Mark all read</button>
                            </div>
                            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {notifications.length === 0 ? (
                                    <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No notifications yet.</p>
                                ) : (
                                    notifications.map(n => {
                                        const isRead = userData?.readNotifications?.includes(n.id);
                                        return (
                                            <div
                                                key={n.id}
                                                onClick={() => markAsRead(n.id)}
                                                style={{
                                                    display: 'flex',
                                                    gap: '1rem',
                                                    padding: '1rem',
                                                    background: n.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : n.type === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                                    borderRadius: '12px',
                                                    borderLeft: `4px solid ${n.type === 'success' ? '#10b981' : n.type === 'warning' ? '#f59e0b' : '#818cf8'}`,
                                                    opacity: isRead ? 0.5 : 1,
                                                    cursor: isRead ? 'default' : 'pointer',
                                                    transition: 'all 0.2s',
                                                    position: 'relative'
                                                }}>
                                                <Info style={{ flexShrink: 0 }} color={n.type === 'success' ? '#10b981' : n.type === 'warning' ? '#f59e0b' : '#818cf8'} />
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontWeight: isRead ? '400' : '600' }}>{n.title}</p>
                                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{n.message}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>{n.time}</p>
                                                </div>
                                                {!isRead && (
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#818cf8', position: 'absolute', top: '1rem', right: '1rem' }} />
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'resources' && (
                        <div className="responsive-grid">
                            {registrations && registrations.length > 0 ? (
                                registrations.filter(r => r && r.id).map(reg => {
                                    // Use String conversion to prevent type-mismatch on IDs
                                    const eventDetails = events.find(e => String(e.id) === String(reg.eventId));
                                    if (!eventDetails) {
                                        console.warn(`[DEBUG] Resource list: Event NOT FOUND for registration:`, {
                                            regId: reg.id,
                                            regEventId: reg.eventId,
                                            regEventName: reg.eventName,
                                            availableEventIds: events.map(e => e.id)
                                        });
                                    } else {
                                        console.log(`[DEBUG] Found matching event for resources: ${eventDetails.eventName} (${eventDetails.resources?.length || 0} files)`);
                                    }
                                    const eventName = reg.eventName || eventDetails?.eventName || 'Unnamed Event';
                                    const resources = eventDetails?.resources || [];

                                    return (
                                        <div key={`res-${reg.id}`} className="glassmorphism" style={{ padding: '1.5rem' }}>
                                            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#c4b5fd' }}>
                                                <Folder size={20} /> {eventName}
                                                <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 'normal' }}>({resources.length} files)</span>
                                            </h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {resources.length > 0 ? (
                                                    resources.map((res, i) => {
                                                        const isPdf = res.type === 'application/pdf' ||
                                                            res.url?.toLowerCase().includes('.pdf') ||
                                                            res.name?.toLowerCase().endsWith('.pdf');

                                                        console.log(`[DEBUG] Resource ${i}: ${res.name}`, { type: res.type, isPdf, url: res.url });

                                                        return (
                                                            <div
                                                                key={i}
                                                                style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    padding: '1rem',
                                                                    background: 'rgba(255,255,255,0.03)',
                                                                    borderRadius: '12px',
                                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 min-content', overflow: 'hidden' }}>
                                                                        <div style={{ padding: '0.5rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', color: '#818cf8', flexShrink: 0 }}>
                                                                            <Link size={16} />
                                                                        </div>
                                                                        <span style={{ fontSize: '0.9rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{res.name}</span>
                                                                    </div>

                                                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                                        {/* PRIMARY VIEW (Google Viewer) */}
                                                                        <a
                                                                            href={getViewerUrl(res.url)}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            title="View in Google Reader"
                                                                            style={{ padding: '0.5rem', backgroundColor: 'rgba(99, 102, 241, 0.2)', borderRadius: '8px', color: '#a5b4fc', display: 'flex', transition: 'all 0.2s', textDecoration: 'none' }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.3)'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.2)'}
                                                                        >
                                                                            <FileText size={16} />
                                                                        </a>

                                                                        {/* DIRECT DOWNLOAD */}
                                                                        <a
                                                                            href={getDownloadUrl(res.url)}
                                                                            download={res.name}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            title="Download File"
                                                                            style={{ padding: '0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: '#34d399', display: 'flex', transition: 'all 0.2s', textDecoration: 'none' }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.4)'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'}
                                                                        >
                                                                            <Download size={16} />
                                                                        </a>

                                                                        {/* COPY LINK */}
                                                                        <button
                                                                            onClick={() => copyToClipboard(res.url)}
                                                                            title="Copy Link"
                                                                            style={{ padding: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '8px', color: '#cbd5e1', display: 'flex', transition: 'all 0.2s', cursor: 'pointer' }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                                                        >
                                                                            <Copy size={16} />
                                                                        </button>

                                                                        {/* DELETE BUTTON */}
                                                                        <button
                                                                            onClick={() => {
                                                                                if (window.confirm("Are you sure you want to delete this resource link?")) {
                                                                                    // Removing from local state for this student's view
                                                                                    const updatedEvents = events.map(evt => {
                                                                                        if (evt.id === event.id) {
                                                                                            return {
                                                                                                ...evt,
                                                                                                resources: evt.resources.filter((_, i) => i !== resIndex)
                                                                                            };
                                                                                        }
                                                                                        return evt;
                                                                                    });
                                                                                    setEvents(updatedEvents);
                                                                                }
                                                                            }}
                                                                            title="Delete Link"
                                                                            style={{ padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', color: '#ef4444', display: 'flex', transition: 'all 0.2s', cursor: 'pointer' }}
                                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px dashed rgba(255,255,255,0.05)' }}>
                                                        <Info size={16} style={{ display: 'block', margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                                        <p style={{ marginBottom: '1rem' }}>No materials available for this event yet.</p>

                                                        {/* DELETE ENTIRE EVENT/REGISTRATION OPTION */}
                                                        <button
                                                            onClick={async () => {
                                                                if (window.confirm(`Are you sure you want to remove your registration for "${eventName}"? This will remove it from your dashboard.`)) {
                                                                    try {
                                                                        // Optimistic local update
                                                                        setRegistrations(prev => prev.filter(r => r.id !== reg.id));

                                                                        // Real DB update
                                                                        await import('firebase/firestore').then(({ deleteDoc, doc }) => {
                                                                            deleteDoc(doc(db, 'registrations', reg.id)).catch(err => {
                                                                                console.error("Failed to delete from DB", err);
                                                                            });
                                                                        });
                                                                        alert("Registration removed!");
                                                                    } catch (err) {
                                                                        console.error("Error removing registration:", err);
                                                                    }
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '0.5rem 1rem',
                                                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                                borderRadius: '8px',
                                                                color: '#ef4444',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                transition: 'all 0.2s',
                                                                cursor: 'pointer',
                                                                fontSize: '0.8rem'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                                        >
                                                            <Trash2 size={14} /> Remove Event from Resources
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', opacity: 0.5, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <Folder size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                                    <p>Register for events to access their resources and materials.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'invite' && (
                        <div className="glassmorphism" style={{ padding: '2rem', maxWidth: '600px' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Send Invitation</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Select Event</label>
                                    <select style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '10px', color: 'white' }}>
                                        {events.map(e => <option key={e.id}>{e.eventName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Friend's Email</label>
                                    <input placeholder="email@example.com" style={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '10px', color: 'white' }} />
                                </div>
                                <button onClick={() => alert("Invitation Sent!")} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <UserPlus size={18} /> Send Request
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Ticket Modal */}
            {selectedTicket && (
                <div className="responsive-modal">
                    <div className="responsive-modal-content glassmorphism fade-in" style={{ textAlign: 'center', position: 'relative', border: '2px solid var(--primary)' }}>
                        <button onClick={() => setSelectedTicket(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        <h2 style={{ marginBottom: '0.5rem' }}>Event Ticket</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Show this QR code at the check-in desk</p>

                        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem' }}>
                            <QRCodeCanvas
                                value={`REG:${selectedTicket.id}|USER:${auth.currentUser?.uid}`}
                                size={200}
                                level="H"
                            />
                        </div>

                        <div style={{ textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Event:</strong> {selectedTicket.eventName}</p>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Venue:</strong> {selectedTicket.venue || (events.find(e => e.id === selectedTicket.eventId)?.venue) || 'Auditorium'}</p>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Date:</strong> {selectedTicket.date}</p>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}><strong>Time:</strong> {formatTime(selectedTicket.time)}</p>
                            <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', opacity: 0.6 }}><strong>ID:</strong> {selectedTicket.id}</p>
                        </div>

                        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>
                            Wait for Admin to Scan
                        </p>
                    </div>
                </div>
            )}

            {/* Event Details Modal */}
            {selectedEventDetails && (
                <div className="responsive-modal">
                    <div className="responsive-modal-content glassmorphism fade-in" style={{ position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <button onClick={() => setSelectedEventDetails(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(99, 102, 241, 0.2)', borderRadius: '4px', color: '#818cf8', fontWeight: '600' }}>
                                {selectedEventDetails.category}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {selectedEventDetails.mode || 'Offline'}
                            </span>
                        </div>

                        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {selectedEventDetails.eventName}
                        </h2>

                        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={18} color="#8b5cf6" />
                                <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date</p><p style={{ fontSize: '0.9rem' }}>{selectedEventDetails.date}</p></div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={18} color="#8b5cf6" />
                                <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time</p><p style={{ fontSize: '0.9rem' }}>{formatTime(selectedEventDetails.time)}</p></div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={18} color="#8b5cf6" />
                                <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Venue</p><p style={{ fontSize: '0.9rem' }}>{selectedEventDetails.venue}</p></div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: '#e2e8f0' }}>Event Details & Description</h3>
                            <div style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                                {selectedEventDetails.description || 'No detailed description available for this event.'}
                            </div>
                        </div>

                        {selectedEventDetails.prizePool && (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.85rem', color: '#fef08a' }}>Prize Pool</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fde047' }}>{selectedEventDetails.prizePool}</p>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <button onClick={() => {
                                setSelectedEventDetails(null);
                                if (!registrations.some(r => r.eventId === selectedEventDetails.id)) {
                                    handleRegister(selectedEventDetails);
                                }
                            }} className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
                                {registrations.some(r => r.eventId === selectedEventDetails.id) ? 'Already Registered' : 'Register Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;

