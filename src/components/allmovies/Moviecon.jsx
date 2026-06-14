import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Movies from '../movies/Movies';
import './moviecon.css';

export default function Content(props) {
  const {
    searchQuery,
    watchlist,
    toggleWatchlist,
    likes,
    toggleLike,
    downloads,
    startDownload,
    deleteDownload,
    activeProfile
  } = props;

  const navigate = useNavigate();
  const [heroMovies, setHeroMovies] = useState([]);
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const currentHero = heroMovies[activeHeroIdx] || null;

  const [activeGenre, setActiveGenre] = useState('All');
  const [activeSort, setActiveSort] = useState('default');
  
  // Geolocation and schedule states
  const [userLocation, setUserLocation] = useState({ city: "Mumbai", country: "India" });
  const [scheduleShows, setScheduleShows] = useState([]);

  // Catalog categories loaded dynamically from TVMaze
  const [categories, setCategories] = useState({
    marvel: [],
    bollywood: [],
    recommended: []
  });
  const [loading, setLoading] = useState(true);

  // Video player custom controls states (Speed/Quality)
  const [playSpeed, setPlaySpeed] = useState(1);
  const [videoQuality, setVideoQuality] = useState("1080p");
  const [playerMuted, setPlayerMuted] = useState(false);
  const [trailerVideoId, setTrailerVideoId] = useState(null);
  const [trailerLoading, setTrailerLoading] = useState(false);

  useEffect(() => {
    setActiveHeroIdx(0);
    setActiveGenre('All');
    setActiveSort('default');
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Location
        try {
          const locRes = await fetch('https://ipapi.co/json/');
          const locData = await locRes.json();
          if (locData.city && locData.country_name) {
            setUserLocation({ city: locData.city, country: locData.country_name });
          }
        } catch (err) {
          console.warn("Location API failed, using defaults.", err);
        }

        // 2. Fetch Hero Shows (Kids: Pokémon: 412, SpongeBob: 160, Avatar: 505. Adult: Breaking Bad: 179, Game of Thrones: 82, Stranger Things: 2993)
        const heroShowIds = activeProfile?.kids ? [412, 160, 505] : [179, 82, 2993];
        const fetchedHeroes = [];
        for (const id of heroShowIds) {
          try {
            const res = await fetch(`https://api.tvmaze.com/shows/${id}`);
            if (res.ok) {
              const data = await res.json();
              fetchedHeroes.push(data);
            }
          } catch (err) {
            console.error(`Failed to fetch hero show ${id}`, err);
          }
        }
        setHeroMovies(fetchedHeroes);

        // 3. Fetch Live Airing Today Schedule
        try {
          const scheduleRes = await fetch('https://api.tvmaze.com/schedule');
          const scheduleData = await scheduleRes.json();
          const uniqueSchedMap = new Map();
          scheduleData.forEach(ep => {
            if (ep.show && ep.show.id && ep.show.image) {
              uniqueSchedMap.set(ep.show.id, { show: ep.show });
            }
          });
          setScheduleShows(Array.from(uniqueSchedMap.values()).slice(0, 10));
        } catch (err) {
          console.error("Error fetching live schedule:", err);
        }

        // 4. Fetch Marvel / Anime and Bollywood / Disney Shows conditionally
        if (activeProfile?.kids) {
          const [resDisney, resCartoons, resAnime] = await Promise.all([
            fetch('https://api.tvmaze.com/search/shows?q=disney'),
            fetch('https://api.tvmaze.com/search/shows?q=cartoon'),
            fetch('https://api.tvmaze.com/search/shows?q=anime')
          ]);

          const [dataDisney, dataCartoons, dataAnime] = await Promise.all([
            resDisney.json(),
            resCartoons.json(),
            resAnime.json()
          ]);

          setCategories({
            marvel: dataCartoons,
            bollywood: dataDisney,
            recommended: dataAnime
          });
        } else {
          const [resMarvel, resBollywood, resHindi] = await Promise.all([
            fetch('https://api.tvmaze.com/search/shows?q=marvel'),
            fetch('https://api.tvmaze.com/search/shows?q=bollywood'),
            fetch('https://api.tvmaze.com/search/shows?q=hindi')
          ]);

          const [dataMarvel, dataBollywood, dataHindi] = await Promise.all([
            resMarvel.json(),
            resBollywood.json(),
            resHindi.json()
          ]);

          const bollywoodMap = new Map();
          [...dataBollywood, ...dataHindi].forEach(item => {
            if (item.show && item.show.id) {
              bollywoodMap.set(item.show.id, item);
            }
          });
          const combinedBollywood = Array.from(bollywoodMap.values());

          setCategories({
            marvel: dataMarvel,
            bollywood: combinedBollywood,
            recommended: dataMarvel.slice(2, 7)
          });
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [activeProfile]);

  // Auto-rotate hero slider every 7 seconds
  useEffect(() => {
    if (heroMovies.length <= 1) return;
    const interval = setInterval(() => {
      setActiveHeroIdx((prev) => (prev + 1) % heroMovies.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [heroMovies, activeHeroIdx]);

  // Fetch the real YouTube trailer video ID by scraping YouTube search via CORS proxy
  const fetchTrailerVideoId = async (showName) => {
    const query = encodeURIComponent(`${showName} official trailer`);
    // Approach 1: corsproxy.io (most reliable free CORS proxy)
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://www.youtube.com/results?search_query=${query}`)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const html = await res.text();
        // YouTube embeds videoId in its page JSON — grab first occurrence
        const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
        if (match && match[1]) return match[1];
      }
    } catch {}
    // Approach 2: try allorigins.win CORS proxy
    try {
      const res2 = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.youtube.com/results?search_query=${query}`)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res2.ok) {
        const json = await res2.json();
        const html = json.contents || '';
        const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
        if (match && match[1]) return match[1];
      }
    } catch {}
    return null;
  };

  const handleHeroPlay = async () => {
    if (!currentHero) return;
    setTrailerVideoId(null);
    setTrailerLoading(true);
    setShowTrailer(true);
    const videoId = await fetchTrailerVideoId(currentHero.name);
    setTrailerVideoId(videoId);
    setTrailerLoading(false);
  };

  const handleHeroInfo = () => {
    if (currentHero) {
      const fakeSearchItem = { show: currentHero };
      navigate(`/summery/${currentHero.id}`, { state: { movie: fakeSearchItem } });
    }
  };

  // Build a list of all loaded shows for live searching
  const allLoadedShows = [
    ...categories.marvel,
    ...categories.bollywood,
    ...scheduleShows
  ];

  // Deduplicate loaded shows
  const uniqueShowsMap = new Map();
  allLoadedShows.forEach(item => {
    if (item.show && item.show.id) {
      uniqueShowsMap.set(item.show.id, item);
    }
  });

  const availableGenres = activeProfile?.kids 
    ? ['All', 'Animation', 'Children', 'Family', 'Fantasy', 'Comedy', 'Adventure']
    : ['All', 'Action', 'Drama', 'Crime', 'Thriller', 'Comedy', 'Sci-Fi', 'Mystery'];

  const kidsFilter = (item) => {
    if (!activeProfile?.kids) return true;
    const genres = item.show.genres || [];
    // Keep animations, children, comedy and fantasy; filter out mature themes
    const adultGenres = ["Drama", "Horror", "Thriller", "Crime", "Mystery", "Action", "Suspense"];
    const hasAdultTheme = genres.some(g => adultGenres.includes(g));
    const isKidGenre = genres.some(g => ["Animation", "Children", "Family", "Fantasy", "Comedy", "Adventure"].includes(g));
    return isKidGenre || !hasAdultTheme;
  };

  const uniqueShows = Array.from(uniqueShowsMap.values()).filter(kidsFilter);

  // Apply genre filter and sorting
  let curatedShows = uniqueShows;
  if (activeGenre !== 'All') {
    curatedShows = curatedShows.filter(item => 
      item.show.genres?.some(g => g.toLowerCase() === activeGenre.toLowerCase())
    );
  }

  if (activeSort === 'rating') {
    curatedShows = [...curatedShows].sort((a, b) => (b.show.rating?.average || 0) - (a.show.rating?.average || 0));
  } else if (activeSort === 'year') {
    curatedShows = [...curatedShows].sort((a, b) => {
      const yearA = a.show.premiered ? parseInt(a.show.premiered.split('-')[0]) : 0;
      const yearB = b.show.premiered ? parseInt(b.show.premiered.split('-')[0]) : 0;
      return yearB - yearA;
    });
  } else if (activeSort === 'title') {
    curatedShows = [...curatedShows].sort((a, b) => (a.show.name || '').localeCompare(b.show.name || ''));
  }

  // Filter shows based on search query
  const searchFilteredShows = uniqueShows.filter(item => {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase();
    const nameMatch = item.show.name?.toLowerCase().includes(q);
    const summaryMatch = item.show.summary?.toLowerCase().includes(q);
    const genreMatch = item.show.genres?.some(g => g.toLowerCase().includes(q));
    const languageMatch = item.show.language?.toLowerCase().includes(q);
    return nameMatch || summaryMatch || genreMatch || languageMatch;
  });

  // Calculate personalized recommendations based on likes/watchlist
  const favoriteGenres = new Set();
  watchlist.forEach(item => item.show.genres?.forEach(g => favoriteGenres.add(g)));
  Object.keys(likes).forEach(id => {
    if (likes[id]) {
      const showObj = uniqueShows.find(s => s.show.id.toString() === id);
      showObj?.show.genres?.forEach(g => favoriteGenres.add(g));
    }
  });

  const recommendedShows = uniqueShows.filter(item => {
    const isWatchlisted = watchlist.some(w => w.show.id === item.show.id);
    if (isWatchlisted) return false;
    const sharesGenre = item.show.genres?.some(g => favoriteGenres.has(g));
    const isHighlyRated = (item.show.rating?.average || 0) >= 8.0;
    return sharesGenre || isHighlyRated;
  }).slice(0, 8);

  const activeDownloads = Object.keys(downloads).map(id => downloads[id]).filter(Boolean);

  if (loading) {
    return (
      <div className="netflix-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="netflix-homepage animated-page">
      {/* Search results grid */}
      {searchQuery ? (
        <div className="search-results-page" style={{ paddingTop: '80px', minHeight: '80vh' }}>
          <h2 className="search-results-title">Search Results for "{searchQuery}"</h2>
          {searchFilteredShows.length === 0 ? (
            <div className="no-search-results">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>No titles found matching your search. Try adjusting spelling or looking for other genres.</p>
            </div>
          ) : (
            <div className="search-grid">
              {searchFilteredShows.map((movieItem) => (
                <Movies 
                  key={movieItem.show.id} 
                  movie={movieItem} 
                  name={movieItem.show.name} 
                  language={movieItem.show.language} 
                  image={movieItem.show.image?.medium || movieItem.show.image?.original} 
                  id={movieItem.show.id} 
                  date={movieItem.show.premiered}
                  watchlist={watchlist}
                  toggleWatchlist={toggleWatchlist}
                  likes={likes}
                  toggleLike={toggleLike}
                  downloads={downloads}
                  startDownload={startDownload}
                  deleteDownload={deleteDownload}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Cinematic Hero Banner */}
          {currentHero && (
            <div 
              className="hero-banner"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(20,20,20,0.1) 40%, rgba(20,20,20,1) 100%), url(${currentHero.image?.original || ''})`
              }}
            >
              <div className="hero-content fade-in-up" key={activeHeroIdx}>
                <div className="brand-badge animate-pulse">CINEMA ORIGINALS</div>
                <h1 className="hero-title">{currentHero.name}</h1>
                <div className="hero-meta">
                  <span className="hero-rating">★ {currentHero.rating?.average || '8.9'}</span>
                  <span className="hero-year">{currentHero.premiered?.split('-')[0] || '2008'}</span>
                  <span className="hero-badge">Ultra HD 4K</span>
                </div>
                <p className="hero-description" dangerouslySetInnerHTML={{ 
                  __html: currentHero.summary?.replace(/<[^>]*>/g, '').slice(0, 160) + '...' 
                }}></p>
                <div className="hero-buttons">
                  <button className="hero-btn play-btn" onClick={handleHeroPlay}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Watch Trailer
                  </button>
                  <button className="hero-btn info-btn" onClick={handleHeroInfo}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    More Info
                  </button>
                </div>
              </div>

              {/* Hero Carousel Dots */}
              <div className="hero-carousel-dots">
                {heroMovies.map((_, idx) => (
                  <button
                    key={idx}
                    className={`hero-dot ${idx === activeHeroIdx ? 'active-dot' : ''}`}
                    onClick={() => setActiveHeroIdx(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Curated Curation & Curation Filters Pill Row */}
          <div className="curation-bar-container">
            <div className="genre-pills">
              {availableGenres.map((genre) => (
                <button
                  key={genre}
                  className={`genre-pill-btn ${activeGenre === genre ? 'active' : ''}`}
                  onClick={() => setActiveGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
            
            <div className="sort-picker">
              <span>Sort By: </span>
              <select 
                value={activeSort} 
                onChange={(e) => setActiveSort(e.target.value)}
                className="sort-select-dropdown"
              >
                <option value="default">Relevance</option>
                <option value="rating">Top Rated ★</option>
                <option value="year">Release Year 📅</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Catalog Curation Display */}
          {(activeGenre !== 'All' || activeSort !== 'default') ? (
            <div className="movie-rows-container curated-results-grid animated-page">
              <h2 className="row-title">
                Showing {curatedShows.length} titles in "{activeGenre}" 
                {activeSort !== 'default' ? ` sorted by ${activeSort}` : ''}
              </h2>
              {curatedShows.length === 0 ? (
                <div className="no-search-results">
                  <p>No matching shows found for this selection.</p>
                </div>
              ) : (
                <div className="search-grid">
                  {curatedShows.map((movieItem) => (
                    <Movies 
                      key={movieItem.show.id} 
                      movie={movieItem} 
                      name={movieItem.show.name} 
                      language={movieItem.show.language} 
                      image={movieItem.show.image?.medium || movieItem.show.image?.original} 
                      id={movieItem.show.id} 
                      date={movieItem.show.premiered}
                      watchlist={watchlist}
                      toggleWatchlist={toggleWatchlist}
                      likes={likes}
                      toggleLike={toggleLike}
                      downloads={downloads}
                      startDownload={startDownload}
                      deleteDownload={deleteDownload}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Dynamic Scroll Rows */
            <div className="movie-rows-container">
              {/* Top 5 Blockbusters row */}
              <Top5Row 
                movies={uniqueShows} 
                watchlist={watchlist} 
                toggleWatchlist={toggleWatchlist}
                likes={likes}
                toggleLike={toggleLike}
                downloads={downloads}
                startDownload={startDownload}
                deleteDownload={deleteDownload}
              />
            {/* Watchlist Row (Netflix-Style) */}
            {watchlist.length > 0 && (
              <MovieRow 
                title="My List" 
                movies={watchlist} 
                watchlist={watchlist} 
                toggleWatchlist={toggleWatchlist}
                likes={likes}
                toggleLike={toggleLike}
                downloads={downloads}
                startDownload={startDownload}
                deleteDownload={deleteDownload}
              />
            )}

            {/* Offline Downloads Row (Downloads Simulator) */}
            {activeDownloads.length > 0 && (
              <div className="movie-row downloads-row fade-in-section">
                <h2 className="row-title">Downloaded Offline</h2>
                <div className="downloads-grid">
                  {activeDownloads.map((dl, idx) => (
                    <div key={idx} className="download-item-card">
                      <img 
                        src={dl.show?.show.image?.medium || dl.show?.show.image?.original} 
                        alt={dl.show?.show.name} 
                        className="download-card-img"
                      />
                      <div className="download-card-details">
                        <h4>{dl.show?.show.name}</h4>
                        {dl.progress < 100 ? (
                          <div className="download-progress-container">
                            <div className="progress-bar-fill" style={{ width: `${dl.progress}%` }}></div>
                            <span className="progress-text">Downloading: {dl.progress}%</span>
                          </div>
                        ) : (
                          <div className="download-complete-status">
                            <span className="dl-check-icon">✓</span>
                            <span>Downloaded (840 MB)</span>
                            <button onClick={() => deleteDownload(dl.show.show.id)} className="delete-dl-btn">Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Row (Netflix Personalized) */}
            {(recommendedShows.length > 0 ? recommendedShows : categories.recommended).length > 0 && (
              <MovieRow 
                title={activeProfile?.kids ? "Kids Anime & Fun" : `Recommended for ${activeProfile?.name || 'You'}`}
                movies={recommendedShows.length > 0 ? recommendedShows : categories.recommended}
                watchlist={watchlist}
                toggleWatchlist={toggleWatchlist}
                likes={likes}
                toggleLike={toggleLike}
                downloads={downloads}
                startDownload={startDownload}
                deleteDownload={deleteDownload}
              />
            )}

            {/* Marvel / Cartoons Row */}
            {categories.marvel.length > 0 && (
              <MovieRow 
                title={activeProfile?.kids ? "Animated Adventures" : "Marvel Cinematic Universe"} 
                movies={categories.marvel} 
                delay="0.1s" 
                watchlist={watchlist}
                toggleWatchlist={toggleWatchlist}
                likes={likes}
                toggleLike={toggleLike}
                downloads={downloads}
                startDownload={startDownload}
                deleteDownload={deleteDownload}
              />
            )}

            {/* Bollywood / Disney Row */}
            {categories.bollywood.length > 0 && (
              <MovieRow 
                title={activeProfile?.kids ? "Disney Magic & Family" : "Bollywood Blockbusters"} 
                movies={categories.bollywood} 
                delay="0.2s" 
                watchlist={watchlist}
                toggleWatchlist={toggleWatchlist}
                likes={likes}
                toggleLike={toggleLike}
                downloads={downloads}
                startDownload={startDownload}
                deleteDownload={deleteDownload}
              />
            )}

            {/* TVMaze Live Airing Today Schedule Row (Live API) */}
            {scheduleShows.length > 0 && (
              <MovieRow 
                title={activeProfile?.kids ? "Cartoons Airing Live" : "Live Airing Today"} 
                movies={scheduleShows} 
                watchlist={watchlist} 
                toggleWatchlist={toggleWatchlist}
                likes={likes}
                toggleLike={toggleLike}
                downloads={downloads}
                startDownload={startDownload}
                deleteDownload={deleteDownload}
              />
            )}
          </div>
        )}
      </>
    )}

      {/* Video Trailer Modal (YouTube Controls Simulator) */}
      {showTrailer && (
        <div className="trailer-modal-overlay" onClick={() => setShowTrailer(false)}>
          <div className="trailer-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-ambilight-glow" style={{ backgroundImage: `url(${currentHero?.image?.original || ''})` }} />
            <button className="close-modal-btn" onClick={() => setShowTrailer(false)}>✕</button>
            <div className="video-responsive">
              {trailerLoading ? (
                <div className="trailer-loading-state">
                  <div className="spinner" />
                  <p>Finding trailer for <strong>{currentHero?.name}</strong>…</p>
                </div>
              ) : trailerVideoId ? (
                <iframe
                  key={trailerVideoId}
                  className="trailer-iframe"
                  src={`https://www.youtube.com/embed/${trailerVideoId}?autoplay=1&rel=0&mute=${playerMuted ? 1 : 0}`}
                  title={`${currentHero?.name} Trailer`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="trailer-unavailable">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                    <path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3L10 15z"/>
                  </svg>
                  <p>Could not load trailer for <strong>{currentHero?.name}</strong>.</p>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent((currentHero?.name || '') + ' official trailer')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="watch-on-yt-btn"
                  >
                    Watch on YouTube ↗
                  </a>
                </div>
              )}
            </div>

            {/* Custom YouTube Player Controls */}
            <div className="youtube-player-bar">
              <div className="player-btn-group">
                <button 
                  onClick={() => setPlayerMuted(!playerMuted)} 
                  className={`control-panel-btn ${playerMuted ? 'active-control' : ''}`}
                >
                  {playerMuted ? "🔇 Unmute" : "🔊 Mute"}
                </button>
              </div>

              <div className="player-btn-group">
                <span>Speed: </span>
                <select value={playSpeed} onChange={(e) => setPlaySpeed(Number(e.target.value))}>
                  <option value="0.5">0.5x</option>
                  <option value="1">1x (Normal)</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>

              <div className="player-btn-group">
                <span>Quality: </span>
                <select value={videoQuality} onChange={(e) => setVideoQuality(e.target.value)}>
                  <option value="1080p">1080p HD</option>
                  <option value="720p">720p</option>
                  <option value="480p">480p</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inner helper component for scrollable row
function MovieRow(props) {
  const { title, movies, delay, watchlist, toggleWatchlist, likes, toggleLike, downloads, startDownload, deleteDownload } = props;
  
  // Filter items in list to guarantee structure
  const validMovies = movies.map(item => {
    if (item.show) return item;
    return { show: item }; // handle raw show objects
  }).filter(item => item.show && item.show.image);

  return (
    <div className="movie-row fade-in-section" style={{ animationDelay: delay }}>
      <h2 className="row-title">{title}</h2>
      <div className="row-posters-container">
        <div className="row-posters">
          {validMovies.map((movieItem) => (
            <Movies 
              key={movieItem.show.id} 
              movie={movieItem} 
              name={movieItem.show.name} 
              language={movieItem.show.language} 
              image={movieItem.show.image?.medium || movieItem.show.image?.original} 
              id={movieItem.show.id} 
              date={movieItem.show.premiered}
              watchlist={watchlist}
              toggleWatchlist={toggleWatchlist}
              likes={likes}
              toggleLike={toggleLike}
              downloads={downloads}
              startDownload={startDownload}
              deleteDownload={deleteDownload}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Inner helper component for Top 5 Blockbusters Row
function Top5Row(props) {
  const { movies, watchlist, toggleWatchlist, likes, toggleLike, downloads, startDownload, deleteDownload } = props;

  // Filter highest rated and slice first 5
  const top5 = [...movies]
    .filter(item => item.show && item.show.image)
    .sort((a, b) => (b.show.rating?.average || 0) - (a.show.rating?.average || 0))
    .slice(0, 5);

  if (top5.length === 0) return null;

  return (
    <div className="movie-row top-5-row fade-in-section">
      <h2 className="row-title">Top 5 Blockbusters Today</h2>
      <div className="top-5-grid-container">
        {top5.map((movieItem, index) => (
          <div key={movieItem.show.id} className="rank-card-container">
            <span className="rank-number">{index + 1}</span>
            <div className="rank-card-wrapper">
              <Movies 
                movie={movieItem} 
                name={movieItem.show.name} 
                language={movieItem.show.language} 
                image={movieItem.show.image?.medium || movieItem.show.image?.original} 
                id={movieItem.show.id} 
                date={movieItem.show.premiered}
                watchlist={watchlist}
                toggleWatchlist={toggleWatchlist}
                likes={likes}
                toggleLike={toggleLike}
                downloads={downloads}
                startDownload={startDownload}
                deleteDownload={deleteDownload}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}