import React, { useState, useEffect } from 'react';
import './Navbar.css';

export default function Navbar({ user, onLogout, onNavigate }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (e, targetView) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(targetView);
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        {/* Left: Logo */}
        <a href="/" onClick={(e) => handleNavigation(e, 'landing')} className="logo-group">
          <div className="logo-icon">
            <span>S</span>
          </div>
          <span className="logo-text">Skillmate</span>
        </a>

        {/* Middle: Center Navigation Links */}
        <div className="nav-links-center">
          <a href="#find-peers" className="nav-center-link">
            Find peers
          </a>
          <a href="#forum" className="nav-center-link">
            Forum
          </a>
        </div>
        
        {/* Right: Actions */}
        <div className="nav-actions">
          {user ? (
            <>
              <span className="nav-greeting">Hi, {user.name.split(' ')[0]}</span>
              <span className="nav-credits-badge">{user.credits} credits</span>
              <a href="#signout" onClick={(e) => { e.preventDefault(); onLogout(); }} className="nav-link show-link">
                Sign out
              </a>
            </>
          ) : (
            <>
              <button onClick={(e) => handleNavigation(e, 'auth')} className="btn btn-primary btn-signin-header">
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
