import { useEffect, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Entry, MoodTag } from "../types/database";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/Select";
import { AnalyticsService } from "../services/analyticsService";
import {
  Search,
  Play,
  Pause,
  Download,
  Trash2,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";

import DeleteBinIcon from "../assets/images/DeleteBin.png";

const MOOD_OPTIONS = [
  { value: "all", label: "All Moods" },
  { value: "happy", label: "😊 Happy" },
  { value: "calm", label: "😌 Calm" },
  { value: "anxious", label: "😰 Anxious" },
  { value: "sad", label: "😢 Sad" },
  { value: "stressed", label: "😤 Stressed" },
  { value: "excited", label: "🤩 Excited" },
  { value: "frustrated", label: "😠 Frustrated" },
  { value: "content", label: "😊 Content" },
];

function safeVideoUrl(url: unknown): string | undefined {
  return typeof url === "string" && url ? url : undefined;
}

function TavusVideoCard({
  status,
  videoUrl,
  userName,
  mood,
  onRetry,
}: {
  status: "processing" | "ready" | "error";
  videoUrl?: string;
  userName?: string;
  mood?: string;
  onRetry?: () => void;
}) {
  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (status === "ready") {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(t);
    }
  }, [status]);

  // Download handler
  function handleDownload() {
    if (videoUrl) {
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = "Linda-Therapist-Video.mp4";
      a.click();
    }
  }

  // Share handler (Web Share API)
  function handleShare() {
    if (navigator.share && videoUrl) {
      navigator.share({
        title: "Linda Therapist Video",
        url: videoUrl,
      });
    }
  }

  return (
    <div className="relative bg-gradient-to-br from-emerald-900/60 via-blue-900/60 to-purple-900/60 rounded-xl p-5 flex flex-col items-center shadow-lg border border-emerald-700/20 animate-in fade-in">
      {/* Confetti animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10 animate-bounce">
          {/* Simple confetti dots */}
          {[...Array(20)].map((_, i) => (
            <span
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            >
              🎉
            </span>
          ))}
        </div>
      )}
      {/* Avatar or video */}
      {status === "processing" && (
        <>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400/40 to-blue-400/40 flex items-center justify-center mb-2 animate-pulse">
            <img
              src="/avatar-linda.png"
              alt="Linda the Therapist"
              className="w-16 h-16 rounded-full object-cover"
            />
          </div>
          <div className="text-lg font-semibold text-emerald-200 mb-1">
            Linda is preparing your video...
          </div>
          <div className="text-xs text-blue-200 mb-2">
            This usually takes 1-2 minutes. You can continue using the app—we'll
            let you know when it's ready!
          </div>
          <div className="w-full flex justify-center mb-2">
            <div className="w-32 h-2 bg-emerald-800/40 rounded-full overflow-hidden">
              <div className="h-2 bg-emerald-400 animate-pulse rounded-full w-1/2"></div>
            </div>
          </div>
          {userName && mood && (
            <div className="text-xs text-slate-300 mb-1">
              For <span className="font-bold">{userName}</span> about feeling{" "}
              <span className="italic">{mood}</span>
            </div>
          )}
        </>
      )}
      {status === "ready" && videoUrl && (
        <>
          <div className="w-full aspect-video rounded-lg overflow-hidden mb-2 shadow-xl border border-emerald-700/30">
            <video
              src={videoUrl}
              controls
              className="w-full h-full bg-black rounded-lg"
            />
          </div>
          <div className="flex gap-2 mb-2">
            <Button variant="secondary" onClick={handleDownload}>
              Download
            </Button>
            {typeof navigator.share === "function" && (
              <Button variant="secondary" onClick={handleShare}>
                Share
              </Button>
            )}
          </div>
          {userName && mood && (
            <div className="text-xs text-slate-300 mb-1">
              For <span className="font-bold">{userName}</span> about feeling{" "}
              <span className="italic">{mood}</span>
            </div>
          )}
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-20 h-20 rounded-full bg-red-900/40 flex items-center justify-center mb-2">
            <span className="text-4xl">⚠️</span>
          </div>
          <div className="text-lg font-semibold text-red-200 mb-1">
            Oops! Video failed
          </div>
          <div className="text-xs text-red-300 mb-2">
            Something went wrong creating your video. Please try again.
          </div>
          {onRetry && (
            <Button variant="primary" onClick={onRetry}>
              Retry
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export default function JournalPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodTag | "all">("all");
  const [dateFilter, setDateFilter] = useState("");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // Audio player state
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [videoPlayer, setVideoPlayer] = useState<{ [key: string]: boolean }>(
    {}
  );

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    entryId: string | null;
    entryMood: string;
    entryDate: string;
  }>({
    isOpen: false,
    entryId: null,
    entryMood: "",
    entryDate: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    if (profile) fetchEntries();

    // Cleanup audio on component unmount
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
      }
    };
  }, [profile]);

  useEffect(() => {
    let filtered = entries.filter((entry) => {
      const searchTermMatch =
        searchTerm === "" ||
        entry.transcription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.text_summary?.toLowerCase().includes(searchTerm.toLowerCase());
      const moodMatch =
        selectedMood === "all" || entry.mood_tag === selectedMood;
      const dateMatch =
        dateFilter === "" ||
        new Date(entry.created_at).toISOString().slice(0, 10) === dateFilter;
      return searchTermMatch && moodMatch && dateMatch;
    });
    setFilteredEntries(filtered);
  }, [searchTerm, selectedMood, dateFilter, entries]);

  const fetchEntries = async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching entries", error);
    else setEntries(data || []);
    setLoading(false);
  };

  const getMoodEmoji = (mood: string) =>
    MOOD_OPTIONS.find((m) => m.value === mood)?.label.split(" ")[0] || "😐";

  const handlePlayAudio = (url: string | null | undefined, id: string) => {
    if (!url) return;
    if (audioPlayer && playingAudio === id) {
      audioPlayer.pause();
      setPlayingAudio(null);
    } else {
      if (audioPlayer) {
        audioPlayer.pause();
      }
      const newAudio = new Audio(url);
      setAudioPlayer(newAudio);
      newAudio.play();
      setPlayingAudio(id);
      newAudio.onended = () => setPlayingAudio(null);
    }
  };

  const openDeleteConfirmation = (entry: Entry) => {
    setDeleteConfirmation({
      isOpen: true,
      entryId: entry.id,
      entryMood: entry.mood_tag,
      entryDate: new Date(entry.created_at).toLocaleDateString(),
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      entryId: null,
      entryMood: "",
      entryDate: "",
    });
  };

  const deleteEntry = async () => {
    if (!deleteConfirmation.entryId || !profile) return;

    setIsDeleting(true);

    try {
      // First, get the entry to check for file URLs
      const { data: entryData, error: fetchError } = await supabase
        .from("entries")
        .select("voice_note_url, ai_response_url, tavus_video_url")
        .eq("id", deleteConfirmation.entryId)
        .single();

      if (fetchError) {
        console.error("Error fetching entry for deletion:", fetchError);
        return;
      }

      // Delete associated files from storage
      const filesToDelete: string[] = [];

      if (entryData.voice_note_url) {
        const voiceFilePath =
          entryData.voice_note_url.split("/voice-recordings/")[1];
        if (voiceFilePath) filesToDelete.push(voiceFilePath);
      }

      if (entryData.ai_response_url) {
        const aiFilePath =
          entryData.ai_response_url.split("/voice-recordings/")[1];
        if (aiFilePath) filesToDelete.push(aiFilePath);
      }

      // Delete files from storage (ignore errors - files may already be deleted)
      if (filesToDelete.length > 0) {
        await supabase.storage.from("voice-recordings").remove(filesToDelete);
      }

      // Delete the database entry
      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("id", deleteConfirmation.entryId);

      if (error) {
        console.error("Error deleting entry:", error);
        return;
      }

      // Invalidate analytics cache to update dashboard
      const analyticsService = AnalyticsService.getInstance();
      analyticsService.invalidateUserCache(profile.id);

      // Refresh the entries list
      await fetchEntries();

      // Close confirmation dialog
      closeDeleteConfirmation();

      // Show success message
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
    } catch (error) {
      console.error("Unexpected error during deletion:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderEntryMedia = (entry: Entry) => {
    const hasVoice = !!entry.voice_note_url;
    const hasAIAudio = !!entry.ai_response_url;
    const hasVideo = !!entry.tavus_video_url;
    const hasText = !!entry.text_summary;
    const hasAnyMedia = hasVoice || hasAIAudio || hasVideo;
    const showMissingAudio = hasText && !hasAIAudio;

    // Determine Tavus video status
    let tavusStatus: "processing" | "ready" | "error" = "processing";
    if (hasVideo) tavusStatus = "ready";
    // Optionally, you could track error state if you have a field for it

    if (!hasAnyMedia && !showMissingAudio) return null;

    const videoUrlSafe: string | undefined = safeVideoUrl(
      entry.tavus_video_url
    );

    return (
      <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-2">
        {hasVoice && (
          <Button
            variant="secondary"
            onClick={() =>
              handlePlayAudio(entry.voice_note_url, entry.id + "-voice")
            }
            className="w-full"
          >
            {playingAudio === entry.id + "-voice" ? (
              <Pause size={16} className="mr-2" />
            ) : (
              <Play size={16} className="mr-2" />
            )}
            Your Voice Note
          </Button>
        )}
        {hasAIAudio ? (
          <Button
            variant="secondary"
            onClick={() =>
              handlePlayAudio(entry.ai_response_url, entry.id + "-ai")
            }
            className="w-full"
          >
            {playingAudio === entry.id + "-ai" ? (
              <Pause size={16} className="mr-2" />
            ) : (
              <Play size={16} className="mr-2" />
            )}
            Listen to AI Response
          </Button>
        ) : showMissingAudio ? (
          <div className="w-full p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-400">
              <span className="text-sm">⚠️</span>
              <span className="text-xs">
                AI audio not available (created before audio feature or API key
                missing)
              </span>
            </div>
          </div>
        ) : null}
        {/* Tavus Video Card: show processing, ready, or error state */}
        {(hasVideo || entry.tavus_video_url === null) && (
          <TavusVideoCard
            status={tavusStatus}
            videoUrl={videoUrlSafe}
            userName={profile?.full_name}
            mood={entry.mood_tag}
            // onRetry={...} // Optionally implement retry logic
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-8">
      {/* Success notification */}
      {deleteSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-right">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <span className="font-medium">Entry deleted successfully</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Journal</h1>
            <p className="text-gray-400">
              {filteredEntries.length} of {entries.length} entries
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm("");
                setSelectedMood("all");
                setDateFilter("");
              }}
            >
              Clear Filters
            </Button>
            <Button variant="primary" onClick={() => navigate("/dashboard")}>
              New Check-in
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Input
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
            className="md:col-span-1"
            icon={<Search size={16} className="text-gray-400" />}
          />
          <Select
            value={selectedMood}
            onValueChange={(v: MoodTag | "all") => setSelectedMood(v)}
          >
            <SelectTrigger className="md:col-span-1">
              <SelectValue placeholder="All Moods" />
            </SelectTrigger>
            <SelectContent>
              {MOOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setDateFilter(e.target.value)
            }
            className="md:col-span-1"
          />
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="text-center p-8">
            <span className="text-gray-400">Loading entries...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="bg-gray-800/50 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getMoodEmoji(entry.mood_tag)}
                    </span>
                    <div>
                      <h2 className="font-bold text-lg capitalize">
                        {entry.mood_tag}
                      </h2>
                      <p className="text-xs text-gray-400">
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 h-auto text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    onClick={() => openDeleteConfirmation(entry)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                <div className="space-y-3 text-sm">
                  {entry.text_summary && (
                    <div>
                      <h4 className="font-semibold text-blue-400 mb-1">
                        AI Summary
                      </h4>
                      <p className="text-gray-300">{entry.text_summary}</p>
                    </div>
                  )}
                  {entry.transcription && (
                    <div>
                      <h4 className="font-semibold text-gray-400 mb-1">
                        Your Words
                      </h4>
                      <p className="text-gray-300 italic">
                        "{entry.transcription}"
                      </p>
                    </div>
                  )}
                </div>
                {renderEntryMedia(entry)}
              </div>
            ))}
            {filteredEntries.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No entries match your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.isOpen && (
        <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center bg-black/40 backdrop-blur-2xl z-[999] lg:w-[full] ">
          <div className="w-full flex flex-col items-center gap-[1rem] bg-grey-2 rounded-2xl p-6 mx-4 border-2 border-red lg:w-[400px] ">
            <div className="flex flex-col items-center gap-[0.5rem]">
              <img src={DeleteBinIcon} alt="delete icon" />

              <div className="flex flex-col items-center gap-[0.3rem]">
                <h3 className="text-lg font-semibold text-text-blue">
                  Delete Entry
                </h3>

                <p className="text-sm text-text-blue/70">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gradient-to-br from-dark to-black rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl">
                  {getMoodEmoji(deleteConfirmation.entryMood)}
                </span>
                <span className="font-medium text-gray-300 capitalize">
                  {deleteConfirmation.entryMood}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Created on {deleteConfirmation.entryDate}
              </p>
              <p className="text-sm text-red-400 mt-2">
                This will permanently delete the entry, voice recording, AI
                response audio, and any associated files.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={closeDeleteConfirmation}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={deleteEntry}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
