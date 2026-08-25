import React from 'react';
import './Hero.css';

const PEERS = [
  {
    id: 1,
    name: 'Priya S.',
    badge: 'Expert',
    details: 'Helps with React · CS · Year 3',
    initial: 'P',
    bgColor: '#fee2e2',
    textColor: '#ef4444'
  },
  {
    id: 2,
    name: 'Marcus T.',
    badge: 'Intermediate',
    details: 'Helps with React · IT · Year 2',
    initial: 'M',
    bgColor: '#ffedd5',
    textColor: '#f97316'
  },
  {
    id: 3,
    name: 'Ana R.',
    badge: 'Expert',
    details: 'Helps with React · Design · Year 4',
    initial: 'A',
    bgColor: '#fef3c7',
    textColor: '#f59e0b'
  }
];

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="container hero-grid">
        {/* Left Column: Copy & Actions */}
        <div className="hero-content animate-fade-in">
          <span className="hero-label">PEER SKILL EXCHANGE</span>
          
          <h1 className="hero-title">
            Teach what you know.
            <br />
            <span className="highlight-coral italic-title">Learn what you want.</span>
          </h1>
          
          <p className="hero-description">
            A credit-based marketplace where anyone can trade skills — one hour taught earns one hour learned. No money. No gatekeeping.
          </p>
        </div>

        {/* Right Column: Static Peer Search Preview Card */}
        <div className="hero-preview animate-fade-in delay-1">
          <div className="preview-card">
            {/* Search Input */}
            <div className="search-box">
              <span className="search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search a skill you want to learn..."
                className="search-input"
                readOnly
              />
            </div>

            {/* Peer List */}
            <div className="peer-list">
              {PEERS.map((peer) => (
                <div key={peer.id} className="peer-row">
                  <div className="peer-avatar" style={{ backgroundColor: peer.bgColor, color: peer.textColor }}>
                    {peer.initial}
                  </div>
                  
                  <div className="peer-info">
                    <div className="peer-header">
                      <span className="peer-name">{peer.name}</span>
                      <span className="peer-badge">{peer.badge}</span>
                    </div>
                    <div className="peer-details">{peer.details}</div>
                  </div>

                  <button className="btn-reach-out">
                    Reach out
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
