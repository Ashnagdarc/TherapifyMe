import { useState, useEffect } from "react";
import {
  X,
  Settings,
  Zap,
  TestTube,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { AIResponseService } from "../services/aiResponseService";

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DiagnosticsResult {
  huggingFace: { success: boolean; message: string };
  tavus: { success: boolean; message: string };
  overall: { success: boolean; message: string };
}

export default function AISettingsModal({
  isOpen,
  onClose,
}: AISettingsModalProps) {
  const [aiPercentage, setAiPercentage] = useState(70);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.6);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(
    null
  );
  const [lastTestTime, setLastTestTime] = useState<string | null>(null);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedPercentage = localStorage.getItem("ai-percentage");
    const savedThreshold = localStorage.getItem("ai-confidence-threshold");

    if (savedPercentage) setAiPercentage(parseInt(savedPercentage));
    if (savedThreshold) setConfidenceThreshold(parseFloat(savedThreshold));
  }, []);

  const handleSaveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem("ai-percentage", aiPercentage.toString());
    localStorage.setItem(
      "ai-confidence-threshold",
      confidenceThreshold.toString()
    );

    // Update AI service configuration
    AIResponseService.configureAI({
      useAIPercentage: aiPercentage,
      confidenceThreshold: confidenceThreshold,
    });

    alert("AI settings saved successfully!");
  };

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const result = await AIResponseService.runDiagnostics();
      setDiagnostics(result);
      setLastTestTime(new Date().toLocaleString());
    } catch (error) {
      console.error("Diagnostics failed:", error);
      setDiagnostics({
        huggingFace: { success: false, message: "Failed to run diagnostics" },
        tavus: { success: false, message: "Failed to run diagnostics" },
        overall: { success: false, message: "Diagnostics failed to complete" },
      });
    }
    setIsRunningDiagnostics(false);
  };

  const resetToDefaults = () => {
    setAiPercentage(70);
    setConfidenceThreshold(0.6);
    AIResponseService.configureAI({
      useAIPercentage: 70,
      confidenceThreshold: 0.6,
    });
    localStorage.removeItem("ai-percentage");
    localStorage.removeItem("ai-confidence-threshold");
    alert("Settings reset to defaults!");
  };

  const getStatusIcon = (success: boolean, isLoading: boolean = false) => {
    if (isLoading)
      return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success ? "text-green-600" : "text-red-600";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                AI Settings
              </h2>
              <p className="text-sm text-gray-500">
                Configure your AI therapy experience
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* AI Generation Settings */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-medium text-gray-900">
                AI Generation Settings
              </h3>
            </div>

            {/* AI Usage Percentage */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                AI Usage Percentage: {aiPercentage}%
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={aiPercentage}
                  onChange={(e) => setAiPercentage(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Always Templates</span>
                  <span>Balanced</span>
                  <span>Always AI</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Controls how often AI generation is attempted. Lower values
                favor reliable templates, higher values use more dynamic AI
                responses.
              </p>
            </div>

            {/* Confidence Threshold */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                AI Confidence Threshold:{" "}
                {(confidenceThreshold * 100).toFixed(0)}%
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0.3"
                  max="0.9"
                  step="0.1"
                  value={confidenceThreshold}
                  onChange={(e) =>
                    setConfidenceThreshold(parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Lenient</span>
                  <span>Balanced</span>
                  <span>Strict</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Minimum confidence required to use AI responses. Lower values
                accept more AI responses, higher values fall back to templates
                more often.
              </p>
            </div>
          </div>

          {/* Service Diagnostics */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TestTube className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-medium text-gray-900">
                  Service Diagnostics
                </h3>
              </div>
              <button
                onClick={runDiagnostics}
                disabled={isRunningDiagnostics}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isRunningDiagnostics ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4" />
                    <span>Run Tests</span>
                  </>
                )}
              </button>
            </div>

            {lastTestTime && (
              <p className="text-sm text-gray-500">
                Last tested: {lastTestTime}
              </p>
            )}

            {diagnostics && (
              <div className="space-y-4">
                {/* Hugging Face Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(diagnostics.huggingFace.success, false)}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Hugging Face AI
                      </h4>
                      <p className="text-sm text-gray-600">
                        Free AI text generation
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${getStatusColor(
                        diagnostics.huggingFace.success
                      )}`}
                    >
                      {diagnostics.huggingFace.success ? "Connected" : "Failed"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {diagnostics.huggingFace.message}
                    </p>
                  </div>
                </div>

                {/* Tavus Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(diagnostics.tavus.success, false)}
                    <div>
                      <h4 className="font-medium text-gray-900">Tavus Video</h4>
                      <p className="text-sm text-gray-600">
                        AI video generation
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${getStatusColor(
                        diagnostics.tavus.success
                      )}`}
                    >
                      {diagnostics.tavus.success ? "Connected" : "Failed"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {diagnostics.tavus.message}
                    </p>
                  </div>
                </div>

                {/* Overall Status */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(diagnostics.overall.success, false)}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Overall Status
                      </h4>
                      <p className="text-sm text-gray-600">All AI services</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${getStatusColor(
                        diagnostics.overall.success
                      )}`}
                    >
                      {diagnostics.overall.success
                        ? "All Systems Go"
                        : "Issues Detected"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {diagnostics.overall.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* API Key Status */}
          <div className="space-y-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-gray-900">API Key Requirements</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                • <strong>VITE_HUGGINGFACE_API_KEY</strong>: Required for AI
                text generation (free from huggingface.co)
              </p>
              <p>
                • <strong>VITE_TAVUS_API_KEY</strong>: Required for AI video
                generation (from tavus.io)
              </p>
              <p>
                • <strong>VITE_ELEVENLABS_API_KEY</strong>: Required for AI
                voice generation (from elevenlabs.io)
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Add these keys to your .env file or environment variables
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleSaveSettings}
              className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors font-medium"
            >
              Save Settings
            </button>
            <button
              onClick={resetToDefaults}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
