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
import {
  Search,
  Play,
  Pause,
  Download,
  Trash2,
  MoreHorizontal,
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

  const handlePlayAudio = (url: string, id: string) => {
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

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) console.error("Error deleting entry", error);
    else fetchEntries();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-8">
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
                  <Button variant="ghost" size="sm" className="p-2 h-auto">
                    <MoreHorizontal size={20} />
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
                {entry.voice_note_url && (
                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        handlePlayAudio(entry.voice_note_url!, entry.id)
                      }
                      className="w-full"
                    >
                      {playingAudio === entry.id ? (
                        <Pause size={16} className="mr-2" />
                      ) : (
                        <Play size={16} className="mr-2" />
                      )}
                      Your Voice Note
                    </Button>
                  </div>
                )}
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
    </div>
  );
}
