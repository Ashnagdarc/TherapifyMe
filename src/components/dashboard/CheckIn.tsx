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

  // Debug: Check if environment variables are loaded
  console.log("🔧 Environment Check:", {
    elevenLabs: import.meta.env.VITE_ELEVENLABS_API_KEY
      ? "✅ Loaded"
      : "❌ Missing",
    tavus: import.meta.env.VITE_TAVUS_API_KEY ? "✅ Loaded" : "❌ Missing",
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? "✅ Loaded" : "❌ Missing",
  });
  const [step, setStep] = useState<CheckInStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState("");

  // Reviewing state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState("");
  // Note: editedTranscription removed - we now use original transcription for AI response
  const [selectedMood, setSelectedMood] = useState("");

  // Audio playback state
  const audioRef = useRef<HTMLAudioElement>(null);
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

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

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
      setError(
        "Microphone access denied. Please enable microphone permissions."
      );
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
    setProcessingMessage(
      "Converting your voice to text with AI transcription..."
    );
    try {
      const text = await TranscriptionService.transcribeAudio(blob);
      setTranscription(text);
      // Don't allow editing - use original transcription for AI response
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
      setProcessingMessage("Analyzing your voice recording...");
      // Use original transcription from voice recording, not edited text
      const { finalResponse, videoScript } =
        await EnhancedAIService.generateEnhancedResponse(transcription);

      setProcessingMessage("Creating AI audio response...");
      let aiResponseAudioUrl: string | null = null;
      const elevenLabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

      console.log("🔧 ElevenLabs Debug:", {
        apiKeyExists: !!elevenLabsApiKey,
        apiKeyLength: elevenLabsApiKey?.length || 0,
        apiKeyStart: elevenLabsApiKey?.substring(0, 10) || "none",
      });

      if (elevenLabsApiKey) {
        try {
          console.log("Starting AI audio generation with ElevenLabs...");
          const audioBlob = await ElevenLabsService.textToSpeech(finalResponse);
          console.log("AI audio blob generated:", audioBlob.size, "bytes");

          const audioFilePath = `${user.id}/${Date.now()}-ai-response.mp3`;
          const { error: audioUploadError } = await supabase.storage
            .from("voice-recordings")
            .upload(audioFilePath, audioBlob);

          if (!audioUploadError) {
            const {
              data: { publicUrl: aiAudioUrl },
            } = supabase.storage
              .from("voice-recordings")
              .getPublicUrl(audioFilePath);
            aiResponseAudioUrl = aiAudioUrl;
            console.log("AI audio uploaded successfully:", aiAudioUrl);
          } else {
            console.error("Failed to upload AI audio:", audioUploadError);
            console.error("Upload path attempted:", audioFilePath);
          }
        } catch (audioError) {
          console.warn(
            "AI audio generation failed, proceeding without audio:",
            audioError
          );
        }
      } else {
        console.warn(
          "ElevenLabs API key not configured - skipping AI audio generation"
        );
        setProcessingMessage(
          "Skipping audio generation (API key not configured)..."
        );
      }

      setProcessingMessage("Uploading voice note...");
      const filePath = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("voice-recordings")
        .upload(filePath, audioBlob);
      if (uploadError)
        throw new Error(`Audio upload failed: ${uploadError.message}`);

      const {
        data: { publicUrl },
      } = supabase.storage.from("voice-recordings").getPublicUrl(filePath);

      let tavusVideoUrl: string | null = null;
      const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
      if (tavusApiKey && videoScript) {
        setProcessingMessage("Creating personalized video...");
        try {
          const videoResponse = await TavusService.createVideo(
            tavusApiKey,
            videoScript
          );
          console.log("Video creation started:", videoResponse.video_id);

          // Enhanced polling with progress updates
          const maxAttempts = 15;
          for (let i = 0; i < maxAttempts; i++) {
            const progress = Math.round(((i + 1) / maxAttempts) * 100);
            setProcessingMessage(
              `Creating personalized video... ${progress}% (${i * 4}s)`
            );

            await new Promise((res) => setTimeout(res, 4000)); // Poll every 4 seconds

            try {
              const status = await TavusService.getVideoStatus(
                tavusApiKey,
                videoResponse.video_id
              );
              console.log(`Video status check ${i + 1}:`, status.status);

              if (status.status === "completed") {
                tavusVideoUrl = status.download_url || null;
                setProcessingMessage("Video generation completed!");
                console.log("Video completed with URL:", tavusVideoUrl);
                break;
              }
              if (status.status === "failed") {
                console.warn("Tavus video generation failed.");
                setProcessingMessage("Video generation failed, continuing...");
                break;
              }
              if (status.status === "generating") {
                setProcessingMessage(
                  `Video generating... ${progress}% (${(i + 1) * 4}s elapsed)`
                );
              }
              if (status.status === "pending") {
                setProcessingMessage(
                  `Video pending... ${progress}% (${(i + 1) * 4}s elapsed)`
                );
              }
            } catch (statusError) {
              console.warn(`Status check ${i + 1} failed:`, statusError);
            }
          }
        } catch (tavusError) {
          console.error(
            "Error during Tavus video creation, proceeding without it.",
            tavusError
          );
          setProcessingMessage("Video generation error, continuing...");
        }
      }

      setProcessingMessage("Saving your entry...");
      const { data: insertData, error: insertError } = await supabase
        .from("entries")
        .insert({
          user_id: profile.id,
          mood_tag: selectedMood,
          transcription: transcription, // Use original transcription from voice recording
          voice_note_url: publicUrl,
          ai_response_url: aiResponseAudioUrl,
          text_summary: finalResponse,
          tavus_video_url: tavusVideoUrl,
        })
        .select();

      if (insertError)
        throw new Error(`Failed to save entry: ${insertError.message}`);

      setStep("complete");

      // Navigate to AI response page with audio URL
      const entryId = insertData?.[0]?.id;
      if (entryId) {
        setTimeout(() => {
          navigate("/ai-response", {
            state: {
              entryId,
              mood: selectedMood,
              transcription: transcription, // Show original voice transcription
              aiResponse: finalResponse,
              aiResponseAudioUrl,
              suggestions: [
                "Take deep breaths",
                "Stay present",
                "Practice gratitude",
              ],
            },
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
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
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
    setSelectedMood("");
    setIsPlaying(false);
    setPlaybackTime(0);
    setDuration(0);
  }, [audioUrl]);

  function togglePlayback() {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }

  // Orb display logic
  function renderOrbContent() {
    if (step === "recording") {
      return <Mic className="w-13 h-13 md:w-16 md:h-16" />;
    } else if (step === "reviewing") {
      return <Check className="w-13 h-13 md:w-16 md:h-16" />;
    } else if (step === "processing" || step === "generating") {
      return <Loader2 className="w-13 h-13 md:w-16 md:h-16 animate-spin" />;
    } else if (step === "complete") {
      return <Check className="w-13 h-13 md:w-16 md:h-16" />;
    } else if (step === "error") {
      return <AlertTriangle className="w-13 h-13 md:w-16 md:h-16" />;
    } else {
      return <Mic className=" w-13 h-13 md:w-16 md:h-16" />;
    }
  }

  function getHelperText() {
    if (step === "idle") {
      return "Tap the orb to start recording your thoughts";
    } else if (step === "recording") {
      return "Tap again to stop recording";
    } else if (step === "processing") {
      return "Processing audio...";
    } else if (step === "generating") {
      return "Generating AI response...";
    } else if (step === "complete") {
      return "Check-in completed successfully!";
    } else if (step === "error") {
      return error || "An unexpected error occurred. Please try again.";
    } else {
      return "";
    }
  }

  function renderAudioPlayer() {
    return (
      <div className="w-full flex flex-col gap-[0.7rem] bg-gray-900/70 p-4 rounded-lg lg:w-[90%] ">
        <h3 className="font-semibold">Your Recording</h3>
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
  }

  function renderTranscriptionEditor() {
    if (!transcription) return null;

    // Analyze voice content for display
    const themes = transcription.toLowerCase().includes("work")
      ? ["work stress"]
      : transcription.toLowerCase().includes("relationship")
      ? ["relationships"]
      : transcription.toLowerCase().includes("anxious") ||
        transcription.toLowerCase().includes("stressed")
      ? ["anxiety"]
      : transcription.toLowerCase().includes("happy") ||
        transcription.toLowerCase().includes("good")
      ? ["positive mood"]
      : transcription.toLowerCase().includes("sad") ||
        transcription.toLowerCase().includes("down")
      ? ["sadness"]
      : ["general reflection"];

    return (
      <div className="w-full flex flex-col gap-[1rem] lg:w-[90%] ">
        {/* Voice Analysis Summary */}
        <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
          <h3 className="text-emerald-300 font-semibold mb-2 flex items-center gap-2">
            🎤 Voice Analysis
          </h3>

          <div className="text-sm text-emerald-200/80 space-y-1">
            <p>
              <strong>Detected themes:</strong> {themes.join(", ")}
            </p>

            <p>
              <strong>Length:</strong> ~
              {Math.round(transcription.split(" ").length / 2)} seconds of
              content
            </p>

            <p>
              <strong>Status:</strong> Your voice was successfully analyzed for
              AI response
            </p>
          </div>
        </div>

        {/* Original Transcription Display */}
        <div className="bg-gray-900/70 p-4 rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            📝 What You Shared
          </h3>
          <p className="text-gray-300 leading-relaxed italic">
            "{transcription}"
          </p>
          <p className="text-gray-500 text-xs mt-2">
            This is what we heard from your voice recording and will be used for
            your AI response.
          </p>
        </div>
      </div>
    );
  }

  function renderMoodSelector() {
    return (
      <div className=" w-full flex flex-col gap-[1rem] mb-8 lg:w-[40%] lg:self-start lg:relative lg:left-[4.5rem] ">
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
  }

  // Main render logic
  if (step === "reviewing") {
    return (
      <div className="w-[300px] flex flex-col items-center gap-[1rem]  text-grey-2/80 bg-gradient-to-br from-dark to-black rounded-2xl p-4 lg:w-[90%] ">
        <h2 className="text-2xl font-bold mb-4 text-center">Review & Save</h2>
        {renderAudioPlayer()}
        {renderTranscriptionEditor()}
        {renderMoodSelector()}

        <div className="flex flex-col items-center gap-[0.6rem] lg:flex-row lg:items-center ">
          <Button
            onClick={handleSave}
            disabled={!selectedMood}
            className="cursor-pointer"
          >
            <Check className="mr-2" />
            Save & Generate AI Response
          </Button>

          <Button
            variant="outline"
            onClick={resetState}
            className="w-full lg:w-auto hover:text-dark "
          >
            Discard
          </Button>
        </div>
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      </div>
    );
  }

  function getOrbProps() {
    if (step === "recording") {
      return {
        hue: 0, // Red for recording
        forceHoverState: true,
        rotateOnHover: true,
        hoverIntensity: 0.8,
      };
    } else if (step === "processing" || step === "generating") {
      return {
        hue: 60, // Yellow for processing
        forceHoverState: true,
        rotateOnHover: true,
        hoverIntensity: 0.6,
      };
    } else if (step === "complete") {
      return {
        hue: 120, // Green for complete
        forceHoverState: true,
        rotateOnHover: false,
        hoverIntensity: 0.4,
      };
    } else if (step === "error") {
      return {
        hue: 0, // Red for error
        forceHoverState: false,
        rotateOnHover: false,
        hoverIntensity: 0.3,
      };
    } else {
      return {
        hue: 220, // Blue for idle/reviewing
        forceHoverState: false,
        rotateOnHover: true,
        hoverIntensity: 0.3,
      };
    }
  }

  return (
    <div className="text-center p-4 flex flex-col items-center justify-center h-full">
      <div className="relative w-[300px] h-96 flex items-center justify-center mb-8 lg:w-96">
        <div
          onClick={handleOrbClick}
          className="cursor-pointer w-[60%] h-full lg:w-full"
          style={{
            pointerEvents:
              step === "processing" ||
              step === "generating" ||
              step === "complete"
                ? "none"
                : "auto",
          }}
        >
          <Orb {...getOrbProps()} hue={280} />
        </div>
        <div className="w-full absolute inset-0 flex items-center justify-center text-dark/70 pointer-events-none">
          {renderOrbContent()}
        </div>
      </div>
      <p className="mt-6 text-lg text-text-blue h-10">{getHelperText()}</p>
      {processingMessage && (
        <p className="mt-2 text-sm text-main">{processingMessage}</p>
      )}
    </div>
  );
}
