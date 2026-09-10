import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  allVideosWatched,
  getVideoToPlayNext,
  getYouTubeVideoIdFromUrl,
  storePlayedVideo,
  videoKey,
} from '../lib/videoLogic.js';

let ytApiLoading = false;
let ytApiReady = false;
const ytReadyCallbacks = [];

function loadYouTubeApi() {
  if (ytApiReady || (window.YT && window.YT.Player)) {
    ytApiReady = true;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    ytReadyCallbacks.push(resolve);
    if (ytApiLoading) return;
    ytApiLoading = true;
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      ytApiReady = true;
      if (prev) prev();
      ytReadyCallbacks.splice(0).forEach((cb) => cb());
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
}

function isValidYouTubeId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id);
}

const YouTubePlayer = forwardRef(
  (
    {
      filteredVideos,
      onPlayingChange,
      onMarkPlayed,
      onAllWatched,
      minutes,
      seconds,
    },
    ref
  ) => {
    const wrapperRef = useRef(null);
    const containerRef = useRef(null);
    const playerRef = useRef(null);
    const playingVideoRef = useRef(null);
    const videosRef = useRef(filteredVideos);
    const videoKeysRef = useRef(null);
    const onPlayingChangeRef = useRef(onPlayingChange);
    const onMarkPlayedRef = useRef(onMarkPlayed);
    const onAllWatchedRef = useRef(onAllWatched);
    const timeCheckIntervalRef = useRef(null);
    const isPlayingRef = useRef(false);
    const playerReadyRef = useRef(false);

    // Refs for minutes and seconds to avoid stale closures
    const minutesRef = useRef(minutes);
    const secondsRef = useRef(seconds);

    const [isPlaying, setIsPlaying] = useState(false);
    const [hasNextVideo, setHasNextVideo] = useState(false);

    // Keep refs up to date
    isPlayingRef.current = isPlaying;
    videosRef.current = filteredVideos;
    onPlayingChangeRef.current = onPlayingChange;
    onMarkPlayedRef.current = onMarkPlayed;
    onAllWatchedRef.current = onAllWatched;

    // Update duration refs whenever props change
    useEffect(() => {
      minutesRef.current = minutes;
      secondsRef.current = seconds;
    }, [minutes, seconds]);

    const getMaxDurationInSeconds = () => minutesRef.current * 60 + secondsRef.current;

    const updateNextButtonState = (currentVideo) => {
      const next = currentVideo
        ? getVideoToPlayNext(videosRef.current, currentVideo)
        : null;
      setHasNextVideo(!!next);
      return next;
    };

    const stopTimeChecking = () => {
      if (timeCheckIntervalRef.current) {
        clearInterval(timeCheckIntervalRef.current);
        timeCheckIntervalRef.current = null;
      }
    };

    const startTimeChecking = () => {
      stopTimeChecking();
      timeCheckIntervalRef.current = setInterval(() => {
        if (!playerRef.current || !isPlayingRef.current) return;
        try {
          const currentTime = playerRef.current.getCurrentTime?.();
          const maxDuration = getMaxDurationInSeconds();
          //console.log('Current time:', currentTime, 'Max duration:', maxDuration);
          if (maxDuration > 0 && typeof currentTime === 'number' && currentTime >= maxDuration) {
            stopTimeChecking();
            playNext();
          }
        } catch (err) {
          // ignore
        }
      }, 1000);
    };

    const setPlayingVideo = (nextVideo) => {
      playingVideoRef.current = nextVideo;
      videoKeysRef.current = videosRef.current
        ? videosRef.current.map((video) => videoKey(video))
        : null;
    };

    const playNext = () => {

      if (!playerRef.current) return;

      stopTimeChecking();

      const currentPlayingVideo = playingVideoRef.current;
      if (currentPlayingVideo) {
        storePlayedVideo(currentPlayingVideo.VideoURL, currentPlayingVideo.TimeWhenAdded);
        onMarkPlayedRef.current?.(currentPlayingVideo);
        if (allVideosWatched(videosRef.current)) {
          onAllWatchedRef.current?.();
        }
      }

      let nextVideo = getVideoToPlayNext(videosRef.current, currentPlayingVideo);
      let videoId = nextVideo ? getYouTubeVideoIdFromUrl(nextVideo.VideoURL) : null;

      while (nextVideo && (!videoId || !isValidYouTubeId(videoId))) {
        storePlayedVideo(nextVideo.VideoURL, nextVideo.TimeWhenAdded);
        onMarkPlayedRef.current?.(nextVideo);
        nextVideo = getVideoToPlayNext(videosRef.current, nextVideo);
        videoId = nextVideo ? getYouTubeVideoIdFromUrl(nextVideo.VideoURL) : null;
      }

      setPlayingVideo(nextVideo);
      onPlayingChangeRef.current?.(nextVideo);
      updateNextButtonState(nextVideo);

      if (videoId && playerRef.current.loadVideoById) {
        try {
          playerRef.current.loadVideoById(videoId);
          setIsPlaying(false);
        } catch (err) {
          playNext();
        }
      } else if (playerRef.current.stopVideo) {
        playerRef.current.stopVideo();
      }

    };

    // Expose playNext to parent via ref
    useImperativeHandle(ref, () => ({ playNext }), []);

    const loadFirstUnwatched = () => {
      if (!playerReadyRef.current || !playerRef.current) return;
      const nextVideo = getVideoToPlayNext(videosRef.current, null);
      const videoId = nextVideo ? getYouTubeVideoIdFromUrl(nextVideo.VideoURL) : null;
      if (videoId && isValidYouTubeId(videoId)) {
        setPlayingVideo(nextVideo);
        onPlayingChangeRef.current?.(nextVideo);
        updateNextButtonState(nextVideo);
        playerRef.current.loadVideoById(videoId);
        setIsPlaying(false);
      } else if (playerRef.current.stopVideo) {
        playerRef.current.stopVideo();
      }
    };

    // Re-start time check when duration changes while playing
    useEffect(() => {
      if (isPlayingRef.current && playerRef.current) {
        startTimeChecking();
      }
    }, [minutes, seconds]);

    // ----- Player initialisation (ONCE) -----
    useEffect(() => {
      let destroyed = false;
      let resizeObserver = null;

      const syncPlayerSize = () => {
        const wrapper = wrapperRef.current;
        if (!wrapper || !playerRef.current?.setSize) return;
        const width = wrapper.clientWidth;
        const height = wrapper.clientHeight;
        if (width > 0 && height > 0) playerRef.current.setSize(width, height);
      };

      loadYouTubeApi().then(() => {
        if (destroyed || !containerRef.current) return;

        const nextVideo = getVideoToPlayNext(videosRef.current, null);
        const videoId = nextVideo ? getYouTubeVideoIdFromUrl(nextVideo.VideoURL) : 'UnZWZXcVLOs';

        let finalVideo = nextVideo;
        let finalId = videoId;
        while (finalVideo && (!finalId || !isValidYouTubeId(finalId))) {
          storePlayedVideo(finalVideo.VideoURL, finalVideo.TimeWhenAdded);
          onMarkPlayedRef.current?.(finalVideo);
          finalVideo = getVideoToPlayNext(videosRef.current, finalVideo);
          finalId = finalVideo ? getYouTubeVideoIdFromUrl(finalVideo.VideoURL) : null;
        }

        setPlayingVideo(finalVideo);
        onPlayingChangeRef.current?.(finalVideo);
        updateNextButtonState(finalVideo);

        const wrapper = wrapperRef.current;
        const width = wrapper?.clientWidth || window.innerWidth;
        const height = wrapper?.clientHeight || Math.max(window.innerHeight - 70, 280);

        playerRef.current = new window.YT.Player(containerRef.current, {
          width,
          height,
          videoId: finalId,
          playerVars: {
            iv_load_policy: 3,
            autoplay: 1,
            mute: 1,
            controls: 1,
            rel: 0,
          },
          events: {
            onReady: () => {
              playerReadyRef.current = true;
              syncPlayerSize();
            },
            onStateChange: (e) => {
              if (e.data === window.YT.PlayerState.ENDED) {
                stopTimeChecking();
                playNext();
                //console.log('YT Player ended, playing next video');
              } else if (e.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                startTimeChecking();
                //console.log('YT Player started playing');
              } else if (e.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                stopTimeChecking();
                //console.log('YT Player paused');
              }
            },
            onError: () => {
              stopTimeChecking();
              playNext();
            },
          },
        });

        if (wrapper) {
          resizeObserver = new ResizeObserver(() => syncPlayerSize());
          resizeObserver.observe(wrapper);
        }
        window.addEventListener('resize', syncPlayerSize);
      });

      return () => {
        destroyed = true;
        stopTimeChecking();
        resizeObserver?.disconnect();
        window.removeEventListener('resize', syncPlayerSize);
        playerRef.current?.destroy?.();
        playerRef.current = null;
        playerReadyRef.current = false;
      };
    }, []); // player created only once

    // React to filteredVideos changes without re‑creating the player
    useEffect(() => {
      if (!playerReadyRef.current || !playerRef.current) return;
      if (!videoKeysRef.current || !videosRef.current) {
        loadFirstUnwatched();
        return;
      }
      const videoKeys = videosRef.current.map((video) => videoKey(video));
      if (videoKeys.toString() === videoKeysRef.current.toString()) {
        updateNextButtonState(playingVideoRef.current);
      } else {
        loadFirstUnwatched();
      }
    }, [filteredVideos]);

    return (
      <div className="youtube-player-container">
        <div ref={wrapperRef} className="videowrapper">
          <div ref={containerRef} id="myytplayer" />
        </div>
      </div>
    );
  }
);

export default YouTubePlayer;