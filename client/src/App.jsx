import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout.jsx';
import YouTubePlayer from './components/YouTubePlayer.jsx';
import FilterControls from './components/FilterControls.jsx';
import PlaylistTable from './components/PlaylistTable.jsx';
import VideosTodayBanner from './components/VideosTodayBanner.jsx';
import ShareSection from './components/ShareSection.jsx';
import { useVideos } from './hooks/useVideos.js';
import {
  getDateFilterFromUrl,
  updateDateFilterInUrl,
  filterVideosByDate,
  filterVideosByVotesComments,
  filterVideosByCategory,
  getCategories,
  getVideoToPlayNext,
  videoKey,
} from './lib/videoLogic.js';

const FAVORITES_STORAGE_KEY = 'favorite_products';

function loadFavorites() {
  try {
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!storedFavorites) return { items: [], error: null };

    const parsedFavorites = JSON.parse(storedFavorites);
    if (!Array.isArray(parsedFavorites)) {
      throw new Error('Saved favorites must be a list.');
    }

    const items = parsedFavorites.map((video) => {
      const timeWhenAdded = new Date(video.TimeWhenAdded);
      if (!video.VideoURL || Number.isNaN(timeWhenAdded.getTime())) {
        throw new Error('A saved favorite is missing valid product information.');
      }
      return { ...video, TimeWhenAdded: timeWhenAdded };
    });
    return { items, error: null };
  } catch (error) {
    return { items: [], error: `Unable to load favorites: ${error.message}` };
  }
}

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default function App() {
  const STORAGE_KEYS = {
    SORT_MODE: 'playlist_sort_mode',
    DATE_FILTER_MODE: 'playlist_date_mode',
    DATE_FILTER_VALUE: 'playlist_date_value',
    MIN_UPVOTES: 'playlist_min_upvotes',
    MIN_COMMENTS: 'playlist_min_comments',
    PLAYER_MINUTES: 'player_minutes',
    PLAYER_SECONDS: 'player_seconds',
  };

  const [hasStoredFilterSettings] = useState(() =>
    [
      STORAGE_KEYS.SORT_MODE,
      STORAGE_KEYS.DATE_FILTER_MODE,
      STORAGE_KEYS.DATE_FILTER_VALUE,
      STORAGE_KEYS.MIN_UPVOTES,
      STORAGE_KEYS.MIN_COMMENTS,
    ].some((key) => localStorage.getItem(key) !== null)
  );

  const getInitialState = () => {
    const sort = localStorage.getItem(STORAGE_KEYS.SORT_MODE);
    const upvotes = localStorage.getItem(STORAGE_KEYS.MIN_UPVOTES);
    const comments = localStorage.getItem(STORAGE_KEYS.MIN_COMMENTS);

    return {
      sortMode:
        sort &&
        ['upvotes-desc', 'upvotes-asc', 'comments-desc', 'comments-asc', 'shuffle'].includes(sort)
          ? sort
          : 'shuffle',
      minUpvotes: !isNaN(parseInt(upvotes, 10)) ? Math.max(0, parseInt(upvotes, 10)) : 0,
      minComments: !isNaN(parseInt(comments, 10)) ? Math.max(0, parseInt(comments, 10)) : 0,
    };
  };

  const getPlayerInitialState = () => {
    const mins = localStorage.getItem(STORAGE_KEYS.PLAYER_MINUTES);
    const secs = localStorage.getItem(STORAGE_KEYS.PLAYER_SECONDS);
    const minVal = parseInt(mins, 10);
    const secVal = parseInt(secs, 10);
    return {
      minutes: !isNaN(minVal) ? Math.min(Math.max(0, minVal), 59) : 0,
      seconds: !isNaN(secVal) ? Math.min(Math.max(0, secVal), 59) : 30,
    };
  };

  const initialState = getInitialState();
  const playerInitial = getPlayerInitialState();

  const [playingVideo, setPlayingVideo] = useState(null);
  const [playlistVersion, setPlaylistVersion] = useState(0);
  const markPlayedRef = useRef(null);

  // Player time state
  const [minutes, setMinutes] = useState(playerInitial.minutes);
  const [seconds, setSeconds] = useState(playerInitial.seconds);

  // Date filter state
  const [dateFilterMode, setDateFilterMode] = useState(() => {
    const { mode } = getDateFilterFromUrl();
    return mode;
  });
  const [selectedDateRange, setSelectedDateRange] = useState(() => {
    const { selectedDateRange } = getDateFilterFromUrl();
    return selectedDateRange;
  });

  const [minUpvotes, setMinUpvotes] = useState(initialState.minUpvotes);
  const [minComments, setMinComments] = useState(initialState.minComments);
  const [sortMode, setSortMode] = useState(initialState.sortMode);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleEmptyDateResults = useCallback((mode) => {
    if (!hasStoredFilterSettings && (mode === 'yesterday' || mode === 'today')) {
      setDateFilterMode('week');
    }
  }, [hasStoredFilterSettings]);

  const { loading, hasLoaded, error, sortedVideos, filteredVideos, categoryName } = useVideos({
    dateMode: dateFilterMode,
    selectedDateRange,
  }, handleEmptyDateResults);

  // Modal states
  const [showFilter, setShowFilter] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [favoriteState, setFavoriteState] = useState(loadFavorites);
  const favorites = favoriteState.items;

  const playerRef = useRef(null);

  const saveFavorites = useCallback((nextFavorites) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextFavorites));
      setFavoriteState({ items: nextFavorites, error: null });
    } catch (error) {
      setFavoriteState((current) => ({
        ...current,
        error: `Unable to save favorites: ${error.message}`,
      }));
    }
  }, []);

  const handleAddFavorite = useCallback((video) => {
    if (!video) return;
    if (favorites.some((favorite) => videoKey(favorite) === videoKey(video))) return;
    saveFavorites([...favorites, video]);
  }, [favorites, saveFavorites]);

  const handleRemoveFavorite = useCallback((video) => {
    saveFavorites(favorites.filter((favorite) => videoKey(favorite) !== videoKey(video)));
  }, [favorites, saveFavorites]);

  const handleToggleFavorite = useCallback((video) => {
    if (!video) return;
    const isAlreadyFavorite = favorites.some((favorite) => videoKey(favorite) === videoKey(video));
    if (isAlreadyFavorite) {
      handleRemoveFavorite(video);
      return;
    }
    handleAddFavorite(video);
  }, [favorites, handleAddFavorite, handleRemoveFavorite]);

  const handleClearFavorites = useCallback(() => {
    saveFavorites([]);
  }, [saveFavorites]);

  // Sync filters with URL / localStorage
  useEffect(() => {
    updateDateFilterInUrl(dateFilterMode, selectedDateRange);
  }, [dateFilterMode, selectedDateRange]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SORT_MODE, sortMode);
  }, [sortMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MIN_UPVOTES, String(minUpvotes));
  }, [minUpvotes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MIN_COMMENTS, String(minComments));
  }, [minComments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLAYER_MINUTES, String(minutes));
  }, [minutes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLAYER_SECONDS, String(seconds));
  }, [seconds]);

  // Apply all filters
  const dateFilteredVideos = filterVideosByDate(filteredVideos, dateFilterMode, selectedDateRange);
  const votesCommentsFilteredVideos = filterVideosByVotesComments(
    dateFilteredVideos,
    minUpvotes,
    minComments
  );
  const categoryFilteredVideos = filterVideosByCategory(votesCommentsFilteredVideos, selectedCategory);

  const finalSortedVideos = useMemo(() => {
    if (!categoryFilteredVideos.length) return categoryFilteredVideos;
    const rowsCopy = [...categoryFilteredVideos];
    switch (sortMode) {
      case 'upvotes-desc':
        rowsCopy.sort((a, b) => (b.Votes ?? 0) - (a.Votes ?? 0));
        break;
      case 'upvotes-asc':
        rowsCopy.sort((a, b) => (a.Votes ?? 0) - (b.Votes ?? 0));
        break;
      case 'comments-desc':
        rowsCopy.sort((a, b) => (b.Comments ?? 0) - (a.Comments ?? 0));
        break;
      case 'comments-asc':
        rowsCopy.sort((a, b) => (a.Comments ?? 0) - (b.Comments ?? 0));
        break;
      case 'shuffle':
      default:
        break;
    }
    return rowsCopy;
  }, [categoryFilteredVideos, sortMode]);

  const categories = useMemo(() => {
    const cats = getCategories(sortedVideos || []);
    return ['Any Category', ...cats.sort()];
  }, [sortedVideos]);

  // Check if there is a next video
  const hasNextVideo = useMemo(() => {
    if (!playingVideo) {
      return !!getVideoToPlayNext(finalSortedVideos, null);
    }
    return !!getVideoToPlayNext(finalSortedVideos, playingVideo);
  }, [finalSortedVideos, playingVideo]);

  const handleMarkPlayed = useCallback((video) => {
    markPlayedRef.current?.(video);
    setPlaylistVersion((v) => v + 1);
  }, []);

  const handleAllWatched = useCallback(() => {

  }, []);

  const handleDateFilterChange = useCallback((mode, dateRange) => {
    setDateFilterMode(mode);
    setSelectedDateRange(dateRange);
  }, []);

  const handleMinutesChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    setMinutes(Math.min(Math.max(0, val), 59));
  };

  const handleSecondsChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    setSeconds(Math.min(Math.max(0, val), 59));
  };

  const handlePlayNext = useCallback(() => {
    if (playerRef.current?.playNext) {
      playerRef.current.playNext();
    }
  }, []);

  if (loading && !hasLoaded) {
  return (
    <div className="loading-screen">
      <h1>Loading playlist...</h1>
    </div>
  );
}

  if (error) {
    return (
      <Layout
        onFilterClick={() => {}}
        onPlaylistClick={() => {}}
        onFavoritesClick={() => {}}
        onAddFavorite={() => {}}
        isPlayingVideoFavorite={false}
        hasPlayingVideo={false}
        onAboutClick={() => {}}
        onNextClick={() => {}}
        minutes={minutes}
        seconds={seconds}
        onMinutesChange={handleMinutesChange}
        onSecondsChange={handleSecondsChange}
        hasNextVideo={false}
      >
        <p>Error: {error}</p>
        <p>
          Make sure the server is running and the database is seeded (
          <code>npm run seed</code>).
        </p>
      </Layout>
    );
  }

  return (
    <>
      <Layout
        onFilterClick={() => setShowFilter(true)}
        onPlaylistClick={() => setShowPlaylist(true)}
        onFavoritesClick={() => setShowFavorites(true)}
        onAddFavorite={() => handleToggleFavorite(playingVideo)}
        isPlayingVideoFavorite={
          !!playingVideo &&
          favorites.some((favorite) => videoKey(favorite) === videoKey(playingVideo))
        }
        hasPlayingVideo={!!playingVideo}
        onAboutClick={() => setShowAbout(true)}
        onNextClick={handlePlayNext}
        minutes={minutes}
        seconds={seconds}
        onMinutesChange={handleMinutesChange}
        onSecondsChange={handleSecondsChange}
        hasNextVideo={hasNextVideo}
      >
        <YouTubePlayer
          ref={playerRef}
          filteredVideos={finalSortedVideos}
          onPlayingChange={setPlayingVideo}
          onMarkPlayed={handleMarkPlayed}
          onAllWatched={handleAllWatched}
          minutes={minutes}
          seconds={seconds}
        />
      </Layout>

      {/* Filter Modal */}
      <Modal isOpen={showFilter} onClose={() => setShowFilter(false)} title="Sort & Filter">
        <FilterControls
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          dateFilterMode={dateFilterMode}
          selectedDateRange={selectedDateRange}
          onDateFilterChange={handleDateFilterChange}
          minUpvotes={minUpvotes}
          minComments={minComments}
          onMinUpvotesChange={setMinUpvotes}
          onMinCommentsChange={setMinComments}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          onApply={() => setShowFilter(false)}
        />
      </Modal>

      {/* Playlist Modal */}
      <Modal isOpen={showPlaylist} onClose={() => setShowPlaylist(false)} title="Playlist 📺">
        <div style={{ marginBottom: '1rem' }}>
          {selectedCategory && (
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Category: {selectedCategory}</div>
          )}
          <VideosTodayBanner filteredVideos={sortedVideos} />
        </div>
        <PlaylistTable
          filteredVideos={finalSortedVideos}
          playingVideo={playingVideo}
          playlistVersion={playlistVersion}
          onMarkPlayedRef={markPlayedRef}
          maxDuration={minutes * 60 + seconds}
          favorites={favorites}
          onAddFavorite={handleToggleFavorite}
        />
      </Modal>

      {/* Favorites Modal */}
      <Modal isOpen={showFavorites} onClose={() => setShowFavorites(false)} title="Favorites ✨">
        {favoriteState.error && (
          <p className="favorites-error" role="alert">{favoriteState.error}</p>
        )}
        <PlaylistTable
          filteredVideos={favorites}
          playingVideo={playingVideo}
          playlistVersion={playlistVersion}
          onMarkPlayedRef={null}
          maxDuration={0}
          favorites={favorites}
          onRemoveFavorite={handleRemoveFavorite}
          onClearFavorites={handleClearFavorites}
          isFavoritesView
        />
      </Modal>

      {/* About Modal */}
      <Modal isOpen={showAbout} onClose={() => setShowAbout(false)} title="About">
        <h1>Product Trailers - The TV channel for Product Hunt launches.</h1>
        <h2>Continuous autoplay of the latest product trailers. Filter, sort, and lean back. 🍿</h2>
        <ul>
          <li>New videos are added automatically every day.</li>
          <li>Specify auto-advance time. The default is 0:30. Enter 0:0 to play the entire video.</li>
          <li>No replays - every time you visit the site, you see unwatched videos.</li>
          <li>Shuffling is done in descending order of date.</li>
          <li>On your smartphone, rotate the screen to landscape orientation and expand the player to full screen for the best viewing experience.</li>
        </ul>
        <h2>License</h2>
        <p>
          This project is licensed under the GNU Affero General Public License v3.0 or later
          (AGPL-3.0-or-later). Source code is available at{' '}
          <a
            href="https://github.com/OlegIGalkin/ProductTrailers"
            target="_blank"
            rel="noreferrer"
          >
            OlegIGalkin/ProductTrailers
          </a>
          .
        </p>
        <h2>Share This Website ❤️</h2>
        <ShareSection />
        <div className="innertube">
          <p>
            Created by{' '}
            <a href="https://x.com/OlegIGalkin" target="_blank" rel="noreferrer">
              Kentich
            </a>
          </p>
        </div>
      </Modal>
    </>
  );
}