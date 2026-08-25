import React, { useState, useEffect } from 'react';
import './Auth.css';

export default function Auth({ onLoginSuccess, onNavigate }) {
  const [isSignUp, setIsSignUp] = useState(false); // false = Sign In, true = Sign Up
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Helper: Render official Google Button in the DOM
  const renderGoogleBtn = () => {
    if (window.google && window.google.accounts) {
      const btnContainer = document.getElementById("googleBtnDiv");
      if (btnContainer) {
        window.google.accounts.id.renderButton(
          btnContainer,
          { 
            theme: "outline", 
            size: "large", 
            width: btnContainer.offsetWidth || 360,
            text: "continue_with",
            shape: "rectangular"
          }
        );
      }
    }
  };

  // 1. Initialize Google SDK once on component mount
  useEffect(() => {
    const initGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          // Loads from root .env via Vite
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, 
          callback: handleGoogleCredentialResponse
        });
        renderGoogleBtn();
      } else {
        // Retry shortly if the script tag hasn't finished loading from index.html
        setTimeout(initGoogleSignIn, 300);
      }
    };
    initGoogleSignIn();
  }, []);

  // 2. Re-render the button whenever isSignUp toggles (since card re-mounts)
  useEffect(() => {
    renderGoogleBtn();
  }, [isSignUp]);

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('landing');
    }
  };

  const handleToggleMode = (e) => {
    e.preventDefault();
    setIsSignUp(prev => !prev);
    // Clear inputs and errors on toggle
    setName('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleGoogleCredentialResponse = async (response) => {
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential: response.credential })
      });

      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.error || 'Google login verification failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to authentication server. Make sure server is running.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const url = isSignUp 
      ? 'http://localhost:5000/api/auth/signup' 
      : 'http://localhost:5000/api/auth/signin';
      
    const payload = isSignUp 
      ? { name, email, password } 
      : { email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.error || 'Authentication failed. Check your inputs.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to authentication server. Make sure MySQL is running.');
    }
  };

  return (
    <div className="auth-split-container">
      {/* Left Panel: Coral Branding */}
      <div className="auth-left">
        <a href="/" onClick={handleLogoClick} className="auth-logo-group">
          <div className="auth-logo-icon">
            <span>S</span>
          </div>
          <span className="auth-logo-text">Skillmate</span>
        </a>

        <div className="auth-left-content">
          <blockquote className="auth-quote">
            "I taught React to three classmates and learned Figma from one. No money changed hands."
          </blockquote>
          <p className="auth-quote-author">
            — How Skillmate works, in one sentence.
          </p>
        </div>

        <div className="auth-left-footer">
          Peer to peer. Skill to skill.
        </div>
      </div>

      {/* Right Panel: Auth Card */}
      <div className="auth-right">
        {/* Mobile Logo: visible only on small screens since left panel is hidden */}
        <div className="auth-mobile-header">
          <a href="/" onClick={handleLogoClick} className="auth-logo-group dark">
            <div className="auth-logo-icon color">
              <span>S</span>
            </div>
            <span className="auth-logo-text">Skillmate</span>
          </a>
        </div>

        <div className="auth-card">
          <h2 className="auth-card-title">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="auth-card-subtitle">
            {isSignUp ? 'Start teaching and learning with your peers.' : 'Sign in to browse peers and manage your skills.'}
          </p>

          {/* Display validation errors if any */}
          {error && (
            <div className="auth-error-banner animate-fade-in-quick">
              <span className="error-icon">⚠️</span>
              <span className="error-msg">{error}</span>
            </div>
          )}

          {/* Official Google Sign-In Button Container */}
          <div id="googleBtnDiv" className="auth-google-container"></div>

          {/* Divider */}
          <div className="auth-divider">
            <span>OR</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {isSignUp && (
              <div className="form-group">
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
            </div>

            <button type="submit" className="btn btn-primary auth-submit-btn">
              {isSignUp ? 'Create account' : 'Sign in'}
            </button>
          </form>

          {/* Mode toggle link */}
          <div className="auth-footer-text">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <a href="#signin" onClick={handleToggleMode} className="auth-coral-link">
                  Sign in
                </a>
              </>
            ) : (
              <>
                New to Skillmate?{' '}
                <a href="#signup" onClick={handleToggleMode} className="auth-coral-link">
                  Create account
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
