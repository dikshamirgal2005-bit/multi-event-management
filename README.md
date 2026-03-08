# 🎟️ EventHub: Mult-Event Management OS

A comprehensive, modern platform designed to manage multiple events like **conferences, workshops, and hackathons**.
It features dedicated portals for both **Students** and **Administrators**, streamlining event registration, resource sharing, and ticketing with a beautiful glassmorphism UI.

---

# 🚀 Features

## 🌟 Public Landing Page
* **Modern UI:** A stunning, responsive landing page built with custom CSS glassmorphism, gradients, and micro-animations.
* **Frictionless Entry:** Clear Calls to Action (CTA) for students to sign up or log in.

## 👩‍🎓 Student Portal (Student Hub)
* **Smart Matchmaking (Recommendations):** Our recommendation engine automatically highlights relevant events (like Hackathons) based on the student's academic background (e.g., Computer Science).
* **Event Discovery:** Browse upcoming events with details like date, time, venue, and descriptions.
* **Easy Registration:** Register for individual events or form teams for hackathons.
* **Dashboard:** Manage registered events and view upcoming schedules.
* **Resource Access:** Download or view materials (PDFs, links) shared by admins for specific events.
* **Digital Tickets:** Access unique **QR-coded tickets** for seamless event check-in.
* **Smart Notifications:** Receive alerts for successful registrations and **24-hour event reminders** via EmailJS.

## 🛠️ Admin Portal
* **Analytics Dashboard:** A real-time data visualization dashboard featuring visual bar charts (powered by Recharts) showing registration metrics across all events.
* **Dashboard Overview:** Track top-level metrics like Total Events and Total Registrations at a glance.
* **Event Creation:** Create customized events (Conference, Workshop, Hackathon) with tailored registration fields and team size limits.
* **Resource Management:** Upload and manage event resources and materials.
* **Attendee Tracking:** View all registered students for each event, including team details for hackathons.

---

# 🧑‍💻 Technologies Used

## 🎨 Frontend
* **React** – UI library using functional components and hooks
* **Vite** – Fast build tool and development server
* **React Router** – Client-side routing
* **Recharts** – Composable charting library for the Admin Analytics Dashboard
* **Framer Motion** – Animation library for smooth page transitions
* **Lucide React** – Modern icon library
* **qrcode.react** – QR code generation for digital tickets
* **Custom CSS (Glassmorphism)** – Modern UI design with transparent blurred backgrounds and responsive styling

## 🔧 Backend & Database
* **Firebase Authentication** – Secure login and registration supporting **Admin** and **Student** roles.
* **Firebase Firestore** – NoSQL cloud database used to store users, events, registrations, and resources in real time.

## 📧 Email Notifications
* **EmailJS** – Third-party service used to send dynamic emails to students upon event registration and when new resources are uploaded. No backend server required.

---

# 💻 How to Run the Project Locally

## Prerequisites
Make sure **Node.js** is installed on your system.

## Installation Steps

### 1️⃣ Clone the repository
```bash
git clone https://github.com/dikshamirgal2005-bit/multi-event-management.git
```

### 2️⃣ Navigate to the project folder
```bash
cd multi-event
```

### 3️⃣ Install dependencies
```bash
npm install
```

### 4️⃣ Setup environment variables
Create a `.env` file and add your Firebase and EmailJS configuration:
```env
# Firebase Setup
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# EmailJS Setup (Create templates at emailjs.com)
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_EMAILJS_REGISTRATION_TEMPLATE_ID=your_registration_template_id
VITE_EMAILJS_RESOURCE_TEMPLATE_ID=your_resource_template_id
```

### 5️⃣ Start the development server
```bash
npm run dev
```

### 6️⃣ Open the browser
Navigate to `http://localhost:5173`

---

# 🌐 Live Project
Deployed Link:
https://multi-event-management.vercel.app/

---

# 📄 Usage Guide

## 1️⃣ Public Access
* View the modern landing page and choose to Sign In or Get Started.

## 2️⃣ As an Admin
* Register/Login as an Admin.
* View your Analytics Dashboard to see real-time event performance.
* Go to **Create Event** to add a new event to the platform.
* Use **Event History** to manage events, resources, upload materials, and view attendees.

## 3️⃣ As a Student
* Register/Login as a Student and provide your background data (department/year).
* Check the **Dashboard** for Smart Event Recommendations tailored to your profile.
* Browse **Upcoming Events** and click **Register**.
* Access your **QR Ticket** and **event materials** in your personal dashboard.

---

# 🛡️ License
This project is created for **educational and portfolio purposes**.
