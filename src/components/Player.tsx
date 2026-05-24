'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, 
  Volume2, VolumeX, Maximize2, Minimize2, Heart, Share2, 
  Sliders, Timer, ArrowDownCircle, ChevronDown, ListMusic 
} from 'lucide-react';
import { usePlayer, Track } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import MusicWave from './MusicWave';

interface PlayerProps {
  openEqualizer: () => void;
  openSleepTimer: () => void;
  openShare: (track: Track) => void;
}

export const Player: React.FC<PlayerProps> = ({ openEqualizer, openSleepTimer, openShare }) => {
  const {
    currentTrack, isPlaying, currentTime, durationSeconds, volume,
    repeatMode, isShuffle, queue, togglePlay, nextTrack, prevTrack,
    seekTo, setVolume, setRepeatMode, setIsShuffle, sleepTimer, equalizer
  } = usePlayer();

  const { likedSongs, toggleLikeSong, isLiked, downloads, toggleDownload, isDownloaded } = useLibrary();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(50);
  
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Toggle mute
  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  // Sync mute state on volume changes
  useEffect(() => {
    if (volume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [volume]);

  // Format seconds to MM:SS
  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekTo(parseInt(e.target.value, 10));
  };

  // Generate Mock Lyrics based on song title
  const getMockLyrics = (title: string) => {
    const defaultLyrics = [
      { time: 0, text: "🎵 (Instrumental Intro) 🎵" },
      { time: 8, text: "Welcome to the sound of Mehfile..." },
      { time: 14, text: "Feel the base echoing in the dark room" },
      { time: 20, text: "We are chasing shadows, under emerald glows" },
      { time: 26, text: "No worries, no stress, just you and the waves" },
      { time: 33, text: "Let the rhythm take over your heartbeat" },
      { time: 40, text: "Every lyric, every note, spinning like a record" },
      { time: 48, text: "Under the emerald green stars, we shine" },
      { time: 55, text: "Yeah, this is where we belong..." },
      { time: 62, text: "🎵 (Synth Solo Drop) 🎵" },
      { time: 76, text: "Chasing after the fast pace of the city" },
      { time: 82, text: "But right here, time stands still" },
      { time: 88, text: "Glassmorphic dreams and neon memories" },
      { time: 95, text: "We find ourselves in the frequency of sound" },
      { time: 102, text: "Let the music wash away the echoes of yesterday" },
      { time: 110, text: "Mehfile is our sanctuary, our vibe, our home" },
      { time: 118, text: "Hold onto the tempo, never let it go..." },
      { time: 125, text: "🎵 (Outro fade out) 🎵" }
    ];

    if (title.toLowerCase().includes('kesariya')) {
      return [
        { time: 0, text: "🎵 (Acoustic Flute Intro) 🎵" },
        { time: 6, text: "Mujhko saza de, ya chahe wafa de" },
        { time: 12, text: "Tujhpe hi khatam hai meri kahaani" },
        { time: 18, text: "Kesariya tera ishq hai piya" },
        { time: 24, text: "Rang jaaun jo main haath lagaaun" },
        { time: 30, text: "Din beete saara teri fikr mein" },
        { time: 36, text: "Rain saari teri khair manaaun" },
        { time: 42, text: "Patjhad ke mausam mein bhi jo tu aaye" },
        { time: 48, text: "Bahaar ban ke dil mera dharake" },
        { time: 55, text: "Kesariya tera ishq hai piya..." },
        { time: 65, text: "🎵 (Beautiful Violin Drop) 🎵" }
      ];
    }
    
    if (title.toLowerCase().includes('starboy')) {
      return [
        { time: 0, text: "🎵 (Dark Synth Intro) 🎵" },
        { time: 7, text: "I'm tryna put you in the worst mood, ah" },
        { time: 12, text: "P1 cleaner than your church shoes, ah" },
        { time: 16, text: "Milli point two just to hurt you, ah" },
        { time: 21, text: "House so empty, need a centerpiece" },
        { time: 25, text: "Twenty racks a table cut from ebony" },
        { time: 29, text: "Cut that ivory into skinny pieces" },
        { time: 33, text: "Then she clean it with her face man I love my baby" },
        { time: 37, text: "Look what you've done..." },
        { time: 41, text: "I'm a motherf***ing starboy!" },
        { time: 46, text: "Look what you've done..." },
        { time: 50, text: "I'm a motherf***ing starboy!" }
      ];
    }

    return defaultLyrics;
  };

  const lyrics = currentTrack ? getMockLyrics(currentTrack.title) : [];

  // Find currently active lyric line index
  const activeLyricIndex = lyrics.reduce((acc, lyric, index) => {
    if (currentTime >= lyric.time) {
      return index;
    }
    return acc;
  }, 0);

  // Auto-scroll lyrics
  useEffect(() => {
    if (isExpanded && lyricsContainerRef.current) {
      const activeElement = lyricsContainerRef.current.children[activeLyricIndex] as HTMLElement;
      if (activeElement) {
        lyricsContainerRef.current.scrollTo({
          top: activeElement.offsetTop - lyricsContainerRef.current.clientHeight / 2 + activeElement.clientHeight / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [activeLyricIndex, isExpanded]);

  if (!currentTrack) return null;

  const isSongLiked = isLiked(currentTrack.id);
  const isSongDownloaded = isDownloaded(currentTrack.id);

  return (
    <>
      {/* Sticky Bottom Player */}
      <div 
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-0 left-0 right-0 h-20 bg-black/90 border-t border-zinc-900 px-4 md:px-6 flex items-center justify-between z-40 select-none cursor-pointer backdrop-blur-lg hover:border-zinc-800 transition"
      >
        {/* Progress bar overlay (top border border-t accent line) */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-zinc-900">
          <div 
            className="h-full bg-accent shadow-emerald-glow"
            style={{ width: `${(currentTime / (durationSeconds || 1)) * 100}%` }}
          />
        </div>

        {/* Track Details */}
        <div className="flex items-center gap-3 w-1/3 min-w-0">
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className={`w-12 h-12 rounded-lg object-cover border border-zinc-800 ${
              isPlaying ? 'animate-spin-slow shadow-emerald-glow' : ''
            }`}
          />
          <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
            <h4 
              className="text-xs font-bold text-white truncate hover:underline hover:text-accent cursor-pointer"
              onClick={() => setIsExpanded(true)}
            >
              {currentTrack.title}
            </h4>
            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{currentTrack.channelTitle}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLikeSong(currentTrack);
            }}
            className={`hover:scale-110 transition shrink-0 ml-1.5 cursor-pointer ${
              isSongLiked ? 'text-accent' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Heart size={14} fill={isSongLiked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Media Controls */}
        <div 
          className="flex flex-col items-center gap-1.5 w-1/3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-5">
            <button
              onClick={setIsShuffle ? () => setIsShuffle(!isShuffle) : undefined}
              className={`hover:scale-105 transition cursor-pointer ${
                isShuffle ? 'text-accent shadow-emerald-glow' : 'text-zinc-500 hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle size={14} />
            </button>

            <button onClick={prevTrack} className="text-zinc-400 hover:text-white transition cursor-pointer">
              <SkipBack size={16} fill="currentColor" />
            </button>

            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-white text-black hover:scale-105 flex items-center justify-center transition cursor-pointer shadow"
            >
              {isPlaying ? (
                <Pause size={14} fill="black" className="text-black" />
              ) : (
                <Play size={14} fill="black" className="text-black ml-0.5" />
              )}
            </button>

            <button onClick={nextTrack} className="text-zinc-400 hover:text-white transition cursor-pointer">
              <SkipForward size={16} fill="currentColor" />
            </button>

            <button
              onClick={() => {
                if (repeatMode === 'off') setRepeatMode('queue');
                else if (repeatMode === 'queue') setRepeatMode('track');
                else setRepeatMode('off');
              }}
              className={`hover:scale-105 transition relative cursor-pointer ${
                repeatMode !== 'off' ? 'text-accent shadow-emerald-glow' : 'text-zinc-500 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              <Repeat size={14} />
              {repeatMode === 'track' && (
                <span className="absolute -top-1 -right-1 text-[7px] font-bold bg-accent text-black rounded-full px-0.5 leading-none">1</span>
              )}
            </button>
          </div>

          {/* Time Scrubber (Desktop view) */}
          <div className="hidden md:flex items-center gap-2 w-full max-w-sm">
            <span className="text-[9px] font-mono text-zinc-500">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={durationSeconds || 100}
              value={currentTime}
              onChange={handleProgressChange}
              className="flex-1 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-accent"
            />
            <span className="text-[9px] font-mono text-zinc-500">{formatTime(durationSeconds)}</span>
          </div>
        </div>

        {/* Volume & Layout Actions */}
        <div 
          className="flex items-center justify-end gap-4 w-1/3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sleep Timer Mini Indicator */}
          {sleepTimer !== null && (
            <div className="text-[10px] text-accent font-bold font-mono bg-accent/15 border border-accent/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Timer size={10} className="animate-spin-slow" />
              {Math.ceil(sleepTimer / 60)}m
            </div>
          )}

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-2">
            <button onClick={handleMuteToggle} className="text-zinc-400 hover:text-white cursor-pointer">
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className="w-20 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-accent"
            />
          </div>

          <button
            onClick={() => setIsExpanded(true)}
            className="text-zinc-400 hover:text-white transition cursor-pointer"
            title="Expand Full Screen"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      {/* Expanded Full-Screen Cinematic Player */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none">
          {/* Dynamic Blurred Background Cover */}
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-25 pointer-events-none scale-125 z-0"
            style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
          />

          {/* Header Bar */}
          <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-zinc-900/60 bg-gradient-to-b from-black/60 to-transparent">
            <button 
              onClick={() => setIsExpanded(false)}
              className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-900/40 transition cursor-pointer"
            >
              <ChevronDown size={22} />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Playing from</span>
              <span className="text-xs font-bold text-accent tracking-wide">Mehfile Cinema Stream</span>
            </div>
            <button 
              onClick={() => openShare(currentTrack)}
              className="text-zinc-400 hover:text-accent p-2 rounded-full hover:bg-zinc-900/40 transition cursor-pointer"
              title="Share track"
            >
              <Share2 size={18} />
            </button>
          </header>

          {/* Main Visuals & Lyrics Split View */}
          <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 p-6 md:p-12 items-center gap-8 overflow-y-auto lg:overflow-hidden max-h-[calc(100vh-160px)]">
            
            {/* Column 1: Large Artwork & Visualizer */}
            <div className="flex flex-col items-center justify-center space-y-8 select-none">
              <div className="relative group">
                {/* Glowing ring under art */}
                <div className="absolute inset-0 rounded-full bg-accent/20 filter blur-2xl scale-110 group-hover:bg-accent/35 transition" />
                
                {/* Visual Album Cover */}
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-zinc-950 border border-zinc-800/80 shadow-2xl relative z-10 overflow-hidden flex items-center justify-center">
                  <img
                    src={currentTrack.thumbnail}
                    alt={currentTrack.title}
                    className={`w-full h-full object-cover rounded-full ${
                      isPlaying ? 'animate-spin-slow' : ''
                    }`}
                  />
                  {/* Center vinyl hole */}
                  <div className="absolute w-8 h-8 rounded-full bg-black border-[3px] border-zinc-900 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                  </div>
                </div>
              </div>

              {/* Title & Stats */}
              <div className="text-center space-y-1.5 max-w-sm">
                <h3 className="text-lg md:text-2xl font-black text-white leading-snug line-clamp-2">
                  {currentTrack.title}
                </h3>
                <p className="text-xs text-accent font-semibold tracking-wider">
                  {currentTrack.channelTitle}
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => toggleLikeSong(currentTrack)}
                    className={`w-9 h-9 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-sm flex items-center justify-center transition border border-zinc-800 cursor-pointer ${
                      isSongLiked ? 'text-accent' : 'text-zinc-500 hover:text-white'
                    }`}
                    title="Like Song"
                  >
                    <Heart size={15} fill={isSongLiked ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    onClick={() => toggleDownload(currentTrack.id)}
                    className={`w-9 h-9 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-sm flex items-center justify-center transition border border-zinc-800 cursor-pointer ${
                      isSongDownloaded ? 'text-accent shadow-emerald-glow' : 'text-zinc-500 hover:text-white'
                    }`}
                    title={isSongDownloaded ? 'Downloaded Offline' : 'Download Mock'}
                  >
                    <ArrowDownCircle size={15} />
                  </button>

                  <button
                    onClick={openEqualizer}
                    className="w-9 h-9 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-500 hover:text-white text-sm flex items-center justify-center transition border border-zinc-800 cursor-pointer"
                    title="Equalizer"
                  >
                    <Sliders size={15} />
                  </button>

                  <button
                    onClick={openSleepTimer}
                    className={`w-9 h-9 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-sm flex items-center justify-center transition border border-zinc-800 cursor-pointer ${
                      sleepTimer !== null ? 'text-accent shadow-emerald-glow' : 'text-zinc-500 hover:text-white'
                    }`}
                    title="Sleep Timer"
                  >
                    <Timer size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Column 2: Synchronized Lyrics */}
            <div className="flex flex-col h-[300px] lg:h-full justify-between glass-panel rounded-2xl p-6 border border-zinc-800/80 max-w-lg w-full mx-auto overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4 select-none">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <ListMusic size={14} className="text-accent" />
                  Live Lyrics
                </span>
                {isPlaying && (
                  <MusicWave isPlaying={true} />
                )}
              </div>

              {/* Lyrics Scrollable container */}
              <div 
                ref={lyricsContainerRef}
                className="flex-1 overflow-y-auto space-y-5 pr-2 select-text scrollbar-none font-sans"
              >
                {lyrics.map((line, index) => {
                  const isActive = index === activeLyricIndex;
                  return (
                    <p
                      key={index}
                      className={`text-sm md:text-base font-bold transition duration-300 leading-relaxed cursor-pointer ${
                        isActive
                          ? 'text-accent scale-100 opacity-100'
                          : 'text-zinc-500 opacity-40 hover:opacity-70 scale-95 origin-left'
                      }`}
                      onClick={() => seekTo(line.time)}
                    >
                      {line.text}
                    </p>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Bottom Control Deck */}
          <div className="relative z-10 bg-gradient-to-t from-black to-black/80 px-6 py-8 border-t border-zinc-900/60 flex flex-col gap-4 select-none">
            {/* Custom slider progress */}
            <div className="flex items-center gap-3 w-full max-w-2xl mx-auto">
              <span className="text-[10px] font-mono text-zinc-500">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={durationSeconds || 100}
                value={currentTime}
                onChange={handleProgressChange}
                className="flex-1 h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-accent"
              />
              <span className="text-[10px] font-mono text-zinc-500">{formatTime(durationSeconds)}</span>
            </div>

            {/* Actions deck */}
            <div className="flex items-center justify-between w-full max-w-md mx-auto">
              <button
                onClick={setIsShuffle ? () => setIsShuffle(!isShuffle) : undefined}
                className={`p-2 transition cursor-pointer ${
                  isShuffle ? 'text-accent shadow-emerald-glow' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <Shuffle size={18} />
              </button>

              <button 
                onClick={prevTrack} 
                className="text-zinc-300 hover:text-white p-2 transition cursor-pointer"
              >
                <SkipBack size={20} fill="currentColor" />
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-accent text-black hover:scale-105 flex items-center justify-center transition cursor-pointer shadow-emerald-glow hover:shadow-emerald-neon"
              >
                {isPlaying ? (
                  <Pause size={24} fill="black" className="text-black" />
                ) : (
                  <Play size={24} fill="black" className="text-black ml-1" />
                )}
              </button>

              <button 
                onClick={nextTrack} 
                className="text-zinc-300 hover:text-white p-2 transition cursor-pointer"
              >
                <SkipForward size={20} fill="currentColor" />
              </button>

              <button
                onClick={() => {
                  if (repeatMode === 'off') setRepeatMode('queue');
                  else if (repeatMode === 'queue') setRepeatMode('track');
                  else setRepeatMode('off');
                }}
                className={`p-2 relative transition cursor-pointer ${
                  repeatMode !== 'off' ? 'text-accent shadow-emerald-glow' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <Repeat size={18} />
                {repeatMode === 'track' && (
                  <span className="absolute top-0 right-0 text-[7px] font-bold bg-accent text-black rounded-full px-0.5 leading-none">1</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Player;
