import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MoodTag } from '../types/database';
import { TranscriptionService } from '../services/transcriptionService';
import { AIResponseService } from '../services/aiResponseService';
import { ElevenLabsService } from '../services/elevenLabsService';
import { CrisisDetectionService } from '../services/crisisDetectionService';
import { AnalyticsService } from '../services/analyticsService';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Mic, MicOff, Play, Pause, Square, ArrowLeft, Loader2 } from 'lucide-react';

const MOOD_OPTIONS = [
  { value: 'happy', label: '😊 Happy' },
  { value: 'calm', label: '😌 Calm' },
  { value: 'anxious', label: '😰 Anxious' },
  { value: 'sad', label: '😢 Sad' },
  { value: 'stressed', label: '😤 Stressed' },
  { value: 'excited', label: '🤩 Excited' },
  { value: 'frustrated', label: '😠 Frustrated' },
  { value: 'grateful', label: '🙏 Grateful' },
  { value: 'overwhelmed', label: '😵 Overwhelmed' },
  { value: 'content', label: '😊 Content' },
];

export function CheckInPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Form state
  const [selectedMood, setSelectedMood] = useState<MoodTag | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setHasRecording(true);

        // Create audio URL for playback
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    setHasRecording(false);
    setAudioBlob(null);
    setIsPlaying(false);
    setRecordingTime(0);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const uploadAudioToStorage = async (audioBlob: Blob): Promise<string | null> => {
    try {
      const fileName = `${profile?.id}/voice-note-${Date.now()}.wav`;

      const { data, error } = await supabase.storage
        .from('voice-recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/wav',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('voice-recordings')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading audio:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!selectedMood) {
      setError('Please select how you\'re feeling');
      return;
    }

    if (!profile) {
      setError('Profile not loaded. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setIsProcessing(true);
    setError(null);

    try {
      let transcription = '';
      let aiResponseText = '';
      let aiResponseAudioUrl = null;
      let voiceNoteUrl = null;

      // Upload audio if recording exists
      if (audioBlob) {
        setProcessingStep('Uploading voice recording...');
        voiceNoteUrl = await uploadAudioToStorage(audioBlob);
        if (!voiceNoteUrl) {
          throw new Error('Failed to upload voice recording');
        }

        // Transcribe the audio
        setProcessingStep('Transcribing your voice...');
        transcription = await TranscriptionService.transcribeAudio(audioBlob);

        // Check for crisis indicators in transcription
        if (transcription.trim()) {
          setProcessingStep('Analyzing content for support resources...');
          const crisisDetection = CrisisDetectionService.getInstance();
          const analysis = await crisisDetection.analyzeText(transcription, profile.id);

          if (analysis.shouldShowResources) {
            // Get user's crisis resources
            const resources = await crisisDetection.getCrisisResources(profile.id);

            // Show crisis intervention modal if needed
            if (analysis.severity >= 5) {
              crisisDetection.showCrisisInterventionModal(analysis.severity, resources);

              // For high severity, we might want to pause processing
              if (analysis.severity >= 8) {
                setIsSubmitting(false);
                setIsProcessing(false);
                setProcessingStep('');
                return; // Stop processing to let user get help
              }
            }
          }
        }
      }

      // Generate AI response
      setProcessingStep('Generating AI response...');
      const aiResponse = await AIResponseService.generateResponse(
        selectedMood,
        transcription,
        profile.preferred_tone as 'calm' | 'motivational' | 'reflective'
      );
      aiResponseText = aiResponse.response;

      // Generate voice response using ElevenLabs
      setProcessingStep('Creating AI voice response...');
      try {
        const therapeuticVoices = ElevenLabsService.getTherapeuticVoices();
        const selectedVoice = therapeuticVoices[aiResponse.tone];

        const audioBlob = await ElevenLabsService.textToSpeech(
          aiResponseText,
          selectedVoice.id
        );

        // Upload AI response audio
        const aiAudioFileName = `${profile.id}/ai-response-${Date.now()}.mp3`;
        const { data: aiAudioData, error: aiAudioError } = await supabase.storage
          .from('voice-recordings')
          .upload(aiAudioFileName, audioBlob, {
            contentType: 'audio/mpeg',
            upsert: false
          });

        if (!aiAudioError && aiAudioData) {
          const { data: aiUrlData } = supabase.storage
            .from('voice-recordings')
            .getPublicUrl(aiAudioFileName);
          aiResponseAudioUrl = aiUrlData.publicUrl;
        }
      } catch (voiceError) {
        console.warn('Failed to generate AI voice response:', voiceError);
        // Continue without voice response - we still have text
      }

      // Create entry in database
      setProcessingStep('Saving your check-in...');
      const { data, error } = await supabase
        .from('entries')
        .insert({
          user_id: profile.id,
          mood_tag: selectedMood,
          voice_note_url: voiceNoteUrl,
          ai_response_url: aiResponseAudioUrl,
          text_summary: aiResponseText,
          transcription: transcription,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('Entry created:', data);

      // Update analytics and session tracking
      try {
        const analyticsService = AnalyticsService.getInstance();
        await analyticsService.updateUserSessionAnalytics(profile.id, {
          mood: selectedMood,
          date: new Date().toISOString().split('T')[0]
        });
      } catch (analyticsError) {
        console.warn('Failed to update analytics:', analyticsError);
        // Don't block user flow for analytics failure
      }

      // Navigate to AI response page
      navigate('/ai-response', {
        state: {
          entryId: data.id,
          mood: selectedMood,
          transcription,
          aiResponse: aiResponseText,
          aiResponseAudioUrl,
          suggestions: aiResponse.suggestions
        }
      });

    } catch (err) {
      console.error('Error submitting check-in:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit check-in');
    } finally {
      setIsSubmitting(false);
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-primery">Mood Check-In</h1>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-grey p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primery mb-4">
              How are you feeling today?
            </h2>
            <p className="text-text-black text-lg">
              Share your thoughts through voice or simply select your mood
            </p>
          </div>

          {/* Voice Recording Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-primery mb-4">Voice Recording (Optional)</h3>

            <div className="bg-grey-2 rounded-xl p-6 text-center">
              {!hasRecording ? (
                <div>
                  <div className="mb-6">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isSubmitting}
                      className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${isRecording
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-main hover:bg-blue-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isRecording ? (
                        <Square className="w-8 h-8 text-white" />
                      ) : (
                        <Mic className="w-8 h-8 text-white" />
                      )}
                    </button>
                  </div>

                  {isRecording ? (
                    <div>
                      <p className="text-red-600 font-medium mb-2">Recording...</p>
                      <p className="text-2xl font-mono text-red-600">{formatTime(recordingTime)}</p>
                      <p className="text-grey text-sm mt-2">Tap the square to stop</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-text-black font-medium mb-2">Tap to start recording</p>
                      <p className="text-grey text-sm">Share how you're feeling in your own words</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-center space-x-4 mb-4">
                      <button
                        onClick={isPlaying ? pauseRecording : playRecording}
                        className="w-12 h-12 bg-main hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
                        disabled={isSubmitting}
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-1" />
                        )}
                      </button>

                      <button
                        onClick={deleteRecording}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={isSubmitting}
                      >
                        Delete Recording
                      </button>
                    </div>

                    <p className="text-green-600 font-medium">
                      ✓ Recording saved ({formatTime(recordingTime)})
                    </p>
                  </div>

                  <audio
                    ref={audioRef}
                    src={audioUrl || undefined}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Mood Selection */}
          <div className="mb-8">
            <Select
              label="How are you feeling? *"
              options={MOOD_OPTIONS}
              value={selectedMood}
              onChange={(value) => setSelectedMood(value as MoodTag)}
              placeholder="Select your mood"
              error={!selectedMood && error ? 'Please select your mood' : undefined}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center">
            {isProcessing && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" />
                  <span className="text-blue-600 font-medium">Processing your check-in...</span>
                </div>
                <p className="text-blue-600 text-sm">{processingStep}</p>
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedMood}
              className="w-full sm:w-auto px-8 py-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isProcessing ? 'Processing...' : 'Submitting Check-In...'}
                </>
              ) : (
                'Submit Check-In'
              )}
            </Button>

            {selectedMood && (
              <p className="text-grey text-sm mt-3">
                Your {selectedMood} check-in will receive a personalized AI response
              </p>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-grey text-sm">
            Your voice recording and mood data are private and secure.
            They will only be used to generate your personalized AI response.
          </p>
        </div>
      </div>
    </div>
  );
}