import React from 'react';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">

        {/* Brand */}
        <div className="footer-brand">
          <span className="footer-logo">
            <span className="footer-logo-c">C</span>ineVerse
          </span>
          <p className="footer-tagline">Your universe of cinema, redefined.</p>
        </div>

        {/* Links */}
        <div className="footer-links-grid">
          <div className="footer-col">
            <h4>Browse</h4>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/">Trending</a></li>
              <li><a href="/">My List</a></li>
              <li><a href="/">Downloads</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Genres</h4>
            <ul>
              <li><a href="/">Action</a></li>
              <li><a href="/">Drama</a></li>
              <li><a href="/">Sci-Fi</a></li>
              <li><a href="/">Comedy</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="/">About</a></li>
              <li><a href="/">Privacy</a></li>
              <li><a href="/">Terms</a></li>
              <li><a href="/">Contact</a></li>
            </ul>
          </div>
        </div>

      </div>

      {/* Divider */}
      <div className="footer-divider" />

      {/* Bottom bar */}
      <div className="footer-bottom">
        <span className="footer-copy">
          © {year} CineVerse. All rights reserved.
        </span>
        <span className="footer-credit">
          Crafted with <span className="footer-heart">♥</span> by{' '}
          <strong className="footer-author">Ashish Chanchal</strong>
        </span>
      </div>
    </footer>
  );
}
