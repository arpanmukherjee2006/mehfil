'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, MicOff, Play, Clock, Heart, Plus, Sparkles, Volume2 } from 'lucide-react';
import { usePlayer, Track } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import MusicWave from './MusicWave';

interface SearchTabProps {
  openCreatePlaylist: () => void;
}

export const SearchTab: React.FC<SearchTabProps> = ({ openCreatePlaylist }) => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { likedSongs, playlists, addSongToPlaylist, toggleLikeSong, isLiked } = useLibrary();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Voice Search states
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceText, setVoiceText] = useState('Listening...');
  const recognitionRef = useRef<any>(null);

  const trendingSearches = [
    'Arijit Singh Lofi Mix',
    'Sidhu Moose Wala Hits',
    'Weeknd Starboy Blinding Lights',
    'Late Night Lo-Fi Chill',
    'Workout Bhangra Hits',
    'Coke Studio Pakistan',
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setVoiceText('Speak now...');
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setVoiceText(`"${text}"`);
        setQuery(text);
        handleSearch(text);
        setTimeout(() => {
          setIsListening(false);
        }, 1500);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e.error);
        setVoiceText('Could not hear clearly. Try again.');
        setTimeout(() => setIsListening(false), 2000);
      };

      rec.onend = () => {
        // Handled in onresult or onerror
      };

      recognitionRef.current = rec;
    }
  }, []);

  const startVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    } else {
      // Simulate listening if not supported
      setIsListening(true);
      setVoiceText('Listening (Simulated)...');
      setTimeout(() => {
        const simulatedText = 'Hindi Lofi Remix';
        setVoiceText(`"${simulatedText}"`);
        setQuery(simulatedText);
        handleSearch(simulatedText);
        setTimeout(() => setIsListening(false), 1500);
      }, 3000);
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Trigger search
  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;

    setLoading(true);
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=20`);
      const data = await res.json();
      if (data.success && data.songs) {
        setResults(data.songs);
      }
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard trigger search
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  // Dynamic Suggestion generation (mocked for quick local feedback)
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      const pool = [
        'arijit singh sad', 'arijit singh romantic', 'lofi beats', 'lofi bollywood',
        'punjabi beats', 'diljit dosanjh', 'ap dhillon', 'rap drill', 'kr$na', 'raftaar',
        'devotional bhajan', 'hanuman chalisa lofi', 'gym workout trance', 'retro remix'
      ];
      const match = pool.filter((item) => item.includes(query.toLowerCase())).slice(0, 5);
      setSuggestions(match);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const [activePlaylistDropdown, setActivePlaylistDropdown] = useState<string | null>(null);

  const togglePlaylistDropdown = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    setActivePlaylistDropdown(activePlaylistDropdown === songId ? null : songId);
  };

  const handleAddToPlaylist = async (playlistId: string, track: Track) => {
    await addSongToPlaylist(playlistId, track);
    setActivePlaylistDropdown(null);
  };

  return (
    <div className="space-y-8 pb-24 relative select-none">
      {/* Search Input Container */}
      <div className="relative flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for songs, channels, or genres..."
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-accent transition text-sm shadow-emerald-glow"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsSearching(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white transition font-medium cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <button
          onClick={startVoiceSearch}
          className="bg-accent/15 hover:bg-accent border border-accent/20 text-accent hover:text-black p-4 rounded-2xl transition cursor-pointer"
          title="Voice Search"
        >
          <Mic size={18} />
        </button>
      </div>

      {/* Suggestion Dropdown */}
      {suggestions.length > 0 && !isSearching && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-2 space-y-1 -mt-6 z-30 relative shadow-2xl">
          {suggestions.map((sug) => (
            <button
              key={sug}
              onClick={() => {
                setQuery(sug);
                handleSearch(sug);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-zinc-900 rounded-xl text-xs text-zinc-300 hover:text-accent font-medium capitalize transition flex items-center gap-2 cursor-pointer"
            >
              <Search size={12} className="text-zinc-500" />
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Voice Search active overlay */}
      {isListening && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6">
          <div className="relative">
            {/* Pulsing ring animation */}
            <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping scale-150" />
            <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center relative shadow-emerald-neon">
              <Mic size={36} className="text-black animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-white">{voiceText}</h3>
            <p className="text-xs text-zinc-500">
              {voiceSupported ? 'Speech recognition listening...' : 'Simulated listening overlay'}
            </p>
          </div>
          <button
            onClick={stopVoiceSearch}
            className="mt-6 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase animate-pulse">
            Scanning YouTube...
          </span>
        </div>
      ) : (
        <>
          {/* Results Grid */}
          {results.length > 0 ? (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-accent" />
                Search Results
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {results.map((song) => {
                  const isCurrent = currentTrack?.id === song.id;
                  const isSongLiked = isLiked(song.id);
                  return (
                    <div
                      key={song.id}
                      onClick={() => playTrack(song, results)}
                      className="group glass-panel glass-panel-hover p-3 rounded-xl cursor-pointer relative flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-3 bg-zinc-950">
                          <img
                            src={song.thumbnail}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-[10px] px-1.5 py-0.5 rounded font-mono font-medium text-white">
                            {song.duration}
                          </span>
                          {/* Play overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-emerald-glow">
                              {isCurrent && isPlaying ? (
                                <MusicWave isPlaying={isPlaying} color="bg-black" />
                              ) : (
                                <Play size={16} fill="black" className="text-black ml-0.5" />
                              )}
                            </div>
                          </div>
                        </div>

                        <h4 className={`text-xs font-semibold line-clamp-2 leading-relaxed ${isCurrent ? 'text-accent' : 'text-white'}`}>
                          {song.title}
                        </h4>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.channelTitle}</p>
                      </div>

                      {/* Card actions */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-900/60">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLikeSong(song);
                          }}
                          className={`hover:scale-110 transition cursor-pointer ${
                            isSongLiked ? 'text-accent' : 'text-zinc-500 hover:text-white'
                          }`}
                        >
                          <Heart size={14} fill={isSongLiked ? 'currentColor' : 'none'} />
                        </button>

                        {/* Dropdown container */}
                        <div className="relative">
                          <button
                            onClick={(e) => togglePlaylistDropdown(e, song.id)}
                            className="w-6 h-6 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-accent flex items-center justify-center border border-zinc-800 cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                          
                          {activePlaylistDropdown === song.id && (
                            <div className="absolute right-0 bottom-8 w-44 bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 shadow-2xl z-20">
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-1">Add to playlist:</p>
                              {playlists.length === 0 ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openCreatePlaylist();
                                    setActivePlaylistDropdown(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 rounded text-[11px] text-zinc-400 hover:bg-zinc-900 hover:text-white cursor-pointer font-medium"
                                >
                                  + Create Playlist
                                </button>
                              ) : (
                                playlists.map((p) => (
                                  <button
                                    key={p._id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToPlaylist(p._id, song);
                                    }}
                                    className="w-full text-left truncate px-2 py-1.5 rounded text-[11px] text-zinc-400 hover:bg-zinc-900 hover:text-white cursor-pointer font-medium"
                                  >
                                    {p.name}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            isSearching && (
              <div className="py-24 text-center text-xs text-zinc-500">
                No songs found matching "{query}". Search for another track!
              </div>
            )
          )}

          {/* Trending Searches Grid */}
          {!isSearching && (
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Trending Searches
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {trendingSearches.map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => {
                      setQuery(keyword);
                      handleSearch(keyword);
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl border border-zinc-900 hover:border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/50 text-left text-xs font-semibold text-zinc-300 hover:text-accent transition cursor-pointer"
                  >
                    <Search size={14} className="text-zinc-500 shrink-0" />
                    {keyword}
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default SearchTab;
