import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, where, updateDoc, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, Users, Calendar, Clock, MapPin, Trophy, LayoutTemplate, Link, Download, QrCode, Search, Check, X, Loader2, Plus, FileText, FileUp } from 'lucide-react';
import Papa from 'papaparse';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { sendResourceEmail } from '../utils/emailService';

const AdminEventDetails = ({ embeddedEventId, onClose }) => {
    const { eventId: routeEventId } = useParams();
    const eventId = embeddedEventId || routeEventId;
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingResources, setSavingResources] = useState(false);
    const [resources, setResources] = useState([]);
    const [expandedTeam, setExpandedTeam] = useState(null);
    const [scanning, setScanning] = useState(false);
    const scannerRef = useRef(null);
    const isProcessingRef = useRef(false);

    useEffect(() => {
        if (!eventId) return;

        // 1. Fetch Event Details
        const fetchEvent = async () => {
            if (eventId.startsWith('dummy-')) {
                const dummyEvents = [
                    { id: 'dummy-1', eventName: 'Tech Nova Hackathon', category: 'Hackathon', date: '2026-04-15', time: '09:00', venue: 'Main Auditorium', description: 'Join us for a 24-hour coding marathon!', posterUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80' },
                    { id: 'dummy-2', eventName: 'AI/ML Workshop', category: 'Workshop', date: '2026-04-20', time: '14:00', venue: 'Lab 3, CS Department', description: 'A hands-on workshop.', posterUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80' }
                ];
                setEvent(dummyEvents.find(e => e.id === eventId) || dummyEvents[0]);
            } else {
                const docSnap = await getDoc(doc(db, 'events', eventId));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setEvent(data);
                    setResources(data.resources || []);
                }
            }
        };

        fetchEvent();

        // 2. Real-time Attendees Listener
        const q = query(collection(db, 'registrations'), where('eventId', '==', eventId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedAttendees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAttendees(fetchedAttendees);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching attendees:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [eventId]);

    useEffect(() => {
        if (scanning) {
            isProcessingRef.current = false; // Reset lock when scanning starts
            const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
            scanner.render(onScanSuccess, onScanError);
            scannerRef.current = scanner;
        } else {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Scanner clear error:", err));
                scannerRef.current = null;
            }
        }
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Scanner clear error:", err));
            }
        };
    }, [scanning]);

    const onScanSuccess = async (decodedText) => {
        // Drop any subsequent scan triggers if we are already processing one
        if (isProcessingRef.current) return;

        // Immediately acquire lock
        isProcessingRef.current = true;

        try {
            // Attempt to completely shut down the scanner immediately to stop further callbacks
            if (scannerRef.current) {
                try {
                    await scannerRef.current.clear();
                } catch (e) {
                    console.error("Error clearing scanner on success:", e);
                }
            }

            // Decoded text expected: "REG:regId|USER:userId"
            const regIdMatch = decodedText.match(/REG:([^|]+)/);
            if (regIdMatch && regIdMatch[1]) {
                const regId = regIdMatch[1];
                await handleManualCheckIn(regId);

                // Close scanner UI
                setScanning(false);

                // Show success alert slightly deferred
                setTimeout(() => {
                    alert("Successfully checked in via QR code! ✅");
                }, 300);
            } else {
                isProcessingRef.current = false; // Release lock if invalid QR
            }
        } catch (err) {
            console.error("Scan processing error:", err);
            isProcessingRef.current = false; // Release lock on error
        }
    };

    const onScanError = (err) => { /* Ignore noisy errors */ };

    const handleManualCheckIn = async (regId) => {
        try {
            await updateDoc(doc(db, 'registrations', regId), {
                checkedIn: true,
                checkedInAt: new Date()
            });
        } catch (err) {
            console.error("Check-in update error:", err);
        }
    };

    const handleExportCSV = () => {
        const dataToExport = attendees.flatMap(reg => {
            const base = {
                TeamName: reg.teamName || 'Individual',
                EventName: event?.eventName || 'Event',
                RegistrationDate: reg.timestamp?.toDate ? reg.timestamp.toDate().toLocaleString() : reg.timestamp || '',
                CheckedIn: reg.checkedIn ? 'Yes' : 'No',
                RegistrationID: reg.id
            };
            if (reg.members) {
                return reg.members.map(m => ({ ...base, SubName: m.name, SubEmail: m.email, SubContact: m.contact, SubDept: m.dept, SubYear: m.year }));
            }
            return [{ ...base, Name: reg.name, Email: reg.email, Contact: reg.contact, Dept: reg.dept, Year: reg.year, RollNo: reg.rollno }];
        });

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Attendees_${event?.eventName || 'Event'}.csv`;
        link.click();
    };
    const [newResourceName, setNewResourceName] = useState('');
    const [newResourceUrl, setNewResourceUrl] = useState('');

    const handleAddLinkResource = async (e) => {
        e.preventDefault();
        if (!newResourceName.trim() || !newResourceUrl.trim()) {
            alert("Please enter both a name and a link URL.");
            return;
        }

        setSavingResources(true);
        try {
            const newResource = {
                name: newResourceName,
                url: newResourceUrl,
                type: 'link',
                publicId: `link_${Date.now()}`
            };
            const updatedResources = [...resources, newResource];

            await updateDoc(doc(db, 'events', eventId), { resources: updatedResources });

            // Notify all attendees via email in background
            const emailPromises = attendees.flatMap(reg => {
                if (reg.members) {
                    return reg.members.map(m => {
                        if (m.email) {
                            return sendResourceEmail(m.email, m.name || 'Participant', event?.eventName || 'Event', newResourceName).catch(e => console.error("Email sending issue:", e));
                        }
                        return Promise.resolve();
                    });
                } else if (reg.email) {
                    return sendResourceEmail(reg.email, reg.name || 'Participant', event?.eventName || 'Event', newResourceName).catch(e => console.error("Email sending issue:", e));
                }
                return Promise.resolve();
            });
            Promise.all(emailPromises).catch(err => console.error("Email sending issue:", err));

            setResources(updatedResources);
            setNewResourceName('');
            setNewResourceUrl('');
        } catch (err) {
            console.error("Error adding link resource:", err);
            alert(`Failed to add link: ${err.message}`);
        } finally {
            setSavingResources(false);
        }
    };

    const removeResource = async (index) => {
        if (!window.confirm("Remove this resource?")) return;
        const updatedResources = resources.filter((_, i) => i !== index);
        try {
            await updateDoc(doc(db, 'events', eventId), { resources: updatedResources });
            setResources(updatedResources);
        } catch (err) {
            console.error("Error removing resource:", err);
            alert("Failed to remove resource.");
        }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading Event Details...</div>;
    if (!event) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Event not found.</div>;

    const totalAttendees = attendees.reduce((acc, curr) => acc + (curr.members ? curr.members.length : 1), 0);

    return (
        <div style={{ padding: embeddedEventId ? '0' : '2rem', color: 'white', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            {!embeddedEventId && (
                <button
                    onClick={() => navigate('/admin-dashboard')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#c4b5fd', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '500' }}>
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
            )}

            <div className="glassmorphism fade-in" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative' }}>
                {embeddedEventId && onClose && (
                    <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10 }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        title="Close Event Details"
                    >
                        <X size={20} />
                    </button>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, paddingRight: embeddedEventId ? '2.5rem' : '0' }}>
                        <div style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(79, 70, 229, 0.2)', borderRadius: '8px', color: '#c4b5fd', fontSize: '0.9rem', fontWeight: 'bold', width: 'fit-content', marginBottom: '1rem' }}>
                            {event.category}
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {event.eventName}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{event.description}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: embeddedEventId ? '2rem' : '0' }}>
                        <button onClick={() => setScanning(!scanning)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.75rem 1.5rem', backgroundColor: scanning ? '#ef4444' : 'var(--primary)' }}>
                            <QrCode size={18} /> {scanning ? 'Stop Scanning' : 'Open QR Scanner'}
                        </button>
                        <button onClick={handleExportCSV} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.75rem 1.5rem', backgroundColor: '#4b5563', background: 'linear-gradient(135deg, #4b5563, #374151)' }}>
                            <Download size={18} /> Export CSV
                        </button>
                    </div>
                </div>

                {scanning && (
                    <div className="glassmorphism" style={{ margin: '1.5rem 0', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', border: '2px dashed var(--primary)' }}>
                        <div id="reader" style={{ width: '100%', maxWidth: '400px', borderRadius: '12px', overflow: 'hidden' }}></div>
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Position the student's ticket QR code in the window</p>
                    </div>
                )}

                <div className="responsive-grid" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '12px', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Calendar size={20} color="#8b5cf6" /><div><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date</p><p style={{ fontWeight: '600' }}>{event.date}</p></div></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Clock size={20} color="#8b5cf6" /><div><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Time</p><p style={{ fontWeight: '600' }}>{event.time}</p></div></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><MapPin size={20} color="#8b5cf6" /><div><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Venue</p><p style={{ fontWeight: '600' }}>{event.venue}</p></div></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Users size={20} color="#8b5cf6" /><div><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Participants</p><p style={{ fontWeight: '600' }}>{totalAttendees}</p></div></div>
                </div>
            </div>

            {/* Manage Resources Section */}
            <div className="glassmorphism fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <FileUp size={24} color="#8b5cf6" /> Event Resources
                    </h2>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: '100%' }}>
                        <input
                            type="text"
                            placeholder="Resource Name"
                            value={newResourceName}
                            onChange={(e) => setNewResourceName(e.target.value)}
                            style={{ flex: '1 1 150px', minWidth: '150px', padding: '0.75rem', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                        />
                        <input
                            type="url"
                            placeholder="Drive Link (https://...)"
                            value={newResourceUrl}
                            onChange={(e) => setNewResourceUrl(e.target.value)}
                            style={{ flex: '2 1 200px', minWidth: '200px', padding: '0.75rem', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.9rem' }}
                        />
                        <button
                            type="button"
                            onClick={handleAddLinkResource}
                            disabled={savingResources}
                            className="btn-primary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                        >
                            <Plus size={16} /> Add Link
                        </button>
                    </div>
                </div>

                {resources.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No resources uploaded yet.</p>
                ) : (
                    <div className="responsive-grid">
                        {resources.map((res, index) => (
                            <div key={index} className="glassmorphism" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', gap: '1rem', flexWrap: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', flex: 1 }}>
                                    <Link size={18} color="#c4b5fd" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{res.name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                    <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ padding: '0.4rem', background: 'rgba(79, 70, 229, 0.1)', color: '#a5b4fc', border: 'none', borderRadius: '6px', display: 'flex' }}>
                                        <Download size={16} />
                                    </a>
                                    <button onClick={() => removeResource(index)} style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="glassmorphism fade-in" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Users size={24} color="#8b5cf6" /> Attendees
                </h2>

                {attendees.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No registrations yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {event.category === 'Hackathon' ? (
                            attendees.map((reg) => (
                                <div key={reg.id} style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div
                                        onClick={() => setExpandedTeam(expandedTeam === reg.id ? null : reg.id)}
                                        style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{reg.teamName || 'Unnamed Team'}</h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{reg.members?.length || 0} Members • Registered on {reg.timestamp?.toDate ? reg.timestamp.toDate().toLocaleDateString() : 'Unknown Data'}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {reg.checkedIn ? (
                                                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}><Check size={18} /> Checked In</span>
                                            ) : (
                                                <button onClick={(e) => { e.stopPropagation(); handleManualCheckIn(reg.id); }} style={{ padding: '0.4rem 0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', borderRadius: '6px', cursor: 'pointer' }}>Mark Present</button>
                                            )}
                                        </div>
                                    </div>
                                    {expandedTeam === reg.id && (
                                        <div style={{ padding: '1rem 1.25rem', backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                <thead>
                                                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                                                        <th style={{ padding: '0.5rem' }}>Name</th>
                                                        <th style={{ padding: '0.5rem' }}>Email</th>
                                                        <th style={{ padding: '0.5rem' }}>Contact</th>
                                                        <th style={{ padding: '0.5rem' }}>Dept/Year</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reg.members?.map((m, i) => (
                                                        <tr key={i}><td style={{ padding: '0.5rem' }}>{m.name}</td><td style={{ padding: '0.5rem' }}>{m.email}</td><td style={{ padding: '0.5rem' }}>{m.contact || '-'}</td><td style={{ padding: '0.5rem' }}>{m.dept} - {m.year}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <tr>
                                            <th style={{ padding: '1rem' }}>Student Name</th>
                                            <th style={{ padding: '1rem' }}>Email</th>
                                            <th style={{ padding: '1rem' }}>Contact</th>
                                            <th style={{ padding: '1rem' }}>Details</th>
                                            <th style={{ padding: '1rem' }}>Status</th>
                                            <th style={{ padding: '1rem' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendees.map((reg) => (
                                            <tr key={reg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem' }}>{reg.name}</td>
                                                <td style={{ padding: '1rem' }}>{reg.email}</td>
                                                <td style={{ padding: '1rem' }}>{reg.contact || '-'}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{reg.dept} • {reg.year}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ color: reg.checkedIn ? '#10b981' : '#f59e0b', fontWeight: '600' }}>{reg.checkedIn ? 'Checked In' : 'Pending'}</span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    {!reg.checkedIn && (
                                                        <button onClick={() => handleManualCheckIn(reg.id)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}>Check In</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminEventDetails;
