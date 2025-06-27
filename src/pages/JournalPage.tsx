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
  ArrowLeft,
  Calendar,
  Filter,
  FileText,
  Mic,
  Volume2,
  Video,
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

function safeVideoUrl(url: string | null | undefined): string | undefined {
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
    <div className="relative bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200/50 rounded-xl p-6 flex flex-col items-center shadow-sm">
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
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center mb-4 animate-pulse border-2 border-emerald-200">
            <Video className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="text-lg font-semibold text-emerald-700 mb-2">
            Linda is preparing your video...
          </div>
          <div className="text-sm text-blue-600 mb-4 text-center">
            This usually takes 1-2 minutes. You can continue using the app—we'll
            let you know when it's ready!
          </div>
          <div className="w-full flex justify-center mb-4">
            <div className="w-32 h-2 bg-emerald-200 rounded-full overflow-hidden">
              <div className="h-2 bg-emerald-500 animate-pulse rounded-full w-1/2"></div>
            </div>
          </div>
          {userName && mood && (
            <div className="text-sm text-gray-600 text-center">
              For <span className="font-semibold">{userName}</span> about feeling{" "}
              <span className="italic">{mood}</span>
            </div>
          )}
        </>
      )}
      {status === "ready" && videoUrl && (
        <>
          <div className="w-full aspect-video rounded-lg overflow-hidden mb-4 shadow-lg border border-emerald-200">
            <video
              src={videoUrl}
              controls
              className="w-full h-full bg-black rounded-lg"
            />
          </div>
          <div className="flex gap-3 mb-3">
            <Button variant="secondary" onClick={handleDownload} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-300">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {typeof navigator.share === "function" && (
              <Button variant="secondary" onClick={handleShare} className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300">
                Share
              </Button>
            )}
          </div>
          {userName && mood && (
            <div className="text-sm text-gray-600 text-center">
              For <span className="font-semibold">{userName}</span> about feeling{" "}
              <span className="italic">{mood}</span>
            </div>
          )}
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4 border-2 border-red-200">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div className="text-lg font-semibold text-red-700 mb-2">
            Oops! Video failed
          </div>
          <div className="text-sm text-red-600 mb-4 text-center">
            Something went wrong creating your video. Please try again.
          </div>
          {onRetry && (
            <Button variant="primary" onClick={onRetry} className="bg-red-600 hover:bg-red-700">
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

    if (error) {
      console.error("Error fetching entries:", error);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  const getMoodEmoji = (mood: string) =>
    MOOD_OPTIONS.find((m) => m.value === mood)?.label.split(" ")[0] || "😐";

  const handlePlayAudio = (url: string | null | undefined, id: string) => {
    if (!url) return;

    if (playingAudio === id) {
      audioPlayer?.pause();
      setPlayingAudio(null);
      return;
    }

    if (audioPlayer) {
      audioPlayer.pause();
    }

    const audio = new Audio(url);
    audio.onended = () => setPlayingAudio(null);
    audio.play();
    setAudioPlayer(audio);
    setPlayingAudio(id);
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
    if (!deleteConfirmation.entryId) return;

    setIsDeleting(true);
    try {
      // Get entry details first
      const { data: entry, error: fetchError } = await supabase
        .from("entries")
        .select("*")
        .eq("id", deleteConfirmation.entryId)
        .single();

      if (fetchError) throw fetchError;

      // Delete files from storage
      const filesToDelete = [];
      if (entry.voice_note_url) {
        const fileName = entry.voice_note_url.split("/").pop();
        if (fileName) filesToDelete.push(`${entry.user_id}/${fileName}`);
      }
      if (entry.ai_response_url) {
        const fileName = entry.ai_response_url.split("/").pop();
        if (fileName) filesToDelete.push(`${entry.user_id}/${fileName}`);
      }
      if (entry.tavus_video_url) {
        const fileName = entry.tavus_video_url.split("/").pop();
        if (fileName) filesToDelete.push(`${entry.user_id}/${fileName}`);
      }

      // Delete from storage
      if (filesToDelete.length > 0) {
        await supabase.storage.from("voice-recordings").remove(filesToDelete);
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from("entries")
        .delete()
        .eq("id", deleteConfirmation.entryId);

      if (deleteError) throw deleteError;

      // Update local state
      setEntries((prev) =>
        prev.filter((e) => e.id !== deleteConfirmation.entryId)
      );

      // Invalidate analytics cache
      const analyticsService = AnalyticsService.getInstance();
      analyticsService.invalidateUserCache(profile?.id || "");

      // Show success message
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);

      closeDeleteConfirmation();
    } catch (error) {
      console.error("Error deleting entry:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderEntryMedia = (entry: Entry) => {
    const hasVoiceRecording = entry.voice_note_url;
    const hasAIAudio = entry.ai_response_url;
    const hasVideo = entry.tavus_video_url;

    // Show missing audio warning for old entries that might not have AI audio
    const showMissingAudio = !hasAIAudio && entry.text_summary;

    let tavusStatus: "processing" | "ready" | "error" = "ready";
    if (entry.tavus_video_url === null) tavusStatus = "processing";
    else if (!entry.tavus_video_url) tavusStatus = "error";

    const videoUrlSafe = safeVideoUrl(entry.tavus_video_url);

    return (
      <div className="space-y-4">
        {hasVoiceRecording && (
          <Button
            variant="secondary"
            onClick={() =>
              handlePlayAudio(entry.voice_note_url, entry.id)
            }
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            {playingAudio === entry.id ? (
              <Pause size={16} className="mr-2" />
            ) : (
              <Mic size={16} className="mr-2" />
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
            className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
          >
            {playingAudio === entry.id + "-ai" ? (
              <Pause size={16} className="mr-2" />
            ) : (
              <Volume2 size={16} className="mr-2" />
            )}
            Listen to AI Response
          </Button>
        ) : showMissingAudio ? (
          <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-2 text-amber-700">
              <AlertTriangle size={16} />
              <span className="text-sm">
                AI audio not available (created before audio feature or API key missing)
              </span>
            </div>
          </div>
        ) : null}

        {/* Tavus Video Card: show processing, ready, or error state */}
        {(hasVideo || entry.tavus_video_url === null) && (
          <TavusVideoCard
            status={tavusStatus}
            videoUrl={entry.tavus_video_url || undefined}
            userName={profile?.full_name}
            mood={entry.mood_tag}
          // onRetry={...} // Optionally implement retry logic
          />
        )}
      </div>
    );
  };

  const activeFiltersCount = [
    searchTerm !== "",
    selectedMood !== "all",
    dateFilter !== "",
  ].filter(Boolean).length;

  return (
    <div className="w-full min-h-screen bg-gray-50 flex justify-center">
      {/* Success notification */}
      {deleteSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-green-200 text-green-800 px-6 py-4 rounded-lg shadow-lg animate-in slide-in-from-right">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <span className="font-medium">Entry deleted successfully</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-3xl px-6 py-8 pt-24">
        {/* Header Section */}
        <div className="mb-8">
          <Button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 bg-white hover:bg-gray-50 border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Journal</h1>
              <p className="text-lg text-gray-600">
                {filteredEntries.length} of {entries.length} entries
                {activeFiltersCount > 0 && (
                  <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedMood("all");
                  setDateFilter("");
                }}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate("/dashboard")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                New Check-in
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                className="pl-10 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                icon={<Search size={16} className="text-gray-400" />}
              />
            </div>

            <Select
              value={selectedMood}
              onValueChange={(v: MoodTag | "all") => setSelectedMood(v)}
            >
              <SelectTrigger className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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

            <div className="relative">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setDateFilter(e.target.value)
                }
                className="pl-10 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your entries...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Entry Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-2xl">
                      {getMoodEmoji(entry.mood_tag)}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 capitalize mb-1">
                        {entry.mood_tag}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 h-auto text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    onClick={() => openDeleteConfirmation(entry)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                {/* Entry Content */}
                <div className="space-y-4 mb-6">
                  {entry.text_summary && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-blue-700 mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        AI Summary
                      </h4>
                      <p className="text-gray-700 leading-relaxed">{entry.text_summary}</p>
                    </div>
                  )}
                  {entry.transcription && (
                    <div className="border-l-4 border-blue-200 pl-4">
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center">
                        <Mic className="w-4 h-4 mr-2" />
                        Your Words
                      </h4>
                      <p className="text-gray-600 italic leading-relaxed">
                        "{entry.transcription}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Media Section */}
                {renderEntryMedia(entry)}
              </div>
            ))}

            {filteredEntries.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No entries found</h3>
                <p className="text-gray-500 mb-6">
                  {entries.length === 0
                    ? "Start your journey by creating your first check-in."
                    : "Try adjusting your filters to find what you're looking for."
                  }
                </p>
                <Button
                  variant="primary"
                  onClick={() => navigate("/dashboard")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Create First Entry
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Delete Entry
              </h3>
              <p className="text-gray-600">
                This action cannot be undone
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">
                  {getMoodEmoji(deleteConfirmation.entryMood)}
                </span>
                <span className="font-medium text-gray-900 capitalize">
                  {deleteConfirmation.entryMood}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Created on {deleteConfirmation.entryDate}
              </p>
              <p className="text-sm text-red-600">
                This will permanently delete the entry, voice recording, AI
                response audio, and any associated files.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={closeDeleteConfirmation}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={deleteEntry}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Entry
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
