import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  isVideoWatched,
  videoKey,
} from '../lib/videoLogic.js';

const PAGE_SIZE = 50;
const SEARCH_STORAGE_KEY = 'playlist_search_query';

export default function PlaylistTable({
  filteredVideos,
  playingVideo,
  playlistVersion,
  onMarkPlayedRef,
  maxDuration,
  favorites = [],
  onAddFavorite,
  onRemoveFavorite,
  onClearFavorites,
  isFavoritesView = false,
}) {
  const searchStorageKey = isFavoritesView
    ? 'favorites_search_query'
    : SEARCH_STORAGE_KEY;

  // Load search from localStorage (default '')
  const [search, setSearch] = useState(() => {
    return localStorage.getItem(searchStorageKey) || '';
  });

  const [page, setPage] = useState(1);
  const [rowStyles, setRowStyles] = useState({});

  // Persist search to localStorage
  useEffect(() => {
    localStorage.setItem(searchStorageKey, search);
  }, [search, searchStorageKey]);

  // Mark played callback
  const markPlayed = useCallback((video) => {
    const key = videoKey(video);
    setRowStyles((prev) => ({ ...prev, [key]: 'watched' }));
  }, []);

  useEffect(() => {
    if (onMarkPlayedRef) onMarkPlayedRef.current = markPlayed;
  }, [markPlayed, onMarkPlayedRef]);

  // Update row styles when playing video changes
  useEffect(() => {
    if (!playingVideo) return;
    const key = videoKey(playingVideo);
    setRowStyles((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k] === 'playing') next[k] = 'normal';
      });
      next[key] = 'playing';
      return next;
    });
  }, [playingVideo, playlistVersion]);

  // Compute filtered rows (all videos, only search filter)
  const filteredRows = useMemo(() => {
    const visibleVideos = filteredVideos; // show all
    return visibleVideos
      .map((video, index) => {
        const watched = isVideoWatched(video.VideoURL, video.TimeWhenAdded);
        const key = videoKey(video);
        const style = rowStyles[key] || (watched ? 'watched' : 'normal');
        return { video, index, watched, key, style };
      })
      .filter(({ video, index }) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const title = (video.Title || '').toLowerCase();
        const description = (video.Description || '').toLowerCase();
        const categories = (video.Categories || '').toLowerCase();
        return (
          title.includes(q) ||
          description.includes(q) ||
          categories.includes(q) ||
          String(video.Votes ?? 0).includes(q) ||
          String(video.Comments ?? 0).includes(q) ||
          String(index + 1).includes(q)
        );
      });
  }, [filteredVideos, search, rowStyles, playlistVersion]);

  const unwatchedCount = useMemo(
    () =>
      filteredVideos.filter(
        (video) => !isVideoWatched(video.VideoURL, video.TimeWhenAdded)
      ).length,
    [filteredVideos, playlistVersion]
  );
  const estimatedRemainingSeconds = unwatchedCount * maxDuration;

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  // Determine the page containing the playing video (if any)
  const getPlayingVideoPage = useCallback(() => {
    if (!playingVideo) return 1;
    const index = filteredRows.findIndex(
      (row) => videoKey(row.video) === videoKey(playingVideo)
    );
    if (index === -1) return 1;
    return Math.floor(index / PAGE_SIZE) + 1;
  }, [filteredRows, playingVideo]);

  // Auto‑navigate to playing video page only when search is empty
  useEffect(() => {
    if (search.trim() === '') {
      const targetPage = getPlayingVideoPage();
      setPage(targetPage);
    }
  }, [search, getPlayingVideoPage]);

  // When search becomes non‑empty, reset page to 1
  useEffect(() => {
    if (search.trim() !== '') {
      setPage(1);
    }
  }, [search]);

  // Keep page within valid bounds
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [page, totalPages]);

  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getRowBackgroundColor = (style) => {
    switch (style) {
      case 'playing':
        return '#0094FF';
      case 'watched':
        return '#C0C0C0';
      default:
        return 'transparent';
    }
  };

  return (
    <>
      {/* Controls: only search */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '6px',
          marginBottom: 12,
        }}
      >
        {isFavoritesView && (
          <button
            type="button"
            onClick={onClearFavorites}
            disabled={favorites.length === 0}
          >
            Delete All Favorites
          </button>
        )}
        <input
          type="search"
          placeholder={isFavoritesView ? 'Search favorites...' : 'Search playlist...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '320px',
            padding: '6px 8px',
            boxSizing: 'border-box',
          }}
        />
        {!isFavoritesView && <div>
          <strong>Unwatched: </strong>{unwatchedCount}
          {maxDuration !== 0 && (
            <>
              {'. '} <strong>Time left:</strong> {' '}
              {estimatedRemainingSeconds >= 3600 && (
                <>{Math.floor(estimatedRemainingSeconds / 3600)}h{' '}</>
              )}
              {Math.floor((estimatedRemainingSeconds % 3600) / 60)}m{' '}
              {estimatedRemainingSeconds % 60}s.
            </>
          )}
        </div>}
        {!isFavoritesView && <div>
          <span style={{ backgroundColor: '#0094FF', padding: '2px 6px' }}>Blue bg</span> watching &nbsp;
          <span style={{ backgroundColor: '#C0C0C0', padding: '2px 6px' }}>Gray bg</span> watched &nbsp;
        </div>}
      </div>

      {/* Main table */}
      <div className="table-wrapper">
        <table className="tTable">
          <thead>
            <tr className="table-head">
              <th>#</th>
              <th>Title</th>
              <th>Description</th>
              <th>Upvotes</th>
              <th>Comments</th>
              <th>Video</th>
              <th>Categories</th>
              {isFavoritesView ? <th>Delete</th> : <th>✨</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.map(({ video, style }, i) => {
              const titleCell = (
                video.SourceLink ? (
                  <a href={video.SourceLink} target="_blank" rel="noreferrer">
                    {video.Title}
                  </a>
                ) : (
                  video.Title
                )
              );
              const isFavorite = favorites.some(
                (favorite) => videoKey(favorite) === videoKey(video)
              );
              return (
                <tr key={videoKey(video)} style={{ backgroundColor: getRowBackgroundColor(style) }}>
                  <td>{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td>{titleCell}</td>
                  <td className="tTable-description">{video.Description || ''}</td>
                  <td>{video.Votes ?? 0}</td>
                  <td>{video.Comments ?? 0}</td>
                  <td>
                    <a href={video.VideoURL} target="_blank" rel="noreferrer">
                      🎥
                    </a>
                  </td>
                  <td>{video.Categories || ''}</td>
                  <td className="favorite-action-cell">
                    {isFavoritesView ? (
                      <button
                        type="button"
                        className="favorite-row-btn remove-favorite-btn"
                        onClick={() => onRemoveFavorite(video)}
                        aria-label={`Delete ${video.Title} from favorites`}
                        title="Delete from favorites"
                      >
                        ×
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`favorite-row-btn${isFavorite ? ' is-favorite' : ''}`}
                        onClick={() => onAddFavorite(video)}
                        aria-label={isFavorite ? `${video.Title} is in favorites` : `Add ${video.Title} to favorites`}
                        aria-pressed={isFavorite}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        ⭐
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-pager" style={{ padding: '8px', marginTop: 8 }}>
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span style={{ margin: '0 12px' }}>
          Page {page} of {totalPages} ({filteredRows.length} {isFavoritesView ? 'favorites' : 'videos'})
        </span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </>
  );
}