import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { isFirebaseConfigured } from './firebase';

import PrivateRoute from './components/PrivateRoute';

// Pages (Placeholders for now)
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Home from './pages/Home';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="layout">
            {!isFirebaseConfigured && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                textAlign: 'center',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <span>⚠️ <strong>Firebase Yapılandırması Eksik:</strong> Uygulamanın verileri kaydetmesi ve kullanıcı girişi için AI Studio Settings menüsünden Firebase ortam değişkenlerini (API Key, Project ID vb.) tanımlayın.</span>
              </div>
            )}
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/dashboard/*" element={<Dashboard />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}


export default App;
