import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { EnhancedAIService } from "../services/enhancedAIService";
import {
  ArrowLeft,
  User,
  Globe,
  Volume2,
  Clock,
  Bell,
  Shield,
  Trash2,
  Save,
  Edit3,
  CheckCircle,
  AlertCircle,
  Download,
  Upload,
  Settings,
  Home,
  Zap,
  TestTube,
  Loader,
  Brain,
  AlertTriangle,
  X,
  HelpCircle,
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

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "zh", label: "中文" },
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

interface DiagnosticsResult {
  huggingFace: { success: boolean; message: string };
  tavus: { success: boolean; message: string };
  overall: { success: boolean; message: string };
}

type DiagnosticStatus =
  | "Untested"
  | "Operational"
  | "Error"
  | "Testing..."
  | "Good"
  | "Issues Detected";

interface ServiceStatus {
  status: DiagnosticStatus;
  message: string;
}

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
    language: "en",
    preferred_tone: "calm" as
      | "calm"
      | "motivational"
      | "reflective"
      | "direct"
      | "empathetic",
  });

  // AI Settings state
  const [aiUsage, setAiUsage] = useState(70);
  const [confidenceThreshold, setConfidenceThreshold] = useState(60);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

  const [diagnostics, setDiagnostics] = useState<{
    gemini: ServiceStatus;
    tavus: ServiceStatus;
    overall: ServiceStatus;
  }>({
    gemini: { status: "Untested", message: "" },
    tavus: { status: "Untested", message: "" },
    overall: {
      status: "Untested",
      message: 'Click "Run Diagnostics" to test services.',
    },
  });
  const [lastTestTime, setLastTestTime] = useState<string | null>(null);

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
        language: profile.language || "en",
        preferred_tone: profile.preferred_tone || "calm",
      });
      fetchUserStats();
    }

    const storedAiUsage = localStorage.getItem("aiUsagePercentage");
    const storedConfidence = localStorage.getItem("aiConfidenceThreshold");
    if (storedAiUsage) setAiUsage(parseInt(storedAiUsage, 10));
    if (storedConfidence)
      setConfidenceThreshold(parseInt(storedConfidence, 10));
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
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!profile) return;

    setIsSaving(true);
    setMessage(null);

    try {
      await updateProfile({
        name: formData.name,
        timezone: formData.timezone,
        language: formData.language,
        preferred_tone: formData.preferred_tone,
      });

      localStorage.setItem("aiUsagePercentage", aiUsage.toString());
      localStorage.setItem(
        "aiConfidenceThreshold",
        confidenceThreshold.toString()
      );

      setMessage({ type: "success", text: "Settings saved successfully!" });
      setIsEditing(false);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to save settings",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleResetAI() {
    setAiUsage(70);
    setConfidenceThreshold(60);
    localStorage.setItem("aiUsagePercentage", "70");
    localStorage.setItem("aiConfidenceThreshold", "60");
  }

  async function runDiagnostics() {
    setIsRunningDiagnostics(true);
    setDiagnostics((prev) => ({
      ...prev,
      gemini: { status: "Testing...", message: "Initializing test..." },
    }));
    setDiagnostics((prev) => ({
      ...prev,
      tavus: { status: "Testing...", message: "Initializing test..." },
    }));
    setDiagnostics((prev) => ({
      ...prev,
      overall: { status: "Testing...", message: "Running tests..." },
    }));

    try {
      const results = await EnhancedAIService.runDiagnostics();
      setDiagnostics({
        gemini: results.gemini,
        tavus: results.tavus,
        overall: results.overall,
      });
      setLastTestTime(new Date().toLocaleString());
    } catch (error: any) {
      console.error("Diagnostic error:", error);
      setDiagnostics({
        gemini: { status: "Error", message: "Test failed to run." },
        tavus: { status: "Error", message: "Test failed to run." },
        overall: {
          status: "Error",
          message: `An unexpected error occurred: ${error.message}`,
        },
      });
    } finally {
      setIsRunningDiagnostics(false);
    }
  }

  async function handleExportData() {
    if (!profile) return;
    setMessage({ type: "success", text: "Preparing your data for export..." });
    try {
      const { data: entries, error } = await supabase
        .from("entries")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const exportData = JSON.stringify(
        {
          profile: profile,
          entries: entries,
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
    setMessage({
      type: "error",
      text: "Deleting your account... This is irreversible.",
    });
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

  function renderStatusIndicator(status: DiagnosticStatus) {
    const iconMap: Record<DiagnosticStatus, JSX.Element> = {
      Untested: <HelpCircle className="w-4 h-4 text-gray-400" />,
      "Testing...": <Loader className="w-4 h-4 text-blue-400 animate-spin" />,
      Operational: <CheckCircle className="w-4 h-4 text-green-400" />,
      Error: <AlertCircle className="w-4 h-4 text-red-400" />,
      Good: <CheckCircle className="w-4 h-4 text-green-400" />,
      "Issues Detected": <AlertTriangle className="w-4 h-4 text-yellow-400" />,
    };

    return (
      <div className="flex items-center gap-2">
        {iconMap[status]}
        <span
          className={`font-medium ${
            status === "Operational"
              ? "text-green-400"
              : status === "Error"
              ? "text-red-400"
              : "text-gray-400"
          }`}
        >
          {status}
        </span>
      </div>
    );
  }

  function renderApiKeyStatus(apiKey: string | undefined | null) {
    const isConfigured = apiKey && apiKey.length > 8;
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full ${
          isConfigured
            ? "bg-green-900/50 text-green-300"
            : "bg-red-900/50 text-red-300"
        }`}
      >
        {isConfigured ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <AlertTriangle className="w-3 h-3" />
        )}
        {isConfigured ? "API Key Set" : "Not Configured"}
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900">
        <Loader className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-2 text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-[1rem] lg:mt-0 ">
          <Button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-grey-2 text-[12px] hover:text-grey-2/70 md:text-[16px]  "
          >
            <ArrowLeft className="w-5 h-5" /> Back to Dashboard
          </Button>
        </div>

        {message && (
          <div
            className={`p-4 mb-6 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-800/50 text-green-300"
                : "bg-red-800/50 text-red-300"
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
              className="ml-auto text-current hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile & Preferences */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Profile Card */}
            <div className="bg-gradient-to-br from-dark to-black rounded-2xl p-6 shadow-2xl/50 shadow-black ">
              <div className="flex items-start justify-between mb-6">
                <div className="flex flex-col items-start gap-4 md:flex-row ">
                  <User className="w-8 h-8 text-main " />
                  <h2 className="text-2xl font-semibold text-white">
                    Your Profile
                  </h2>
                </div>
                {isEditing ? (
                  <div className="flex flex-col items-end gap-2 md:flex-row md:items-center">
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="secondary"
                      className="shadow-xl/40 shadow-black"
                    >
                      <small>Cancel</small>
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-[0.4rem] shadow-xl/40 shadow-black"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <small>Save Changes</small>
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="flex items-center gap-2 shadow-xl/40 shadow-black hover:text-dark hover:border-dark"
                  >
                    <Edit3 className="w-4 h-4" />
                    <small>Edit Profile</small>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Full Name
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) =>
                      handleInputChange("timezone", e.target.value)
                    }
                    disabled={!isEditing}
                    className="w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white cursor-pointer"
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

            {/* AI Preferences */}
            <div className="bg-gradient-to-br from-dark to-black rounded-2xl p-6 shadow-2xl/40 shadow-black ">
              <div className="flex items-center gap-4 mb-6">
                <Brain className="w-8 h-8 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">
                  AI Response Preferences
                </h2>
              </div>
              <p className="text-gray-400 mb-6">
                Choose the tone that best suits your needs for AI-generated
                responses. This helps Aura provide the most supportive
                experience for you.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {TONE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      isEditing &&
                      handleInputChange("preferred_tone", option.value)
                    }
                    disabled={!isEditing}
                    className={`p-4 rounded-lg text-left transition-all duration-200 border-2 ${
                      formData.preferred_tone === option.value
                        ? "border-purple-500 bg-purple-900/30"
                        : "border-gray-700 hover:border-purple-600 bg-gray-800/60"
                    } ${!isEditing ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="font-semibold text-white">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-400">
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced AI Settings */}
            <div className="bg-gradient-to-br from-dark to-black rounded-2xl p-6 shadow-2xl/40 shadow-black">
              <div className="flex items-center gap-4 mb-4">
                <Zap className="w-8 h-8 text-yellow-400" />
                <h2 className="text-2xl font-semibold text-white">
                  Advanced AI Configuration
                </h2>
              </div>

              <div className="space-y-6">
                {/* API Status Display */}
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    AI Service Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Gemini AI</span>
                      {renderApiKeyStatus(import.meta.env.VITE_GEMINI_API_KEY)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Tavus Video</span>
                      {renderApiKeyStatus(import.meta.env.VITE_TAVUS_API_KEY)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    ✨ AI services are globally configured. All users share the
                    same AI capabilities.
                  </p>
                </div>

                {/* Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-700/50">
                  <div>
                    <label
                      htmlFor="ai-usage"
                      className="block text-sm font-medium text-gray-400"
                    >
                      AI Usage Percentage:{" "}
                      <span className="font-bold text-white">{aiUsage}%</span>
                    </label>
                    <input
                      id="ai-usage"
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={aiUsage}
                      onChange={(e) => setAiUsage(parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Controls how often AI is used vs. templates.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="ai-confidence"
                      className="block text-sm font-medium text-gray-400"
                    >
                      AI Confidence Threshold:{" "}
                      <span className="font-bold text-white">
                        {confidenceThreshold}%
                      </span>
                    </label>
                    <input
                      id="ai-confidence"
                      type="range"
                      min="30"
                      max="90"
                      step="5"
                      value={confidenceThreshold}
                      onChange={(e) =>
                        setConfidenceThreshold(parseInt(e.target.value))
                      }
                      disabled={!isEditing}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Min confidence for AI response. Below this, it's blended
                      with a template.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Diagnostics & Data */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-gradient-to-br from-dark to-black rounded-2xl p-6 shadow-2xl/40 shadow-black">
              <div className="flex items-center gap-4 mb-4">
                <TestTube className="w-8 h-8 text-cyan-400" />
                <h2 className="text-2xl font-semibold text-white">
                  Service Diagnostics
                </h2>
              </div>
              <Button
                onClick={runDiagnostics}
                disabled={isRunningDiagnostics}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isRunningDiagnostics ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="mr-2 h-4 w-4" />
                )}
                Run Diagnostics
              </Button>
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-300">
                    Gemini (LLM)
                  </span>
                  {renderStatusIndicator(diagnostics.gemini.status)}
                </div>
                <p className="text-xs text-gray-500 pl-2 border-l-2 border-gray-700">
                  {diagnostics.gemini.message || "Ready to test."}
                </p>

                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-300">
                    Tavus (Video)
                  </span>
                  {renderStatusIndicator(diagnostics.tavus.status)}
                </div>
                <p className="text-xs text-gray-500 pl-2 border-l-2 border-gray-700">
                  {diagnostics.tavus.message || "Ready to test."}
                </p>

                <div className="flex justify-between items-center pt-4 border-t border-gray-700/50">
                  <span className="font-bold text-white">Overall Status</span>
                  {renderStatusIndicator(diagnostics.overall.status)}
                </div>
                {lastTestTime && (
                  <p className="text-xs text-gray-500 text-center">
                    Last test: {lastTestTime}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-dark to-black rounded-2xl p-6 shadow-2xl/40 shadow-black">
              <div className="flex items-center gap-4 mb-4">
                <Shield className="w-8 h-8 text-red-400" />
                <h2 className="text-2xl font-semibold text-white">
                  Account Actions
                </h2>
              </div>
              <div className="space-y-4">
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export My Data
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="destructive"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete My Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className=" w-[320px] h-svh flex items-center justify-center bg-black/40 backdrop-blur-xl absolute top-0 z-99 lg:w-[92%] ">
          <div className=" w-[90%] flex flex-col items-center gap-[1.5rem] bg-grey-2 rounded-2xl p-[1rem] shadow-2xl border border-red-500/50 md:p-[2rem] lg:w-[400px] lg:gap-[2rem] lg:border-[0.3rem] lg:border-red ">
            <div className="flex flex-col items-center gap-4">
              <img src={DeleteIcon} alt="delete bin image" />

              <h2 className="text-2xl font-bold text-text-blue text-center">
                Are you absolutely sure?
              </h2>
            </div>

            <p className="text-text-blue/70 text-center">
              This action cannot be undone. All of your journal entries, AI
              responses, and personal settings will be permanently deleted.
            </p>

            <div className="w-[90%] flex flex-col items-center gap-[1.3rem] lg:w-full lg:flex-row lg:justify-center ">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-[90%] md:w-auto"
              >
                Cancel
              </Button>

              <Button variant="destructive" onClick={handleDeleteAccount}>
                Yes, Delete My Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
