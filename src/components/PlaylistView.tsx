'use client';

import React, { useState, useEffect } from 'react';
import { Play, Trash2, Heart, Clock, Music, Search, Plus, Calendar, AlertCircle } from 'lucide-react';
import { usePlayer, Track } from '@/context/PlayerContext';
import { useLibrary, LocalPlaylist } from '@/context/LibraryContext';
import MusicWave from './MusicWave';

interface PlaylistViewProps {
  playlistId: string;
  setCurrentTab: (tab: string) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlistId, setCurrentTab }) => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { 
    playlists, 
    likedSongs, 
    toggleLikeSong, 
    isLiked, 
    removeSongFromPlaylist, 
    addSongToPlaylist,
    deletePlaylist,
    isOfflineMode 
  } = useLibrary();

  const [playlist, setPlaylist] = useState<LocalPlaylist | null>(null);
  
  // Quick Add states
  const [quickQuery, setQuickQuery] = useState('');
  const [quickResults, setQuickResults] = useState<Track[]>([]);
  const [quickLoading, setQuickLoading] = useState(false);

  // Sync playlist state from Library Context
  useEffect(() => {
    // Special handling for liked_songs & downloads
    if (playlistId === 'liked_songs') {
      setPlaylist({
        _id: 'liked_songs',
        name: 'Liked Songs',
        description: 'Your favorite tracks collection.',
        songs: likedSongs,
        createdAt: new Date().toISOString()
      });
      return;
    }

    const currentPlaylist = playlists.find((p) => p._id === playlistId);
    if (currentPlaylist) {
      setPlaylist(currentPlaylist);
    } else {
      setPlaylist(null);
    }
  }, [playlistId, playlists, likedSongs]);

  const handlePlayPlaylist = () => {
    if (playlist && playlist.songs.length > 0) {
      playTrack(playlist.songs[0], playlist.songs);
    }
  };

  const handleDelete = async () => {
    if (!playlist) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete "${playlist.name}"?`);
    if (confirmDelete) {
      await deletePlaylist(playlist._id);
      setCurrentTab('library');
    }
  };

  const handleRemoveTrack = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (!playlist) return;
    await removeSongFromPlaylist(playlist._id, trackId);
  };

  // Quick Add Search
  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;

    setQuickLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(quickQuery)}&limit=5`);
      const data = await res.json();
      if (data.success && data.songs) {
        setQuickResults(data.songs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQuickLoading(false);
    }
  };

  const handleQuickAdd = async (track: Track) => {
    if (!playlist) return;
    await addSongToPlaylist(playlist._id, track);
    // Remove from quick results after adding
    setQuickResults(quickResults.filter((t) => t.id !== track.id));
  };

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="text-zinc-600" size={32} />
        <span className="text-xs text-zinc-500 font-semibold uppercase">Playlist not found</span>
        <button onClick={() => setCurrentTab('library')} className="text-xs text-accent underline mt-2">
          Back to Library
        </button>
      </div>
    );
  }

  const isLikedSongsTab = playlistId === 'liked_songs';

  return (
    <div className="space-y-8 pb-24 select-none">
      {/* Header Banner */}
      <div className="relative rounded-2xl glass-panel p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-end border border-zinc-800/80 shadow-emerald-glow overflow-hidden">
        {/* Blurred BG matching artwork */}
        <div 
          className="absolute inset-0 opacity-15 filter blur-3xl pointer-events-none scale-125 z-0"
          style={{ 
            backgroundImage: `url(${playlist.songs[0]?.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80'})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        />

        <div className="w-40 h-40 rounded-xl bg-zinc-950 flex items-center justify-center shrink-0 border border-zinc-800 relative z-10 overflow-hidden shadow-2xl">
          {playlist.songs.length > 0 ? (
            <img
              src={playlist.songs[0].thumbnail}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music size={52} className="text-zinc-700" />
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-2 relative z-10">
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/15 px-2.5 py-1 rounded-full">
            Playlist
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
            {playlist.name}
          </h2>
          {playlist.description && (
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {playlist.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-zinc-500 pt-1.5 font-medium">
            <span>{playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Created {new Date(playlist.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-3 relative z-10 shrink-0">
          {playlist.songs.length > 0 && (
            <button
              onClick={handlePlayPlaylist}
              className="w-12 h-12 rounded-full bg-accent text-black hover:bg-emerald-400 flex items-center justify-center shadow-emerald-glow hover:shadow-emerald-neon transition duration-300 cursor-pointer"
              title="Play Playlist"
            >
              <Play size={20} fill="black" className="ml-1" />
            </button>
          )}
          {!isLikedSongsTab && (
            <button
              onClick={handleDelete}
              className="w-10 h-10 rounded-full bg-red-950/20 border border-red-900/50 hover:bg-red-600 text-red-500 hover:text-black flex items-center justify-center transition duration-300 cursor-pointer"
              title="Delete Playlist"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tracks Table / List */}
      <section className="space-y-4">
        {playlist.songs.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-500 border border-dashed border-zinc-900 rounded-2xl">
            This playlist is empty. Search and add tracks below!
          </div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[40px_1fr_40px] md:grid-cols-[40px_2fr_1fr_40px_40px] px-6 py-3 border-b border-zinc-900 text-[10px] font-bold text-zinc-500 uppercase tracking-widest select-none">
              <span className="text-center">#</span>
              <span>Title</span>
              <span className="hidden md:block">Channel</span>
              <span className="hidden md:block text-center"><Clock size={12} className="inline" /></span>
              <span></span>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-zinc-900/40">
              {playlist.songs.map((song, index) => {
                const isCurrent = currentTrack?.id === song.id;
                const isSongLiked = isLiked(song.id);
                return (
                  <div
                    key={`${song.id}-${index}`}
                    onClick={() => playTrack(song, playlist.songs)}
                    className="grid grid-cols-[40px_1fr_40px] md:grid-cols-[40px_2fr_1fr_40px_40px] px-6 py-3.5 hover:bg-zinc-900/40 transition items-center cursor-pointer group"
                  >
                    <span className="text-center text-xs font-semibold text-zinc-600 group-hover:text-accent">
                      {isCurrent && isPlaying ? (
                        <div className="flex justify-center">
                          <MusicWave isPlaying={isPlaying} />
                        </div>
                      ) : (
                        index + 1
                      )}
                    </span>

                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover shrink-0 bg-zinc-900"
                      />
                      <div className="min-w-0">
                        <h4 className={`text-xs font-semibold truncate ${isCurrent ? 'text-accent' : 'text-white'}`}>
                          {song.title}
                        </h4>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5 md:hidden">
                          {song.channelTitle}
                        </p>
                      </div>
                    </div>

                    <span className="hidden md:block text-xs text-zinc-400 truncate pr-4">
                      {song.channelTitle}
                    </span>

                    <span className="hidden md:block text-xs font-mono text-zinc-500 text-center">
                      {song.duration}
                    </span>

                    <div className="flex items-center justify-end gap-3.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeSong(song);
                        }}
                        className={`hover:scale-110 transition cursor-pointer shrink-0 ${
                          isSongLiked ? 'text-accent' : 'text-zinc-600 hover:text-white'
                        }`}
                      >
                        <Heart size={14} fill={isSongLiked ? 'currentColor' : 'none'} />
                      </button>
                      
                      {!isLikedSongsTab && (
                        <button
                          onClick={(e) => handleRemoveTrack(e, song.id)}
                          className="text-zinc-600 hover:text-red-500 transition cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
                          title="Remove from Playlist"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Add Songs Quick Panel (Not visible on Liked Songs) */}
      {!isLikedSongsTab && (
        <section className="space-y-4 border-t border-zinc-900 pt-8">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Search size={14} className="text-accent" />
            Let's add something to this playlist
          </h3>
          
          <form onSubmit={handleQuickSearch} className="flex gap-2">
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Search YouTube for tracks to add..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent transition"
            />
            <button
              type="submit"
              disabled={quickLoading || !quickQuery.trim()}
              className="bg-accent text-black px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-400 transition text-xs flex items-center gap-1.5 cursor-pointer shadow-emerald-glow"
            >
              Search
            </button>
          </form>

          {quickLoading && (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
          )}

          {quickResults.length > 0 && (
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden divide-y divide-zinc-900/60 shadow-inner">
              {quickResults.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/20 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-10 h-10 rounded object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">{song.title}</h4>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{song.channelTitle}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3.5">
                    <span className="text-[10px] font-mono text-zinc-500">{song.duration}</span>
                    <button
                      onClick={() => handleQuickAdd(song)}
                      className="bg-zinc-900 hover:bg-accent border border-zinc-800 hover:border-accent text-zinc-400 hover:text-black px-3.5 py-1.5 rounded-full text-[10px] font-bold transition cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default PlaylistView;
