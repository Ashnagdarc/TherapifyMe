import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import {
  ArrowLeft,
  User,
  Globe,
  Volume2,
  Save,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Download,
  Trash2,
  X,
  Loader,
  Brain,
  Heart,
  Calendar,
} from "lucide-react";
import { Input } from "../components/ui/Input";
import DeleteIcon from "../assets/images/DeleteBin.png";

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "British Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

const TONE_OPTIONS = [
  {
    value: "calm",
    label: "Calm & Soothing",
    description:
      "Gentle, peaceful responses that help you relax and find balance",
    icon: "😌",
  },
  {
    value: "motivational",
    label: "Motivational & Encouraging",
    description: "Uplifting, energizing responses that inspire and empower you",
    icon: "🌟",
  },
  {
    value: "reflective",
    label: "Thoughtful & Reflective",
    description: "Deep, contemplative responses that encourage self-discovery",
    icon: "🤔",
  },
];

export default function SettingsPage() {
  const { profile, loading, updateProfile } = useAuth();
  const navigate = useNavigate();

  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    timezone: "UTC",
    preferred_tone: "calm" as "calm" | "motivational" | "reflective",
  });

  // Stats State
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalDays: 0,
    averageMood: "neutral",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        timezone: profile.timezone || "UTC",
        preferred_tone:
          (profile.preferred_tone as "calm" | "motivational" | "reflective") ||
          "calm",
      });
      fetchUserStats();
    }
  }, [profile]);

  async function fetchUserStats() {
    if (!profile) return;
    const { data: entries, error } = await supabase
      .from("entries")
      .select("mood_tag, created_at")
      .eq("user_id", profile.id);

    if (error) {
      console.error("Error fetching user stats:", error);
      return;
    }

    const totalEntries = entries?.length || 0;
    const uniqueDays = new Set(
      entries?.map((entry) => new Date(entry.created_at).toDateString()) || []
    ).size;

    const moodCounts: { [key: string]: number } = {};
    entries?.forEach((entry) => {
      moodCounts[entry.mood_tag] = (moodCounts[entry.mood_tag] || 0) + 1;
    });

    const mostCommonMood =
      Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "neutral";

    setStats({
      totalEntries,
      totalDays: uniqueDays,
      averageMood: mostCommonMood,
    });
  }

  function handleInputChange(field: string, value: string) {
    setFormData({ ...formData, [field]: value });
  }

  async function handleSave() {
    if (!profile) return;
    setIsSaving(true);
    setMessage(null);

    try {
      await updateProfile(formData);

      setMessage({ type: "success", text: "Settings saved successfully!" });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: `Failed to save: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExportData() {
    if (!profile) return;

    try {
      const { data: entries, error } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", profile.id);

      if (error) throw error;

      const exportData = JSON.stringify(
        {
          profile: {
            name: profile.name,
            timezone: profile.timezone,
            preferred_tone: profile.preferred_tone,
            created_at: profile.created_at,
          },
          entries: entries || [],
          stats,
          exported_at: new Date().toISOString(),
        },
        null,
        2
      );

      const blob = new Blob([exportData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `therapify-me-data-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Data exported successfully!" });
    } catch (error: any) {
      console.error("Error exporting data:", error);
      setMessage({ type: "error", text: `Export failed: ${error.message}` });
    }
  }

  async function handleDeleteAccount() {
    if (!profile) return;

    try {
      const { error } = await supabase.rpc("delete_user_account");
      if (error) throw error;
      navigate("/auth");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      setMessage({
        type: "error",
        text: `Failed to delete account: ${error.message}`,
      });
    }
  }

  const getMoodEmoji = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      happy: "😊",
      sad: "😢",
      anxious: "😰",
      calm: "😌",
      excited: "🤗",
      frustrated: "😤",
      grateful: "🙏",
      neutral: "😐",
    };
    return moodMap[mood] || "😐";
  };

  if (loading && !profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex justify-center ">
      <div className="w-full px-6 py-8 pt-24 lg:w-[90%]">
        {/* Back to Dashboard Button */}
        <Button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 bg-white hover:bg-gray-50 border border-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        {message && (
          <div
            className={`p-4 mb-6 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-current hover:text-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-6 pb-[2rem]">
          {/* User Profile Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-[2rem]">
              <div className="flex flex-col md:flex-row  md:items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-bold text-[20px] ">
                  {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Your Profile
                  </h2>
                  <p className="text-gray-600">
                    Personalize your TherapifyMe experience
                  </p>
                </div>
              </div>
              {isEditing ? (
                <div className="flex flex-col items-end md:flex-row md:items-center gap-2">
                  <Button onClick={() => setIsEditing(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white text-right flex items-center gap-2 md:text-center"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="w-full flex items-center gap-2 md:w-[25%] lg:w-[15%] "
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Full Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter your name"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) =>
                    handleInputChange("timezone", e.target.value)
                  }
                  disabled={!isEditing}
                  className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  {TIMEZONE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* AI Response Preferences */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  AI Response Style
                </h2>
                <p className="text-gray-600">Choose how Aura responds to you</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TONE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    isEditing &&
                    handleInputChange("preferred_tone", option.value)
                  }
                  disabled={!isEditing}
                  className={`p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                    formData.preferred_tone === option.value
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300 bg-gray-50"
                  } ${
                    !isEditing
                      ? "cursor-not-allowed opacity-70"
                      : "cursor-pointer"
                  }`}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="font-semibold text-gray-900 mb-1">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-600">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Your Journey Stats */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Your Journey
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Total Check-ins
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {stats.totalEntries}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Active Days
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {stats.totalDays}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {getMoodEmoji(stats.averageMood)}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    Common Mood
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900 capitalize">
                  {stats.averageMood}
                </span>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Account</h3>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleExportData}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Export My Data
              </Button>

              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
                className="w-full flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Your privacy matters. All data is securely encrypted.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-red-200">
            <div className="flex flex-col items-center gap-4 mb-6">
              <img
                src={DeleteIcon}
                alt="Delete confirmation"
                className="w-16 h-16"
              />
              <h2 className="text-xl font-bold text-gray-900 text-center">
                Delete Your Account?
              </h2>
            </div>

            <p className="text-gray-600 text-center mb-6">
              This action cannot be undone. All of your journal entries, AI
              responses, and personal settings will be permanently deleted.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="w-full"
              >
                Yes, Delete My Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
