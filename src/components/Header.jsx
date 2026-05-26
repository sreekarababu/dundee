import React, { useState, useEffect } from 'react';

const Header = ({ activeSection, setActiveSection }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="logo-container" onClick={() => handleNavClick('hero')}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="logo-icon floating">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#7000ff" />
            </linearGradient>
          </defs>
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        <span className="logo-text neon-text-cyan">Anti<span style={{color: '#ff007b', textShadow: '0 0 10px rgba(255,0,123,0.4)'}}>Gravity</span></span>
      </div>

      <nav>
        <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <li className="nav-item">
            <a 
              href="#hero" 
              className={activeSection === 'hero' ? 'active' : ''} 
              onClick={(e) => { e.preventDefault(); handleNavClick('hero'); }}
            >
              Home
            </a>
          </li>
          <li className="nav-item">
            <a 
              href="#attractions" 
              className={activeSection === 'attractions' ? 'active' : ''} 
              onClick={(e) => { e.preventDefault(); handleNavClick('attractions'); }}
            >
              Attractions
            </a>
          </li>
          <li className="nav-item">
            <a 
              href="#booking" 
              className={activeSection === 'booking' ? 'active' : ''} 
              onClick={(e) => { e.preventDefault(); handleNavClick('booking'); }}
            >
              Passes & Booking
            </a>
          </li>
          <li className="nav-item">
            <a 
              href="#guide" 
              className={activeSection === 'guide' ? 'active' : ''} 
              onClick={(e) => { e.preventDefault(); handleNavClick('guide'); }}
            >
              Gravity Guide AI
            </a>
          </li>
          <li className="nav-item">
            <a 
              href="#contact" 
              className={activeSection === 'contact' ? 'active' : ''} 
              onClick={(e) => { e.preventDefault(); handleNavClick('contact'); }}
            >
              Contact
            </a>
          </li>
        </ul>
      </nav>

      <button className="header-cta" onClick={() => handleNavClick('booking')}>
        Book Tickets
      </button>

      <button 
        className={`burger-menu ${mobileMenuOpen ? 'open' : ''}`} 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle Navigation Menu"
      >
        <span className="burger-bar"></span>
        <span className="burger-bar"></span>
        <span className="burger-bar"></span>
      </button>
    </header>
  );
};

export default Header;
