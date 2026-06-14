import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import './Summery.css';

export default function Summary(props) {
  const { 
    watchlist = [], 
    toggleWatchlist, 
    likes = {}, 
    toggleLike, 
    downloads = {}, 
    startDownload 
  } = props;

  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [movieDetails, setMovieDetails] = useState(state?.movie?.show || null);
  const [cast, setCast] = useState([]);
  const [loadingCast, setLoadingCast] = useState(true);

  // Watch Party states
  const [watchPartyActive, setWatchPartyActive] = useState(false);
  const [partyChat, setPartyChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const emojiIdCounter = useRef(0);

  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [visualizerMode, setVisualizerMode] = useState('bars');
  const [activeSpotlight, setActiveSpotlight] = useState(null);
  const [chordStepIdx, setChordStepIdx] = useState(0);
  const audioCtxRef = useRef(null);
  const activeOscillators = useRef([]);
  const synthIntervalRef = useRef(null);
  const analyserRef = useRef(null);
  const visualizerCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Reviews Feed states
  const [reviews, setReviews] = useState([]);
  const [reviewInput, setReviewInput] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [ratingStars, setRatingStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);

  // Audio synthesis Refs

  // Fetch details & cast info dynamically from TVMaze API
  useEffect(() => {
    const fetchCastAndDetails = async () => {
      try {
        setLoadingCast(true);
        const res = await fetch(`https://api.tvmaze.com/shows/${id}?embed=cast`);
        const data = await res.json();
        setMovieDetails(data);
        if (data._embedded && data._embedded.cast) {
          setCast(data._embedded.cast.slice(0, 8)); // top 8 actors
        }
      } catch (error) {
        console.error("Error fetching show crew info:", error);
      } finally {
        setLoadingCast(false);
      }
    };
    fetchCastAndDetails();
  }, [id]);

  // Load reviews on load
  useEffect(() => {
    if (movieDetails) {
      const storedReviews = localStorage.getItem(`cineverse_reviews_${movieDetails.id}`);
      if (storedReviews) {
        setReviews(JSON.parse(storedReviews));
      } else {
        const initial = [
          { name: "Cinephile99", text: "Absolute masterpiece! Pacings and castings are perfect.", date: "2026-06-05" },
          { name: "SeriesSeeker", text: "Truly enjoyable stream. Highly recommended!", date: "2026-06-11" }
        ];
        setReviews(initial);
        localStorage.setItem(`cineverse_reviews_${movieDetails.id}`, JSON.stringify(initial));
      }
    }
  }, [id, movieDetails]);

  // Simulate mock comments in Watch Party when active
  useEffect(() => {
    let interval;
    if (watchPartyActive) {
      const mockMessages = [
        "User101: This sequence is visually outstanding! 🤯",
        "Vikram_Kumar: Perfect scene pacing here.",
        "Host: High definition feed streaming cleanly.",
        "Guest45: Let's book tickets for this right now!",
        "MovieVerse: The cast performance is stellar."
      ];
      
      interval = setInterval(() => {
        const randomMsg = mockMessages[Math.floor(Math.random() * mockMessages.length)];
        setPartyChat(prev => [...prev, randomMsg]);
        
        // Randomly trigger a floating emoji corresponding to messages
        triggerFloatingEmoji(["❤️", "😂", "👏", "😮"][Math.floor(Math.random() * 4)]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [watchPartyActive]);

  // Procedural synthesizer functions (Instrumentals - no voice)
  const stopSynthesizer = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    activeOscillators.current.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    activeOscillators.current = [];
  };

  const startSynthesizer = (trackIdx) => {
    stopSynthesizer();
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Chord arrays (Notes frequencies)
      const chordProgressions = [
        // CineVerse Main Overture (Deep space minor chords: Am, F, C, G)
        [
          [110.00, 220.00, 261.63, 329.63], // Am
          [87.31, 174.61, 220.00, 261.63],  // F
          [130.81, 261.63, 329.63, 392.00], // C
          [98.00, 196.00, 246.94, 293.66]   // G
        ],
        // Midnight Ambient Neon (Atmospheric drone: Dm, Bb, F, C)
        [
          [73.42, 146.83, 220.00, 293.66],  // Dm
          [58.27, 116.54, 174.61, 233.08],  // Bb
          [87.31, 174.61, 261.63, 349.23],  // F
          [65.41, 130.81, 196.00, 261.63]   // C
        ],
        // Retro Cyber Synth-wave (Sci-fi synthesizer: Em, C, G, D)
        [
          [82.41, 164.81, 246.94, 329.63],  // Em
          [65.41, 130.81, 196.00, 261.63],  // C
          [98.00, 196.00, 293.66, 392.00],  // G
          [73.42, 146.83, 220.00, 293.66]   // D
        ]
      ];

      const progression = chordProgressions[trackIdx] || chordProgressions[0];
      let step = 0;

      const playChordStep = () => {
        const frequencies = progression[step];
        setChordStepIdx(step);
        step = (step + 1) % progression.length;

        // Fade out previous oscillators
        activeOscillators.current.forEach(osc => {
          try {
            osc.gainNode.gain.setValueAtTime(osc.gainNode.gain.value, ctx.currentTime);
            osc.gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
            setTimeout(() => {
              try { osc.stop(); } catch(e) {}
            }, 1500);
          } catch(e) {}
        });
        activeOscillators.current = [];

        // Lowpass filter with slow resonant sweep
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(320, ctx.currentTime);
        filter.Q.setValueAtTime(4, ctx.currentTime);

        const filterLfo = ctx.createOscillator();
        const filterLfoGain = ctx.createGain();
        filterLfo.frequency.value = 0.25; // Slow modulation (4s loop)
        filterLfoGain.gain.value = 160;   // Sweeps filter frequency between 160Hz and 480Hz
        
        filterLfo.connect(filterLfoGain);
        filterLfoGain.connect(filter.frequency);
        filterLfo.start();

        if (!analyserRef.current) {
          analyserRef.current = ctx.createAnalyser();
          analyserRef.current.fftSize = 256;
        }
        filter.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);

        // Synthesize notes polyphonically
        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();

          // Synthwave uses sawtooth, ambient paths use triangle waves
          osc.type = trackIdx === 2 ? "sawtooth" : "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          // Add slight pitch detune for wider chorusing stereo width
          if (idx > 1) {
            osc.detune.setValueAtTime(idx * 4 - 6, ctx.currentTime);
          }

          // Slow ambient attack envelope
          oscGain.gain.setValueAtTime(0, ctx.currentTime);
          oscGain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.8);

          osc.connect(oscGain);
          oscGain.connect(filter);
          osc.start();

          // Keep tracks of osc properties
          osc.gainNode = oscGain;
          activeOscillators.current.push(osc);
        });
      };

      playChordStep();
      synthIntervalRef.current = setInterval(playChordStep, 4000);
    } catch (e) {
      console.warn("Web Audio API failed or blocked", e);
    }
  };

  // Sync Soundtrack progress bar and Audio context state
  useEffect(() => {
    let interval;
    if (audioPlaying) {
      startSynthesizer(0);
      interval = setInterval(() => {
        setAudioProgress(prev => {
          if (prev >= 100) return 0;
          return prev + 1;
        });
      }, 1000);
    } else {
      stopSynthesizer();
      setAudioProgress(0);
    }
    return () => {
      clearInterval(interval);
      stopSynthesizer();
    };
  }, [audioPlaying]);

  // Handle global unmount audio cleanup
  useEffect(() => {
    return () => {
      stopSynthesizer();
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch(e) {}
        audioCtxRef.current = null;
      }
    };
  }, []);

  // Real-time canvas wave drawing sweep
  useEffect(() => {
    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let drawFrameId;
    let discRotation = 0;

    const draw = () => {
      drawFrameId = requestAnimationFrame(draw);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const analyser = analyserRef.current;
      if (!analyser || !audioPlaying) {
        document.documentElement.style.setProperty('--sound-volume-factor', '0');
        if (visualizerMode === 'disc') {
          // Draw static vinyl disc outline
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, 40, 0, 2 * Math.PI);
          ctx.strokeStyle = "rgba(29, 185, 84, 0.2)";
          ctx.lineWidth = 3;
          ctx.stroke();

          // Spindle
          ctx.beginPath();
          ctx.arc(width / 2, height / 2, 6, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(29, 185, 84, 0.4)";
          ctx.fill();
        } else {
          // Horizontal glowing wire when idle
          ctx.beginPath();
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
          ctx.strokeStyle = "rgba(29, 185, 84, 0.2)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Compute volume factor from frequency data for global Ambilight pulsing
      const freqData = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(freqData);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += freqData[i];
      }
      const average = sum / bufferLength;
      const volumeFactor = average / 255;
      document.documentElement.style.setProperty('--sound-volume-factor', volumeFactor.toFixed(3));

      if (visualizerMode === 'bars') {
        analyser.getByteFrequencyData(dataArray);
        const barWidth = (width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * height * 0.95;
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, "rgba(29, 185, 84, 0.15)");
          gradient.addColorStop(1, "#1db954");

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth - 3, barHeight);
          x += barWidth;
        }
      } else if (visualizerMode === 'wave') {
        analyser.getByteTimeDomainData(dataArray);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1db954';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(29, 185, 84, 0.7)';
        ctx.beginPath();

        const sliceWidth = width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * height / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (visualizerMode === 'disc') {
        const outerRadius = 35 + volumeFactor * 22;
        discRotation += 0.05 + volumeFactor * 0.1;

        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(discRotation);

        const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, outerRadius);
        grad.addColorStop(0, '#101018');
        grad.addColorStop(0.6, '#1db954');
        grad.addColorStop(0.85, '#00ff66');
        grad.addColorStop(1, '#101018');
        
        ctx.beginPath();
        ctx.arc(0, 0, outerRadius, 0, 2 * Math.PI);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        for (let r = 15; r < outerRadius; r += 6) {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, 2 * Math.PI);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(-outerRadius, -outerRadius);
        ctx.lineTo(outerRadius, outerRadius);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(outerRadius, -outerRadius);
        ctx.lineTo(-outerRadius, outerRadius);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff0055';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#040408';
        ctx.fill();

        ctx.restore();
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(drawFrameId);
      document.documentElement.style.setProperty('--sound-volume-factor', '0');
    };
  }, [audioPlaying, visualizerMode]);

  if (!movieDetails) {
    return (
      <div className="summary-error-container">
        <h2>Loading Movie Details...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  const show = movieDetails;
  const isLiked = !!likes[show.id];
  const isWatchlisted = watchlist.some(item => item.show.id === show.id);
  const downloadState = downloads[show.id];

  function handleBookNow() {
    navigate(`/book-ticket/Bookingform`, { state: { movieName: show.name } });
  }

  const rating = show.rating?.average || '8.5';
  const genresList = show.genres && show.genres.length > 0 ? show.genres.join(' • ') : 'Drama';
  const year = show.premiered ? show.premiered.split('-')[0] : 'N/A';

  // Watch Party Chat Submitter
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      setPartyChat(prev => [...prev, `You: ${chatInput}`]);
      setChatInput("");
    }
  };

  // Floating Emoji Spawner
  const triggerFloatingEmoji = (symbol) => {
    const id = emojiIdCounter.current++;
    const leftOffset = Math.floor(Math.random() * 80) + 10;
    const newEmoji = { id, symbol, leftOffset };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 2500);
  };

  // Review Submitter
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (reviewInput.trim() && reviewerName.trim()) {
      const newReview = {
        name: reviewerName,
        rating: ratingStars,
        text: reviewInput,
        date: new Date().toISOString().split('T')[0]
      };
      const updated = [newReview, ...reviews];
      setReviews(updated);
      localStorage.setItem(`cineverse_reviews_${show.id}`, JSON.stringify(updated));
      setReviewInput("");
      setReviewerName("");
      setRatingStars(5);
    }
  };

  // Safe fallback trailer search query
  const trailerEmbedSrc = `https://www.youtube.com/embed/HhesaQXLuRY?autoplay=1&rel=0`;

  return (
    <div className="netflix-details-page">
      {/* Backdrop image glow */}
      <div 
        className="details-backdrop"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(20, 20, 20, 0.95) 35%, rgba(20, 20, 20, 0.6) 70%, transparent 100%), url(${show.image?.original || ''})`
        }}
      />

      {/* Poster Ambilight Projection Aura */}
      <div 
        className="details-ambilight-glow"
        style={{
          backgroundImage: `url(${show.image?.original || show.image?.medium || ''})`
        }}
      />

      <div className="details-container fade-in-up">
        <div className="details-nav">
          <Link to="/" className="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Browse
          </Link>
        </div>

        {/* Cinematic Details Card */}
        <div className="details-content">
          <div className="details-poster-wrapper">
            <img 
              alt={show.name} 
              className="details-poster"
              src={show.image?.medium || show.image?.original || ''} 
            />
          </div>

          <div className="details-info">
            <h1 className="details-title">{show.name}</h1>
            
            <div className="details-meta">
              <span className="details-match">98% Match</span>
              <span className="details-meta-item">{year}</span>
              <span className="details-meta-item">{show.language}</span>
              <span className="details-rating-badge">★ {rating}</span>
            </div>

            <div className="details-genres">{genresList}</div>

            <div className="details-summary-section">
              <h3>Overview</h3>
              <div 
                className="details-summary-text" 
                dangerouslySetInnerHTML={{ __html: show.summary || '<p>No overview available.</p>' }}
              />
            </div>

            {/* Quick Actions Panel */}
            <div className="details-actions">
              <button onClick={handleBookNow} className="details-book-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2z"/>
                </svg>
                Book Tickets
              </button>

              <button 
                className={`action-btn-circle ${isWatchlisted ? 'active' : ''}`}
                onClick={() => toggleWatchlist({ show })}
                title={isWatchlisted ? "In Watchlist" : "Add to My List"}
              >
                {isWatchlisted ? "✓" : "+"}
              </button>

              <button 
                className={`action-btn-circle ${isLiked ? 'active' : ''}`}
                onClick={() => toggleLike(show.id)}
                title={isLiked ? "Liked" : "Like"}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '18px', height: '18px' }}>
                  <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                </svg>
              </button>

              <button 
                className={`action-btn-circle ${downloadState ? 'disabled' : ''}`}
                onClick={() => startDownload(show.id, { show })}
                title="Download Offline"
                disabled={!!downloadState}
              >
                {downloadState ? "↓" : "💾"}
              </button>

              {/* Watch Party Toggle */}
              <button 
                onClick={() => setWatchPartyActive(!watchPartyActive)} 
                className={`watch-party-toggle-btn ${watchPartyActive ? 'active-party' : ''}`}
              >
                👥 Watch Party {watchPartyActive ? "ON" : "Start"}
              </button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM SECTIONS ── */}
        <div className="summary-sections-wrap">

          {/* ── SECTION 1: Cast Strip ── */}
          {cast.length > 0 && (
            <div className="sec-block">
              <div className="sec-title">Cast &amp; Crew</div>
              <div className="cast-strip">
                {cast.map((c, i) => (
                  <div
                    key={i}
                    className="cast-card"
                    onClick={() => setActiveSpotlight(c)}
                    title={`View ${c.person.name} spotlight`}
                  >
                    <div className="cast-img-wrap">
                      <img
                        src={c.person.image?.medium || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}
                        alt={c.person.name}
                        className="cast-img"
                      />
                      <div className="cast-hover-badge">View</div>
                    </div>
                    <div className="cast-name">{c.person.name}</div>
                    <div className="cast-role">{c.character.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {loadingCast && (
            <div className="sec-block"><div className="spinner" /></div>
          )}

          {/* ── SECTION 2: Ambient Synthesizer ── */}
          <div className="sec-block synth-block">
            <div className="synth-left">
              <div className="sec-title">Ambient Synthesizer</div>
              <p className="synth-desc">
                Procedurally generated atmospheric theme — live Web Audio synthesis based on this show's mood.
              </p>
              <div className="synth-controls">
                <button
                  className={`synth-play-btn ${audioPlaying ? 'playing' : ''}`}
                  onClick={() => setAudioPlaying(!audioPlaying)}
                >
                  <span className="synth-play-icon">{audioPlaying ? '⏸' : '▶'}</span>
                  <span>{audioPlaying ? 'Pause' : 'Play Theme'}</span>
                </button>
                <div className="synth-vis-pills">
                  {[['bars','≡'],['wave','∿'],['disc','◉']].map(([mode, icon]) => (
                    <button
                      key={mode}
                      className={`vis-pill ${visualizerMode === mode ? 'active' : ''}`}
                      onClick={() => setVisualizerMode(mode)}
                      title={mode}
                    >{icon}</button>
                  ))}
                </div>
              </div>
              <div className="synth-progress-bar">
                <div className="synth-progress-fill" style={{ width: `${audioProgress}%` }} />
              </div>
              {audioPlaying && (
                <div className="synth-status-dot">
                  <span className="dot-pulse" />
                  <span>Synthesizing…</span>
                </div>
              )}
            </div>
            <div className="synth-right">
              <canvas
                ref={visualizerCanvasRef}
                width={480}
                height={160}
                className="synth-canvas"
              />
            </div>
          </div>

          {/* ── SECTION 3: Reviews ── */}
          <div className="sec-block reviews-block">
            <div className="reviews-top">
              {/* Form */}
              <div className="reviews-form-wrap">
                <div className="sec-title">Leave a Review</div>
                <form onSubmit={handleReviewSubmit} className="reviews-form-new">
                  <input
                    type="text"
                    placeholder="Your name"
                    required
                    value={reviewerName}
                    onChange={e => setReviewerName(e.target.value)}
                  />
                  <div className="stars-row-new">
                    <span>Rating</span>
                    <div className="stars-new">
                      {[1,2,3,4,5].map(val => (
                        <button
                          key={val}
                          type="button"
                          className={`star-btn-new ${(hoverStars || ratingStars) >= val ? 'lit' : ''}`}
                          onClick={() => setRatingStars(val)}
                          onMouseEnter={() => setHoverStars(val)}
                          onMouseLeave={() => setHoverStars(0)}
                        >★</button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    placeholder="Share your thoughts…"
                    required
                    value={reviewInput}
                    onChange={e => setReviewInput(e.target.value)}
                  />
                  <button type="submit" className="review-submit-btn">Post Review</button>
                </form>
              </div>

              {/* Feed */}
              <div className="reviews-feed-wrap">
                <div className="sec-title">Reviews ({reviews.length})</div>
                {reviews.length === 0 ? (
                  <p className="no-reviews-msg">Be the first to review this show.</p>
                ) : (
                  <div className="reviews-feed-new">
                    {reviews.map((r, i) => (
                      <div key={i} className="review-card-new">
                        <div className="review-avatar">{r.name?.[0]?.toUpperCase() || '?'}</div>
                        <div className="review-body-new">
                          <div className="review-meta-new">
                            <strong>{r.name}</strong>
                            <span className="review-stars-new">
                              {'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}
                            </span>
                            <small>{r.date}</small>
                          </div>
                          <p>{r.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>{/* /summary-sections-wrap */}
      </div>{/* /details-container */}

      {/* Actor Spotlight Modal */}
      {activeSpotlight && (
        <div className="spotlight-modal-overlay" onClick={() => setActiveSpotlight(null)}>
          <div className="spotlight-card-content fade-in" onClick={e => e.stopPropagation()}>
            <button className="spotlight-close-btn" onClick={() => setActiveSpotlight(null)}>✕</button>
            <div className="spotlight-header">
              <img
                src={activeSpotlight.person.image?.medium || activeSpotlight.person.image?.original || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'}
                alt={activeSpotlight.person.name}
                className="spotlight-actor-img"
              />
              <div className="spotlight-names">
                <h2>{activeSpotlight.person.name}</h2>
                <h4>as {activeSpotlight.character.name}</h4>
                <div className="spotlight-meta-tags">
                  <span>Actor</span>
                  {activeSpotlight.person.gender && <span>{activeSpotlight.person.gender}</span>}
                  {activeSpotlight.person.country && <span>{activeSpotlight.person.country.name}</span>}
                </div>
              </div>
            </div>
            <div className="spotlight-body">
              <div className="spotlight-bio-section">
                <h3>About {activeSpotlight.person.name}</h3>
                <p>
                  {activeSpotlight.person.name} portrays <em>{activeSpotlight.character.name}</em> in this production.
                  {activeSpotlight.person.birthday && ` Born ${activeSpotlight.person.birthday}.`}
                  {activeSpotlight.person.country && ` From ${activeSpotlight.person.country.name}.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


