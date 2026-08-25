import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';
import Auth from './components/Auth';
import './App.css';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' or 'auth'
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user session on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // Clear invalid token
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Failed to restore user session:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLoginSuccess = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setView('landing');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setView('landing');
  };

  if (loading) {
    return (
      <div className="app-loading-screen" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#faf7f2',
        color: '#121b2d',
        fontFamily: 'sans-serif',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        Loading Skillmate...
      </div>
    );
  }

  return (
    <div className="app-container">
      {view === 'landing' ? (
        <>
          {/* Navigation header */}
          <Navbar user={user} onLogout={handleLogout} onNavigate={setView} />

          {/* Main page content area */}
          <main className="main-content">
            {/* Pass user session details to Hero if needed, to show greeting */}
            <Hero user={user} />
            <Features />
          </main>

          {/* Bottom info section */}
          <Footer />
        </>
      ) : (
        <Auth onLoginSuccess={handleLoginSuccess} onNavigate={setView} />
      )}
    </div>
  );
}
