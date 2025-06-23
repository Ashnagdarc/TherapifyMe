import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { TranscriptionService } from '../../services/transcriptionService';
import { AIResponseService } from '../../services/aiResponseService';
import { CrisisDetectionService } from '../../services/crisisDetectionService';
import Orb from '../Orb';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import type { SelectOption } from '../ui/Select';
import { MoodTag, User } from '../../types/database';
import { Mic, Pause, Square, Edit3, Check, Loader2, Play, Volume2, Save, Sparkles } from 'lucide-react';

const MOOD_OPTIONS: SelectOption[] = [
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

interface CheckInProps {
    onCheckInComplete: () => void;
}

export const CheckIn = ({ onCheckInComplete }: CheckInProps) => {
    const { profile } = useAuth();

    // Check-in Flow State
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

    // Refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Cleanup effect
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

    const handleOrbClick = async () => {
        if (checkInStep === 'idle') {
            await startRecording();
        } else if (checkInStep === 'recording') {
            stopRecording();
        }
    };

    const startRecording = async () => {
        setCheckInError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCheckInError("Your browser doesn't support audio recording.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;

            const audioChunks: Blob[] = [];
            recorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                processRecording(audioBlob);
            };

            recorder.start();
            setIsRecording(true);
            setCheckInStep('recording');
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Error starting recording:', err);
            setCheckInError('Could not access microphone. Please check permissions.');
            setCheckInStep('idle');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            setRecordingTime(0);
            streamRef.current?.getTracks().forEach(track => track.stop());
        }
    };

    const processRecording = async (blob: Blob) => {
        setCheckInStep('processing');
        setProcessingStep('Transcribing audio...');

        try {
            const transcriptionService = new TranscriptionService();
            const transcript = await transcriptionService.transcribe(blob);
            setTranscription(transcript);
            setEditedTranscription(transcript);
            setAudioUrl(URL.createObjectURL(blob));
            setCheckInStep('reviewing');
        } catch (error) {
            console.error('Error processing recording:', error);
            setCheckInError('Failed to transcribe audio. Please try again.');
            resetCheckIn();
        }
    };

    const handleSaveAndGenerate = async () => {
        if (!selectedMood || !editedTranscription || !profile || !audioBlob) {
            setCheckInError('Please select a mood and ensure transcription is not empty.');
            return;
        }

        setCheckInStep('generating');
        setProcessingStep('Analyzing your entry...');

        try {
            const crisisService = new CrisisDetectionService();
            const isCrisis = await crisisService.isCrisis(editedTranscription);

            if (isCrisis) {
                // In a real app, you would show a modal with resources here.
                console.warn('Crisis keywords detected. Showing resources...');
                setCheckInError('Important: If you are in a crisis, please seek help.');
                setCheckInStep('reviewing'); // Go back to review to show the message
                return;
            }

            const aiService = AIResponseService.getInstance();
            const { aiResponse } = await aiService.getAIResponse({
                mood: selectedMood,
                transcription: editedTranscription,
                userProfile: profile as User // Casting because profile can be null but we check it above
            });
            setAiAnalysis(aiResponse);

            setProcessingStep('Saving your entry...');
            const filePath = `${profile.id}/${new Date().toISOString()}.webm`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('voice-recordings')
                .upload(filePath, audioBlob);

            if (uploadError) throw uploadError;

            const { data: entry, error: insertError } = await supabase
                .from('entries')
                .insert({
                    user_id: profile.id,
                    mood_tag: selectedMood,
                    transcription: editedTranscription,
                    ai_response: aiResponse,
                    audio_url: uploadData.path,
                    text_summary: editedTranscription.slice(0, 150),
                })
                .select()
                .single();

            if (insertError) throw insertError;

            setProcessingStep('Complete!');
            setCheckInStep('complete');
            onCheckInComplete(); // Notify dashboard to refresh data

            // Optional: reset after a delay
            setTimeout(() => resetCheckIn(), 5000);

        } catch (error) {
            console.error('Error saving and generating:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setCheckInError(`Failed to save. ${errorMessage}`);
            setCheckInStep('reviewing');
        }
    };

    const resetCheckIn = () => {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingTime(0);
        setAudioBlob(null);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setTranscription('');
        setEditedTranscription('');
        setSelectedMood('');
        setIsEditingText(false);
        setCheckInStep('idle');
        setProcessingStep('');
        setAiAnalysis('');
        setCheckInError(null);
        mediaRecorderRef.current = null;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getOrbProps = () => {
        switch (checkInStep) {
            case 'recording':
                return { state: 'recording' as const, recordingTime };
            case 'processing':
            case 'generating':
                return { state: 'processing' as const, processingText: processingStep };
            case 'reviewing':
                return { state: 'listening' as const };
            case 'complete':
                return { state: 'complete' as const };
            default:
                return { state: 'idle' as const };
        }
    };

    const getOrbMessage = () => {
        switch (checkInStep) {
            case 'idle':
                return 'Tap to start your voice check-in';
            case 'recording':
                return `Recording... ${formatTime(recordingTime)}`;
            case 'processing':
                return processingStep;
            case 'reviewing':
                return 'Review your check-in';
            case 'generating':
                return processingStep;
            case 'complete':
                return 'Your check-in is complete!';
            default:
                return 'Ready to check in?';
        }
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-2xl mx-auto text-center border border-gray-100">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800">{getOrbMessage()}</h2>
            <div className="flex justify-center items-center my-6 sm:my-8">
                <Orb {...getOrbProps()} onClick={handleOrbClick} />
            </div>

            {checkInError && <p className="text-red-500 my-4 bg-red-50 p-3 rounded-lg">{checkInError}</p>}

            {checkInStep === 'reviewing' && (
                <div className="text-left animate-fade-in space-y-6">
                    <h3 className="font-semibold text-xl mb-2 text-gray-700">Review & Refine</h3>
                    {audioUrl && (
                        <div className="mb-4">
                            <audio ref={audioRef} src={audioUrl} controls className="w-full" />
                        </div>
                    )}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="transcription" className="font-semibold text-gray-700">Your Thoughts:</label>
                            <Button variant="outline" size="sm" onClick={() => setIsEditingText(!isEditingText)}>
                                {isEditingText ? <Check className="w-4 h-4 mr-1" /> : <Edit3 className="w-4 h-4 mr-1" />}
                                {isEditingText ? 'Save' : 'Edit'}
                            </Button>
                        </div>
                        {isEditingText ? (
                            <textarea
                                id="transcription"
                                value={editedTranscription}
                                onChange={(e) => setEditedTranscription(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md h-40 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        ) : (
                            <p className="p-3 border border-gray-200 rounded-md bg-gray-50 h-40 overflow-y-auto text-gray-800">{editedTranscription}</p>
                        )}
                    </div>
                    <div className="mb-6">
                        <label htmlFor="mood" className="font-semibold block mb-2 text-gray-700">How are you feeling?</label>
                        <Select
                            value={selectedMood}
                            onChange={(value) => setSelectedMood(value as MoodTag)}
                            placeholder="Select a mood..."
                            options={MOOD_OPTIONS}
                        />
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                        <Button variant="ghost" onClick={resetCheckIn}>Start Over</Button>
                        <Button
                            onClick={handleSaveAndGenerate}
                            disabled={!selectedMood || !editedTranscription || checkInStep === 'generating'}
                        >
                            {checkInStep === 'generating' ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Save & Generate AI Response
                        </Button>
                    </div>
                </div>
            )}

            {checkInStep === 'complete' && aiAnalysis && (
                <div className="text-left mt-6 bg-blue-50 p-4 rounded-lg animate-fade-in">
                    <h3 className="font-semibold text-lg mb-2 text-blue-800 flex items-center"><Sparkles className="w-5 h-5 mr-2" />Your AI Insight</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{aiAnalysis}</p>
                </div>
            )}
        </div>
    );
}; 