'use client';

import React, { useState } from 'react';
import { Home, Search, Library, Music, Sparkles } from 'lucide-react';

// Context imports
import { usePlayer, Track } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';

// Component imports
import Sidebar from '@/components/Sidebar';
import HomeTab from '@/components/HomeTab';
import SearchTab from '@/components/SearchTab';
import LibraryTab from '@/components/LibraryTab';
import PlaylistView from '@/components/PlaylistView';
import Player from '@/components/Player';

// Dialog Modals
import { 
  CreatePlaylistDialog, 
  EqualizerDialog, 
  SleepTimerDialog, 
  AIMoodDialog, 
  ShareSongDialog 
} from '@/components/Dialogs';

export default function Dashboard() {
  const { currentTrack } = usePlayer();
  const { isOfflineMode } = useLibrary();

  // Navigation state: 'home' | 'search' | 'library' | 'liked_songs' | 'downloads' | 'playlist_[id]'
  const [currentTab, setCurrentTab] = useState<string>('home');

  // Modal open states
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isAIMoodOpen, setIsAIMoodOpen] = useState(false);
  const [shareTrack, setShareTrack] = useState<Track | null>(null);

  const handleOpenPlaylist = (playlistId: string) => {
    setCurrentTab(`playlist_${playlistId}`);
  };

  const renderActiveTab = () => {
    if (currentTab === 'home') {
      return (
        <HomeTab 
          setCurrentTab={setCurrentTab} 
          openCreatePlaylist={() => setIsCreatePlaylistOpen(true)} 
        />
      );
    }
    
    if (currentTab === 'search') {
      return (
        <SearchTab 
          openCreatePlaylist={() => setIsCreatePlaylistOpen(true)} 
        />
      );
    }
    
    if (currentTab === 'library') {
      return (
        <LibraryTab 
          setCurrentTab={setCurrentTab} 
          openCreatePlaylist={() => setIsCreatePlaylistOpen(true)} 
        />
      );
    }

    if (currentTab === 'liked_songs') {
      return (
        <PlaylistView 
          playlistId="liked_songs" 
          setCurrentTab={setCurrentTab} 
        />
      );
    }

    if (currentTab === 'downloads') {
      return (
        <PlaylistView 
          playlistId="liked_songs" // Mock downloads as liked songs details
          setCurrentTab={setCurrentTab} 
        />
      );
    }

    if (currentTab.startsWith('playlist_')) {
      const playlistId = currentTab.replace('playlist_', '');
      return (
        <PlaylistView 
          playlistId={playlistId} 
          setCurrentTab={setCurrentTab} 
        />
      );
    }

    // Default Fallback
    return <HomeTab setCurrentTab={setCurrentTab} openCreatePlaylist={() => setIsCreatePlaylistOpen(true)} />;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-zinc-100 relative font-sans">
      
      {/* Decorative Glowing blobs */}
      <div className="bg-glow-emerald top-[-100px] left-[-50px]" />
      <div className="bg-glow-emerald bottom-[-100px] right-[-50px]" style={{ opacity: 0.08 }} />

      {/* Main Layout Container */}
      <div className="flex flex-1 w-full h-full relative z-10 overflow-hidden">
        
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden md:block h-full shrink-0">
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            openCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
            openEqualizer={() => setIsEqualizerOpen(true)}
            openSleepTimer={() => setIsSleepTimerOpen(true)}
            openAIMood={() => setIsAIMoodOpen(true)}
          />
        </div>

        {/* Scrollable Dashboard Panel */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-zinc-950/20 via-black to-black">
          
          {/* Header Bar */}
          <header className="h-16 border-b border-zinc-950 px-6 flex items-center justify-between shrink-0 bg-black/40 backdrop-blur-md sticky top-0 z-30 select-none">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-white capitalize font-sans tracking-wide">
                {currentTab === 'home' ? '🎵 Good Evening' : currentTab.replace('playlist_', '').replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Quick AI Trigger */}
              <button
                onClick={() => setIsAIMoodOpen(true)}
                className="bg-accent/15 border border-accent/25 text-accent hover:bg-accent hover:text-black font-semibold text-xs rounded-full px-4 py-2 flex items-center gap-1.5 transition cursor-pointer shadow-emerald-glow"
              >
                <Sparkles size={12} />
                Ask AI
              </button>
            </div>
          </header>

          {/* Tab Content Window */}
          <div className={`flex-1 overflow-y-auto px-6 py-8 ${currentTrack ? 'pb-52 md:pb-28' : 'pb-20 md:pb-8'}`}>
            {renderActiveTab()}
          </div>
        </main>
      </div>

      {/* Bottom Sticky Player (Fades in when a track is cued) */}
      {currentTrack && (
        <Player
          openEqualizer={() => setIsEqualizerOpen(true)}
          openSleepTimer={() => setIsSleepTimerOpen(true)}
          openShare={(track) => setShareTrack(track)}
        />
      )}

      {/* Mobile Sticky Navigation (hidden on desktop) */}
      <nav className={`flex md:hidden fixed left-0 right-0 h-16 bg-zinc-950/90 border-t border-zinc-900/60 justify-around items-center z-30 backdrop-blur-md pb-2 select-none transition-all duration-300 ${currentTrack ? 'bottom-20' : 'bottom-0'}`}>
        <button
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition cursor-pointer ${
            currentTab === 'home' ? 'text-accent' : 'text-zinc-500'
          }`}
        >
          <Home size={18} />
          Home
        </button>
        <button
          onClick={() => setCurrentTab('search')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition cursor-pointer ${
            currentTab === 'search' ? 'text-accent' : 'text-zinc-500'
          }`}
        >
          <Search size={18} />
          Search
        </button>
        <button
          onClick={() => setCurrentTab('library')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition cursor-pointer ${
            currentTab === 'library' || currentTab.includes('playlist_') || currentTab === 'liked_songs'
              ? 'text-accent'
              : 'text-zinc-500'
          }`}
        >
          <Library size={18} />
          Library
        </button>
      </nav>

      {/* Modals & Portal Overlays */}
      <CreatePlaylistDialog
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
      />
      <EqualizerDialog
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
      />
      <SleepTimerDialog
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
      />
      <AIMoodDialog
        isOpen={isAIMoodOpen}
        onClose={() => setIsAIMoodOpen(false)}
        onOpenPlaylist={handleOpenPlaylist}
      />
      <ShareSongDialog
        isOpen={shareTrack !== null}
        onClose={() => setShareTrack(null)}
        track={shareTrack}
      />
      
    </div>
  );
}
