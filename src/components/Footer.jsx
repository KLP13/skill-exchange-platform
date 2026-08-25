import React from 'react';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer-section">
      <div className="container footer-container">
        <div className="footer-left">
          <span>&copy; {currentYear} Skillmate</span>
        </div>
        <div className="footer-right">
          <span>Made for students, by students.</span>
        </div>
      </div>
    </footer>
  );
}
