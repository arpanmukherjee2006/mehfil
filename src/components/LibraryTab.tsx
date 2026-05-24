'use client';

import React from 'react';
import { Heart, Play, Clock, ArrowDownCircle, Trash2, ListMusic, Music, ToggleLeft, ToggleRight } from 'lucide-react';
import { usePlayer, Track } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import MusicWave from './MusicWave';

interface LibraryTabProps {
  setCurrentTab: (tab: string) => void;
  openCreatePlaylist: () => void;
}

export const LibraryTab: React.FC<LibraryTabProps> = ({ setCurrentTab, openCreatePlaylist }) => {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { likedSongs, playlists, listeningHistory, clearHistory, downloads, toggleDownload } = useLibrary();

  const handlePlayLiked = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedSongs.length > 0) {
      playTrack(likedSongs[0], likedSongs);
    }
  };

  const handleOpenPlaylist = (id: string) => {
    setCurrentTab(`playlist_${id}`);
  };

  return (
    <div className="space-y-10 pb-24 select-none">
      {/* Quick Access Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Liked Songs Banner */}
        <div
          onClick={() => setCurrentTab('liked_songs')}
          className="group relative rounded-2xl glass-panel p-6 flex flex-col justify-between cursor-pointer border border-zinc-800/80 shadow-emerald-glow overflow-hidden h-44"
        >
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-zinc-900/90 to-black pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow-emerald-glow">
              <Heart size={22} fill="black" className="text-black" />
            </div>
            {likedSongs.length > 0 && (
              <button
                onClick={handlePlayLiked}
                className="w-10 h-10 rounded-full bg-accent text-black flex items-center justify-center scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition duration-300 shadow-emerald-glow cursor-pointer"
              >
                <Play size={16} fill="black" className="ml-0.5" />
              </button>
            )}
          </div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white group-hover:text-accent transition">
              Liked Songs
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'} in your collection
            </p>
          </div>
        </div>

        {/* Downloads UI Banner */}
        <div
          onClick={() => setCurrentTab('downloads')}
          className="group relative rounded-2xl glass-panel p-6 flex flex-col justify-between cursor-pointer border border-zinc-800/80 shadow-emerald-glow overflow-hidden h-44"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-accent">
              <ArrowDownCircle size={22} />
            </div>
          </div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white group-hover:text-accent transition">
              Downloads
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              {downloads.length} {downloads.length === 1 ? 'song' : 'songs'} cached for offline simulation
            </p>
          </div>
        </div>
      </div>

      {/* Playlist Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
            <ListMusic size={18} className="text-accent" />
            Playlists
          </h3>
          <button
            onClick={openCreatePlaylist}
            className="text-xs font-semibold bg-accent text-black px-4 py-2 rounded-full hover:bg-emerald-400 transition shadow-emerald-glow cursor-pointer"
          >
            Create Playlist
          </button>
        </div>
        
        {playlists.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-zinc-900 rounded-2xl">
            You haven't created any playlists yet. Start creating!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {playlists.map((p) => (
              <div
                key={p._id}
                onClick={() => handleOpenPlaylist(p._id)}
                className="group glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer flex flex-col relative"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3 bg-zinc-950 flex items-center justify-center border border-zinc-900">
                  {p.songs.length > 0 ? (
                    <img
                      src={p.songs[0].thumbnail}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music size={32} className="text-zinc-700" />
                  )}
                  {/* Play Playlist Overlay */}
                  {p.songs.length > 0 && (
                    <div 
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        playTrack(p.songs[0], p.songs);
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-emerald-glow">
                        <Play size={16} fill="black" className="text-black ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>

                <h4 className="text-xs font-bold text-white group-hover:text-accent transition truncate">
                  {p.name}
                </h4>
                <p className="text-[10px] text-zinc-500 truncate mt-1">
                  {p.songs.length} {p.songs.length === 1 ? 'song' : 'songs'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* History List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
            <Clock size={18} className="text-accent" />
            Listening History
          </h3>
          {listeningHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-[10px] font-bold text-zinc-500 hover:text-red-400 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 size={12} />
              Clear
            </button>
          )}
        </div>

        {listeningHistory.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 border border-dashed border-zinc-900 rounded-2xl">
            No history recorded. Start listening!
          </div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden divide-y divide-zinc-900/60 max-h-96 overflow-y-auto">
            {listeningHistory.map((song, index) => {
              const isCurrent = currentTrack?.id === song.id;
              return (
                <div
                  key={`${song.id}-${index}`}
                  onClick={() => playTrack(song, listeningHistory)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900/40 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-zinc-600 font-bold w-4 text-center">
                      {index + 1}
                    </span>
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <h4 className={`text-xs font-semibold truncate ${isCurrent ? 'text-accent' : 'text-white'}`}>
                        {song.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {song.channelTitle}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isCurrent && isPlaying && (
                      <MusicWave isPlaying={isPlaying} />
                    )}
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {song.duration}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default LibraryTab;
