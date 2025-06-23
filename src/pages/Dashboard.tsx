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
import { WeeklyVideoSection } from '../components/WeeklyVideoSection';
import { AISettingsModal } from '../components/AISettingsModal';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { MoodTrendChart } from '../components/dashboard/MoodTrendChart';
import { RecentEntriesList } from '../components/dashboard/RecentEntriesList';
import { CheckIn } from '../components/dashboard/CheckIn';

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
    const { profile, user, signOut, loading: authLoading } = useAuth();
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

    // AI Settings Modal State
    const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);

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

    // Debug effect to monitor state changes
    React.useEffect(() => {
        console.log('=== STATE CHANGE DEBUG ===');
        console.log('checkInStep:', checkInStep);
        console.log('transcription length:', transcription.length);
        console.log('editedTranscription length:', editedTranscription.length);
        console.log('audioUrl:', !!audioUrl);
        console.log('selectedMood:', selectedMood);
        console.log('checkInError:', checkInError);
        console.log('profile:', profile);
        console.log('user:', user);
        console.log('authLoading:', authLoading);
        console.log('========================');
    }, [checkInStep, transcription, editedTranscription, audioUrl, selectedMood, checkInError, profile, user, authLoading]);

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

    const fetchDashboardData = async (userIdOverride?: string) => {
        const userId = userIdOverride || profile?.id;
        const authId = user?.id;

        console.log('Dashboard: fetchDashboardData called', {
            userId,
            profileId: profile?.id,
            authId,
            userIdOverride
        });

        if (!userId && !authId) {
            console.log('Dashboard: No user ID available, using default data');
            setDashboardData(getDefaultDashboardData());
            setLoading(false);
            return;
        }

        try {
            let targetUserId = userId;

            // If no userId but we have authId, try to find the user profile
            if (!targetUserId && authId) {
                console.log('Dashboard: Looking up user profile by auth ID...');
                const { data: userProfile, error } = await supabase
                    .from('users')
                    .select('id')
                    .eq('auth_id', authId)
                    .maybeSingle();

                if (userProfile) {
                    targetUserId = userProfile.id;
                    console.log('Dashboard: Found user profile:', targetUserId);
                } else {
                    console.log('Dashboard: No user profile found, using default data');
                    setDashboardData(getDefaultDashboardData());
                    setLoading(false);
                    return;
                }
            }

            if (!targetUserId) {
                console.log('Dashboard: No target user ID found, using default data');
                setDashboardData(getDefaultDashboardData());
                setLoading(false);
                return;
            }

            console.log('Dashboard: Calling analyticsService with userId:', targetUserId);
            const data = await analyticsService.getDashboardData(targetUserId);
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
            console.log('Requesting microphone access...');

            // Check if browser supports getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.');
            }

            // Request microphone access with specific constraints
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            });

            console.log('Microphone access granted');
            streamRef.current = stream;

            // Check if MediaRecorder is supported
            if (!window.MediaRecorder) {
                throw new Error('Your browser does not support audio recording. Please update to a newer version.');
            }

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });
            mediaRecorderRef.current = mediaRecorder;

            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                    console.log('Audio chunk received:', event.data.size, 'bytes');
                }
            };

            mediaRecorder.onstop = async () => {
                console.log('MediaRecorder stopped, processing audio...');
                const mimeType = mediaRecorder.mimeType || 'audio/wav';
                const blob = new Blob(chunks, { type: mimeType });

                if (blob.size === 0) {
                    console.error('No audio data recorded');
                    setCheckInError('No audio was recorded. Please check your microphone and try again.');
                    setCheckInStep('idle');
                    return;
                }

                console.log('Audio blob created:', blob.size, 'bytes');
                setAudioBlob(blob);

                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                // Start processing immediately
                setCheckInStep('processing');
                await processRecording(blob);

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => {
                        track.stop();
                        console.log('Media track stopped');
                    });
                }
            };

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                setCheckInError('Recording failed. Please try again.');
                setCheckInStep('idle');
            };

            mediaRecorder.start(1000); // Collect data every second
            setCheckInStep('recording');
            setIsRecording(true);
            setRecordingTime(0);

            console.log('Recording started successfully');

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Error starting recording:', err);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setCheckInError('Microphone access denied. Please allow microphone access and try again.');
                } else if (err.name === 'NotFoundError') {
                    setCheckInError('No microphone found. Please connect a microphone and try again.');
                } else if (err.name === 'NotReadableError') {
                    setCheckInError('Microphone is being used by another application. Please close other apps and try again.');
                } else {
                    setCheckInError(err.message || 'Unable to access microphone. Please check your permissions and try again.');
                }
            } else {
                setCheckInError('Unable to access microphone. Please check your permissions and try again.');
            }
            setCheckInStep('idle');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            console.log('Stopping recording...');

            // Validate recording duration
            if (recordingTime < 1) {
                setCheckInError('Recording too short. Please record for at least 1 second.');
                setCheckInStep('idle');
                setIsRecording(false);

                // Clean up
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
                return;
            }

            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            console.log(`Recording stopped after ${recordingTime} seconds`);
        }
    };

    const processRecording = async (blob: Blob) => {
        if (!profile?.id || !user?.id) {
            console.error('No user profile found');
            setCheckInStep('idle');
            return;
        }

        setCheckInStep('processing');
        setProcessingStep('Processing your recording...');

        try {
            const userId = profile.id;
            const authId = user.id;

            // Upload voice recording to Supabase Storage
            setProcessingStep('Uploading your voice recording...');
            const fileName = `${authId}/${Date.now()}-voice-note.webm`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('voice-recordings')
                .upload(fileName, blob, {
                    contentType: 'audio/webm',
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw new Error('Failed to upload voice recording: ' + uploadError.message);
            }

            // Get public URL for the uploaded file
            const { data: urlData } = supabase.storage
                .from('voice-recordings')
                .getPublicUrl(fileName);

            const voiceNoteUrl = urlData.publicUrl;
            console.log('Voice recording uploaded successfully:', voiceNoteUrl);

            // Set the audio URL for playback during review
            setAudioUrl(voiceNoteUrl);

            // Transcribe audio
            setProcessingStep('Converting speech to text...');
            console.log('Starting transcription...');

            let transcriptionResult = '';
            try {
                transcriptionResult = await TranscriptionService.transcribeAudio(blob);
                console.log('Transcription successful:', transcriptionResult);
            } catch (transcriptionError) {
                console.error('Transcription failed:', transcriptionError);
                // Continue without transcription
                transcriptionResult = '';
            }

            setTranscription(transcriptionResult);
            setEditedTranscription(transcriptionResult);
            setCheckInStep('reviewing');

        } catch (error) {
            console.error('Error processing recording:', error);
            setCheckInError(error instanceof Error ? error.message : 'Failed to process recording');
            setCheckInStep('idle');
        }
    };

    const handleSaveAndGenerate = async () => {
        if (!selectedMood || !profile?.id || !user?.id) {
            setCheckInError('Please select a mood and ensure you are logged in');
            return;
        }

        setCheckInStep('generating');
        setProcessingStep('Analyzing your thoughts...');

        try {
            const userId = profile.id;
            const authId = user.id;
            const finalTranscription = editedTranscription || transcription || '';

            // Get stored voice recording URL from previous upload
            const voiceNoteUrl = audioUrl; // This should now be the Supabase Storage URL

            if (!voiceNoteUrl) {
                throw new Error('No voice recording found. Please record your voice first.');
            }

            // Generate AI response
            setProcessingStep('Generating your personalized AI response...');

            const userPreferences = {
                tone: profile.preferred_tone || 'calm',
                language: profile.language || 'en'
            };

            // Import the enhanced AI service
            const { EnhancedAIService } = await import('../services/enhancedAIService');

            const aiResponse = await EnhancedAIService.generateResponse(
                selectedMood as MoodTag,
                finalTranscription,
                (profile?.preferred_tone as 'calm' | 'motivational' | 'reflective') || 'calm',
                userId
            );

            setAiAnalysis(aiResponse.response);

            // Generate audio response using ElevenLabs
            setProcessingStep('Creating your audio response...');

            let aiResponseUrl = '';
            try {
                const audioResponse = await ElevenLabsService.textToSpeech(
                    aiResponse.response
                );

                // Upload AI response audio to Supabase Storage
                const aiFileName = `${authId}/${Date.now()}-ai-response.mp3`;

                const { data: aiUploadData, error: aiUploadError } = await supabase.storage
                    .from('voice-recordings')
                    .upload(aiFileName, audioResponse, {
                        contentType: 'audio/mpeg',
                        cacheControl: '3600',
                        upsert: false
                    });

                if (!aiUploadError) {
                    const { data: aiUrlData } = supabase.storage
                        .from('voice-recordings')
                        .getPublicUrl(aiFileName);
                    aiResponseUrl = aiUrlData.publicUrl;
                    console.log('AI response audio uploaded successfully:', aiResponseUrl);
                }
            } catch (audioError) {
                console.error('AI audio generation failed:', audioError);
                // Continue without audio response
            }

            // Save entry to database
            setProcessingStep('Saving your check-in...');

            const { data: entryData, error: entryError } = await supabase
                .from('entries')
                .insert({
                    user_id: userId,
                    mood_tag: selectedMood,
                    voice_note_url: voiceNoteUrl,
                    ai_response_url: aiResponseUrl,
                    text_summary: aiResponse.response,
                    transcription: finalTranscription
                })
                .select()
                .single();

            if (entryError) {
                console.error('Entry save error:', entryError);
                throw new Error('Failed to save entry: ' + entryError.message);
            }

            console.log('Entry saved successfully:', entryData);

            // Generate Tavus video response (ASYNC - don't wait)
            console.log('Starting async video generation...');
            try {
                // Create a personalized script based on the AI analysis and user mood
                const userName = profile?.name || user?.user_metadata?.name || 'there';
                const personalizedScript = `Hello ${userName}. 

I've been reflecting on what you shared with me during your check-in today. You mentioned feeling ${selectedMood}, and I can sense the depth of your experience.

${aiResponse.response}

Remember, every feeling you experience is valid and important. Your willingness to check in with yourself shows incredible self-awareness and strength.

Take care of yourself, and know that I'm here whenever you need support on your journey.`;

                console.log('Generating Tavus video with script:', personalizedScript);

                // Start video generation asynchronously (don't wait for completion)
                TavusService.createVideo(personalizedScript)
                    .then(async (tavusResponse) => {
                        console.log('Tavus video creation started:', tavusResponse);

                        // Poll for completion in background
                        let attempts = 0;
                        const maxAttempts = 20; // 10 minutes max

                        const pollVideoStatus = async () => {
                            try {
                                const videoStatus = await TavusService.getVideoStatus(tavusResponse.video_id);
                                console.log('Video status check:', videoStatus);

                                if (videoStatus.status === 'completed' && (videoStatus.download_url || videoStatus.stream_url)) {
                                    // Update entry with video URL when ready
                                    const videoUrl = videoStatus.download_url || videoStatus.stream_url || '';
                                    await supabase
                                        .from('entries')
                                        .update({ ai_response_url: videoUrl })
                                        .eq('id', entryData.id);

                                    console.log('Entry updated with video URL:', videoUrl);
                                    return;
                                }

                                if (videoStatus.status === 'failed') {
                                    console.warn('Video generation failed');
                                    return;
                                }

                                // Continue polling if still generating
                                if ((videoStatus.status === 'pending' || videoStatus.status === 'generating') && attempts < maxAttempts) {
                                    attempts++;
                                    setTimeout(pollVideoStatus, 30000); // Check every 30 seconds
                                }
                            } catch (error) {
                                console.error('Error polling video status:', error);
                            }
                        };

                        // Start polling after initial delay
                        setTimeout(pollVideoStatus, 30000);
                    })
                    .catch(error => {
                        console.error('Video generation failed:', error);
                        // Entry is already saved with audio, so this is non-blocking
                    });

                // Set temporary message for immediate display
                setAiVideoUrl('generating');
                console.log('Video generation started in background');

            } catch (videoError) {
                console.error('Video generation initialization failed:', videoError);
                setAiVideoUrl(''); // Proceed without video if initialization fails
            }

            // Update analytics cache and refresh dashboard
            console.log('Invalidating analytics cache for user:', userId);
            analyticsService.invalidateUserCache(userId);

            // Refresh dashboard data
            await fetchDashboardData(userId);

            setCheckInStep('complete');
            setCheckInError(null);

        } catch (error) {
            console.error('Error saving and generating response:', error);
            setCheckInError(error instanceof Error ? error.message : 'Failed to generate AI response');
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
                    hoverIntensity: 0.8 + (Math.sin(Date.now() * 0.01) * 0.2), // Pulsing effect
                    forceHoverState: true,
                    rotateOnHover: true
                };
            case 'processing':
                return {
                    hue: 60, // Yellow for processing
                    hoverIntensity: 0.6,
                    forceHoverState: true,
                    rotateOnHover: true
                };
            case 'reviewing':
                return {
                    hue: 180, // Cyan for reviewing
                    hoverIntensity: 0.4,
                    forceHoverState: false,
                    rotateOnHover: false
                };
            case 'generating':
                return {
                    hue: 120, // Green for generating
                    hoverIntensity: 0.7,
                    forceHoverState: true,
                    rotateOnHover: true
                };
            case 'complete':
                return {
                    hue: 270, // Purple for complete
                    hoverIntensity: 0.5,
                    forceHoverState: false,
                    rotateOnHover: false
                };
            default:
                return {
                    hue: 220, // Default blue
                    hoverIntensity: 0.3,
                    forceHoverState: false,
                    rotateOnHover: false
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

    const handleCheckInComplete = () => {
        // Refetch data when a new check-in is completed
        setLoading(true);
        if (profile?.id) {
            analyticsService.getDashboardData(profile.id)
                .then(setDashboardData)
                .catch(error => {
                    console.error("Failed to refetch dashboard data:", error);
                    setDashboardData(null);
                })
                .finally(() => setLoading(false));
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
                <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <DashboardHeader />
            <CheckIn onCheckInComplete={handleCheckInComplete} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <MoodTrendChart moodTrends={dashboardData?.moodTrends || []} />
                </div>
                <div>
                    <WeeklyVideoSection userId={profile?.id || ''} />
                </div>
            </div>
            <div>
                <RecentEntriesList entries={dashboardData?.recentEntries || []} />
            </div>
        </div>
    );
} 