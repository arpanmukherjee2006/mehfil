'use client';

import React, { useState, useEffect } from 'react';
import { Play, Flame, Disc, Radio, Clock, Heart, Volume2, Plus } from 'lucide-react';
import { usePlayer, Track } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import MusicWave from './MusicWave';

interface HomeTabProps {
  setCurrentTab: (tab: string) => void;
  openCreatePlaylist: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ setCurrentTab, openCreatePlaylist }) => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { likedSongs, listeningHistory, playlists, addSongToPlaylist } = useLibrary();

  const [categories] = useState(['Trending', 'Hindi', 'Punjabi', 'Lofi', 'Rap', 'Devotional']);
  const [activeCategory, setActiveCategory] = useState('Trending');
  
  const [trendingSongs, setTrendingSongs] = useState<Track[]>([]);
  const [categorySongs, setCategorySongs] = useState<Track[]>([]);
  const [lofiSongs, setLofiSongs] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial content on mount
  useEffect(() => {
    const fetchHomeContent = async () => {
      setLoading(true);
      try {
        // Fetch Trending
        const trendRes = await fetch('/api/search?q=latest bollywood hits&limit=10');
        const trendData = await trendRes.json();
        if (trendData.success) setTrendingSongs(trendData.songs);

        // Fetch Lofi Bollywood
        const lofiRes = await fetch('/api/search?q=bollywood lofi songs chill&limit=10');
        const lofiData = await lofiRes.json();
        if (lofiData.success) setLofiSongs(lofiData.songs);

        // Fetch default category songs
        const catRes = await fetch(`/api/search?q=trending songs&limit=10`);
        const catData = await catRes.json();
        if (catData.success) setCategorySongs(catData.songs);
      } catch (err) {
        console.error('Error fetching home content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeContent();
  }, []);

  // Fetch new category songs when active category changes
  useEffect(() => {
    if (activeCategory === 'Trending') return;
    
    const fetchCategorySongs = async () => {
      try {
        const query = `${activeCategory} hit songs 2026`;
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
        const data = await res.json();
        if (data.success) {
          setCategorySongs(data.songs);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchCategorySongs();
  }, [activeCategory]);

  const handlePlayBanner = () => {
    if (trendingSongs.length > 0) {
      playTrack(trendingSongs[0], trendingSongs);
    }
  };

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
    <div className="space-y-10 pb-24">
      {/* Featured Banner */}
      <div className="relative rounded-2xl overflow-hidden glass-panel h-64 md:h-80 flex flex-col justify-end p-6 md:p-10 select-none group border border-zinc-800/80 shadow-emerald-glow">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ 
            backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.95) 20%, rgba(0,0,0,0.3) 100%), url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&q=80')` 
          }}
        />
        
        {/* Glow accent */}
        <div className="absolute top-10 right-10 w-44 h-44 rounded-full bg-accent/15 filter blur-3xl" />

        <div className="relative z-10 space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/20 border border-accent/40 rounded-full text-accent text-xs font-semibold uppercase tracking-wider">
            <Flame size={12} className="animate-bounce" />
            Featured Release
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
            Mehfil Hits 2026
          </h2>
          
          <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed">
            Unwind with our curated playlist of the month, loaded with viral chart-busters and soulful acoustic sounds.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handlePlayBanner}
              className="flex items-center gap-2 px-6 py-3 bg-accent text-black hover:bg-emerald-400 font-bold rounded-full transition shadow-emerald-glow hover:shadow-emerald-neon cursor-pointer text-sm"
            >
              <Play size={16} fill="black" />
              Play Album
            </button>
            <button
              onClick={() => setCurrentTab('search')}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-900/80 hover:bg-zinc-800 text-white font-semibold rounded-full border border-zinc-800/80 transition text-sm cursor-pointer"
            >
              Search More
            </button>
          </div>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 border ${
              activeCategory === cat
                ? 'bg-accent border-accent text-black shadow-emerald-glow'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main content loader */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase animate-pulse">Loading Vibes...</span>
        </div>
      ) : (
        <>
          {/* Recently Played */}
          {listeningHistory.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                <Clock size={18} className="text-accent" />
                Recently Played
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {listeningHistory.slice(0, 6).map((song, index) => {
                  const isCurrent = currentTrack?.id === song.id;
                  return (
                    <div
                      key={`${song.id}-${index}`}
                      onClick={() => playTrack(song, listeningHistory)}
                      className="group glass-panel glass-panel-hover p-3 rounded-xl cursor-pointer flex flex-col items-center relative overflow-hidden"
                    >
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3">
                        <img
                          src={song.thumbnail}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Play Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-emerald-glow">
                            {isCurrent && isPlaying ? (
                              <MusicWave isPlaying={true} color="bg-black" />
                            ) : (
                              <Play size={16} fill="black" className="text-black ml-0.5" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full text-center">
                        <h4 className={`text-xs font-semibold truncate ${isCurrent ? 'text-accent' : 'text-white'}`}>
                          {song.title}
                        </h4>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.channelTitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Dynamic Category Playlist */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                <Disc size={18} className="text-accent" />
                {activeCategory === 'Trending' ? 'Trending Hits' : `${activeCategory} Special`}
              </h3>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x select-none">
              {(activeCategory === 'Trending' ? trendingSongs : categorySongs).map((song, index) => {
                const isCurrent = currentTrack?.id === song.id;
                return (
                  <div
                    key={`${song.id}-${index}`}
                    className="w-40 shrink-0 group glass-panel glass-panel-hover p-3 rounded-xl cursor-pointer snap-start relative flex flex-col"
                    onClick={() => playTrack(song, activeCategory === 'Trending' ? trendingSongs : categorySongs)}
                  >
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Play hover button */}
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

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-semibold truncate ${isCurrent ? 'text-accent' : 'text-white'}`}>
                        {song.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.channelTitle}</p>
                    </div>

                    {/* Playlist Quick Add Toggle */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => togglePlaylistDropdown(e, song.id)}
                        className="w-6 h-6 rounded-full bg-black/80 hover:bg-black text-white hover:text-accent flex items-center justify-center border border-zinc-800"
                      >
                        <Plus size={12} />
                      </button>
                      
                      {activePlaylistDropdown === song.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 shadow-xl z-20">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-1 select-none">Add to:</p>
                          {playlists.length === 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCreatePlaylist();
                                setActivePlaylistDropdown(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded text-[11px] text-zinc-400 hover:bg-zinc-900 hover:text-white cursor-pointer"
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
                                className="w-full text-left truncate px-2 py-1.5 rounded text-[11px] text-zinc-400 hover:bg-zinc-900 hover:text-white cursor-pointer"
                              >
                                {p.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* LoFi Relaxing Corner */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Radio size={18} className="text-accent" />
              Chill & Lofi Vibes
            </h3>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x select-none">
              {lofiSongs.map((song, index) => {
                const isCurrent = currentTrack?.id === song.id;
                return (
                  <div
                    key={`${song.id}-${index}`}
                    className="w-40 shrink-0 group glass-panel glass-panel-hover p-3 rounded-xl cursor-pointer snap-start relative flex flex-col"
                    onClick={() => playTrack(song, lofiSongs)}
                  >
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
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

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-semibold truncate ${isCurrent ? 'text-accent' : 'text-white'}`}>
                        {song.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.channelTitle}</p>
                    </div>

                    {/* Playlist Quick Add */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => togglePlaylistDropdown(e, song.id)}
                        className="w-6 h-6 rounded-full bg-black/80 hover:bg-black text-white hover:text-accent flex items-center justify-center border border-zinc-800"
                      >
                        <Plus size={12} />
                      </button>
                      
                      {activePlaylistDropdown === song.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 shadow-xl z-20">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-1 select-none">Add to:</p>
                          {playlists.length === 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCreatePlaylist();
                                setActivePlaylistDropdown(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded text-[11px] text-zinc-400 hover:bg-zinc-900 hover:text-white cursor-pointer"
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
                                className="w-full text-left truncate px-2 py-1.5 rounded text-[11px] text-zinc-400 hover:bg-zinc-900 hover:text-white cursor-pointer"
                              >
                                {p.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default HomeTab;
