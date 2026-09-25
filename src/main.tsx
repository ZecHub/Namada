import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GovernanceDashboard from './pages/Home';
import Dashboard from './pages/Dashboard';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
     <Router>
      <Routes>
        <Route path="/" element={<GovernanceDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  </StrictMode>,
)
