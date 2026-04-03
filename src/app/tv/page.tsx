"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type MouseEvent,
  type KeyboardEvent,
} from "react";
import {
  LiveBadge,
  PresenceAvatars,
  type Watcher,
} from "@/components/tv-player-components";

/* ============================================================
   Types
   ============================================================ */

interface TVContent {
  id: string;
  title: string;
  chosenBy: string;
  videoUrl: string;
  posterUrl?: string;
  isLive: boolean;
  duration: number; // total seconds
}

interface TVSession {
  channelNumber: number;
  channelName: string;
  content: TVContent;
  watchers: Watcher[];
  startedAt?: string; // ISO timestamp
}

/* ============================================================
   Demo Data
   ============================================================ */

const DEMO_SESSION: TVSession = {
  channelNumber: 1,
  channelName: "The Henderson Channel",
  content: {
    id: "demo-1",
    title: "Thanksgiving Outtakes 2024",
    chosenBy: "Grandma June",
    // Public domain sample video (Big Buck Bunny)
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    posterUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    isLive: true,
    duration: 596, // 9:56
  },
  watchers: [
    {
      id: "w1",
      name: "Grandma June",
      avatarUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&q=80",
      isSolo: false,
    },
    {
      id: "w2",
      name: "Sarah",
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&q=80",
      isSolo: false,
    },
    {
      id: "w3",
      name: "Mike",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&q=80",
      isSolo: false,
    },
    {
      id: "w4",
      name: "Lily",
      avatarUrl:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&q=80",
      isSolo: false,
    },
  ],
};

/* ============================================================
   Helpers
   ============================================================ */

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatClock(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/* ============================================================
   Custom Progress Bar
   ============================================================ */

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  buffered?: number;
  onSeek: (time: number) => void;
  isVisible: boolean;
}

function ProgressBar({
  currentTime,
  duration,
  buffered = 0,
  onSeek,
  isVisible,
}: ProgressBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [hoverX, setHoverX] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  // Update trackWidth when track becomes available
  useEffect(() => {
    if (trackRef.current) {
      setTrackWidth(trackRef.current.offsetWidth);
    }
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  const handleTrackClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current || duration === 0) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      setHoverX(e.clientX - rect.left);
    },
    []
  );

  const hoverTime =
    trackWidth > 0 && duration > 0
      ? formatTime((hoverX / trackWidth) * duration)
      : null;

  return (
    <div
      className="w-full px-0"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 200ms ease-out",
      }}
    >
      {/* Time labels */}
      <div className="flex justify-between mb-1.5">
        <span
          className="font-mono text-xs"
          style={{ color: "#A8A8B0", fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
        >
          {formatTime(currentTime)}
        </span>
        <span
          className="font-mono text-xs"
          style={{ color: "#A8A8B0", fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}
        >
          {formatTime(duration)}
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative w-full rounded-full cursor-pointer select-none"
        style={{
          height: hovering ? 12 : 8,
          background: "#3A3A3E",
          transition: "height 150ms ease-out",
        }}
        onClick={handleTrackClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={handleMouseMove}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
      >
        {/* Buffered */}
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${bufferedPct}%`,
            background: "rgba(255,255,255,0.1)",
          }}
        />

        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: "#C41E3A",
          }}
        />

        {/* Scrubber */}
        <div
          className="absolute top-1/2 rounded-full"
          style={{
            left: `${progress}%`,
            transform: "translate(-50%, -50%)",
            width: hovering ? 20 : 16,
            height: hovering ? 20 : 16,
            background: "#C41E3A",
            boxShadow: "0 0 10px rgba(196, 30, 58, 0.6)",
            transition: "width 150ms ease-out, height 150ms ease-out",
          }}
        />

        {/* Hover time tooltip */}
        {hovering && hoverTime && (
          <div
            className="absolute top-[-28px] font-mono text-xs px-1.5 py-0.5 rounded pointer-events-none"
            style={{
              left: hoverX,
              transform: "translateX(-50%)",
              background: "#252529",
              color: "#E8E8EC",
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: 11,
              whiteSpace: "nowrap",
            }}
          >
            {hoverTime}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Skip Button
   ============================================================ */

function SkipButton({
  seconds,
  onClick,
  isVisible,
  label,
}: {
  seconds: number;
  onClick: () => void;
  isVisible: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-full transition-all duration-150"
      style={{
        width: 48,
        height: 48,
        background: "transparent",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 200ms ease-out",
        cursor: "pointer",
      }}
      aria-label={`Skip ${seconds > 0 ? "forward" : "back"} ${Math.abs(seconds)} seconds`}
    >
      <span
        style={{
          fontSize: 10,
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          color: "#A8A8B0",
          lineHeight: 1,
          marginBottom: 2,
        }}
      >
        {label}
      </span>
      {seconds > 0 ? (
        /* Skip forward icon */
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#A8A8B0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="5 4 15 12 5 20 5 4" />
          <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
      ) : (
        /* Skip back icon */
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#A8A8B0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="19 20 9 12 19 4 19 20" />
          <line x1="5" y1="19" x2="5" y2="5" />
        </svg>
      )}
    </button>
  );
}

/* ============================================================
   Main TV Player Screen
   ============================================================ */

export default function TVPlayerPage() {
  const [session] = useState<TVSession>(DEMO_SESSION);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [clock, setClock] = useState(formatClock());

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* ---- Clock ticker ---- */
  useEffect(() => {
    const tick = () => setClock(formatClock());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* ---- Auto-hide controls after 3s of inactivity ---- */
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  /* ---- Video event handlers ---- */
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setIsBuffering(false);
    // Auto-hide after 3s
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const handleWaiting = useCallback(() => setIsBuffering(true), []);
  const handleCanPlay = useCallback(() => setIsBuffering(false), []);

  /* ---- Playback controls ---- */
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(time, v.duration || 0));
    setCurrentTime(v.currentTime);
  }, []);

  const skip = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v) return;
      seek(v.currentTime + delta);
    },
    [seek]
  );

  /* ---- Keyboard shortcuts ---- */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(10);
          break;
        case "f":
        case "F":
          e.preventDefault();
          if (videoRef.current) {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            } else {
              videoRef.current.requestFullscreen?.().catch(() => {});
            }
          }
          break;
        case "m":
        case "M":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
          }
          break;
        default:
          break;
      }
      showControls();
    };
    window.addEventListener("keydown", handleKey as unknown as EventListener);
    return () =>
      window.removeEventListener("keydown", handleKey as unknown as EventListener);
  }, [togglePlay, skip, showControls]);

  /* ---- Responsive: disable hover-persist on mobile ---- */
  const [isMobile, setIsMobile] = useState(() => {
    // Lazy initializer - only runs once on mount, not during render
    if (typeof window === 'undefined') return false;
    return window.matchMedia("(hover: none)").matches;
  });
  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    // Don't call setIsMobile synchronously - just set up listener
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className="relative w-full h-screen overflow-hidden select-none"
      style={{ backgroundColor: "#0D0D0F" }}
      onClick={showControls}
    >
      {/* ---- Video ---- */}
      <div className="player-container absolute inset-0">
        <video
          ref={videoRef}
          className="player-video w-full h-full"
          src={session.content.videoUrl}
          poster={session.content.posterUrl}
          style={{
            objectFit: "contain",
            backgroundColor: "#0D0D0F",
          }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handlePlay}
          onPause={handlePause}
          onWaiting={handleWaiting}
          onCanPlay={handleCanPlay}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          playsInline
          aria-label={`${session.content.title}, chosen by ${session.content.chosenBy}`}
        />
      </div>

      {/* ---- Vignette overlay ---- */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(13,13,15,0.5) 100%)",
        }}
        aria-hidden="true"
      />

      {/* =====================================================
          TOP BAR
          ===================================================== */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6"
        style={{
          height: 56,
          background: "rgba(13, 13, 15, 0.85)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          opacity: controlsVisible ? 1 : 0,
          transform: controlsVisible ? "translateY(0)" : "translateY(-8px)",
          transition: "opacity 200ms ease-out, transform 200ms ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Channel info */}
        <div className="flex items-center gap-3">
          {/* TV icon */}
          <div
            className="w-7 h-7 rounded flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(196,30,58,0.15)" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C41E3A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
              <polyline points="17 2 12 7 7 2" />
            </svg>
          </div>

          <div>
            {/* Family callsign */}
            <p
              className="font-heading font-semibold leading-none glow-gold"
              style={{
                fontSize: 17,
                color: "#D4AF37",
                fontFamily: "var(--font-heading, 'Oswald', sans-serif)",
              }}
            >
              {session.channelName}
            </p>
            {/* Channel number */}
            <p
              className="font-heading text-xs mt-0.5"
              style={{
                color: "#A8A8B0",
                fontFamily: "var(--font-heading, 'Oswald', sans-serif)",
                fontWeight: 400,
              }}
            >
              ★ Channel {session.channelNumber}
            </p>
          </div>
        </div>

        {/* Right: Presence avatars + clock + guide button */}
        <div className="flex items-center gap-3">
          <PresenceAvatars watchers={session.watchers} max={3} size="sm" />

          {/* Guide button */}
          <button
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-heading font-medium uppercase tracking-wide transition-colors duration-150"
            style={{
              background: "transparent",
              color: "#A8A8B0",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "var(--font-heading, 'Oswald', sans-serif)",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#E8E8EC")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#A8A8B0")
            }
            aria-label="Open TV Guide"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Guide
          </button>

          {/* Clock */}
          <span
            className="font-mono text-xs hidden sm:block"
            style={{
              color: "#A8A8B0",
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            }}
          >
            {clock}
          </span>
        </div>
      </div>

      {/* =====================================================
          CENTERED PLAY BUTTON + SKIP CONTROLS
          ===================================================== */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: "none" }}
      >
        {/* Skip back */}
        <div style={{ pointerEvents: "auto" }}>
          <SkipButton
            seconds={-10}
            onClick={() => skip(-10)}
            isVisible={controlsVisible}
            label="-10s"
          />
        </div>

        {/* Play/Pause or Buffering */}
        <div
          className="flex items-center justify-center mx-4 sm:mx-6"
          style={{ pointerEvents: "auto" }}
        >
          {isBuffering ? (
            /* Buffering spinner */
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 72,
                height: 72,
                backgroundColor: "rgba(196, 30, 58, 0.9)",
              }}
            >
              <svg
                className="animate-spin"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FDF8F3"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
          ) : !isPlaying ? (
            /* Large play button */
            <button
              onClick={togglePlay}
              className="rounded-full flex items-center justify-center glow-red transition-all duration-150"
              style={{
                width: 72,
                height: 72,
                backgroundColor: "#C41E3A",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              }}
              aria-label="Play video"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="#FDF8F3"
                stroke="none"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
          ) : null}
        </div>

        {/* Skip forward */}
        <div style={{ pointerEvents: "auto" }}>
          <SkipButton
            seconds={10}
            onClick={() => skip(10)}
            isVisible={controlsVisible}
            label="+10s"
          />
        </div>
      </div>

      {/* =====================================================
          BOTTOM STRIP
          ===================================================== */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 px-4 sm:px-6 pb-4 sm:pb-6"
        style={{
          background:
            "linear-gradient(to top, rgba(13,13,15,0.95) 0%, rgba(13,13,15,0.7) 60%, transparent 100%)",
          paddingTop: 40,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-xl px-4 sm:px-6 py-4"
          style={{
            background: "rgba(26, 26, 30, 0.88)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Title + LIVE badge row */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h1
                className="font-heading font-semibold truncate"
                style={{
                  fontSize: 18,
                  color: "#D4AF37",
                  fontFamily: "var(--font-heading, 'Oswald', sans-serif)",
                }}
              >
                {session.content.title}
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {session.content.isLive && <LiveBadge />}
            </div>
          </div>

          {/* Chosen by row */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="text-sm"
              style={{
                color: "#A8A8B0",
                fontFamily: "var(--font-sans, 'Source Sans 3', sans-serif)",
                fontSize: 14,
              }}
            >
              Chosen by:{" "}
              <span
                style={{
                  color: "#E8E8EC",
                  fontWeight: 600,
                }}
              >
                {session.content.chosenBy}
              </span>
            </span>
          </div>

          {/* Progress bar */}
          <ProgressBar
            currentTime={currentTime}
            duration={duration || session.content.duration}
            buffered={buffered}
            onSeek={seek}
            isVisible={controlsVisible}
          />
        </div>
      </div>
    </div>
  );
}
