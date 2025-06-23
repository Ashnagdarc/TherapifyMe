import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { TranscriptionService } from "../../services/transcriptionService";
import { EnhancedAIService } from "../../services/enhancedAIService";
import { TavusService } from "../../services/tavusService";
import { ElevenLabsService } from "../../services/elevenLabsService";
import { MoodTag } from "../../types/database";
import Orb from "../Orb";
import { Button } from "../ui/Button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/Select";
import {
    Edit3,
    Check,
    Loader2,
    Play,
    Pause,
    Volume2,
    Mic,
    AlertTriangle,
} from "lucide-react";

type CheckInStep =
    | "idle"
    | "recording"
    | "processing"
    | "reviewing"
    | "generating"
    | "complete"
    | "error";

const MOOD_OPTIONS = [
    { value: "happy", label: "😊 Happy" },
    { value: "calm", label: "😌 Calm" },
    { value: "anxious", label: "😰 Anxious" },
    { value: "sad", label: "😢 Sad" },
    { value: "stressed", label: "😤 Stressed" },
    { value: "excited", label: "🤩 Excited" },
    { value: "frustrated", label: "😠 Frustrated" },
    { value: "content", label: "😊 Content" },
];

interface CheckInProps {
    onCheckInComplete: () => void;
}

export default function CheckIn({ onCheckInComplete }: CheckInProps) {
    const { profile, user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<CheckInStep>("idle");
    const [error, setError] = useState<string | null>(null);
    const [processingMessage, setProcessingMessage] = useState("");



    // Reviewing state
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [transcription, setTranscription] = useState("");
    const [editedTranscription, setEditedTranscription] = useState("");
    const [isEditingText, setIsEditingText] = useState(false);
    const [selectedMood, setSelectedMood] = useState<MoodTag | "">("");

    // Audio playback state
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackTime, setPlaybackTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const formatTime = (timeInSeconds: number) => {
        if (isNaN(timeInSeconds) || !isFinite(timeInSeconds) || timeInSeconds < 0) {
            return "00:00";
        }
        return new Date(timeInSeconds * 1000).toISOString().substr(14, 5);
    };

    const handleOrbClick = () => {
        if (step === "idle") {
            setStep("recording");
            startRecording();
        } else if (step === "recording") {
            setStep("processing");
            stopRecording();
        }
    };

    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                },
            });

            const recorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported("audio/webm")
                    ? "audio/webm"
                    : "audio/mp4",
            });

            const chunks: Blob[] = [];
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: recorder.mimeType });
                setAudioBlob(blob);
                processRecording(blob);
                stream.getTracks().forEach((track) => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Microphone access denied. Please enable microphone permissions.");
            setStep("error");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }
    };

    const processRecording = async (blob: Blob) => {
        setStep("processing");
        setProcessingMessage("Transcribing audio...");
        try {
            const text = await TranscriptionService.transcribeAudio(blob);
            setTranscription(text);
            setEditedTranscription(text);
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            setStep("reviewing");
        } catch (err) {
            console.error(err);
            setError("Failed to process audio. Please try again.");
            setStep("error");
        }
    };

    const handleSave = async () => {
        if (!selectedMood || !profile || !user || !audioBlob) {
            setError("Please select a mood before saving.");
            return;
        }
        setStep("generating");
        setError(null);

        try {
            setProcessingMessage("Generating AI insights...");
            const { finalResponse, videoScript } = await EnhancedAIService.generateEnhancedResponse(editedTranscription);

            setProcessingMessage("Creating AI audio response...");
            let aiResponseAudioUrl: string | null = null;
            try {
                const audioBlob = await ElevenLabsService.textToSpeech(finalResponse);
                const audioFilePath = `ai-responses/${user.id}/${Date.now()}.mp3`;
                const { error: audioUploadError } = await supabase.storage
                    .from("voice-recordings")
                    .upload(audioFilePath, audioBlob);
                if (!audioUploadError) {
                    const { data: { publicUrl: aiAudioUrl } } = supabase.storage.from("voice-recordings").getPublicUrl(audioFilePath);
                    aiResponseAudioUrl = aiAudioUrl;
                }
            } catch (audioError) {
                console.warn("AI audio generation failed, proceeding without audio:", audioError);
            }

            setProcessingMessage("Uploading voice note...");
            const filePath = `${user.id}/${Date.now()}.webm`;
            const { error: uploadError } = await supabase.storage
                .from("voice-recordings")
                .upload(filePath, audioBlob);
            if (uploadError) throw new Error(`Audio upload failed: ${uploadError.message}`);

            const { data: { publicUrl } } = supabase.storage.from("voice-recordings").getPublicUrl(filePath);

            let tavusVideoUrl: string | null = null;
            const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
            if (tavusApiKey && videoScript) {
                setProcessingMessage("Creating personalized video...");
                try {
                    const videoResponse = await TavusService.createVideo(tavusApiKey, videoScript);

                    // Basic polling to check for video completion
                    for (let i = 0; i < 15; i++) {
                        await new Promise(res => setTimeout(res, 4000)); // Poll every 4 seconds
                        const status = await TavusService.getVideoStatus(tavusApiKey, videoResponse.video_id);
                        if (status.status === 'completed') {
                            tavusVideoUrl = status.download_url || null;
                            break;
                        }
                        if (status.status === 'failed') {
                            console.warn("Tavus video generation failed.");
                            break;
                        }
                    }
                } catch (tavusError) {
                    console.error("Error during Tavus video creation, proceeding without it.", tavusError);
                }
            }

            setProcessingMessage("Saving your entry...");
            const { data: insertData, error: insertError } = await supabase.from("entries").insert({
                user_id: profile.id,
                mood_tag: selectedMood,
                transcription: editedTranscription,
                voice_note_url: publicUrl,
                ai_response_url: aiResponseAudioUrl,
                text_summary: finalResponse,
                tavus_video_url: tavusVideoUrl,
            }).select();

            if (insertError) throw new Error(`Failed to save entry: ${insertError.message}`);

            setStep("complete");

            // Navigate to AI response page with audio URL
            const entryId = insertData?.[0]?.id;
            if (entryId) {
                setTimeout(() => {
                    navigate("/ai-response", {
                        state: {
                            entryId,
                            mood: selectedMood,
                            transcription: editedTranscription,
                            aiResponse: finalResponse,
                            aiResponseAudioUrl,
                            suggestions: ["Take deep breaths", "Stay present", "Practice gratitude"]
                        }
                    });
                }, 2000);
            } else {
                setTimeout(() => {
                    onCheckInComplete();
                    resetState();
                }, 2000);
            }

        } catch (err: any) {
            console.error("Error in handleSave:", err);
            setError(err.message || "An unexpected error occurred. Please try again.");
            setStep("error");
        }
    };

    const resetState = useCallback(() => {
        setStep("idle");
        setError(null);
        setProcessingMessage("");
        setAudioBlob(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setTranscription("");
        setEditedTranscription("");
        setIsEditingText(false);
        setSelectedMood("");
        setIsPlaying(false);
        setPlaybackTime(0);
        setDuration(0);
    }, [audioUrl]);

    const togglePlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // Orb display logic
    const renderOrbContent = () => {
        switch (step) {
            case "recording":
                return <Mic className="w-16 h-16" />;
            case "reviewing":
                return <Edit3 className="w-16 h-16" />;
            case "processing":
            case "generating":
                return <Loader2 className="w-16 h-16 animate-spin" />;
            case "complete":
                return <Check className="w-16 h-16" />;
            case "error":
                return <AlertTriangle className="w-16 h-16" />;
            default:
                return <Mic className="w-16 h-16" />;
        }
    };

    const getHelperText = () => {
        switch (step) {
            case "idle":
                return "Tap the orb to start recording your thoughts";
            case "recording":
                return "Tap again to stop recording";
            case "processing":
                return "Processing audio...";
            case "generating":
                return "Generating AI response...";
            case "complete":
                return "Check-in completed successfully!";
            case "error":
                return error || "An unexpected error occurred. Please try again.";
            default:
                return "";
        }
    };

    const renderAudioPlayer = () => {
        return (
            <div className="bg-gray-900/70 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-3">Your Recording</h3>
                <div className="flex items-center gap-4">
                    <button onClick={togglePlayback} className="text-white">
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max={duration}
                        value={playbackTime}
                        onChange={(e) => {
                            if (audioRef.current)
                                audioRef.current.currentTime = Number(e.target.value);
                        }}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-xs w-20 text-right">
                        {formatTime(playbackTime)} / {formatTime(duration)}
                    </div>
                </div>
                <audio
                    ref={audioRef}
                    src={audioUrl || ""}
                    onLoadedData={() => setDuration(audioRef.current?.duration || 0)}
                    onTimeUpdate={() =>
                        setPlaybackTime(audioRef.current?.currentTime || 0)
                    }
                    onEnded={() => setIsPlaying(false)}
                />
            </div>
        );
    };

    const renderTranscriptionEditor = () => {
        return (
            <div className="bg-gray-900/70 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Your Thoughts</h3>
                    <button
                        onClick={() => setIsEditingText(!isEditingText)}
                        className="text-sm text-blue-400 flex items-center gap-1"
                    >
                        {isEditingText ? <Check size={16} /> : <Edit3 size={16} />}
                        {isEditingText ? "Done" : "Edit"}
                    </button>
                </div>
                {isEditingText ? (
                    <textarea
                        value={editedTranscription}
                        onChange={(e) => setEditedTranscription(e.target.value)}
                        className="w-full bg-gray-700 p-2 rounded-md h-24 text-white"
                    />
                ) : (
                    <p className="text-gray-300">{editedTranscription}</p>
                )}
            </div>
        );
    };

    const renderMoodSelector = () => {
        return (
            <div className="mb-8">
                <h3 className="font-semibold mb-3">How are you feeling?</h3>
                <Select onValueChange={(value) => setSelectedMood(value as MoodTag)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select your mood" />
                    </SelectTrigger>
                    <SelectContent>
                        {MOOD_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        );
    };

    // Main render logic
    if (step === "reviewing") {
        return (
            <div className="w-full max-w-2xl mx-auto p-4 bg-gray-800 rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-center">Review & Save</h2>
                {renderAudioPlayer()}
                {renderTranscriptionEditor()}
                {renderMoodSelector()}
                <div className="flex justify-center mt-6 space-x-4">
                    <Button onClick={handleSave} disabled={!selectedMood}>
                        <Check className="mr-2" />
                        Save & Generate AI Response
                    </Button>
                    <Button variant="outline" onClick={resetState}>
                        Discard
                    </Button>
                </div>
                {error && <p className="text-red-400 text-center mt-4">{error}</p>}
            </div>
        );
    }

    const getOrbProps = () => {
        switch (step) {
            case "recording":
                return {
                    hue: 0, // Red for recording
                    forceHoverState: true,
                    rotateOnHover: true,
                    hoverIntensity: 0.8,
                };
            case "processing":
            case "generating":
                return {
                    hue: 60, // Yellow for processing
                    forceHoverState: true,
                    rotateOnHover: true,
                    hoverIntensity: 0.6,
                };
            case "complete":
                return {
                    hue: 120, // Green for complete
                    forceHoverState: true,
                    rotateOnHover: false,
                    hoverIntensity: 0.4,
                };
            case "error":
                return {
                    hue: 0, // Red for error
                    forceHoverState: false,
                    rotateOnHover: false,
                    hoverIntensity: 0.3,
                };
            default:
                return {
                    hue: 220, // Blue for idle/reviewing
                    forceHoverState: false,
                    rotateOnHover: true,
                    hoverIntensity: 0.3,
                };
        }
    };

    return (
        <div className="text-center p-4 flex flex-col items-center justify-center h-full">
            <div className="relative w-96 h-96 mx-auto mb-8">
                <div
                    onClick={handleOrbClick}
                    className="cursor-pointer w-full h-full"
                    style={{ pointerEvents: step === "processing" || step === "generating" || step === "complete" ? "none" : "auto" }}
                >
                    <Orb {...getOrbProps()} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none">
                    {renderOrbContent()}
                </div>
            </div>
            <p className="mt-6 text-lg text-gray-300 h-10">{getHelperText()}</p>
            {processingMessage && (
                <p className="mt-2 text-sm text-blue-400">{processingMessage}</p>
            )}
        </div>
    );
}
