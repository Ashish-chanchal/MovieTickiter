import React from 'react';
import { useNavigate } from "react-router-dom";
import './Movies.css';
import placeholderImg from '../img/none.jpg';

export default function Movies(props) {
  const { 
    movie, 
    name, 
    language, 
    image, 
    id, 
    date,
    watchlist = [],
    toggleWatchlist,
    likes = {},
    toggleLike,
    downloads = {},
    startDownload
  } = props;
  
  const navigate = useNavigate();

  const isLiked = !!likes[id];
  const isWatchlisted = watchlist.some(item => item.show.id === id);
  const downloadState = downloads[id];

  function handleCardClick() {
    navigate(`/summery/${id}`, { state: { movie } });
  }

  // Extract year
  const year = date ? date.split('-')[0] : '2024';

  return (
    <div className="netflix-card">
      <img 
        className="card-image" 
        alt={name} 
        src={image === "Not image found" || !image ? placeholderImg : image} 
        onClick={handleCardClick}
      />
      
      {/* Age rating tag */}
      <span className="card-age-rating">16+</span>

      <div className="card-hover-info">
        <div className="hover-actions" onClick={(e) => e.stopPropagation()}>
          {/* Play/Info Button */}
          <button className="hover-play-btn" onClick={handleCardClick} title="View Details">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>

          {/* Watchlist (+) Toggle */}
          <button 
            className={`hover-play-btn list-btn ${isWatchlisted ? 'in-list' : ''}`} 
            onClick={() => toggleWatchlist(movie)}
            title={isWatchlisted ? "Remove from My List" : "Add to My List"}
          >
            {isWatchlisted ? "✓" : "+"}
          </button>

          {/* Thumbs-Up Like Toggle */}
          <button 
            className={`hover-play-btn like-btn ${isLiked ? 'liked' : ''}`} 
            onClick={() => toggleLike(id)}
            title={isLiked ? "Unlike" : "Like"}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
            </svg>
          </button>

          {/* Download Simulator Button */}
          <button 
            className="hover-play-btn download-btn" 
            onClick={() => startDownload(id, movie)}
            title={downloadState ? "Downloading..." : "Download Offline"}
            disabled={!!downloadState}
          >
            {downloadState ? (
              <span className="download-spin-loader"></span>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
              </svg>
            )}
          </button>
        </div>

        <h3 className="card-title" onClick={handleCardClick}>{name}</h3>
        
        <div className="card-metadata" onClick={handleCardClick}>
          <span className="card-language">{language}</span>
          <span className="card-year">{year}</span>
        </div>
      </div>
    </div>
  );
}