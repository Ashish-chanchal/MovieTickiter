import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from "react-router-dom";
import "./Bookingform.css";

const preOccupiedSeats = ["A-3", "B-4", "C-2", "C-5", "E-7", "F-1"];

export default function Bookingform() {
  const { state } = useLocation();
  const movieName = state?.movieName || "Selected Show";

  const [userDetail, setUserDetail] = useState({
    name: "",
    email: ""
  });

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedCombos, setSelectedCombos] = useState({
    popcorn: false,
    drink: false
  });
  const [bookings, setBookings] = useState([]);
  const [success, setSuccess] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);

  // Projection Light State (persists to localStorage)
  const [projectionColor, setProjectionColor] = useState(() => {
    return localStorage.getItem('cineverse_projection_color') || 'cyan';
  });

  const handleProjectionColorChange = (color) => {
    setProjectionColor(color);
    localStorage.setItem('cineverse_projection_color', color);
  };

  // CoinGecko Crypto Pricing State
  const [cryptoRates, setCryptoRates] = useState({ btc: 65000, eth: 35000 });

  useEffect(() => {
    loadBookings();
    fetchCryptoRates();
  }, []);

  const loadBookings = () => {
    const data = localStorage.getItem('movieBookingDetail');
    if (data) {
      setBookings(JSON.parse(data));
    }
  };

  const fetchCryptoRates = async () => {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
      const data = await res.json();
      if (data.bitcoin?.usd && data.ethereum?.usd) {
        setCryptoRates({
          btc: data.bitcoin.usd,
          eth: data.ethereum.usd
        });
      }
    } catch (err) {
      console.warn("CoinGecko API rate limited or blocked, using static default rates.", err);
    }
  };

  const playSeatSound = (seatCode, isOccupied) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (isOccupied) {
        // Haptic occupied buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } else if (seatCode.startsWith("A")) {
        // VIP seat chord arpeggio
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12);
        gainNode.gain.setValueAtTime(0.035, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.55);
      } else {
        // Standard seat ping
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn("Audio Context blocked or not supported", e);
    }
  };

  const playSuccessChimes = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.15);

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + idx * 0.15);
        gainNode.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + idx * 0.15 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.15 + 0.45);

        osc.start(audioCtx.currentTime + idx * 0.15);
        osc.stop(audioCtx.currentTime + idx * 0.15 + 0.50);
      });
    } catch (e) {
      console.warn("Success chimes audio failed", e);
    }
  };

  const handleSeatClick = (seatCode) => {
    const isOccupied = preOccupiedSeats.includes(seatCode);
    playSeatSound(seatCode, isOccupied);
    if (isOccupied) return;

    if (selectedSeats.includes(seatCode)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatCode));
    } else {
      setSelectedSeats(prev => [...prev, seatCode]);
    }
  };

  const handleComboChange = (e) => {
    setSelectedCombos({
      ...selectedCombos,
      [e.target.name]: e.target.checked
    });
  };

  const calculatePrices = () => {
    let seatPrice = 0;
    selectedSeats.forEach(seat => {
      if (seat.startsWith("A")) {
        seatPrice += 15; // VIP
      } else {
        seatPrice += 10; // Standard
      }
    });

    let comboPrice = 0;
    if (selectedCombos.popcorn) comboPrice += 6;
    if (selectedCombos.drink) comboPrice += 4;

    const subtotal = seatPrice + comboPrice;
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    // Convert total USD price into BTC and ETH fractions
    const btcAmount = total / cryptoRates.btc;
    const ethAmount = total / cryptoRates.eth;

    return { seatPrice, comboPrice, subtotal, tax, total, btcAmount, ethAmount };
  };

  function handleChange(e) {
    setUserDetail({
      ...userDetail, 
      [e.target.name]: e.target.value
    });
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat first.");
      return;
    }

    const priceSummary = calculatePrices();
    const newBooking = {
      MovieName: movieName,
      userDetail,
      bookingId: 'TX-' + Math.floor(100000 + Math.random() * 900000),
      seats: selectedSeats.join(', '),
      price: priceSummary.total.toFixed(2),
      date: new Date().toLocaleDateString()
    };

    const currentBookings = localStorage.getItem('movieBookingDetail');
    let updatedBookings = [];

    if (!currentBookings) {
      updatedBookings = [newBooking];
    } else {
      updatedBookings = [...JSON.parse(currentBookings), newBooking];
    }

    localStorage.setItem('movieBookingDetail', JSON.stringify(updatedBookings));
    setBookings(updatedBookings);
    setCurrentReceipt(newBooking);
    setSuccess(true);
    playSuccessChimes();

    setUserDetail({ name: "", email: "" });
    setSelectedSeats([]);
    setSelectedCombos({ popcorn: false, drink: false });

    setTimeout(() => {
      setSuccess(false);
    }, 6000);
  }

  const cancelBooking = (id) => {
    const updated = bookings.filter(b => b.bookingId !== id);
    setBookings(updated);
    localStorage.setItem('movieBookingDetail', JSON.stringify(updated));
    if (currentReceipt?.bookingId === id) {
      setCurrentReceipt(null);
    }
  };

  const rows = ["A", "B", "C", "D", "E", "F"];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8];

  const priceDetails = calculatePrices();

  return (
    <div className="booking-page">
      {success && <ConfettiCanvas />}
      <div className="booking-overlay" />
      
      <div className="booking-container">
        <div className="booking-nav">
          <Link to="/" className="back-link-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Browse
          </Link>
        </div>

        <div className="booking-grid">
          
          {/* Seating and Checkout Panel */}
          <div className="booking-card">
            <h2>Book Your Tickets</h2>
            <p className="selected-movie-label">Showtime: <strong>{movieName}</strong></p>

            {/* Visual Screen Map */}
            <div className="theater-screen-wrapper">
              <div className="projection-lights-picker">
                <span>Screen Glow: </span>
                {['cyan', 'purple', 'green', 'red'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-dot-btn ${color} ${projectionColor === color ? 'active' : ''}`}
                    onClick={() => handleProjectionColorChange(color)}
                    title={`Ambient ${color}`}
                  />
                ))}
              </div>
              <div className={`screen-curve glow-${projectionColor}`}></div>
              <span className="screen-label">SCREEN</span>
            </div>

            {/* Interactive Seat Map Grid */}
            <div className="seats-map-grid">
              {rows.map(row => (
                <div key={row} className="seat-row-line">
                  <span className="row-letter">{row}</span>
                  {cols.map(col => {
                    const seatCode = `${row}-${col}`;
                    const isOccupied = preOccupiedSeats.includes(seatCode);
                    const isSelected = selectedSeats.includes(seatCode);
                    
                    return (
                      <button 
                        key={col} 
                        type="button"
                        onClick={() => handleSeatClick(seatCode)}
                        className={`seat-unit ${isOccupied ? 'occupied' : ''} ${isSelected ? 'selected' : ''}`}
                        title={`${seatCode} (${row === 'A' ? 'VIP - $15' : 'Standard - $10'})`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Seat Map Legend */}
            <div className="seats-legend">
              <div><span className="legend-color std"></span> Available</div>
              <div><span className="legend-color sel"></span> Selected</div>
              <div><span className="legend-color occ"></span> Booked</div>
            </div>

            {/* Combo Snack Picker */}
            <div className="snack-combo-section">
              <h4>Snack Combos Add-on</h4>
              <div className="combo-picker-row">
                <label className="combo-checkbox-item">
                  <input 
                    type="checkbox" 
                    name="popcorn"
                    checked={selectedCombos.popcorn}
                    onChange={handleComboChange}
                  />
                  <span>🍿 Popcorn Combo (Large) + $6</span>
                </label>

                <label className="combo-checkbox-item">
                  <input 
                    type="checkbox" 
                    name="drink"
                    checked={selectedCombos.drink}
                    onChange={handleComboChange}
                  />
                  <span>🥤 Coca-Cola (Large) + $4</span>
                </label>
              </div>
            </div>

            {/* User Form Details */}
            <form onSubmit={handleFormSubmit} className="booking-form">
              <div className="form-item">
                <label htmlFor="name">Full Name</label>
                <input 
                  type="text" 
                  required 
                  name="name" 
                  id="name" 
                  value={userDetail.name} 
                  onChange={handleChange} 
                  placeholder="Enter your name" 
                />
              </div>

              <div className="form-item">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  required 
                  name="email" 
                  id="email" 
                  value={userDetail.email} 
                  onChange={handleChange} 
                  placeholder="name@example.com" 
                />
              </div>

              {/* Dynamic Price Breakdown Receipt */}
              <div className="billing-breakdown">
                <div className="bill-line">
                  <span>Selected Seats ({selectedSeats.length}):</span>
                  <span>${priceDetails.seatPrice.toFixed(2)}</span>
                </div>
                <div className="bill-line">
                  <span>Snacks Combo Add-on:</span>
                  <span>${priceDetails.comboPrice.toFixed(2)}</span>
                </div>
                <div className="bill-line">
                  <span>GST Tax (18%):</span>
                  <span>${priceDetails.tax.toFixed(2)}</span>
                </div>
                
                {/* Live CoinGecko Crypto Conversion Rates */}
                <div className="bill-line crypto-conversion-box">
                  <span>Crypto Equivalent:</span>
                  <div className="crypto-details-list">
                    <div>⚡ {priceDetails.btcAmount.toFixed(6)} BTC</div>
                    <div>💎 {priceDetails.ethAmount.toFixed(5)} ETH</div>
                  </div>
                </div>

                <hr className="bill-divider" />
                <div className="bill-line grand-total">
                  <span>Total Amount:</span>
                  <span>${priceDetails.total.toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" className="booking-submit-btn">
                Confirm & Pay
              </button>
            </form>
          </div>

          {/* Bookings Tickets List / Dynamic Printable Receipt */}
          <div className="tickets-card">
            <h2>Your Bookings</h2>

            {success && currentReceipt && (
              <div className="ticket-printable-receipt fade-in">
                <div className="receipt-border-top"></div>
                <div className="receipt-body">
                  <div className="receipt-header">
                    <h4>CineVerse Cinema Pass</h4>
                    <span className="receipt-id-tag">{currentReceipt.bookingId}</span>
                  </div>
                  <h3>{currentReceipt.MovieName}</h3>
                  <div className="receipt-meta-grid">
                    <div><strong>Date:</strong> {currentReceipt.date}</div>
                    <div><strong>Seats:</strong> {currentReceipt.seats}</div>
                    <div><strong>Guest:</strong> {currentReceipt.userDetail.name}</div>
                    <div><strong>Total Paid:</strong> ${currentReceipt.price}</div>
                  </div>
                  {/* Visual QR Code barcode mock */}
                  <DynamicQR data={currentReceipt.bookingId + '-' + currentReceipt.seats} />
                </div>
              </div>
            )}

            {bookings.length === 0 ? (
              <div className="no-tickets">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="16" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="4"/>
                  <line x1="8" y1="2" x2="8" y2="4"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p>No active tickets booked yet.</p>
              </div>
            ) : (
              <div className="tickets-list">
                {bookings.map((item) => (
                  <div key={item.bookingId} className="ticket-item">
                    <div className="ticket-header">
                      <span className="ticket-id">{item.bookingId}</span>
                      <span className="ticket-badge">Paid</span>
                    </div>
                    <h3 className="ticket-title">{item.MovieName}</h3>
                    <div className="ticket-details">
                      <div>
                        <strong>Seats:</strong> {item.seats}
                      </div>
                      <div>
                        <strong>Total:</strong> ${item.price}
                      </div>
                    </div>
                    <button onClick={() => cancelBooking(item.bookingId)} className="cancel-ticket-btn">
                      Cancel & Refund
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function DynamicQR({ data }) {
  const generateQRMatrix = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    const matrix = [];
    for (let r = 0; r < 8; r++) {
      const row = [];
      for (let c = 0; c < 8; c++) {
        const isFinderPattern = 
          (r < 3 && c < 3) || 
          (r < 3 && c > 4) || 
          (r > 4 && c < 3);

        if (isFinderPattern) {
          const isBorder = (r === 0 || r === 2 || c === 0 || c === 2 || r === 7 || c === 7 || (r === 5 && c === 0) || (r === 7 && c === 2));
          row.push(isBorder);
        } else {
          const bitIndex = r * 8 + c;
          const isFilled = ((hash >> (bitIndex % 32)) & 1) === 1;
          row.push(isFilled);
        }
      }
      matrix.push(row);
    }
    return matrix;
  };

  const matrix = generateQRMatrix(data || "CineVersePass");

  return (
    <div className="qr-barcode-mock">
      <div 
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 11px)",
          gridTemplateRows: "repeat(8, 11px)",
          gap: "2px",
          border: "4px solid #08080c",
          padding: "6px",
          backgroundColor: "#fff",
          boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
          borderRadius: "4px"
        }}
      >
        {matrix.map((row, rIdx) => 
          row.map((val, cIdx) => (
            <div 
              key={`${rIdx}-${cIdx}`}
              style={{
                backgroundColor: val ? "#08080c" : "#ffffff",
                borderRadius: "1px"
              }}
            />
          ))
        )}
      </div>
      <span>Scan at cinema gate</span>
    </div>
  );
}

function ConfettiCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * -canvas.height - 20;
        this.size = Math.random() * 8 + 6;
        this.color = [
          '#ff0055',
          '#00e5ff',
          '#00ff66',
          '#bd00ff',
          '#ffb61e'
        ][Math.floor(Math.random() * 5)];
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 4 + 3;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 4 - 2;
        this.shape = ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        if (this.y > canvas.height) {
          this.y = -20;
          this.x = Math.random() * canvas.width;
          this.speedY = Math.random() * 4 + 3;
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.beginPath();

        if (this.shape === 'circle') {
          ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.shape === 'square') {
          ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else if (this.shape === 'triangle') {
          ctx.moveTo(0, -this.size / 2);
          ctx.lineTo(this.size / 2, this.size / 2);
          ctx.lineTo(-this.size / 2, this.size / 2);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }
    }

    const particleCount = 120;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    />
  );
}