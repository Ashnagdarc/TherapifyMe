import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  Share, 
  Download,
  Copy,
  Check,
  Lightbulb
} from 'lucide-react';

interface AIResponseState {
  entryId: string;
  mood: string;
  transcription: string;
  aiResponse: string;
  aiResponseAudioUrl?: string;
  suggestions: string[];
}

export function AIResponsePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as AIResponseState;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!state) {
      navigate('/dashboard');
      return;
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  const playAudio = () => {
    if (audioRef.current && state.aiResponseAudioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const copyResponse = async () => {
    try {
      await navigator.clipboard.writeText(state.aiResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const getMoodEmoji = (mood: string) => {
    const emojiMap: { [key: string]: string } = {
      happy: '😊',
      calm: '😌',
      anxious: '😰',
      sad: '😢',
      stressed: '😤',
      excited: '🤩',
      frustrated: '😠',
      grateful: '🙏',
      overwhelmed: '😵',
      content: '😊'
    };
    return emojiMap[mood] || '💭';
  };

  const getMoodColor = (mood: string) => {
    const colorMap: { [key: string]: string } = {
      happy: 'bg-yellow-100 text-yellow-800',
      calm: 'bg-blue-100 text-blue-800',
      anxious: 'bg-orange-100 text-orange-800',
      sad: 'bg-gray-100 text-gray-800',
      stressed: 'bg-red-100 text-red-800',
      excited: 'bg-purple-100 text-purple-800',
      frustrated: 'bg-red-100 text-red-800',
      grateful: 'bg-pink-100 text-pink-800',
      overwhelmed: 'bg-orange-100 text-orange-800',
      content: 'bg-green-100 text-green-800'
    };
    return colorMap[mood] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-primery">AI Response</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyResponse}
              className="flex items-center"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Response
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center"
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main AI Response */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mood Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-grey p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-primery">Your Check-In</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMoodColor(state.mood)}`}>
                  {getMoodEmoji(state.mood)} {state.mood}
                </span>
              </div>
              
              {state.transcription && (
                <div className="bg-grey-2 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-grey mb-2">What you shared:</h3>
                  <p className="text-text-black italic">"{state.transcription}"</p>
                </div>
              )}
            </div>

            {/* AI Response */}
            <div className="bg-white rounded-2xl shadow-sm border border-grey p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-primery flex items-center">
                  <Volume2 className="w-5 h-5 mr-2 text-main" />
                  AI Therapist Response
                </h2>
                
                {state.aiResponseAudioUrl && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={isPlaying ? pauseAudio : playAudio}
                      className="flex items-center space-x-2 px-4 py-2 bg-main hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="prose prose-lg max-w-none">
                <p className="text-text-black leading-relaxed text-lg">
                  {state.aiResponse}
                </p>
              </div>
              
              {state.aiResponseAudioUrl && (
                <audio
                  ref={audioRef}
                  src={state.aiResponseAudioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              )}
            </div>
          </div>

          {/* Sidebar - Suggestions */}
          <div className="space-y-6">
            {/* Personalized Suggestions */}
            <div className="bg-white rounded-2xl shadow-sm border border-grey p-6">
              <h3 className="text-lg font-semibold text-primery flex items-center mb-4">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                Suggested Actions
              </h3>
              
              <div className="space-y-3">
                {state.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-grey-2 rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 bg-main text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <p className="text-text-black text-sm">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-grey p-6">
              <h3 className="text-lg font-semibold text-primery mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/check-in')}
                  className="w-full justify-start"
                >
                  New Check-In
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/journal')}
                  className="w-full justify-start"
                >
                  View Journal
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Audio
                </Button>
              </div>
            </div>

            {/* Session Info */}
            <div className="bg-gradient-to-br from-main to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Session Complete!</h3>
              <p className="text-blue-100 text-sm mb-4">
                You've taken an important step in your mental wellness journey today.
              </p>
              <p className="text-xs text-blue-200">
                Remember to be patient and kind to yourself as you process these insights.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}