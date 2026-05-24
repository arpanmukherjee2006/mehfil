import React from 'react';

interface MusicWaveProps {
  isPlaying: boolean;
  color?: string;
}

export const MusicWave: React.FC<MusicWaveProps> = ({ isPlaying, color = 'bg-accent' }) => {
  return (
    <div className="flex items-end gap-[3px] h-[16px] w-[20px]">
      <span 
        className={`w-[3px] h-[100%] rounded-full ${color} ${isPlaying ? 'wave-bar' : 'scale-y-[0.3]'}`}
        style={{ animationDuration: '0.8s' }}
      ></span>
      <span 
        className={`w-[3px] h-[100%] rounded-full ${color} ${isPlaying ? 'wave-bar' : 'scale-y-[0.3]'}`}
        style={{ animationDuration: '1.1s', animationDelay: '0.15s' }}
      ></span>
      <span 
        className={`w-[3px] h-[100%] rounded-full ${color} ${isPlaying ? 'wave-bar' : 'scale-y-[0.3]'}`}
        style={{ animationDuration: '0.9s', animationDelay: '0.3s' }}
      ></span>
      <span 
        className={`w-[3px] h-[100%] rounded-full ${color} ${isPlaying ? 'wave-bar' : 'scale-y-[0.3]'}`}
        style={{ animationDuration: '1.2s', animationDelay: '0.05s' }}
      ></span>
    </div>
  );
};

export default MusicWave;
