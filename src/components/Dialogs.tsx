'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, Timer, Sparkles, Share2, Plus, Copy, Check } from 'lucide-react';
import { usePlayer, Track } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl glass-panel p-6 shadow-emerald-glow"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {title}
              </h3>
              <button 
                onClick={onClose}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// 1. Create Playlist Dialog
interface CreatePlaylistProps {
  isOpen: boolean;
  onClose: () => void;
}
export const CreatePlaylistDialog: React.FC<CreatePlaylistProps> = ({ isOpen, onClose }) => {
  const { createPlaylist } = useLibrary();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await createPlaylist(name, desc);
    setLoading(false);
    setName('');
    setDesc('');
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Create Playlist">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Playlist Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Late Night Vibe"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-accent transition text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Description
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Optional playlist description"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-accent transition text-sm h-24 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full bg-accent hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-semibold rounded-lg py-3 flex items-center justify-center gap-2 transition duration-300 shadow-emerald-glow hover:shadow-emerald-neon text-sm cursor-pointer"
        >
          <Plus size={18} />
          {loading ? 'Creating...' : 'Create Playlist'}
        </button>
      </form>
    </BaseModal>
  );
};

// 2. Equalizer Dialog
interface EqualizerProps {
  isOpen: boolean;
  onClose: () => void;
}
export const EqualizerDialog: React.FC<EqualizerProps> = ({ isOpen, onClose }) => {
  const { equalizer, setEqualizerPreset, setCustomEqualizerBand } = usePlayer();

  const presets: ('flat' | 'bass' | 'vocal' | 'electronic' | 'classical')[] = [
    'flat', 'bass', 'vocal', 'electronic', 'classical'
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Audio Equalizer">
      <div className="space-y-6">
        {/* Preset Selector */}
        <div className="grid grid-cols-5 gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => setEqualizerPreset(preset)}
              className={`py-1.5 text-xs font-medium rounded-md capitalize transition cursor-pointer ${
                equalizer.activePreset === preset
                  ? 'bg-accent text-black font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Bands sliders */}
        <div className="flex justify-between items-center h-48 px-4 bg-zinc-900/30 rounded-xl border border-zinc-900 py-6">
          {(['bass', 'vocal', 'electronic', 'classical'] as const).map((band) => {
            const value = equalizer[band];
            return (
              <div key={band} className="flex flex-col items-center justify-between h-full w-12">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {band === 'electronic' ? 'Elec' : band}
                </span>
                
                {/* Custom Slider Track */}
                <div className="relative h-28 w-2 bg-zinc-800 rounded-full flex justify-center cursor-pointer">
                  <div
                    className="absolute bottom-0 w-full bg-accent rounded-full shadow-emerald-glow"
                    style={{ height: `${value}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => setCustomEqualizerBand(band, parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer origin-center -rotate-0"
                  />
                </div>
                
                <span className="text-xs font-semibold text-accent">
                  {value}%
                </span>
              </div>
            );
          })}
        </div>

        <div className="text-center text-[10px] text-zinc-500">
          Presets will auto-adjust levels. Custom adjustments change setting to custom.
        </div>
      </div>
    </BaseModal>
  );
};

// 3. Sleep Timer Dialog
interface SleepTimerProps {
  isOpen: boolean;
  onClose: () => void;
}
export const SleepTimerDialog: React.FC<SleepTimerProps> = ({ isOpen, onClose }) => {
  const { sleepTimer, setSleepTimer } = usePlayer();

  const options = [
    { label: 'Off', seconds: null },
    { label: '5 Minutes', seconds: 5 * 60 },
    { label: '10 Minutes', seconds: 10 * 60 },
    { label: '15 Minutes', seconds: 15 * 60 },
    { label: '30 Minutes', seconds: 30 * 60 },
    { label: '45 Minutes', seconds: 45 * 60 },
    { label: '60 Minutes', seconds: 60 * 60 },
  ];

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Sleep Timer">
      <div className="space-y-5">
        {sleepTimer !== null && (
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-4 flex flex-col items-center justify-center">
            <span className="text-xs text-zinc-400">Time remaining</span>
            <span className="text-3xl font-bold text-accent font-mono mt-1">
              {formatTimer(sleepTimer)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                setSleepTimer(opt.seconds);
                onClose();
              }}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition cursor-pointer text-left ${
                (sleepTimer === opt.seconds) || (sleepTimer === null && opt.seconds === null)
                  ? 'border-accent bg-accent/10 text-accent shadow-emerald-glow'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </BaseModal>
  );
};

// 4. AI Mood Playlist Generator Dialog
interface AIMoodProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPlaylist: (id: string) => void;
}
export const AIMoodDialog: React.FC<AIMoodProps> = ({ isOpen, onClose, onOpenPlaylist }) => {
  const { createPlaylist, addSongToPlaylist } = useLibrary();
  const [mood, setMood] = useState('');
  const [generating, setGenerating] = useState(false);

  const moodsList = ['Chill & Relaxing Lofi', 'Gym Power Workout', 'Rainy Midnight Coffee', 'Retro Bollywood Ride', 'Late Night Rap Drill'];

  const handleGenerate = async (moodText: string) => {
    if (!moodText.trim()) return;
    setGenerating(true);

    try {
      // 1. Create Playlist
      const playlistName = `AI Mood: ${moodText}`;
      const playlistDesc = `AI Generated mood compilation matching "${moodText}"`;
      const created = await createPlaylist(playlistName, playlistDesc);
      
      if (!created) {
        setGenerating(false);
        return;
      }

      // 2. Fetch tracks based on the mood query from YouTube Search
      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(moodText)}&limit=10`);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.success && searchData.songs) {
          const songsToInject = searchData.songs;
          // Add songs to the newly created playlist
          for (const track of songsToInject) {
            await addSongToPlaylist(created._id, track);
          }
        }
      }

      setGenerating(false);
      setMood('');
      onClose();
      onOpenPlaylist(created._id);
    } catch (e) {
      console.error(e);
      setGenerating(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="AI Mood Playlist Maker">
      <div className="space-y-4">
        <p className="text-xs text-zinc-400 leading-relaxed">
          Type any mood, activity, or vibe (e.g., "heavy focus piano study", "bollywood motivation"). Our smart generator will instantly scan YouTube and construct a custom playlist for you.
        </p>

        <div>
          <textarea
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="What's your vibe right now?"
            disabled={generating}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-accent transition text-sm h-20 resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {moodsList.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              disabled={generating}
              className="text-[11px] font-medium bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-full px-3 py-1 hover:text-white transition cursor-pointer"
            >
              {m}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleGenerate(mood)}
          disabled={generating || !mood.trim()}
          className="w-full bg-accent hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition duration-300 shadow-emerald-glow hover:shadow-emerald-neon text-sm cursor-pointer"
        >
          <Sparkles size={16} />
          {generating ? 'Tuning your vibes...' : 'Generate AI Playlist'}
        </button>
      </div>
    </BaseModal>
  );
};

// 5. Share Song Dialog
interface ShareSongProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}
export const ShareSongDialog: React.FC<ShareSongProps> = ({ isOpen, onClose, track }) => {
  const [copied, setCopied] = useState(false);

  if (!track) return null;

  // Simulate sharing link
  const shareLink = `https://youtu.be/${track.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Share Song">
      <div className="space-y-4">
        {/* Track brief */}
        <div className="flex items-center gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
          <img
            src={track.thumbnail}
            alt={track.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">{track.title}</h4>
            <p className="text-xs text-zinc-400 truncate">{track.channelTitle}</p>
          </div>
        </div>

        {/* Link Input & Copy */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          <input
            type="text"
            readOnly
            value={shareLink}
            className="flex-1 bg-transparent px-3 text-xs text-zinc-300 focus:outline-none truncate"
          />
          <button
            onClick={handleCopy}
            className="bg-accent text-black p-2 rounded-lg hover:bg-emerald-600 transition flex items-center gap-1.5 font-semibold text-xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy
              </>
            )}
          </button>
        </div>

        <div className="flex justify-around pt-2">
          {['WhatsApp', 'Twitter', 'Facebook'].map((platform) => (
            <button
              key={platform}
              onClick={handleCopy}
              className="text-xs text-zinc-400 hover:text-accent font-medium transition cursor-pointer"
            >
              {platform}
            </button>
          ))}
        </div>
      </div>
    </BaseModal>
  );
};
