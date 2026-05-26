'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface Track {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string; // "m:ss" format
}

type RepeatMode = 'off' | 'track' | 'queue';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  durationSeconds: number;
  volume: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  queue: Track[];
  history: Track[];
  sleepTimer: number | null; // seconds remaining
  equalizer: {
    bass: number;
    vocal: number;
    electronic: number;
    classical: number;
    activePreset: 'flat' | 'bass' | 'vocal' | 'electronic' | 'classical' | 'custom';
  };
  
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setIsShuffle: (shuffle: boolean) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  setQueue: (queue: Track[]) => void;
  setSleepTimer: (seconds: number | null) => void;
  setEqualizerPreset: (preset: 'flat' | 'bass' | 'vocal' | 'electronic' | 'classical' | 'custom') => void;
  setCustomEqualizerBand: (band: 'bass' | 'vocal' | 'electronic' | 'classical', value: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [volume, setVolume] = useState(50);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [equalizer, setEqualizer] = useState({
    bass: 50,
    vocal: 50,
    electronic: 50,
    classical: 50,
    activePreset: 'flat' as 'flat' | 'bass' | 'vocal' | 'electronic' | 'classical' | 'custom',
  });

  const playerRef = useRef<any>(null);
  const iframeCreatedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sleepTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio API refs for background playback keep-alive
  const audioContextRef = useRef<AudioContext | null>(null);
  const silentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Background playback control refs (updates on every render to avoid TDZ and stale closures)
  const togglePlayRef = useRef<() => void>(() => {});
  const prevTrackRef = useRef<() => void>(() => {});
  const nextTrackRef = useRef<() => void>(() => {});
  const seekToRef = useRef<(sec: number) => void>(() => {});

  useEffect(() => {
    togglePlayRef.current = togglePlay;
    prevTrackRef.current = prevTrack;
    nextTrackRef.current = nextTrack;
    seekToRef.current = seekTo;
  });

  // Load YouTube Player API script
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Inject the YouTube Iframe API script if not already present
    if (!window.YT && !document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Define the global callback
    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    // If script already loaded but player not initialized
    if (window.YT && window.YT.Player && !playerRef.current) {
      initPlayer();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
      stopBackgroundKeepAlive();
    };
  }, []);

  // ─── Background Playback Keep-Alive ───────────────────────────────────────
  // Mobile Chrome pauses hidden iframes in background. We keep an AudioContext
  // alive with a silent buffer so the browser treats this page as active audio.

  const startBackgroundKeepAlive = () => {
    if (typeof window === 'undefined') return;

    try {
      // Create AudioContext if not exists
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current;

      // Resume if suspended (required after user gesture on mobile)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Play a silent buffer in a loop — keeps audio focus alive
      const playSilentBuffer = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
        const buffer = audioContextRef.current.createBuffer(1, audioContextRef.current.sampleRate * 0.5, audioContextRef.current.sampleRate);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start();
        silentSourceRef.current = source;
      };

      playSilentBuffer();

      // Re-play silent buffer every 20s to maintain audio focus
      if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = setInterval(() => {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
          }
          playSilentBuffer();
        }
      }, 20000);

    } catch (e) {
      console.warn('Background keep-alive setup failed:', e);
    }
  };

  const stopBackgroundKeepAlive = () => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    try {
      silentSourceRef.current?.stop();
    } catch (_) {}
  };

  // Handle page visibility change — resume AudioContext when tab comes back
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page came back to foreground
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
        // If YouTube player was paused by browser, resume it
        if (isPlaying && playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
          const state = playerRef.current.getPlayerState();
          // state 2 = paused, state -1 = unstarted
          if (state === 2 || state === -1) {
            setTimeout(() => {
              playerRef.current?.playVideo?.();
            }, 300);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying]);
  // ──────────────────────────────────────────────────────────────────────────

  const initPlayer = () => {
    if (playerRef.current || iframeCreatedRef.current) return;
    
    // Create container and player iframe if not exist
    let container = document.getElementById('yt-player-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'yt-player-container';
      container.style.position = 'absolute';
      container.style.width = '0px';
      container.style.height = '0px';
      container.style.overflow = 'hidden';
      container.style.pointerEvents = 'none';
      
      const iframePlaceholder = document.createElement('div');
      iframePlaceholder.id = 'yt-player-placeholder';
      container.appendChild(iframePlaceholder);
      document.body.appendChild(container);
    }

    iframeCreatedRef.current = true;
    
    try {
      playerRef.current = new window.YT.Player('yt-player-placeholder', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: {
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          origin: typeof window !== 'undefined' ? window.location.origin : ''
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
            const state = event.data;
            if (state === 1) { // Playing
              setIsPlaying(true);
              startTrackingProgress();
            } else if (state === 2) { // Paused
              setIsPlaying(false);
              stopTrackingProgress();
            } else if (state === 0) { // Ended
              setIsPlaying(false);
              stopTrackingProgress();
              handleSongEnd();
            } else if (state === 3) { // Buffering
              // Keep playing state as true but maybe show buffering UI if needed
            }
          },
          onError: (error: any) => {
            console.error('YouTube Player Error:', error.data);
            // Auto skip on error
            nextTrack();
          }
        }
      });
    } catch (e) {
      console.error('Error creating YouTube player instance:', e);
    }
  };

  // Convert duration string "m:ss" or "h:mm:ss" to seconds
  const durationToSeconds = (durationStr: string): number => {
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const startTrackingProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(Math.floor(time));
        const dur = playerRef.current.getDuration();
        if (dur && dur > 0) {
          setDurationSeconds(Math.floor(dur));
        }
      }
    }, 500);
  };

  const stopTrackingProgress = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Sync volume state with YouTube Player
  useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  // Handle sleep timer countdown
  useEffect(() => {
    if (sleepTimer !== null) {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
      
      sleepTimerIntervalRef.current = setInterval(() => {
        setSleepTimer((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            // Timer expired, pause music
            if (isPlaying) {
              togglePlay();
            }
            if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (sleepTimerIntervalRef.current) {
        clearInterval(sleepTimerIntervalRef.current);
        sleepTimerIntervalRef.current = null;
      }
    }

    return () => {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
    };
  }, [sleepTimer, isPlaying]);

  // 1. Sync browser tab title with currently playing track
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentTrack) {
      document.title = `${isPlaying ? '▶' : '⏸'} ${currentTrack.title} | Mehfile`;
    } else {
      document.title = 'Mehfile - Premium Music Streaming';
    }
  }, [currentTrack, isPlaying]);

  // 2. Sync Media Session Metadata with OS Media Hub
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !currentTrack) return;

    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.channelTitle,
        album: 'Mehfile Music',
        artwork: [
          { src: currentTrack.thumbnail, sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.thumbnail, sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.thumbnail, sizes: '192x192', type: 'image/jpeg' },
          { src: currentTrack.thumbnail, sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.thumbnail, sizes: '384x384', type: 'image/jpeg' },
          { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' },
        ],
      });
    } catch (e) {
      console.warn('Error setting Media Session Metadata:', e);
    }
  }, [currentTrack]);

  // 3. Sync Media Session Playback State (Playing/Paused)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // 4. Register Media Session Action Handlers exactly once
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => togglePlayRef.current());
      navigator.mediaSession.setActionHandler('pause', () => togglePlayRef.current());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrackRef.current());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrackRef.current());
      navigator.mediaSession.setActionHandler('seekto', (details: any) => {
        if (details.seekTime !== undefined) {
          seekToRef.current(details.seekTime);
        }
      });
    } catch (e) {
      console.warn('Error setting Media Session action handlers:', e);
    }
  }, []);

  // Play a specific track
  const playTrack = (track: Track, newQueue?: Track[]) => {
    if (!playerRef.current) {
      // Re-init player if it was not loaded
      initPlayer();
    }

    // Start background keep-alive on first user interaction (required for mobile AudioContext)
    startBackgroundKeepAlive();

    setCurrentTrack(track);
    setDurationSeconds(durationToSeconds(track.duration));
    setCurrentTime(0);
    setIsPlaying(true);

    // Track recently played history
    setHistory((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      return [track, ...filtered].slice(0, 50); // limit history to 50
    });

    // Handle Queue setup
    if (newQueue && newQueue.length > 0) {
      // Ensure current track is in queue, or insert it if not
      const exists = newQueue.some((qTrack) => qTrack.id === track.id);
      if (exists) {
        setQueueState(newQueue);
      } else {
        setQueueState([track, ...newQueue]);
      }
    } else {
      // If no queue passed, make sure current track is at least in current queue
      setQueueState((prevQueue) => {
        const exists = prevQueue.some((qTrack) => qTrack.id === track.id);
        if (exists) return prevQueue;
        return [...prevQueue, track];
      });
    }

    // Force player to load video
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById(track.id);
      playerRef.current.playVideo();
    } else {
      // If Player is not fully ready, keep polling for loadVideoById
      let retries = 0;
      const interval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.loadVideoById(track.id);
          playerRef.current.playVideo();
          clearInterval(interval);
        } else if (retries++ > 15) {
          clearInterval(interval);
        }
      }, 300);
    }
  };

  // Toggle playback
  const togglePlay = () => {
    if (!currentTrack) return;
    
    if (isPlaying) {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
      setIsPlaying(false);
    } else {
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        playerRef.current.playVideo();
      }
      setIsPlaying(true);
    }
  };

  // Play next track
  const nextTrack = () => {
    if (queue.length === 0 || !currentTrack) return;

    const currentIndex = queue.findIndex((track) => track.id === currentTrack.id);
    
    if (isShuffle) {
      // Pick a random track from queue (different from current if queue has > 1 song)
      if (queue.length > 1) {
        let randomIndex = currentIndex;
        while (randomIndex === currentIndex) {
          randomIndex = Math.floor(Math.random() * queue.length);
        }
        playTrack(queue[randomIndex]);
      } else {
        // Only 1 song, replay it
        seekTo(0);
      }
      return;
    }

    if (currentIndex < queue.length - 1) {
      // Play next song in queue
      playTrack(queue[currentIndex + 1]);
    } else {
      // End of queue
      if (repeatMode === 'queue') {
        // Loop back to start
        playTrack(queue[0]);
      } else {
        // Stop playing
        setIsPlaying(false);
        if (playerRef.current && typeof playerRef.current.stopVideo === 'function') {
          playerRef.current.stopVideo();
        }
      }
    }
  };

  // Play previous track
  const prevTrack = () => {
    if (queue.length === 0 || !currentTrack) return;

    // If current song is > 3 seconds, restart it first
    if (currentTime > 3) {
      seekTo(0);
      return;
    }

    const currentIndex = queue.findIndex((track) => track.id === currentTrack.id);

    if (isShuffle) {
      if (queue.length > 1) {
        let randomIndex = currentIndex;
        while (randomIndex === currentIndex) {
          randomIndex = Math.floor(Math.random() * queue.length);
        }
        playTrack(queue[randomIndex]);
      } else {
        seekTo(0);
      }
      return;
    }

    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    } else {
      // Start of queue
      if (repeatMode === 'queue') {
        // Loop back to the end
        playTrack(queue[queue.length - 1]);
      } else {
        // Restart current song
        seekTo(0);
      }
    }
  };

  // Seek playback position
  const seekTo = (seconds: number) => {
    if (!currentTrack) return;
    setCurrentTime(seconds);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seconds, true);
    }
  };

  // Handler for song end
  const handleSongEnd = () => {
    if (repeatMode === 'track') {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(0, true);
        playerRef.current.playVideo();
      }
      setIsPlaying(true);
    } else {
      nextTrack();
    }
  };

  // Add a track to the queue
  const addToQueue = (track: Track) => {
    setQueueState((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (exists) return prev;
      return [...prev, track];
    });
  };

  // Remove a track from queue
  const removeFromQueue = (trackId: string) => {
    setQueueState((prev) => prev.filter((track) => track.id !== trackId));
  };

  const setQueue = (newQueue: Track[]) => {
    setQueueState(newQueue);
  };

  // Set Equalizer Preset
  const setEqualizerPreset = (preset: 'flat' | 'bass' | 'vocal' | 'electronic' | 'classical' | 'custom') => {
    let eqVals = { bass: 50, vocal: 50, electronic: 50, classical: 50 };
    switch (preset) {
      case 'bass':
        eqVals = { bass: 85, vocal: 45, electronic: 65, classical: 40 };
        break;
      case 'vocal':
        eqVals = { bass: 40, vocal: 85, electronic: 45, classical: 70 };
        break;
      case 'electronic':
        eqVals = { bass: 75, vocal: 50, electronic: 85, classical: 55 };
        break;
      case 'classical':
        eqVals = { bass: 45, vocal: 70, electronic: 40, classical: 80 };
        break;
      case 'custom':
        return; // maintain existing values
    }
    setEqualizer({ ...eqVals, activePreset: preset });
  };

  // Set individual Equalizer bands
  const setCustomEqualizerBand = (band: 'bass' | 'vocal' | 'electronic' | 'classical', value: number) => {
    setEqualizer((prev) => ({
      ...prev,
      [band]: value,
      activePreset: 'custom',
    }));
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        durationSeconds,
        volume,
        repeatMode,
        isShuffle,
        queue,
        history,
        sleepTimer,
        equalizer,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
        setRepeatMode,
        setIsShuffle,
        addToQueue,
        removeFromQueue,
        setQueue,
        setSleepTimer,
        setEqualizerPreset,
        setCustomEqualizerBand,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
