import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Download, Share, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';

interface WeeklyVideoPlayerProps {
  videoUrl: string;
  title: string;
  onGenerateNewVideo?: () => void;
  isGenerating?: boolean;
}

export function WeeklyVideoPlayer({ 
  videoUrl, 
  title, 
  onGenerateNewVideo,
  isGenerating = false 
}: WeeklyVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoaded(true);
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoUrl]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!videoUrl && !isGenerating) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Play className="w-8 h-8 text-purple-400" />
        </div>
        <h4 className="text-xl font-medium mb-2">No Therapy Video Yet</h4>
        <p className="text-gray-400 mb-4">
          Complete a few check-ins this week to generate your personalized therapy session
        </p>
        {onGenerateNewVideo && (
          <Button 
            onClick={onGenerateNewVideo}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Generate This Week's Video
          </Button>
        )}
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
        <h4 className="text-xl font-medium mb-2">Generating Your Therapy Video</h4>
        <p className="text-gray-400 mb-4">
          Our AI is creating a personalized therapy session based on your week's check-ins...
        </p>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <div className="bg-purple-500 h-2 rounded-full w-1/3 animate-pulse"></div>
        </div>
        <p className="text-xs text-gray-500">This usually takes 2-3 minutes</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Video Player */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          poster="/api/placeholder/800/450"
          preload="metadata"
        />
        
        {/* Play/Pause Overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}
        
        {isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={togglePlay}
              className="w-16 h-16 bg-black bg-opacity-60 rounded-full flex items-center justify-center hover:bg-opacity-80 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-medium text-white">{title}</h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              disabled={!isLoaded}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Volume2 className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Download className="w-5 h-5 text-white" />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Share className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-400 w-10">
            {formatTime(currentTime)}
          </span>
          <div 
            className="flex-1 h-2 bg-gray-700 rounded-full cursor-pointer relative"
            onClick={handleSeek}
          >
            <div 
              className="h-2 bg-purple-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-purple-500 rounded-full shadow-md"
              style={{ left: `${progress}%`, marginLeft: '-6px' }}
            />
          </div>
          <span className="text-xs text-gray-400 w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Generate New Video Button */}
        {onGenerateNewVideo && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <Button
              onClick={onGenerateNewVideo}
              variant="ghost"
              size="sm"
              className="w-full justify-center text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            >
              Generate New Video for This Week
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}