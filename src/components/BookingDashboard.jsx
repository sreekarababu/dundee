import React, { useState } from 'react';

const PASSES = [
  {
    id: 'general',
    name: 'General Admission Jump Pass',
    desc: 'Full wall-to-wall trampoline arena access',
    price: 12.50
  },
  {
    id: 'aerial',
    name: 'Aerial Silk & Suspensions',
    desc: 'Access to hammock ropes and rings with coach',
    price: 16.00
  },
  {
    id: 'glow',
    name: 'Nebula Glow Night VIP Pass',
    desc: 'UV lighting jump, glow accessories, neon shake',
    price: 28.50
  }
];

const BookingDashboard = () => {
  const [selectedPassId, setSelectedPassId] = useState('general');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('2026-05-30');
  const [timeSlot, setTimeSlot] = useState('14:00 - 15:00');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);

  const selectedPass = PASSES.find((p) => p.id === selectedPassId);
  const subtotal = selectedPass.price * quantity;
  const tax = subtotal * 0.20; // UK 20% VAT
  const fee = 1.50; // Booking Fee
  const total = subtotal + tax + fee;

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;

    setIsSubmitting(true);
    
    // Simulate API reservation processing
    setTimeout(() => {
      setIsSubmitting(false);
      const confCode = `AGD-${Math.floor(100000 + Math.random() * 900000)}`;
      setSuccessModalData({
        confCode,
        name,
        email,
        date,
        timeSlot,
        quantity,
        passName: selectedPass.name,
        total: total.toFixed(2)
      });
    }, 1500);
  };

  const handleCloseModal = () => {
    setSuccessModalData(null);
    setName('');
    setEmail('');
    setQuantity(1);
  };

  return (
    <section id="booking" className="section-container" style={{ background: 'rgba(255,255,255,0.01)' }}>
      <div className="section-header">
        <span className="section-tag">Booking Center</span>
        <h2 className="section-title">Reserve Your Launch Slot</h2>
        <p className="section-desc">
          Select a pass tier, configure your date and session slot, and generate your instant entry pass.
        </p>
      </div>

      <div className="booking-grid">
        {/* Pass Selector and Form Details */}
        <div className="booking-panel glass-panel">
          <h3 className="card-title neon-text-cyan">
            <span>1.</span> Select Pass Tier
          </h3>
          <div className="pass-selector">
            {PASSES.map((pass) => (
              <div 
                key={pass.id} 
                className={`pass-card ${selectedPassId === pass.id ? 'selected' : ''}`}
                onClick={() => setSelectedPassId(pass.id)}
              >
                <div className="pass-left">
                  <div className="pass-radio" />
                  <div className="pass-info">
                    <h4>{pass.name}</h4>
                    <p>{pass.desc}</p>
                  </div>
                </div>
                <div className="pass-price">£{pass.price.toFixed(2)}</div>
              </div>
            ))}
          </div>

          <h3 className="card-title neon-text-cyan" style={{ marginTop: '40px' }}>
            <span>2.</span> Session Options
          </h3>
          
          <form onSubmit={handleCheckoutSubmit} className="contact-form">
            <div className="checkout-grid">
              <div className="form-group">
                <label htmlFor="booking-date">Date</label>
                <input 
                  id="booking-date"
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="booking-time">Session Time</label>
                <select 
                  id="booking-time"
                  value={timeSlot} 
                  onChange={(e) => setTimeSlot(e.target.value)}
                >
                  <option>10:00 - 11:00</option>
                  <option>12:00 - 13:00</option>
                  <option>14:00 - 15:00</option>
                  <option>16:00 - 17:00</option>
                  <option>18:00 - 19:00</option>
                  <option>20:00 - 21:00 (Nebula Glow Only)</option>
                </select>
              </div>
            </div>

            <div className="checkout-grid">
              <div className="form-group">
                <label htmlFor="booking-name">Full Name</label>
                <input 
                  id="booking-name"
                  type="text" 
                  placeholder="Enter name"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="booking-quantity">Pass Count</label>
                <input 
                  id="booking-quantity"
                  type="number" 
                  min="1" 
                  max="10" 
                  value={quantity} 
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="booking-email">Email Address</label>
              <input 
                id="booking-email"
                type="email" 
                placeholder="Enter email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
              />
            </div>
          </form>
        </div>

        {/* Dynamic Cart Summary Column */}
        <div className="summary-panel glass-panel" style={{ borderColor: 'rgba(255, 0, 123, 0.2)' }}>
          <div>
            <h3 className="card-title neon-text-magenta">Order Summary</h3>
            <div className="summary-list">
              <div className="summary-row">
                <span>Pass Tier Selected</span>
                <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{selectedPass.name}</span>
              </div>
              <div className="summary-row">
                <span>Rate per Pass</span>
                <span>£{selectedPass.price.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Quantity</span>
                <span>{quantity} x</span>
              </div>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>VAT (20% UK Tax)</span>
                <span>£{tax.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Online Booking Fee</span>
                <span>£{fee.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Grand Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(255, 255, 255, 0.02)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-glow)', marginBottom: '30px' }}>
              <span style={{ color: 'var(--neon-cyan)', fontSize: '18px' }}>★</span>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                <strong>No-Slip Socks Required:</strong> Custom AntiGravity traction socks are required for trampoline zones (£2.50, payable at main reception desk).
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-checkout"
            disabled={isSubmitting || !name || !email}
            onClick={handleCheckoutSubmit}
          >
            {isSubmitting ? 'Securing Launch Slot...' : `Checkout & Book (£${total.toFixed(2)})`}
          </button>
        </div>
      </div>

      {/* Booking Success Ticket Modal */}
      {successModalData && (
        <div className="success-overlay">
          <div className="success-modal glass-panel glow-cyan" style={{ border: '2px solid var(--neon-cyan)' }}>
            <div className="success-icon">✔</div>
            <h3>Launch Authorized!</h3>
            <p>Your session has been locked in. Show this digital pass barcode at the reception desk to redeem your anti-gravity wristbands.</p>
            
            <div className="success-ticket-box">
              <div className="ticket-field">
                <span>Order Ref</span>
                <span className="neon-text-cyan">{successModalData.confCode}</span>
              </div>
              <div className="ticket-field">
                <span>Authorized Holder</span>
                <span>{successModalData.name}</span>
              </div>
              <div className="ticket-field">
                <span>Pass Tier</span>
                <span>{successModalData.passName}</span>
              </div>
              <div className="ticket-field">
                <span>Date & Time</span>
                <span>{successModalData.date} @ {successModalData.timeSlot}</span>
              </div>
              <div className="ticket-field">
                <span>Passes Count</span>
                <span>{successModalData.quantity} Adult(s)</span>
              </div>
              <div className="ticket-field" style={{ borderTop: '1px dashed var(--border-glow)', paddingTop: '10px', marginTop: '10px' }}>
                <span>Paid Total</span>
                <span className="neon-text-magenta">£{successModalData.total}</span>
              </div>
            </div>

            <button className="btn-modal-close" onClick={handleCloseModal}>
              Return to Booking Desk
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default BookingDashboard;
