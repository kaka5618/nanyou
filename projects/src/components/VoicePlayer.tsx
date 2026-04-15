'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { estimateDuration } from '@/utils/cleanText';

interface VoicePlayerProps {
  audioUri: string;
  text: string;
  className?: string;
}

export function VoicePlayer({ audioUri, text, className }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = new Audio(audioUri);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUri]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : estimateDuration(text) * 5;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex items-center gap-2 min-w-[120px]', className)}>
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-[#07C160] text-white flex items-center justify-center hover:bg-[#06AD56] transition-colors"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>
      
      <div className="flex-1">
        <div className="h-6 flex items-center px-2">
          {/* 语音波形动画 */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1 bg-[#07C160] rounded-full transition-all',
                  isPlaying && 'animate-pulse'
                )}
                style={{
                  height: `${8 + Math.random() * 12}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
        <div className="text-xs text-gray-500 text-right">
          {formatTime(duration > 0 ? duration : estimateDuration(text))}
        </div>
      </div>
    </div>
  );
}
