import CompactDurationControls from './CompactDurationControls';

export default function Layout({
  children,
  onFilterClick,
  onPlaylistClick,
  onAboutClick,
  onNextClick,
  minutes,
  seconds,
  onMinutesChange,
  onSecondsChange,
  hasNextVideo,
}) {
  return (
    <>
      <header className="top-menu">
        <div className="menu-left">
          <span className="menu-logo">🍿</span>
          <span className="menu-title">Product Trailers</span>
        </div>
        <div className="menu-right">
          <button className="menu-btn" onClick={onFilterClick}>Sort/Filter</button>
          <button className="menu-btn" onClick={onPlaylistClick}>Playlist</button>
          <button className="menu-btn" onClick={onAboutClick}>About</button>
          <button
            className="menu-btn next-btn"
            onClick={onNextClick}
            disabled={!hasNextVideo}
          >
            Next Video ▶
          </button>
          <CompactDurationControls
            minutes={minutes}
            seconds={seconds}
            onMinutesChange={onMinutesChange}
            onSecondsChange={onSecondsChange}
          />
        </div>
      </header>
      <main className="main-content">{children}</main>
    </>
  );
}