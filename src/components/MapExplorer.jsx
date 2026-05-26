import React, { useState } from 'react';

const ZONES_DATA = [
  {
    id: 'trampoline',
    code: 'TG',
    name: 'Trampoline Grid',
    color: '#00f0ff', // cyan
    price: '£12.50',
    capacity: '82%',
    capacityStatus: 'high',
    description: 'Our primary high-bounce playground. 50+ interconnected wall-to-wall trampolines, angled bounce pads, and a premium neon launch deck for professional height jumps.',
    highlights: ['Launch Deck', 'Interactive Dodgeball', 'Angled Wall-Bounce', 'Giant Airbag Pit'],
    coaching: 'Instructors on-site'
  },
  {
    id: 'aerial',
    code: 'AN',
    name: 'Aerial Nest',
    color: '#ff007b', // magenta
    price: '£16.00',
    capacity: '35%',
    capacityStatus: 'low',
    description: 'Suspended in the clouds of Dundee. Experience silk hammock flying yoga, premium aerial hoops, and antigravity suspension training guided by elite specialists.',
    highlights: ['Aerial Silk Hammocks', 'Luminous Hoops', 'Suspension Straps', 'Meditation Lounges'],
    coaching: 'Certified Yoga Elite'
  },
  {
    id: 'parkour',
    code: 'PL',
    name: 'Parkour Lab',
    color: '#7000ff', // purple
    price: '£14.00',
    capacity: '60%',
    capacityStatus: 'low',
    description: 'Unleash your inner athlete. An engineered obstacle course with foam blocks, padded neon vault boxes, wall-run panels, and deep landing pits to refine flips safely.',
    highlights: ['Multi-level Vaults', 'Warped Wall Run', 'Deep Foam Pits', 'Adjustable Obstacles'],
    coaching: 'Guided Freerun Classes'
  },
  {
    id: 'cafe',
    code: 'NC',
    name: 'Neon Cafe & Bar',
    color: '#00ff66', // lime green glow
    price: 'Free Entry',
    capacity: '48%',
    capacityStatus: 'low',
    description: 'Refuel and recharge under glowing neon tubes. Serving glowing vitamin-infused mocktails, custom premium coffee blends, and cyber snack plates with arena views.',
    highlights: ['Glow-Mocktails', 'Nitro Cold Brew', 'Viewing Gallery', 'Cyber Lounge Pods'],
    coaching: 'Ambient music & Wi-Fi'
  }
];

const MapExplorer = ({ onBookZone }) => {
  const [activeZoneId, setActiveZoneId] = useState('trampoline');

  const activeZone = ZONES_DATA.find((z) => z.id === activeZoneId);

  return (
    <section id="attractions" className="section-container">
      <div className="section-header">
        <span className="section-tag">Interactive Playground</span>
        <h2 className="section-title">Explore The Arena</h2>
        <p className="section-desc">
          Click the glowing hot-spots on our interactive map layout to tour our futuristic training bays and leisure decks.
        </p>
      </div>

      <div className="map-layout">
        {/* Arena Map Visualization */}
        <div className="arena-map-container glass-panel">
          <div className="map-grid-bg" />
          
          {/* Map Title Tag */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '25px',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '12px',
            textTransform: 'uppercase',
            fontWeight: '600',
            letterSpacing: '1px'
          }}>
            Arena Deck Map
          </div>

          {/* Zones hotspots */}
          {/* 1. Trampoline Grid */}
          <div 
            className={`map-hotspot ${activeZoneId === 'trampoline' ? 'active' : ''}`}
            style={{ top: '25%', left: '20%', color: '#00f0ff' }}
            onClick={() => setActiveZoneId('trampoline')}
          >
            <div className="hotspot-ring" />
            <div className="hotspot-core">TG</div>
          </div>

          {/* 2. Aerial Nest */}
          <div 
            className={`map-hotspot ${activeZoneId === 'aerial' ? 'active' : ''}`}
            style={{ top: '65%', left: '45%', color: '#ff007b' }}
            onClick={() => setActiveZoneId('aerial')}
          >
            <div className="hotspot-ring" />
            <div className="hotspot-core">AN</div>
          </div>

          {/* 3. Parkour Lab */}
          <div 
            className={`map-hotspot ${activeZoneId === 'parkour' ? 'active' : ''}`}
            style={{ top: '20%', left: '70%', color: '#7000ff' }}
            onClick={() => setActiveZoneId('parkour')}
          >
            <div className="hotspot-ring" />
            <div className="hotspot-core">PL</div>
          </div>

          {/* 4. Neon Cafe */}
          <div 
            className={`map-hotspot ${activeZoneId === 'cafe' ? 'active' : ''}`}
            style={{ top: '70%', left: '80%', color: '#00ff66' }}
            onClick={() => setActiveZoneId('cafe')}
          >
            <div className="hotspot-ring" />
            <div className="hotspot-core">NC</div>
          </div>

          {/* Connected SVG lines for aesthetics */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.15 }}>
            <line x1="20%" y1="25%" x2="45%" y2="65%" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="45%" y1="65%" x2="70%" y2="20%" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="70%" y1="20%" x2="80%" y2="70%" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
        </div>

        {/* Detailed Zone Info Card */}
        <div className="zone-info-card glass-panel" style={{ borderColor: activeZone.color + '33' }}>
          <div className="zone-header">
            <div className="zone-title-group">
              <span style={{ color: activeZone.color, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Zone {activeZone.code}
              </span>
              <h3>{activeZone.name}</h3>
            </div>
            <div className={`zone-capacity-badge ${activeZone.capacityStatus}`}>
              Live Cap: {activeZone.capacity}
            </div>
          </div>

          <div className="zone-price" style={{ color: activeZone.color, marginBottom: '15px' }}>
            {activeZone.price} <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '400' }}>/ hour</span>
          </div>

          <p className="zone-desc">{activeZone.description}</p>

          <div className="zone-details-grid">
            <div className="detail-item">
              <div className="detail-label">Key Highlight</div>
              <div className="detail-val">{activeZone.highlights[0]}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Coaching Support</div>
              <div className="detail-val">{activeZone.coaching}</div>
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: '600', marginBottom: '8px' }}>
              Features & Inclusions
            </div>
            <ul style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 15px' }}>
              {activeZone.highlights.map((highlight, index) => (
                <li key={index} style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: activeZone.color }}>✔</span> {highlight}
                </li>
              ))}
            </ul>
          </div>

          <button 
            className="btn-book-zone" 
            style={{ background: `linear-gradient(90deg, ${activeZone.color}, var(--neon-purple))` }}
            onClick={() => onBookZone('booking')}
          >
            Select & Configure Booking
          </button>
        </div>
      </div>
    </section>
  );
};

export default MapExplorer;
