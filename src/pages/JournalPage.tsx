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
  const [videoPlayer, setVideoPlayer] = useState<{ [key: string]: boolean }>({});

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
        const voiceFilePath = entryData.voice_note_url.split('/voice-recordings/')[1];
        if (voiceFilePath) filesToDelete.push(voiceFilePath);
      }

      if (entryData.ai_response_url) {
        const aiFilePath = entryData.ai_response_url.split('/voice-recordings/')[1];
        if (aiFilePath) filesToDelete.push(aiFilePath);
      }

      // Delete files from storage (ignore errors - files may already be deleted)
      if (filesToDelete.length > 0) {
        await supabase.storage.from("voice-recordings").remove(filesToDelete);
      }

      // Delete the database entry
      const { error } = await supabase.from("entries").delete().eq("id", deleteConfirmation.entryId);

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
    const showMissingAudio = hasText && !hasAIAudio; // Has AI text but no audio

    if (!hasAnyMedia && !showMissingAudio) return null;

    return (
      <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-2">
        {hasVoice && (
          <Button
            variant="secondary"
            onClick={() => handlePlayAudio(entry.voice_note_url, entry.id + "-voice")}
            className="w-full"
          >
            {playingAudio === entry.id + "-voice" ? <Pause size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
            Your Voice Note
          </Button>
        )}

        {hasAIAudio ? (
          <Button
            variant="secondary"
            onClick={() => handlePlayAudio(entry.ai_response_url, entry.id + "-ai")}
            className="w-full"
          >
            {playingAudio === entry.id + "-ai" ? <Pause size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
            Listen to AI Response
          </Button>
        ) : showMissingAudio ? (
          <div className="w-full p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-400">
              <span className="text-sm">⚠️</span>
              <span className="text-xs">AI audio not available (created before audio feature or API key missing)</span>
            </div>
          </div>
        ) : null}

        {hasVideo && (
          <>
            <Button
              variant="secondary"
              onClick={() => setVideoPlayer(prev => ({ ...prev, [entry.id]: !prev[entry.id] }))}
              className="w-full"
            >
              Watch AI Video
            </Button>
            {videoPlayer[entry.id] && (
              <div className="aspect-video rounded-lg overflow-hidden mt-2">
                <video src={entry.tavus_video_url} controls autoPlay className="w-full h-full" />
              </div>
            )}
          </>
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Entry</h3>
                <p className="text-sm text-gray-400">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl">{getMoodEmoji(deleteConfirmation.entryMood)}</span>
                <span className="font-medium text-gray-300 capitalize">{deleteConfirmation.entryMood}</span>
              </div>
              <p className="text-sm text-gray-400">Created on {deleteConfirmation.entryDate}</p>
              <p className="text-sm text-red-400 mt-2">
                This will permanently delete the entry, voice recording, AI response audio, and any associated files.
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
