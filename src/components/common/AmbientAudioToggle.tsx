import React, { useState, useEffect } from 'react';
import audioService from '../../services/audioService';
import useLocalStorage from '../../hooks/useLocalStorage';
import { AudioOffIcon, AudioOnIcon } from '../icons';

const AmbientAudioToggle: React.FC = () => {
  const [isAudioEnabled, setIsAudioEnabled] = useLocalStorage('ambient-audio-enabled', false);
  
  useEffect(() => {
    if (isAudioEnabled) {
      audioService.play();
    } else {
      audioService.pause();
    }
  }, [isAudioEnabled]);

  const toggleAudio = () => {
    setIsAudioEnabled(prev => !prev);
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Ambient Stadium Noise</span>
      <button
        onClick={toggleAudio}
        className="relative flex h-8 w-14 items-center rounded-full p-1 transition-colors"
        style={{ backgroundColor: isAudioEnabled ? 'hsl(var(--team-primary))' : 'hsl(var(--secondary))' }}
        aria-pressed={isAudioEnabled}
      >
        <span className="sr-only">Toggle Ambient Audio</span>
        <div
          className={`h-6 w-6 transform rounded-full bg-white transition-transform ${isAudioEnabled ? 'translate-x-6' : 'translate-x-0'}`}
        />
        <div className="absolute inset-0 flex items-center justify-around">
            <AudioOnIcon className={`h-4 w-4 transition-opacity ${isAudioEnabled ? 'opacity-100 text-white' : 'opacity-0'}`} />
            <AudioOffIcon className={`h-4 w-4 transition-opacity ${!isAudioEnabled ? 'opacity-100 text-gray-400' : 'opacity-0'}`} />
        </div>
      </button>
    </div>
  );
};

export default AmbientAudioToggle;