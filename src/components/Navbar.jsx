import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import "./Navbar.css";

export default function Navbar(props) {
  const { 
    title, 
    activeProfile, 
    onLogoutProfile, 
    searchQuery, 
    setSearchQuery,
    diagnosticsEnabled,
    setDiagnosticsEnabled,
    contrastEnabled,
    setContrastEnabled,
    colorblindFilter,
    setColorblindFilter
  } = props;

  const [isScrolled, setIsScrolled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [accentColor, setAccentColor] = useState(localStorage.getItem('cineverse_theme_accent') || 'red');
  const [bgMode, setBgMode] = useState(localStorage.getItem('cineverse_bg_mode') || 'vignette');
  const [cardStyle, setCardStyle] = useState(localStorage.getItem('cineverse_card_style') || 'bezel-less');

  // Handle CSS variable theme overlays dynamically
  useEffect(() => {
    const doc = document.documentElement;
    const colors = {
      red: { primary: '#ff0055', hover: '#ff2a74', glow: 'rgba(255, 0, 85, 0.45)' },
      cyan: { primary: '#00e5ff', hover: '#33eaff', glow: 'rgba(0, 229, 255, 0.45)' },
      green: { primary: '#00ff66', hover: '#33ff84', glow: 'rgba(0, 255, 102, 0.45)' },
      purple: { primary: '#bd00ff', hover: '#cc33ff', glow: 'rgba(189, 0, 255, 0.4)' },
      gold: { primary: '#ffb61e', hover: '#ffc64d', glow: 'rgba(255, 182, 30, 0.4)' }
    };

    const active = colors[accentColor] || colors.red;
    doc.style.setProperty('--brand-red', active.primary);
    doc.style.setProperty('--brand-red-hover', active.hover);
    doc.style.setProperty('--brand-red-glow', active.glow);

    localStorage.setItem('cineverse_theme_accent', accentColor);
  }, [accentColor]);

  // Handle body classes sync for backdrop variations and card layouts
  useEffect(() => {
    const body = document.body;
    body.classList.remove('bg-vignette', 'bg-matte', 'bg-grid');
    body.classList.add(`bg-${bgMode}`);

    body.classList.remove('card-style-bezel', 'card-style-classic');
    body.classList.add(`card-style-${cardStyle === 'bezel-less' ? 'bezel' : 'classic'}`);

    localStorage.setItem('cineverse_bg_mode', bgMode);
    localStorage.setItem('cineverse_card_style', cardStyle);
  }, [bgMode, cardStyle]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <nav className={`netflix-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setSearchQuery("")}>
          {title}
        </Link>
        
        <ul className="navbar-menu">
          <li><Link to="/" className="active" onClick={() => setSearchQuery("")}>Home</Link></li>
          <li><Link to="/" onClick={() => setSearchQuery("Originals")}>Originals</Link></li>
          <li><Link to="/" onClick={() => setSearchQuery("Action")}>Action</Link></li>
          <li><Link to="/" onClick={() => setSearchQuery("Comedy")}>Comedies</Link></li>
          <li><Link to="/" onClick={() => setSearchQuery("Drama")}>Dramas</Link></li>
        </ul>

        <div className="navbar-right">
          {/* Live Search Input */}
          <div className="search-bar-container">
            <svg className="navbar-icon search-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input 
              type="text" 
              className="navbar-search-input" 
              placeholder="Titles, people, genres..." 
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>

          {/* Settings / Gear icon */}
          <div className="settings-dropdown-wrapper">
            <button className="gear-btn" onClick={() => setShowSettings(!showSettings)} aria-label="Settings">
              <svg className="navbar-icon gear-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            {showSettings && (
              <div className="settings-panel">
                <h4>Accessibility & Features</h4>
                
                {/* Diagnostics Toggle */}
                <div className="settings-item">
                  <span>Show Diagnostics HUD</span>
                  <label className="switch-toggle">
                    <input 
                      type="checkbox" 
                      checked={diagnosticsEnabled} 
                      onChange={(e) => setDiagnosticsEnabled(e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                {/* High Contrast Toggle */}
                <div className="settings-item">
                  <span>High Contrast Mode</span>
                  <label className="switch-toggle">
                    <input 
                      type="checkbox" 
                      checked={contrastEnabled} 
                      onChange={(e) => setContrastEnabled(e.target.checked)}
                    />
                    <span className="switch-slider"></span>
                  </label>
                </div>

                {/* Colorblind Selector */}
                <div className="settings-item select-item">
                  <span>Color Filter</span>
                  <select 
                    value={colorblindFilter} 
                    onChange={(e) => setColorblindFilter(e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="deuteranopia">Deuteranopia</option>
                    <option value="protanopia">Protanopia</option>
                    <option value="tritanopia">Tritanopia</option>
                  </select>
                </div>

                {/* Accent Color Presets Selector */}
                <div className="settings-item theme-item">
                  <span>Theme Accent</span>
                  <div className="theme-bubbles-row">
                    {['red', 'cyan', 'green', 'purple', 'gold'].map((c) => (
                      <button 
                        key={c}
                        className={`theme-bubble bubble-${c} ${accentColor === c ? 'active-theme' : ''}`}
                        onClick={() => setAccentColor(c)}
                        title={`${c} accent`}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Selector */}
                <div className="settings-item select-item">
                  <span>Backdrop Style</span>
                  <select 
                    value={bgMode} 
                    onChange={(e) => setBgMode(e.target.value)}
                  >
                    <option value="vignette">Neon Vignette</option>
                    <option value="matte">Matte Obsidian</option>
                    <option value="grid">Cyber Laser Grid</option>
                  </select>
                </div>

                {/* Card Layout Style Selector */}
                <div className="settings-item select-item">
                  <span>Card Format</span>
                  <select 
                    value={cardStyle} 
                    onChange={(e) => setCardStyle(e.target.value)}
                  >
                    <option value="bezel-less">Glass Bezel-less</option>
                    <option value="classic">Classic Framed</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Active Profile switcher bubble */}
          {activeProfile && (
            <div className="profile-badge-nav" onClick={onLogoutProfile} title="Switch Profile">
              <div 
                className="profile-circle-badge" 
                style={{ backgroundColor: activeProfile.avatar }}
              >
                {activeProfile.name.charAt(0)}
              </div>
              <span className="profile-switch-tooltip">Switch Profile</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

Navbar.propTypes = {
  title: PropTypes.string.isRequired,
  activeProfile: PropTypes.object,
  onLogoutProfile: PropTypes.func,
  searchQuery: PropTypes.string,
  setSearchQuery: PropTypes.func,
  diagnosticsEnabled: PropTypes.bool,
  setDiagnosticsEnabled: PropTypes.func,
  contrastEnabled: PropTypes.bool,
  setContrastEnabled: PropTypes.func,
  colorblindFilter: PropTypes.string,
  setColorblindFilter: PropTypes.func,
};

Navbar.defaultProps = {
  title: "CineVerse",
};
