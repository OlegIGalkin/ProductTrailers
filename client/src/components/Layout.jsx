import { useLayoutEffect, useRef, useState } from 'react';
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
  const menuRef = useRef(null);
  const [hasMoreMenuContent, setHasMoreMenuContent] = useState(false);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return undefined;

    const updateOverflow = () => {
      setHasMoreMenuContent(
        menu.scrollLeft + menu.clientWidth < menu.scrollWidth - 1,
      );
    };

    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(menu);
    menu.querySelectorAll('.menu-left, .menu-right').forEach((item) => {
      resizeObserver.observe(item);
    });
    menu.addEventListener('scroll', updateOverflow, { passive: true });
    updateOverflow();

    return () => {
      resizeObserver.disconnect();
      menu.removeEventListener('scroll', updateOverflow);
    };
  }, []);

  return (
    <>
      <div className="top-menu-shell">
        <header className="top-menu" ref={menuRef}>
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
        {hasMoreMenuContent && (
          <div className="menu-scroll-indicator" aria-hidden="true">›</div>
        )}
      </div>
      <main className="main-content">{children}</main>
    </>
  );
}