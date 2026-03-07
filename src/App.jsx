import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminEventDetails from './pages/AdminEventDetails';

import RegistrationPage from './pages/RegistrationPage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/admin/event/:eventId" element={<AdminEventDetails />} />
          <Route path="/register/:eventId" element={<RegistrationPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
