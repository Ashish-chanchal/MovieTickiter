import React, { useState, useEffect, useRef } from 'react';
import LoadingBar from 'react-top-loading-bar';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import './App.css';
import Navbar from './components/Navbar';
import Movies from './components/allmovies/Moviecon';
import Summery from './components/Summery/Summery';
import Bookingform from './components/bookingform/Bookingform';
import Footer from './components/Footer/Footer';

// Initial Mock Profiles list
const initialProfiles = [
  { id: '1', name: 'Movie Buff', avatar: '#E50914', kids: false, pin: null },
  { id: '2', name: 'Kids Zone', avatar: '#00A8E8', kids: true, pin: null },
  { id: '3', name: 'Guest User', avatar: '#2ECC71', kids: false, pin: '1234' }
];

function App() {
  const [progress, setProgress] = useState(100);
  const [activeProfile, setActiveProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [watchlist, setWatchlist] = useState([]);
  const [likes, setLikes] = useState({});
  const [downloads, setDownloads] = useState({});
  const [showPinModal, setShowPinModal] = useState(null); // profile obj needing PIN entry
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Diagnostics and settings states
  const [diagnosticsEnabled, setDiagnosticsEnabled] = useState(false);
  const [contrastEnabled, setContrastEnabled] = useState(false);
  const [colorblindFilter, setColorblindFilter] = useState("none");
  const [fps, setFps] = useState(60);

  // Track simulated FPS for developer settings
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    let animationId;
    const calculateFps = () => {
      const time = performance.now();
      frames++;
      if (time > lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (time - lastTime)));
        frames = 0;
        lastTime = time;
      }
      animationId = requestAnimationFrame(calculateFps);
    };
    if (diagnosticsEnabled) {
      animationId = requestAnimationFrame(calculateFps);
    }
    return () => cancelAnimationFrame(animationId);
  }, [diagnosticsEnabled]);

  // Load state from local storage on mount
  useEffect(() => {
    const storedProfile = localStorage.getItem('cineverse_active_profile');
    if (storedProfile) {
      setActiveProfile(JSON.parse(storedProfile));
    }

    const storedWatchlist = localStorage.getItem('cineverse_watchlist');
    if (storedWatchlist) {
      setWatchlist(JSON.parse(storedWatchlist));
    }

    const storedLikes = localStorage.getItem('cineverse_likes');
    if (storedLikes) {
      setLikes(JSON.parse(storedLikes));
    }

    const storedDownloads = localStorage.getItem('cineverse_downloads');
    if (storedDownloads) {
      setDownloads(JSON.parse(storedDownloads));
    }
  }, []);

  const handleSelectProfile = (profile) => {
    if (profile.pin) {
      setShowPinModal(profile);
      setPinInput("");
      setPinError(false);
    } else {
      setActiveProfile(profile);
      localStorage.setItem('cineverse_active_profile', JSON.stringify(profile));
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === showPinModal.pin) {
      setActiveProfile(showPinModal);
      localStorage.setItem('cineverse_active_profile', JSON.stringify(showPinModal));
      setShowPinModal(null);
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const handleLogoutProfile = () => {
    setActiveProfile(null);
    localStorage.removeItem('cineverse_active_profile');
  };

  // Watchlist handlers
  const toggleWatchlist = (show) => {
    let updated;
    if (watchlist.some(item => item.id === show.id)) {
      updated = watchlist.filter(item => item.id !== show.id);
    } else {
      updated = [...watchlist, show];
    }
    setWatchlist(updated);
    localStorage.setItem('cineverse_watchlist', JSON.stringify(updated));
  };

  // Like handlers
  const toggleLike = (showId) => {
    const updated = { ...likes, [showId]: !likes[showId] };
    setLikes(updated);
    localStorage.setItem('cineverse_likes', JSON.stringify(updated));
  };

  // Downloads handlers
  const startDownload = (showId, showObj) => {
    if (downloads[showId]) return; // already exists or in progress
    
    // Simulate progressive download (0 to 100)
    setDownloads(prev => ({ ...prev, [showId]: 1 }));
    let progressVal = 1;
    const interval = setInterval(() => {
      progressVal += Math.floor(Math.random() * 15) + 5;
      if (progressVal >= 100) {
        progressVal = 100;
        clearInterval(interval);
      }
      setDownloads(prev => {
        const next = { ...prev, [showId]: { progress: progressVal, show: showObj } };
        localStorage.setItem('cineverse_downloads', JSON.stringify(next));
        return next;
      });
    }, 400);
  };

  const deleteDownload = (showId) => {
    const updated = { ...downloads };
    delete updated[showId];
    setDownloads(updated);
    localStorage.setItem('cineverse_downloads', JSON.stringify(updated));
  };

  return (
    <div className={`app-container ${contrastEnabled ? 'high-contrast' : ''} filter-${colorblindFilter}`} style={{ minHeight: "100vh", position: "relative" }}>
      <AmbientBackdrop />
      <Router>
        {activeProfile ? (
          <>
            <Navbar 
              title="CineVerse" 
              activeProfile={activeProfile}
              onLogoutProfile={handleLogoutProfile}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              diagnosticsEnabled={diagnosticsEnabled}
              setDiagnosticsEnabled={setDiagnosticsEnabled}
              contrastEnabled={contrastEnabled}
              setContrastEnabled={setContrastEnabled}
              colorblindFilter={colorblindFilter}
              setColorblindFilter={setColorblindFilter}
            />
            <LoadingBar
              height={3}
              color='#E50914'
              progress={progress}
              onLoaderFinished={() => setProgress(100)}
            />
            <div className="main-content" style={{ minHeight: "calc(100vh - 68px)" }}>
              <Routes>
                <Route exact path='/' element={
                  <Movies 
                    searchQuery={searchQuery}
                    watchlist={watchlist}
                    toggleWatchlist={toggleWatchlist}
                    likes={likes}
                    toggleLike={toggleLike}
                    downloads={downloads}
                    startDownload={startDownload}
                    deleteDownload={deleteDownload}
                    activeProfile={activeProfile}
                  />
                } />
                <Route exact path='/summery/:id' element={
                  <Summery 
                    watchlist={watchlist}
                    toggleWatchlist={toggleWatchlist}
                    likes={likes}
                    toggleLike={toggleLike}
                    downloads={downloads}
                    startDownload={startDownload}
                    deleteDownload={deleteDownload}
                  />
                } />
                <Route exact path='/book-ticket/Bookingform' element={<Bookingform />} />
              </Routes>
            </div>
            <Footer/>
          </>
        ) : (
          /* Who's Watching profile selection overlay */
          <div className="profile-selector-page fade-in">
            <h1 className="profile-page-title">Who's watching?</h1>
            <div className="profiles-grid">
              {initialProfiles.map((p) => (
                <div 
                  key={p.id} 
                  className="profile-card-item"
                  onClick={() => handleSelectProfile(p)}
                >
                  <div className="profile-avatar-circle" style={{ backgroundColor: p.avatar }}>
                    {p.name.charAt(0)}
                    {p.pin && <span className="profile-lock-icon">🔒</span>}
                  </div>
                  <div className="profile-avatar-name">{p.name}</div>
                  {p.kids && <span className="kids-pill">Kids</span>}
                </div>
              ))}
            </div>
            <button className="manage-profile-btn">Manage Profiles</button>

            {/* PIN modal display */}
            {showPinModal && (
              <div className="pin-modal-overlay">
                <form onSubmit={handlePinSubmit} className="pin-modal-box">
                  <h3>Enter profile PIN</h3>
                  <p>Profile "{showPinModal.name}" is locked.</p>
                  <input 
                    type="password" 
                    maxLength="4" 
                    required
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    autoFocus
                  />
                  {pinError && <div className="pin-error-msg">Incorrect PIN. Try again.</div>}
                  <div className="pin-modal-buttons">
                    <button type="button" onClick={() => setShowPinModal(null)} className="pin-btn-cancel">Cancel</button>
                    <button type="submit" className="pin-btn-submit">Unlock</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Diagnostics FPS Screen Overlay */}
        {diagnosticsEnabled && (
          <div className="diagnostics-overlay">
            <div><strong>CineVerse Diagnostics HUD</strong></div>
            <div>FPS: <span style={{ color: fps > 50 ? '#46d369' : '#ffb61e' }}>{fps} fps</span></div>
            <div>Active Profile: {activeProfile?.name}</div>
            <div>Watchlist Count: {watchlist.length}</div>
            <div>Likes Count: {Object.values(likes).filter(Boolean).length}</div>
            <div>Memory State: STABLE</div>
          </div>
        )}
      </Router>
    </div>
  );
}

function AmbientBackdrop() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles = [];
    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 2 + 1,
        color: ['rgba(255, 0, 85, 0.12)', 'rgba(0, 229, 255, 0.12)', 'rgba(189, 0, 255, 0.12)'][Math.floor(Math.random() * 3)],
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
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
        zIndex: 0,
        opacity: 0.85
      }}
    />
  );
}

export default App;
