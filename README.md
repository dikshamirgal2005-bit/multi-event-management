# Multi-Event Management Platform

A comprehensive platform designed to manage multiple events like conferences, workshops, and hackathons. It features dedicated portals for both Students and Administrators, streamlining event registration, resource sharing, and ticketing.

## 🚀 Features

### Student Portal (Student Hub)
- **Event Discovery:** Browse upcoming events with details like date, time, venue, and descriptions.
- **Easy Registration:** Register for individual events or form teams for Hackathons.
- **Dashboard:** Manage registered events and view upcoming schedules.
- **Resource Access:** Download or view materials (PDFs, links) shared by admins for specific events.
- **Digital Tickets:** Access unique QR-coded tickets for seamless event check-in.
- **Smart Notifications:** Receive dynamic alerts for successful registrations and upcoming 24-hour event reminders.
- **Profile Management:** Update personal details, academic info, and social links (GitHub, LinkedIn).

### Admin Portal
- **Dashboard Overview:** Track total events, total registrations, and platform metrics.
- **Event Creation:** Create customized events (Conference, Workshop, Hackathon) with tailored registration fields and team size limits.
- **Resource Management:** Upload and manage resources/materials for specific events.
- **Attendee Tracking:** View all registered students per event, including team details for hackathons.

## 🛠️ Technologies Used

### Frontend
- **[React](https://reactjs.org/)** - UI Library (using functional components and hooks)
- **[Vite](https://vitejs.dev/)** - Next Generation Frontend Tooling (Build tool and dev server)
- **[React Router](https://reactrouter.com/)** - Declarative routing for React applications
- **[Lucide React](https://lucide.dev/)** - Beautiful & consistent icon toolkit
- **[qrcode.react](https://github.com/zpao/qrcode.react)** - Component for generating QR codes for digital tickets
- **Custom CSS (Glassmorphism)** - Modern, premium UI design using transparent, blurred backgrounds

### Backend & Database
- **[Firebase Authentication](https://firebase.google.com/docs/auth)** - Secure user login and registration supporting multiple roles (Admin/Student).
- **[Firebase Firestore](https://firebase.google.com/docs/firestore)** - NoSQL cloud database for storing users, events, registrations, and resources in real-time.

## 💻 How to Run the Project Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation Steps

1. **Clone the repository** (if applicable) or download the source code.
2. **Navigate to the project directory:**
   \`\`\`bash
   cd multi-event
   \`\`\`
3. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`
4. **Set up environment variables:**
   Ensure you have your Firebase configuration set up in your `.env` file (e.g., `VITE_FIREBASE_API_KEY`, etc.).
5. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`
6. **Open your browser:**
   Navigate to `http://localhost:5173` (or the local URL provided in your terminal).

## 📄 Usage Guide

1. **Register/Login:** Start by selecting whether you are a Student or an Admin.
2. **As an Admin:**
   - Go to "Create Event" to set up a new event.
   - Go to "Event History" to view creations, manage resources, and see attendee lists.
3. **As a Student:**
   - Browse the "Upcoming Events" tab.
   - Click "Register" on an event you're interested in.
   - Access your QR ticket and any provided materials under "Registered Events" and "Resources".

## 🛡️ License
This project is for educational and portfolio purposes.
