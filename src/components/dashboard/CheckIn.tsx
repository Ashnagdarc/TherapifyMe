import { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { TranscriptionService } from "../../services/transcriptionService";
import { EnhancedAIService } from "../../services/enhancedAIService";
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
  const [step, setStep] = useState<CheckInStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState("");

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((track) => track.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleOrbClick = async () => {
    if (step === "idle" || step === "error") {
      await startRecording();
    } else if (step === "recording") {
      stopRecording();
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        processRecording(blob);
      };

      recorder.start();
      setIsRecording(true);
      setStep("recording");
      timerRef.current = setInterval(
        () => setRecordingTime((prev) => prev + 1),
        1000
      );
    } catch (err) {
      console.error(err);
      setError("Could not access microphone. Please check permissions.");
      setStep("error");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
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
    if (!selectedMood || !profile || !user) {
      setError("Please select a mood.");
      return;
    }
    setStep("generating");
    setProcessingMessage("Saving entry & generating AI response...");

    try {
      // 1. Upload audio
      const filePath = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("voice-recordings")
        .upload(filePath, audioBlob!);
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("voice-recordings").getPublicUrl(filePath);

      // 2. Generate AI response
      const aiResponse = await EnhancedAIService.generateResponse(
        selectedMood,
        editedTranscription,
        profile.preferred_tone,
        user.id
      );

      // 3. Save entry
      const { error: insertError } = await supabase.from("entries").insert({
        user_id: profile.id,
        mood_tag: selectedMood,
        transcription: editedTranscription,
        voice_note_url: publicUrl,
        text_summary: aiResponse.response,
        ai_response_url: "", // Assuming no audio response for now
      });
      if (insertError) throw insertError;

      setStep("complete");
      setTimeout(() => {
        onCheckInComplete();
        resetState();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Failed to save your check-in. Please try again.");
      setStep("error");
    }
  };

  const resetState = () => {
    setStep("idle");
    setError(null);
    setProcessingMessage("");
    setIsRecording(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription("");
    setEditedTranscription("");
    setIsEditingText(false);
    setSelectedMood("");
    setIsPlaying(false);
    setPlaybackTime(0);
    setDuration(0);
  };

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
        return (
          <div className="text-center">
            <p className="text-2xl font-bold">
              {new Date(recordingTime * 1000).toISOString().substr(14, 5)}
            </p>
          </div>
        );
      case "reviewing":
        return <Edit3 size={40} />;
      case "processing":
      case "generating":
        return <Loader2 size={40} className="animate-spin" />;
      case "complete":
        return <Check size={40} />;
      case "error":
        return <AlertTriangle size={40} />;
      default:
        return <Mic size={40} />;
    }
  };

  if (step !== "idle" && step !== "recording") {
    return (
      <div className="bg-gray-800/50 p-8 rounded-2xl max-w-2xl mx-auto text-white">
        <h2 className="text-2xl font-bold text-center mb-2">
          Hello {profile?.full_name || "there"}
        </h2>
        <p className="text-center text-gray-400 mb-8">
          Review your transcription, then select your mood
        </p>

        {/* Audio Player */}
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
              {new Date(playbackTime * 1000).toISOString().substr(14, 5)} /{" "}
              {new Date(duration * 1000).toISOString().substr(14, 5)}
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

        {/* Transcription */}
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

        {/* Mood Selector */}
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

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="secondary" onClick={resetState} className="w-full">
            Start Over
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="w-full"
            disabled={step === "generating" || !selectedMood}
          >
            {step === "generating" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save & Generate AI Response
          </Button>
        </div>
        {error && (
          <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="text-center text-white flex flex-col items-center justify-center">
      <div onClick={handleOrbClick} className="cursor-pointer">
        <Orb hue={220} forceHoverState={isRecording}>
          <div className="absolute inset-0 flex items-center justify-center">
            {renderOrbContent()}
          </div>
        </Orb>
      </div>
      <h2 className="text-2xl font-bold mt-8">Hello there</h2>
      <p className="text-gray-400 mt-2">
        {step === "idle" && "Tap the orb to start recording your thoughts"}
        {step === "recording" && "Tap again to stop recording"}
        {error && <span className="text-red-400">{error}</span>}
      </p>
      <p className="text-xs text-gray-600 mt-4">
        State: {step} | Transcription: {transcription ? "Yes" : "No"} | Audio:{" "}
        {audioBlob ? "Yes" : "No"}
      </p>
    </div>
  );
}
