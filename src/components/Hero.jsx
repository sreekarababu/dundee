import React, { useEffect, useState } from 'react';

const Hero = ({ onCtaClick }) => {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    // Generate drift stars for that beautiful dark space backdrop
    const generatedStars = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * -20,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <section id="hero" className="hero-section">
      <div className="bg-particles">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="hero-content">
        <span className="hero-tag floating">Defy Gravity in Dundee</span>
        <h1 className="hero-title">
          Experience The Ultimate <span>Gravity-Defying</span> Arena
        </h1>
        <p className="hero-description">
          Dundee's premier indoor gravity park. Combining futuristic high-bounce trampoline grids, breathtaking aerial training rigs, and a glowing neon atmosphere.
        </p>

        <div className="hero-ctas">
          <button className="btn-primary" onClick={() => onCtaClick('booking')}>
            Book Jump Pass
          </button>
          <button className="btn-secondary" onClick={() => onCtaClick('attractions')}>
            Explore Attractions
          </button>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <h3>5,000m²</h3>
            <p>Gravity Playground</p>
          </div>
          <div className="stat-item">
            <h3>15+<span>★</span></h3>
            <p>Trampoline Zones & Rigs</p>
          </div>
          <div className="stat-item">
            <h3>100%</h3>
            <p>High-Adrenaline Safe Fun</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
