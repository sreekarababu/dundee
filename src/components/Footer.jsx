import React, { useState, useEffect } from 'react';

const Footer = () => {
  const [isOpenNow, setIsOpenNow] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState(null); // 'success', 'error', or null
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    // Check if the facility is currently open based on local time
    const checkStatus = () => {
      const now = new Date();
      const day = now.getDay(); // 0: Sun, 6: Sat
      const hour = now.getHours();
      
      const isWeekend = (day === 0 || day === 6);
      if (isWeekend) {
        // Sat/Sun: 9:00 AM to 10:00 PM (22:00)
        setIsOpenNow(hour >= 9 && hour < 22);
      } else {
        // Mon-Fri: 11:00 AM to 9:00 PM (21:00)
        setIsOpenNow(hour >= 11 && hour < 21);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // check every minute
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const { name, email, message } = formData;

    if (!name.trim() || !email.trim() || !message.trim()) {
      setFormStatus('error');
      setStatusText('Please complete all contact form fields.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormStatus('error');
      setStatusText('Please supply a valid email address.');
      return;
    }

    setFormStatus('success');
    setStatusText('Signal received! Our dispatchers will reply within 24 hours.');
    setFormData({ name: '', email: '', message: '' });

    setTimeout(() => {
      setFormStatus(null);
    }, 5000);
  };

  return (
    <footer id="contact" className="footer-container">
      <div className="footer-grid">
        {/* Information & Socials */}
        <div className="footer-info-column">
          <div className="logo-container">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff007b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="logo-icon">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span className="logo-text neon-text-magenta">AntiGravity</span>
          </div>

          <div>
            {isOpenNow ? (
              <div className="footer-hours-badge open">
                <span className="indicator-dot" />
                <span>Open Now (Session Active)</span>
              </div>
            ) : (
              <div className="footer-hours-badge closed">
                <span className="indicator-dot" />
                <span>Closed Now (Schedules Active)</span>
              </div>
            )}
          </div>

          <p className="footer-desc">
            Dundee's signature high-altitude trampoline and silk-yoga facility. Engineered for thrill-seekers, training athletes, and glowing night lifers.
          </p>

          <div>
            <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px' }}>Launch Control Base</h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              15 Nebula Way, Greenmarket<br />
              Dundee, DD1 4QB
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '10px' }}>Join the Uplink</h4>
            <div className="footer-social-links">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Instagram">📸</a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="TikTok">🎵</a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Facebook">📘</a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-btn" aria-label="Twitter">🐦</a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="footer-contact-column glass-panel" style={{ borderColor: 'rgba(112, 0, 255, 0.2)' }}>
          <form className="contact-form" onSubmit={handleFormSubmit}>
            <div>
              <h3>Secure Uplink</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Send a message to our base team for event bookings, memberships or safety queries.</p>
            </div>

            {formStatus && (
              <div className={`form-alert ${formStatus}`}>
                {statusText}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="contact-name">Name</label>
              <input 
                id="contact-name"
                name="name" 
                type="text" 
                placeholder="Enter your name" 
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-email">Email</label>
              <input 
                id="contact-email"
                name="email" 
                type="email" 
                placeholder="name@domain.com" 
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-message">Message</label>
              <textarea 
                id="contact-message"
                name="message" 
                rows="4" 
                placeholder="Write your signal details..."
                value={formData.message}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="submit" className="btn-submit-contact">
              Transmit Signal
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Legal bar */}
      <div className="footer-bottom-bar">
        <div>
          © {new Date().getFullYear()} Anti Gravity Dundee Ltd. All rights reserved.
        </div>
        <div className="footer-bottom-links">
          <a href="#booking">Refund Policies</a>
          <a href="#contact">Liability Waiver</a>
          <a href="#hero">Terms of Launch</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
