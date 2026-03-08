import { BrowserRouter as Router } from 'react-router-dom';
import AnimatedRoutes from './AnimatedRoutes';
import { initEmailjs } from './utils/emailService';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    initEmailjs();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;
