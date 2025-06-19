import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Entry, TavusVideo, MoodTag } from '../types/database';
import { WeeklyVideoService } from '../services/weeklyVideoService';
import { AnalyticsService, DashboardData } from '../services/analyticsService';
import { TranscriptionService } from '../services/transcriptionService';
import { AIResponseService } from '../services/aiResponseService';
import { ElevenLabsService } from '../services/elevenLabsService';
import { CrisisDetectionService } from '../services/crisisDetectionService';
import Orb from '../components/Orb';
import { WeeklyVideoPlayer } from '../components/WeeklyVideoPlayer';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import {
    Mic,
    MicOff,
    Pause,
    Square,
    Edit3,
    Check,
    Brain,
    Heart,
    Settings,
    User,
    LogOut,
    MoreHorizontal,
    Loader2,
    Play,
    Volume2,
    TrendingUp,
    Clock,
    Calendar,
    Sparkles,
    MessageCircle,
    Save
} from 'lucide-react';
import { TavusService } from '../services/tavusService';

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

type CheckInStep = 'idle' | 'recording' | 'processing' | 'reviewing' | 'generating' | 'complete';

export function Dashboard() {
    const { profile, signOut, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Dashboard Data State
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyticsService] = useState(() => AnalyticsService.getInstance());

    // Check-in Flow State - Orb-centered workflow
    const [checkInStep, setCheckInStep] = useState<CheckInStep>('idle');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [transcription, setTranscription] = useState<string>('');
    const [editedTranscription, setEditedTranscription] = useState<string>('');
    const [selectedMood, setSelectedMood] = useState<MoodTag | ''>('');
    const [isEditingText, setIsEditingText] = useState(false);
    const [processingStep, setProcessingStep] = useState<string>('');
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [checkInError, setCheckInError] = useState<string | null>(null);
    const [aiVideoUrl, setAiVideoUrl] = useState<string>('');

    // Check-in Refs
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const streamRef = React.useRef<MediaStream | null>(null);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        console.log('Dashboard: useEffect triggered', {
            profile: !!profile,
            profileId: profile?.id,
            authLoading,
            loading
        });

        // If auth is still loading, wait
        if (authLoading) {
            console.log('Dashboard: Auth still loading, waiting...');
            return;
        }

        // Add emergency timeout to prevent infinite loading
        const emergencyTimeout = setTimeout(() => {
            console.log('Dashboard: Emergency timeout triggered, setting default data');
            setDashboardData(getDefaultDashboardData());
            setLoading(false);
        }, 3000);

        if (profile?.id) {
            console.log('Dashboard: Profile found, fetching data...');
            fetchDashboardData().finally(() => {
                clearTimeout(emergencyTimeout);
            });
        } else {
            console.log('Dashboard: No profile, showing default data immediately');
            setDashboardData(getDefaultDashboardData());
            setLoading(false);
            clearTimeout(emergencyTimeout);
        }

        return () => {
            clearTimeout(emergencyTimeout);
        };
    }, [profile?.id, authLoading]);

    // Cleanup effect
    React.useEffect(() => {
        return () => {
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

    const getDefaultDashboardData = (): DashboardData => ({
        moodTrends: getDefaultMoodTrends(),
        userAnalytics: {
            totalEntries: 0,
            activeDays: 0,
            currentStreak: 0,
            longestStreak: 0,
            dominantMood: 'content',
            moodTrend: 'stable',
            averageMoodScore: 5,
            lastUpdated: new Date().toISOString()
        },
        recentEntries: [],
        streakInfo: {
            current: 0,
            longest: 0,
            lastCheckIn: null
        }
    });

    const getDefaultMoodTrends = () => {
        const last7Days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            last7Days.push({
                date: dateString,
                mood: 'content',
                intensity: 0,
                count: 0
            });
        }

        return last7Days;
    };

    const fetchDashboardData = async () => {
        console.log('Dashboard: fetchDashboardData called', { profileId: profile?.id });

        if (!profile?.id) {
            console.log('Dashboard: No profile ID, using default data');
            setDashboardData(getDefaultDashboardData());
            setLoading(false);
            return;
        }

        try {
            console.log('Dashboard: Calling analyticsService...');
            const data = await analyticsService.getDashboardData(profile.id);
            console.log('Dashboard: Analytics data received:', data);
            setDashboardData(data);
        } catch (error) {
            console.error('Dashboard: Analytics failed, using default data:', error);
            setDashboardData(getDefaultDashboardData());
        } finally {
            console.log('Dashboard: Setting loading to false');
            setLoading(false);
        }
    };

    // Orb interaction handlers
    const handleOrbClick = async () => {
        console.log('Orb clicked, current step:', checkInStep);

        if (checkInStep === 'idle') {
            console.log('Starting recording...');
            await startRecording();
        } else if (checkInStep === 'recording') {
            console.log('Stopping recording...');
            stopRecording();
        } else {
            console.log('Orb click ignored - not in idle or recording state');
        }
    };

    const startRecording = async () => {
        try {
            setCheckInError(null);
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

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/wav' });
                setAudioBlob(blob);

                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                // Start processing immediately
                setCheckInStep('processing');
                await processRecording(blob);

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start();
            setCheckInStep('recording');
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Error starting recording:', err);
            setCheckInError('Unable to access microphone. Please check your permissions.');
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

    const processRecording = async (blob: Blob) => {
        try {
            setProcessingStep('Transcribing your audio...');
            console.log('Starting transcription process...');

            // Upload audio first
            const fileName = `${profile?.id}/voice-note-${Date.now()}.wav`;
            console.log('Uploading audio file:', fileName);

            const { data, error } = await supabase.storage
                .from('voice-recordings')
                .upload(fileName, blob, {
                    contentType: 'audio/wav',
                    upsert: false
                });

            if (error) {
                console.error('Error uploading audio:', error);
                throw new Error('Failed to upload audio file');
            }

            console.log('Audio uploaded successfully:', data);

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('voice-recordings')
                .getPublicUrl(fileName);

            // Transcribe
            console.log('Starting transcription...');
            const transcriptionText = await TranscriptionService.transcribeAudio(blob);
            console.log('Transcription completed:', transcriptionText);

            setTranscription(transcriptionText);
            setEditedTranscription(transcriptionText);
            setAudioUrl(urlData.publicUrl);

            // Move to reviewing step
            setCheckInStep('reviewing');
            setProcessingStep('');
            console.log('Moved to reviewing step');

            // Small delay to ensure UI updates properly
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error('Error processing recording:', error);
            setCheckInError(`Failed to process your recording: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
            setCheckInStep('idle');
        }
    };

    const handleSaveAndGenerate = async () => {
        if (!selectedMood) {
            setCheckInError('Please select how you\'re feeling');
            return;
        }

        if (!profile) {
            setCheckInError('Profile not loaded. Please try again.');
            return;
        }

        setCheckInStep('generating');
        setCheckInError(null);

        try {
            setProcessingStep('Saving your check-in...');

            // Create the journal entry
            const { data: entryData, error: entryError } = await supabase
                .from('entries')
                .insert({
                    user_id: profile.id,
                    mood_tag: selectedMood,
                    audio_url: audioUrl,
                    transcription: editedTranscription || null,
                    text_summary: editedTranscription ? editedTranscription.substring(0, 500) : null,
                })
                .select()
                .single();

            if (entryError) throw entryError;

            // Crisis detection
            if (editedTranscription) {
                setProcessingStep('Analyzing content for safety...');
                try {
                    const crisisService = CrisisDetectionService.getInstance();
                    await crisisService.analyzeText(editedTranscription, profile.id);
                } catch (crisisError) {
                    console.warn('Crisis detection failed:', crisisError);
                }
            }

            // Generate AI analysis
            setProcessingStep('AI is analyzing your thoughts...');
            const aiResponse = await AIResponseService.generateResponse(selectedMood as MoodTag, editedTranscription);
            setAiAnalysis(aiResponse.response);

            // Generate Tavus video response
            setProcessingStep('Creating your personalized video response...');
            try {
                // Create a personalized script based on the AI analysis and user mood
                const personalizedScript = `Hello ${profile.name || 'there'}. 

I've been reflecting on what you shared with me during your check-in today. You mentioned feeling ${selectedMood}, and I can sense the depth of your experience.

${aiResponse.response}

Remember, every feeling you experience is valid and important. Your willingness to check in with yourself shows incredible self-awareness and strength.

Take care of yourself, and know that I'm here whenever you need support on your journey.`;

                console.log('Generating Tavus video with script:', personalizedScript);

                // Generate video using Tavus service
                const tavusResponse = await TavusService.createVideo(personalizedScript);
                console.log('Tavus response:', tavusResponse);

                // Poll for video completion (Tavus videos take time to generate)
                let videoStatus = tavusResponse;
                let attempts = 0;
                const maxAttempts = 30; // 5 minutes max wait time

                while (videoStatus.status === 'pending' || videoStatus.status === 'generating') {
                    if (attempts >= maxAttempts) {
                        console.warn('Video generation timeout, but saving entry');
                        break;
                    }

                    setProcessingStep(`Creating your video response... (${Math.round((attempts / maxAttempts) * 100)}%)`);
                    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

                    try {
                        videoStatus = await TavusService.getVideoStatus(tavusResponse.video_id);
                        console.log('Video status check:', videoStatus);
                    } catch (statusError) {
                        console.warn('Error checking video status:', statusError);
                        break;
                    }

                    attempts++;
                }

                if (videoStatus.status === 'completed' && (videoStatus.download_url || videoStatus.stream_url)) {
                    setAiVideoUrl(videoStatus.download_url || videoStatus.stream_url || '');
                    console.log('Video generation completed successfully');
                } else {
                    console.warn('Video generation incomplete, but proceeding without video');
                    setAiVideoUrl(''); // Proceed without video if generation fails
                }

            } catch (videoError) {
                console.error('Video generation failed:', videoError);
                setAiVideoUrl(''); // Proceed without video if generation fails
                // Don't throw error - we can complete the check-in without the video
            }

            // Update analytics cache
            analyticsService.invalidateUserCache(profile.id);
            await fetchDashboardData();

        } catch (error) {
            console.error('Error saving check-in:', error);
            setCheckInError('Failed to save your check-in. Please try again.');
            setCheckInStep('reviewing');
        }
    };

    const resetCheckIn = () => {
        setCheckInStep('idle');
        setAudioBlob(null);
        setAudioUrl(null);
        setIsRecording(false);
        setRecordingTime(0);
        setTranscription('');
        setEditedTranscription('');
        setSelectedMood('');
        setIsEditingText(false);
        setAiAnalysis('');
        setAiVideoUrl('');
        setCheckInError(null);
        setProcessingStep('');

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

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getOrbProps = () => {
        switch (checkInStep) {
            case 'recording':
                return {
                    hue: 0, // Red for recording
                    hoverIntensity: 0.8,
                    forceHoverState: true
                };
            case 'processing':
                return {
                    hue: 60, // Yellow for processing
                    hoverIntensity: 0.6,
                    forceHoverState: true
                };
            case 'reviewing':
                return {
                    hue: 180, // Cyan for reviewing
                    hoverIntensity: 0.4,
                    forceHoverState: false
                };
            case 'generating':
                return {
                    hue: 120, // Green for generating
                    hoverIntensity: 0.7,
                    forceHoverState: true
                };
            case 'complete':
                return {
                    hue: 270, // Purple for complete
                    hoverIntensity: 0.5,
                    forceHoverState: false
                };
            default:
                return {
                    hue: 220, // Default blue
                    hoverIntensity: 0.3,
                    forceHoverState: false
                };
        }
    };

    const getOrbMessage = () => {
        switch (checkInStep) {
            case 'idle':
                return 'Tap the orb to start recording your thoughts';
            case 'recording':
                return `Recording... ${formatTime(recordingTime)} - Tap again to stop`;
            case 'processing':
                return processingStep || 'Processing your recording...';
            case 'reviewing':
                return 'Review and edit your transcription, then select your mood';
            case 'generating':
                return processingStep || 'Generating your AI analysis and video response...';
            case 'complete':
                return 'Well done for sharing your mind with me!';
            default:
                return 'Tap the orb to start recording your thoughts';
        }
    };

    const getMoodColor = (mood: string) => {
        const colors: { [key: string]: string } = {
            happy: 'bg-yellow-400',
            calm: 'bg-blue-400',
            anxious: 'bg-orange-400',
            content: 'bg-green-400',
            excited: 'bg-purple-400',
            grateful: 'bg-pink-400',
            sad: 'bg-gray-400',
            stressed: 'bg-red-400',
            frustrated: 'bg-red-500',
            overwhelmed: 'bg-orange-500',
            neutral: 'bg-gray-600'
        };
        return colors[mood] || 'bg-gray-400';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">T</span>
                    </div>
                    <h1 className="text-xl font-semibold">TherapifyMe</h1>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/journal')}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>Journal</span>
                    </button>
                    <button
                        onClick={() => navigate('/settings')}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                    </button>
                    <button
                        onClick={signOut}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">

                {/* Left Sidebar - Stats */}
                <div className="lg:w-80 p-6 space-y-6 border-r border-gray-800">
                    {/* Current Streak */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Current Streak</h3>
                        <div className="text-2xl font-bold text-blue-400">
                            {dashboardData?.streakInfo.current || 0} days
                        </div>
                    </div>

                    {/* Mood Trend */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-3">7-Day Mood Trend</h3>
                        <div className="space-y-2">
                            {dashboardData?.moodTrends.slice(-7).map((trend, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400 w-8">
                                        {new Date(trend.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                    <div className="flex-1 mx-2">
                                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${getMoodColor(trend.mood)} rounded-full transition-all duration-300`}
                                                style={{ width: `${Math.max(trend.intensity || 10, 10)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 capitalize w-16 text-right">
                                        {trend.mood !== 'neutral' && trend.count > 0 ? trend.mood : '-'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Entries */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Check-ins</h3>
                        {dashboardData?.recentEntries.length ? (
                            <div className="space-y-2">
                                {dashboardData.recentEntries.slice(0, 3).map((entry) => (
                                    <div key={entry.id} className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${getMoodColor(entry.mood_tag)}`}></div>
                                        <span className="text-xs text-gray-300 capitalize">{entry.mood_tag}</span>
                                        <span className="text-xs text-gray-500 ml-auto">
                                            {new Date(entry.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500">No entries yet</p>
                        )}
                    </div>
                </div>

                {/* Center - Orb Interface */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">

                    {/* Orb Container */}
                    <div
                        className="relative cursor-pointer group"
                        onClick={handleOrbClick}
                        style={{
                            width: checkInStep === 'recording' ? '400px' : '300px',
                            height: checkInStep === 'recording' ? '400px' : '300px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Orb {...getOrbProps()} />

                        {/* Orb Icon Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {checkInStep === 'idle' && (
                                <Mic className="w-12 h-12 text-white/70 group-hover:text-white transition-colors" />
                            )}
                            {checkInStep === 'recording' && (
                                <Square className="w-12 h-12 text-white animate-pulse" />
                            )}
                            {(checkInStep === 'processing' || checkInStep === 'generating') && (
                                <Loader2 className="w-12 h-12 text-white animate-spin" />
                            )}
                            {checkInStep === 'reviewing' && (
                                <Edit3 className="w-12 h-12 text-white/70" />
                            )}
                            {checkInStep === 'complete' && (
                                <Sparkles className="w-12 h-12 text-white animate-pulse" />
                            )}
                        </div>
                    </div>

                    {/* Message */}
                    <div className="text-center">
                        <h2 className="text-2xl font-light text-blue-300 mb-2">
                            Hello {profile?.name || 'there'}
                        </h2>
                        <p className="text-gray-300 text-lg">
                            {getOrbMessage()}
                        </p>
                    </div>

                    {/* Check-in Flow UI */}
                    {checkInStep === 'reviewing' && (
                        <div className="w-full max-w-2xl space-y-6">

                            {/* Transcription Editor */}
                            <div className="bg-gray-800 rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium">Your Thoughts</h3>
                                    <button
                                        onClick={() => setIsEditingText(!isEditingText)}
                                        className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        <span>{isEditingText ? 'Save' : 'Edit'}</span>
                                    </button>
                                </div>

                                {isEditingText ? (
                                    <textarea
                                        value={editedTranscription}
                                        onChange={(e) => setEditedTranscription(e.target.value)}
                                        className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-4 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Edit your transcription here..."
                                    />
                                ) : (
                                    <div className="bg-gray-900 rounded-lg p-4 min-h-[128px]">
                                        <p className="text-gray-300">
                                            {editedTranscription || transcription || 'No transcription available'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Mood Selection */}
                            <div className="bg-gray-800 rounded-lg p-6">
                                <h3 className="text-lg font-medium mb-4">How are you feeling?</h3>
                                <Select
                                    value={selectedMood}
                                    onChange={(value) => setSelectedMood(value as MoodTag)}
                                    options={MOOD_OPTIONS}
                                    placeholder="Select your mood"
                                    className="bg-gray-700 border-gray-600 text-white [&>option]:bg-gray-700 [&>option]:text-white"
                                />
                            </div>

                            {/* Error Message */}
                            {checkInError && (
                                <div className="bg-red-900/50 border border-red-600 rounded-lg p-4">
                                    <p className="text-red-200">{checkInError}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex space-x-4">
                                <button
                                    onClick={resetCheckIn}
                                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Start Over
                                </button>
                                <Button
                                    onClick={handleSaveAndGenerate}
                                    disabled={!selectedMood}
                                    className="flex-1 flex items-center justify-center space-x-2"
                                    variant="primary"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>Save & Generate AI Response</span>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* AI Response Display */}
                    {checkInStep === 'complete' && (
                        <div className="w-full max-w-2xl space-y-6">

                            {/* Completion Message */}
                            <div className="text-center bg-green-900/20 border border-green-600/30 rounded-lg p-6">
                                <Heart className="w-8 h-8 text-green-400 mx-auto mb-3" />
                                <h3 className="text-xl font-medium text-green-300 mb-2">
                                    Well done for sharing your mind with me!
                                </h3>
                                <p className="text-gray-300">
                                    I've analyzed your thoughts and prepared some insights for you.
                                </p>
                            </div>

                            {/* AI Analysis */}
                            {aiAnalysis && (
                                <div className="bg-gray-800 rounded-lg p-6">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Brain className="w-5 h-5 text-purple-400" />
                                        <h3 className="text-lg font-medium">AI Analysis</h3>
                                    </div>
                                    <div className="bg-gray-900 rounded-lg p-4">
                                        <p className="text-gray-300 leading-relaxed">{aiAnalysis}</p>
                                    </div>
                                </div>
                            )}

                            {/* Video Response */}
                            {aiVideoUrl ? (
                                <div className="bg-gray-800 rounded-lg p-6">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Volume2 className="w-5 h-5 text-blue-400" />
                                        <h3 className="text-lg font-medium">Your Personal Video Response</h3>
                                    </div>
                                    <div className="bg-gray-900 rounded-lg p-4">
                                        <WeeklyVideoPlayer
                                            videoUrl={aiVideoUrl}
                                            title="Personal AI Response"
                                            onGenerateNewVideo={() => { }}
                                            isGenerating={false}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-800 rounded-lg p-6">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Volume2 className="w-5 h-5 text-blue-400" />
                                        <h3 className="text-lg font-medium">Video Response</h3>
                                    </div>
                                    <div className="bg-gray-900 rounded-lg p-4 text-center">
                                        <p className="text-gray-400 mb-2">
                                            Your video response is being prepared and will be available soon.
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Video generation typically takes 2-5 minutes. Check back in a moment or visit your Journal to see when it's ready.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex space-x-4">
                                <button
                                    onClick={resetCheckIn}
                                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    Start New Check-in
                                </button>
                                <button
                                    onClick={() => navigate('/journal')}
                                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    View Journal
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Sidebar - Quick Actions */}
                <div className="lg:w-80 p-6 space-y-6">

                    {/* Quick Stats */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-3">Your Progress</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-300">Total Entries</span>
                                <span className="text-sm font-medium text-blue-400">
                                    {dashboardData?.userAnalytics.totalEntries || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-300">Active Days</span>
                                <span className="text-sm font-medium text-green-400">
                                    {dashboardData?.userAnalytics.activeDays || 0}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-300">Longest Streak</span>
                                <span className="text-sm font-medium text-purple-400">
                                    {dashboardData?.streakInfo.longest || 0} days
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mood Insights */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-400 mb-3">Mood Insights</h3>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${getMoodColor(dashboardData?.userAnalytics.dominantMood || 'content')}`}></div>
                                <span className="text-sm text-gray-300">Dominant mood:</span>
                                <span className="text-sm font-medium capitalize">
                                    {dashboardData?.userAnalytics.dominantMood || 'content'}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="w-3 h-3 text-blue-400" />
                                <span className="text-sm text-gray-300">Trend:</span>
                                <span className={`text-sm font-medium ${dashboardData?.userAnalytics.moodTrend === 'improving' ? 'text-green-400' :
                                    dashboardData?.userAnalytics.moodTrend === 'declining' ? 'text-red-400' :
                                        'text-blue-400'
                                    }`}>
                                    {dashboardData?.userAnalytics.moodTrend || 'stable'}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
} 