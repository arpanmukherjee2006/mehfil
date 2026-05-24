'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Track } from './PlayerContext';

export interface LocalPlaylist {
  _id: string; // matches MongoDB ObjectId format, or local_xxx
  name: string;
  description?: string;
  songs: Track[];
  createdAt: string;
}

interface LibraryContextType {
  likedSongs: Track[];
  playlists: LocalPlaylist[];
  listeningHistory: Track[];
  isOfflineMode: boolean;
  downloads: string[]; // List of videoIds downloaded offline (mock)
  
  toggleLikeSong: (track: Track) => void;
  isLiked: (trackId: string) => boolean;
  
  createPlaylist: (name: string, description?: string) => Promise<LocalPlaylist | null>;
  deletePlaylist: (playlistId: string) => Promise<boolean>;
  addSongToPlaylist: (playlistId: string, track: Track) => Promise<boolean>;
  removeSongFromPlaylist: (playlistId: string, trackId: string) => Promise<boolean>;
  
  addToHistory: (track: Track) => void;
  clearHistory: () => void;
  
  toggleDownload: (trackId: string) => void;
  isDownloaded: (trackId: string) => boolean;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<LocalPlaylist[]>([]);
  const [listeningHistory, setListeningHistory] = useState<Track[]>([]);
  const [downloads, setDownloads] = useState<string[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Initialize data from localStorage & MongoDB
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Liked Songs, Listening History, and Downloads (local only)
    const localLiked = localStorage.getItem('mehfile_liked_songs');
    if (localLiked) setLikedSongs(JSON.parse(localLiked));

    const localHistory = localStorage.getItem('mehfile_listening_history');
    if (localHistory) setListeningHistory(JSON.parse(localHistory));

    const localDownloads = localStorage.getItem('mehfile_downloads');
    if (localDownloads) setDownloads(JSON.parse(localDownloads));

    // Fetch Playlists from MongoDB
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists');
      if (!res.ok) throw new Error('API failed');
      
      const data = await res.json();
      
      if (data.success) {
        if (data.dbConnected) {
          setPlaylists(data.playlists);
          setIsOfflineMode(false);
          // Sync with local storage
          localStorage.setItem('mehfile_playlists', JSON.stringify(data.playlists));
        } else {
          // MongoDB offline fallback
          loadLocalPlaylists(true);
        }
      } else {
        loadLocalPlaylists(true);
      }
    } catch (err) {
      console.warn('Could not connect to playlist API, falling back to local storage:', err);
      loadLocalPlaylists(true);
    }
  };

  const loadLocalPlaylists = (offline = true) => {
    setIsOfflineMode(offline);
    const localPlaylists = localStorage.getItem('mehfile_playlists');
    if (localPlaylists) {
      setPlaylists(JSON.parse(localPlaylists));
    } else {
      // Create a default playlist if none exists
      const defaultPlaylists: LocalPlaylist[] = [
        {
          _id: 'local_default_1',
          name: 'My Vibe Playlist',
          description: 'A collection of my favorite vibes.',
          songs: [],
          createdAt: new Date().toISOString()
        }
      ];
      setPlaylists(defaultPlaylists);
      localStorage.setItem('mehfile_playlists', JSON.stringify(defaultPlaylists));
    }
  };

  // Liked Songs Functions
  const toggleLikeSong = (track: Track) => {
    setLikedSongs((prev) => {
      let updated;
      if (prev.some((t) => t.id === track.id)) {
        updated = prev.filter((t) => t.id !== track.id);
      } else {
        updated = [track, ...prev];
      }
      localStorage.setItem('mehfile_liked_songs', JSON.stringify(updated));
      return updated;
    });
  };

  const isLiked = (trackId: string): boolean => {
    return likedSongs.some((t) => t.id === trackId);
  };

  // Playlists Functions
  const createPlaylist = async (name: string, description?: string): Promise<LocalPlaylist | null> => {
    if (isOfflineMode) {
      const newPlaylist: LocalPlaylist = {
        _id: `local_${Date.now()}`,
        name,
        description: description || '',
        songs: [],
        createdAt: new Date().toISOString()
      };
      
      const updated = [newPlaylist, ...playlists];
      setPlaylists(updated);
      localStorage.setItem('mehfile_playlists', JSON.stringify(updated));
      return newPlaylist;
    }

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();
      if (data.success && data.playlist) {
        setPlaylists((prev) => [data.playlist, ...prev]);
        return data.playlist;
      } else {
        // Fallback to local creation if DB fails
        return createPlaylistLocal(name, description);
      }
    } catch (e) {
      return createPlaylistLocal(name, description);
    }
  };

  const createPlaylistLocal = (name: string, description?: string): LocalPlaylist => {
    const newPlaylist: LocalPlaylist = {
      _id: `local_${Date.now()}`,
      name,
      description: description || '',
      songs: [],
      createdAt: new Date().toISOString()
    };
    const updated = [newPlaylist, ...playlists];
    setPlaylists(updated);
    localStorage.setItem('mehfile_playlists', JSON.stringify(updated));
    return newPlaylist;
  };

  const deletePlaylist = async (playlistId: string): Promise<boolean> => {
    if (playlistId.startsWith('local_') || isOfflineMode) {
      const updated = playlists.filter((p) => p._id !== playlistId);
      setPlaylists(updated);
      localStorage.setItem('mehfile_playlists', JSON.stringify(updated));
      return true;
    }

    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setPlaylists((prev) => prev.filter((p) => p._id !== playlistId));
        return true;
      }
    } catch (e) {
      console.error('Error deleting playlist from server:', e);
    }

    // Fallback: delete locally
    const updated = playlists.filter((p) => p._id !== playlistId);
    setPlaylists(updated);
    localStorage.setItem('mehfile_playlists', JSON.stringify(updated));
    return true;
  };

  const addSongToPlaylist = async (playlistId: string, track: Track): Promise<boolean> => {
    // Check if song already exists in playlist to avoid duplicates
    const targetPlaylist = playlists.find((p) => p._id === playlistId);
    if (targetPlaylist && targetPlaylist.songs.some((s) => s.id === track.id)) {
      return true; // song is already in playlist
    }

    if (playlistId.startsWith('local_') || isOfflineMode) {
      const updated = playlists.map((p) => {
        if (p._id === playlistId) {
          return { ...p, songs: [...p.songs, track] };
        }
        return p;
      });
      setPlaylists(updated);
      localStorage.setItem('mehfile_playlists', JSON.stringify(updated));
      return true;
    }

    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', song: track }),
      });
      const data = await res.json();
      if (data.success && data.playlist) {
        setPlaylists((prev) => prev.map((p) => (p._id === playlistId ? data.playlist : p)));
        return true;
      }
    } catch (e) {
      console.error('Error adding song to playlist on server:', e);
    }

    // Fallback to local update
    const updated = playlists.map((p) => {
      if (p._id === playlistId) {
        return { ...p, songs: [...p.songs, track] };
      }
      return p;
    });
    setPlaylists(updated);
    localStorage.setItem('mehfile_playlists', JSON.stringify(updated));
    return true;
  };

  const removeSongFromPlaylist = async (playlistId: string, trackId: string): Promise<boolean> => {
    if (playlistId.startsWith('local_') || isOfflineMode) {
      const updated = playlists.map((p) => {
        if (p._id === playlistId) {
          return { ...p, songs: p.songs.filter((s) => s.id !== trackId) };
        }
        return p;
      });
      setPlaylists(updated);
      localStorage.setItem('mehfile_playlists', JSON.stringify(updated));
      return true;
    }

    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', song: { id: trackId } }),
      });
      const data = await res.json();
      if (data.success && data.playlist) {
        setPlaylists((prev) => prev.map((p) => (p._id === playlistId ? data.playlist : p)));
        return true;
      }
    } catch (e) {
      console.error('Error removing song from playlist on server:', e);
    }

    // Fallback to local update
    const updated = playlists.map((p) => {
      if (p._id === playlistId) {
        return { ...p, songs: p.songs.filter((s) => s.id !== trackId) };
      }
      return p;
    });
    setPlaylists(updated);
    localStorage.setItem('mehfile_playlists', JSON.stringify(updated));
    return true;
  };

  // Listening History Functions
  const addToHistory = (track: Track) => {
    setListeningHistory((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 50); // limit history to 50
      localStorage.setItem('mehfile_listening_history', JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setListeningHistory([]);
    localStorage.removeItem('mehfile_listening_history');
  };

  // Download Mock Functions
  const toggleDownload = (trackId: string) => {
    setDownloads((prev) => {
      let updated;
      if (prev.includes(trackId)) {
        updated = prev.filter((id) => id !== trackId);
      } else {
        updated = [...prev, trackId];
      }
      localStorage.setItem('mehfile_downloads', JSON.stringify(updated));
      return updated;
    });
  };

  const isDownloaded = (trackId: string): boolean => {
    return downloads.includes(trackId);
  };

  return (
    <LibraryContext.Provider
      value={{
        likedSongs,
        playlists,
        listeningHistory,
        isOfflineMode,
        downloads,
        toggleLikeSong,
        isLiked,
        createPlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        addToHistory,
        clearHistory,
        toggleDownload,
        isDownloaded,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
