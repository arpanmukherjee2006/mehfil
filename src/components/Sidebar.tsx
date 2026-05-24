'use client';

import React from 'react';
import { Home, Search, Library, Plus, Music, Sliders, Timer, Sparkles, AlertCircle } from 'lucide-react';
import { useLibrary } from '@/context/LibraryContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openCreatePlaylist: () => void;
  openEqualizer: () => void;
  openSleepTimer: () => void;
  openAIMood: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  openCreatePlaylist,
  openEqualizer,
  openSleepTimer,
  openAIMood,
}) => {
  const { playlists, isOfflineMode } = useLibrary();

  const mainNav = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Your Library', icon: Library },
  ];

  const premiumNav = [
    { id: 'ai-mood', label: 'AI Mood Generator', icon: Sparkles, action: openAIMood },
    { id: 'equalizer', label: 'Equalizer', icon: Sliders, action: openEqualizer },
    { id: 'sleep-timer', label: 'Sleep Timer', icon: Timer, action: openSleepTimer },
  ];

  return (
    <aside className="w-64 bg-black border-r border-zinc-900 p-6 flex flex-col h-full shrink-0 select-none">
      {/* Brand logo */}
      <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => setCurrentTab('home')}>
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-emerald-glow">
          <Music size={18} className="text-black font-extrabold animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-white font-sans">
            Mehfile<span className="text-accent">.</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-medium -mt-1 tracking-wider uppercase">
            Aesthetic Streamer
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="space-y-1 mb-6">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 block mb-2">
          Discover
        </span>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-accent/10 border-l-[3px] border-accent text-accent shadow-emerald-glow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-accent' : 'text-zinc-400'} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Premium Toolkit */}
      <div className="space-y-1 mb-6">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 block mb-2">
          Sound Lab
        </span>
        {premiumNav.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900/40 transition cursor-pointer"
            >
              <Icon size={18} className="text-zinc-400" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Playlists Header */}
      <div className="flex items-center justify-between px-3 mb-2">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          Playlists
        </span>
        <button
          onClick={openCreatePlaylist}
          className="text-zinc-400 hover:text-accent rounded-full p-0.5 hover:bg-zinc-900 transition cursor-pointer"
          title="Create Playlist"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Playlists List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-2">
        {playlists.length === 0 ? (
          <div className="text-xs text-zinc-600 px-3 py-4 text-center border border-dashed border-zinc-900 rounded-xl">
            No playlists yet. Create one above!
          </div>
        ) : (
          playlists.map((playlist) => {
            const isPlaylistActive = currentTab === `playlist_${playlist._id}`;
            return (
              <button
                key={playlist._id}
                onClick={() => setCurrentTab(`playlist_${playlist._id}`)}
                className={`w-full text-left truncate px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2.5 cursor-pointer ${
                  isPlaylistActive
                    ? 'bg-zinc-900 text-accent font-semibold border-r border-accent/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-accent/60 shrink-0" />
                <span className="truncate">{playlist.name}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Offline Status Footer */}
      {isOfflineMode && (
        <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-start gap-2 select-none">
          <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-semibold text-zinc-300">Local Cache Mode</span>
            <span className="text-[9px] text-zinc-500 leading-tight">Database offline. Syncing locally.</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
