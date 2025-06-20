import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { EnhancedAIService } from '../services/enhancedAIService';
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
    LogOut,
    Home,
    Zap,
    TestTube,
    Loader,
    Brain
} from 'lucide-react';

const TIMEZONE_OPTIONS = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'British Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Português' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'zh', label: '中文' },
];

const TONE_OPTIONS = [
    {
        value: 'calm',
        label: 'Calm & Soothing',
        description: 'Gentle, peaceful responses that help you relax and find balance',
        icon: '😌'
    },
    {
        value: 'motivational',
        label: 'Motivational & Encouraging',
        description: 'Uplifting, energizing responses that inspire and empower you',
        icon: '🌟'
    },
    {
        value: 'reflective',
        label: 'Thoughtful & Reflective',
        description: 'Deep, contemplative responses that encourage self-discovery',
        icon: '🤔'
    },
];

interface DiagnosticsResult {
    huggingFace: { success: boolean; message: string };
    tavus: { success: boolean; message: string };
    overall: { success: boolean; message: string };
}

export function SettingsPage() {
    const { profile, updateProfile, signOut } = useAuth();
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        timezone: 'UTC',
        language: 'en',
        preferred_tone: 'calm' as 'calm' | 'motivational' | 'reflective'
    });

    // AI Settings state
    const [aiPercentage, setAiPercentage] = useState(70);
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.6);
    const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
    const [diagnostics, setDiagnostics] = useState<DiagnosticsResult | null>(null);
    const [lastTestTime, setLastTestTime] = useState<string | null>(null);

    // UI state
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [stats, setStats] = useState({
        totalEntries: 0,
        totalDays: 0,
        averageMood: 'neutral'
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                timezone: profile.timezone || 'UTC',
                language: profile.language || 'en',
                preferred_tone: profile.preferred_tone || 'calm'
            });
            fetchUserStats();
        }

        // Load AI settings from localStorage
        const savedPercentage = localStorage.getItem('ai-percentage');
        const savedThreshold = localStorage.getItem('ai-confidence-threshold');
        if (savedPercentage) setAiPercentage(parseInt(savedPercentage));
        if (savedThreshold) setConfidenceThreshold(parseFloat(savedThreshold));
    }, [profile]);

    const fetchUserStats = async () => {
        if (!profile) return;

        try {
            const { data: entries, error } = await supabase
                .from('entries')
                .select('mood_tag, created_at')
                .eq('user_id', profile.id);

            if (error) throw error;

            const totalEntries = entries?.length || 0;
            const uniqueDays = new Set(
                entries?.map(entry => new Date(entry.created_at).toDateString()) || []
            ).size;

            // Calculate average mood (simplified)
            const moodCounts: { [key: string]: number } = {};
            entries?.forEach(entry => {
                moodCounts[entry.mood_tag] = (moodCounts[entry.mood_tag] || 0) + 1;
            });

            const mostCommonMood = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';

            setStats({
                totalEntries,
                totalDays: uniqueDays,
                averageMood: mostCommonMood
            });
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!profile) return;

        setLoading(true);
        setMessage(null);

        try {
            await updateProfile(formData);

            // Also save AI settings
            localStorage.setItem('ai-percentage', aiPercentage.toString());
            localStorage.setItem('ai-confidence-threshold', confidenceThreshold.toString());
            EnhancedAIService.configureAI({
                useAIPercentage: aiPercentage,
                confidenceThreshold: confidenceThreshold
            });

            setMessage({ type: 'success', text: 'Settings saved successfully!' });
            setIsEditing(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleAISaveSettings = () => {
        // Save AI settings to localStorage
        localStorage.setItem('ai-percentage', aiPercentage.toString());
        localStorage.setItem('ai-confidence-threshold', confidenceThreshold.toString());

        // Update AI service configuration
        EnhancedAIService.configureAI({
            useAIPercentage: aiPercentage,
            confidenceThreshold: confidenceThreshold
        });

        setMessage({ type: 'success', text: 'AI settings saved successfully!' });
    };

    const runDiagnostics = async () => {
        setIsRunningDiagnostics(true);
        try {
            const result = await EnhancedAIService.runDiagnostics();
            setDiagnostics(result);
            setLastTestTime(new Date().toLocaleString());
        } catch (error) {
            console.error('Diagnostics failed:', error);
            setDiagnostics({
                huggingFace: { success: false, message: 'Failed to run diagnostics' },
                tavus: { success: false, message: 'Failed to run diagnostics' },
                overall: { success: false, message: 'Diagnostics failed to complete' }
            });
        }
        setIsRunningDiagnostics(false);
    };

    const resetAIToDefaults = () => {
        setAiPercentage(70);
        setConfidenceThreshold(0.6);
        EnhancedAIService.configureAI({
            useAIPercentage: 70,
            confidenceThreshold: 0.6
        });
        localStorage.removeItem('ai-percentage');
        localStorage.removeItem('ai-confidence-threshold');
        setMessage({ type: 'success', text: 'AI settings reset to defaults!' });
    };

    const getStatusIcon = (success: boolean, isLoading: boolean = false) => {
        if (isLoading) return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
        return success ?
            <CheckCircle className="w-4 h-4 text-green-500" /> :
            <AlertCircle className="w-4 h-4 text-red-500" />;
    };

    const getStatusColor = (success: boolean) => {
        return success ? 'text-green-600' : 'text-red-600';
    };

    const handleExportData = async () => {
        if (!profile) return;

        try {
            const { data: entries, error } = await supabase
                .from('entries')
                .select('*')
                .eq('user_id', profile.id);

            if (error) throw error;

            const exportData = {
                profile: {
                    name: profile.name,
                    created_at: profile.created_at
                },
                entries: entries?.map(entry => ({
                    mood_tag: entry.mood_tag,
                    text_summary: entry.text_summary,
                    transcription: entry.transcription,
                    created_at: entry.created_at
                })) || [],
                exportedAt: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `therapifyme-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: 'Data exported successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to export data' });
        }
    };

    const handleDeleteAccount = async () => {
        if (!profile) return;

        try {
            // This would need to be implemented as a stored procedure in Supabase
            // For now, we'll show a message
            setMessage({
                type: 'error',
                text: 'Account deletion is not yet implemented. Please contact support.'
            });
            setShowDeleteConfirm(false);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete account' });
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header - Same as Dashboard */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">T</span>
                    </div>
                    <h1 className="text-xl font-semibold">TherapifyMe</h1>
                </div>

                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        <span>Dashboard</span>
                    </button>
                    <button
                        onClick={() => navigate('/journal')}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <User className="w-4 h-4" />
                        <span>Journal</span>
                    </button>
                    <button
                        onClick={signOut}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Page Header */}
            <div className="border-b border-gray-800">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-blue-300">Settings</h2>
                            <p className="text-gray-400 text-sm">Manage your account and preferences</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            {isEditing && (
                                <Button
                                    onClick={handleSave}
                                    disabled={loading}
                                    variant="primary"
                                    className="flex items-center space-x-2"
                                >
                                    <Save className="h-4 w-4" />
                                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Success/Error Messages */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${message.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                        {message.type === 'success' ? (
                            <CheckCircle className="h-5 w-5 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        )}
                        <span>{message.text}</span>
                    </div>
                )}

                <div className="grid gap-8">
                    {/* Account Overview */}
                    <div className="bg-white rounded-2xl shadow-xs border border-grey p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-primery flex items-center">
                                <User className="h-5 w-5 mr-3 text-main" />
                                Account Overview
                            </h2>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm text-main hover:bg-main hover:bg-opacity-10 rounded-lg transition-colors"
                            >
                                <Edit3 className="h-4 w-4" />
                                <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Profile Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-primery mb-2">
                                        Full Name
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="w-full px-3 py-2 border border-grey rounded-lg focus:ring-3 focus:ring-main focus:border-transparent"
                                            placeholder="Enter your full name"
                                        />
                                    ) : (
                                        <p className="text-text-black py-2">{profile?.name || 'Not set'}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primery mb-2">
                                        <Globe className="h-4 w-4 inline mr-2" />
                                        Timezone
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={formData.timezone}
                                            onChange={(e) => handleInputChange('timezone', e.target.value)}
                                            className="w-full px-3 py-2 border border-grey rounded-lg focus:ring-3 focus:ring-main focus:border-transparent"
                                        >
                                            {TIMEZONE_OPTIONS.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-text-black py-2">
                                            {TIMEZONE_OPTIONS.find(tz => tz.value === profile?.timezone)?.label || profile?.timezone}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primery mb-2">
                                        Language
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={formData.language}
                                            onChange={(e) => handleInputChange('language', e.target.value)}
                                            className="w-full px-3 py-2 border border-grey rounded-lg focus:ring-3 focus:ring-main focus:border-transparent"
                                        >
                                            {LANGUAGE_OPTIONS.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-text-black py-2">
                                            {LANGUAGE_OPTIONS.find(lang => lang.value === profile?.language)?.label || 'English'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-primery">Your Journey</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-main bg-opacity-10 rounded-lg p-4 text-center">
                                        <div className="text-2xl font-bold text-main">{stats.totalEntries}</div>
                                        <div className="text-xs text-text-black">Total Check-ins</div>
                                    </div>
                                    <div className="bg-teal-500 bg-opacity-10 rounded-lg p-4 text-center">
                                        <div className="text-2xl font-bold text-teal-600">{stats.totalDays}</div>
                                        <div className="text-xs text-text-black">Active Days</div>
                                    </div>
                                </div>
                                <div className="bg-purple-500 bg-opacity-10 rounded-lg p-4 text-center">
                                    <div className="text-sm font-medium text-purple-600 capitalize">
                                        Most Common: {stats.averageMood}
                                    </div>
                                    <div className="text-xs text-text-black">Mood Pattern</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Preferences */}
                    <div className="bg-white rounded-2xl shadow-xs border border-grey p-6">
                        <h2 className="text-xl font-semibold text-primery flex items-center mb-6">
                            <Brain className="h-5 w-5 mr-3 text-main" />
                            AI Response Preferences
                        </h2>

                        <div className="space-y-6">
                            {/* Tone Selection */}
                            <div className="space-y-4">
                                <p className="text-text-black text-sm mb-4">
                                    Choose how you'd like your AI companion to respond to your check-ins
                                </p>

                                <div className="grid gap-4">
                                    {TONE_OPTIONS.map((tone) => (
                                        <label
                                            key={tone.value}
                                            className={`flex items-start space-x-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.preferred_tone === tone.value
                                                ? 'border-main bg-main bg-opacity-5'
                                                : 'border-grey hover:border-grey-2'
                                                } ${!isEditing ? 'cursor-default' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name="preferred_tone"
                                                value={tone.value}
                                                checked={formData.preferred_tone === tone.value}
                                                onChange={(e) => isEditing && handleInputChange('preferred_tone', e.target.value)}
                                                className="sr-only"
                                                disabled={!isEditing}
                                            />
                                            <span className="text-2xl">{tone.icon}</span>
                                            <div className="flex-1">
                                                <div className="font-medium text-primery">{tone.label}</div>
                                                <div className="text-sm text-text-black">{tone.description}</div>
                                            </div>
                                            {formData.preferred_tone === tone.value && (
                                                <CheckCircle className="h-5 w-5 text-main flex-shrink-0" />
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* AI Generation Settings */}
                            <div className="border-t border-grey pt-6">
                                <div className="flex items-center space-x-2 mb-4">
                                    <Zap className="w-5 h-5 text-blue-500" />
                                    <h3 className="text-lg font-medium text-primery">Advanced AI Settings</h3>
                                </div>

                                {/* AI Usage Percentage */}
                                <div className="space-y-3 mb-6">
                                    <label className="block text-sm font-medium text-primery">
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
                                            disabled={!isEditing}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
                                        />
                                        <div className="flex justify-between text-xs text-text-black">
                                            <span>Always Templates</span>
                                            <span>Balanced</span>
                                            <span>Always AI</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-black">
                                        Controls how often AI generation is attempted. Lower values favor reliable templates,
                                        higher values use more dynamic AI responses.
                                    </p>
                                </div>

                                {/* Confidence Threshold */}
                                <div className="space-y-3 mb-6">
                                    <label className="block text-sm font-medium text-primery">
                                        AI Confidence Threshold: {(confidenceThreshold * 100).toFixed(0)}%
                                    </label>
                                    <div className="space-y-2">
                                        <input
                                            type="range"
                                            min="0.3"
                                            max="0.9"
                                            step="0.1"
                                            value={confidenceThreshold}
                                            onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                                            disabled={!isEditing}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50"
                                        />
                                        <div className="flex justify-between text-xs text-text-black">
                                            <span>Lenient</span>
                                            <span>Balanced</span>
                                            <span>Strict</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-black">
                                        Minimum confidence required to use AI responses. Lower values accept more AI responses,
                                        higher values fall back to templates more often.
                                    </p>
                                </div>

                                {/* AI Diagnostics */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <TestTube className="w-5 h-5 text-purple-500" />
                                            <h4 className="font-medium text-primery">Service Diagnostics</h4>
                                        </div>
                                        <button
                                            onClick={runDiagnostics}
                                            disabled={isRunningDiagnostics}
                                            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 text-sm"
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
                                        <p className="text-sm text-text-black">Last tested: {lastTestTime}</p>
                                    )}

                                    {diagnostics && (
                                        <div className="space-y-3">
                                            {/* Hugging Face Status */}
                                            <div className="flex items-center justify-between p-3 bg-grey-2 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    {getStatusIcon(diagnostics.huggingFace.success, false)}
                                                    <div>
                                                        <h5 className="font-medium text-primery text-sm">Hugging Face AI</h5>
                                                        <p className="text-xs text-text-black">Free AI text generation</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-medium ${getStatusColor(diagnostics.huggingFace.success)}`}>
                                                        {diagnostics.huggingFace.success ? 'Connected' : 'Failed'}
                                                    </p>
                                                    <p className="text-xs text-text-black">{diagnostics.huggingFace.message}</p>
                                                </div>
                                            </div>

                                            {/* Tavus Status */}
                                            <div className="flex items-center justify-between p-3 bg-grey-2 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    {getStatusIcon(diagnostics.tavus.success, false)}
                                                    <div>
                                                        <h5 className="font-medium text-primery text-sm">Tavus Video</h5>
                                                        <p className="text-xs text-text-black">AI video generation</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-medium ${getStatusColor(diagnostics.tavus.success)}`}>
                                                        {diagnostics.tavus.success ? 'Connected' : 'Failed'}
                                                    </p>
                                                    <p className="text-xs text-text-black">{diagnostics.tavus.message}</p>
                                                </div>
                                            </div>

                                            {/* Overall Status */}
                                            <div className="flex items-center justify-between p-3 bg-main bg-opacity-10 rounded-lg border border-main border-opacity-20">
                                                <div className="flex items-center space-x-3">
                                                    {getStatusIcon(diagnostics.overall.success, false)}
                                                    <div>
                                                        <h5 className="font-medium text-primery text-sm">Overall Status</h5>
                                                        <p className="text-xs text-text-black">All AI services</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-medium ${getStatusColor(diagnostics.overall.success)}`}>
                                                        {diagnostics.overall.success ? 'All Systems Go' : 'Issues Detected'}
                                                    </p>
                                                    <p className="text-xs text-text-black">{diagnostics.overall.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* API Key Info */}
                                    <div className="space-y-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <h5 className="font-medium text-primery text-sm">API Key Requirements</h5>
                                        <div className="space-y-1 text-xs text-text-black">
                                            <p>• <strong>VITE_HUGGINGFACE_API_KEY</strong>: Free AI text generation</p>
                                            <p>• <strong>VITE_TAVUS_API_KEY</strong>: AI video generation</p>
                                            <p>• <strong>VITE_ELEVENLABS_API_KEY</strong>: AI voice generation</p>
                                        </div>
                                    </div>

                                    {/* AI Action Buttons */}
                                    {isEditing && (
                                        <div className="flex space-x-3 pt-4 border-t border-grey">
                                            <button
                                                onClick={handleAISaveSettings}
                                                className="flex-1 bg-main text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors font-medium text-sm"
                                            >
                                                Save AI Settings
                                            </button>
                                            <button
                                                onClick={resetAIToDefaults}
                                                className="px-4 py-2 border border-grey rounded-lg hover:bg-grey-2 transition-colors font-medium text-primery text-sm"
                                            >
                                                Reset AI Defaults
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Management */}
                    <div className="bg-white rounded-2xl shadow-xs border border-grey p-6">
                        <h2 className="text-xl font-semibold text-primery flex items-center mb-6">
                            <Shield className="h-5 w-5 mr-3 text-main" />
                            Data & Privacy
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-grey">
                                <div>
                                    <h3 className="font-medium text-primery">Export Your Data</h3>
                                    <p className="text-sm text-text-black">Download all your check-ins and responses</p>
                                </div>
                                <Button
                                    onClick={handleExportData}
                                    variant="ghost"
                                    className="flex items-center space-x-2"
                                >
                                    <Download className="h-4 w-4" />
                                    <span>Export</span>
                                </Button>
                            </div>

                            <div className="flex items-center justify-between py-3 border-b border-grey">
                                <div>
                                    <h3 className="font-medium text-primery">Sign Out</h3>
                                    <p className="text-sm text-text-black">Sign out of your account</p>
                                </div>
                                <Button
                                    onClick={handleSignOut}
                                    variant="ghost"
                                >
                                    Sign Out
                                </Button>
                            </div>

                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <h3 className="font-medium text-red-600">Delete Account</h3>
                                    <p className="text-sm text-text-black">Permanently delete your account and all data</p>
                                </div>
                                <Button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    variant="ghost"
                                    className="text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-primery mb-2">Delete Account</h3>
                            <p className="text-text-black mb-6">
                                Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your check-ins, responses, and data.
                            </p>
                            <div className="flex space-x-3">
                                <Button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    variant="ghost"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleDeleteAccount}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 