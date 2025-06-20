import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Entry, MoodTag } from '../types/database';
import { Button } from '../components/ui/Button';
import { WeeklyVideoPlayer } from '../components/WeeklyVideoPlayer';
import {
    Search,
    Filter,
    Calendar,
    Play,
    Pause,
    Volume2,
    ArrowLeft,
    Download,
    Trash2,
    MoreHorizontal,
    SortAsc,
    SortDesc,
    Settings,
    LogOut,
    Home,
    Video
} from 'lucide-react';

const MOOD_OPTIONS = [
    { value: '', label: 'All Moods' },
    { value: 'happy', label: '😊 Happy' },
    { value: 'calm', label: '😌 Calm' },
    { value: 'anxious', label: '😰 Anxious' },
    { value: 'sad', label: '😢 Sad' },
    { value: 'stressed', label: '😤 Stressed' },
    { value: 'excited', label: '🤩 Excited' },
    { value: 'frustrated', label: '😠 Frustrated' },
    { value: 'grateful', label: '🙏 Grateful' },
    { value: 'overwhelmed', label: '😵 Overwhelmed' },
    { value: 'content', label: '😊 Content' },
];

export function JournalPage() {
    const { profile } = useAuth();
    const navigate = useNavigate();

    // State
    const [entries, setEntries] = useState<Entry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMood, setSelectedMood] = useState<MoodTag | ''>('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        fetchEntries();
    }, []);

    useEffect(() => {
        filterEntries();
    }, [entries, searchTerm, selectedMood, dateFilter, sortOrder]);

    const fetchEntries = async () => {
        if (!profile) return;

        try {
            const { data, error } = await supabase
                .from('entries')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEntries(data || []);
        } catch (error) {
            console.error('Error fetching entries:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterEntries = () => {
        let filtered = [...entries];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(entry =>
                entry.text_summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.transcription.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.mood_tag.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Mood filter
        if (selectedMood) {
            filtered = filtered.filter(entry => entry.mood_tag === selectedMood);
        }

        // Date filter
        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            filtered = filtered.filter(entry => {
                const entryDate = new Date(entry.created_at);
                return entryDate.toDateString() === filterDate.toDateString();
            });
        }

        // Sort
        filtered.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        setFilteredEntries(filtered);
    };

    const handlePlayAudio = async (audioUrl: string, entryId: string) => {
        if (playingAudio === entryId) {
            // Pause current audio
            if (currentAudio) {
                currentAudio.pause();
                setPlayingAudio(null);
            }
            return;
        }

        // Stop any currently playing audio
        if (currentAudio) {
            currentAudio.pause();
        }

        try {
            const audio = new Audio(audioUrl);
            setCurrentAudio(audio);
            setPlayingAudio(entryId);

            audio.onended = () => {
                setPlayingAudio(null);
                setCurrentAudio(null);
            };

            audio.onerror = () => {
                setPlayingAudio(null);
                setCurrentAudio(null);
                console.error('Error playing audio');
            };

            await audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
            setPlayingAudio(null);
            setCurrentAudio(null);
        }
    };

    const getMoodColor = (mood: string) => {
        const colors: { [key: string]: string } = {
            happy: 'bg-yellow-400',
            calm: 'bg-blue-400',
            anxious: 'bg-orange-400',
            content: 'bg-green-400',
            excited: 'bg-purple-400',
            grateful: 'bg-pink-400',
            sad: 'bg-gray-400',
            stressed: 'bg-red-400',
            frustrated: 'bg-red-500',
            overwhelmed: 'bg-orange-500'
        };
        return colors[mood] || 'bg-gray-400';
    };

    const getMoodEmoji = (mood: string) => {
        const emojis: { [key: string]: string } = {
            happy: '😊',
            calm: '😌',
            anxious: '😰',
            sad: '😢',
            stressed: '😤',
            excited: '🤩',
            frustrated: '😠',
            grateful: '🙏',
            overwhelmed: '😵',
            content: '😊'
        };
        return emojis[mood] || '😐';
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedMood('');
        setDateFilter('');
        setSortOrder('desc');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const { signOut } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

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
                        onClick={() => navigate('/settings')}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
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
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-blue-300">Journal</h2>
                            <p className="text-gray-400 text-sm">
                                {filteredEntries.length} of {entries.length} entries
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={clearFilters}
                                className="px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Clear Filters
                            </button>
                            <Button
                                onClick={() => navigate('/dashboard')}
                                variant="primary"
                            >
                                New Check-In
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search entries, summaries, or transcriptions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-3 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Mood Filter */}
                        <div className="lg:w-48">
                            <select
                                value={selectedMood}
                                onChange={(e) => setSelectedMood(e.target.value as MoodTag | '')}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-3 focus:ring-blue-500 focus:border-transparent [&>option]:bg-gray-800 [&>option]:text-white"
                            >
                                {MOOD_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date Filter */}
                        <div className="lg:w-40">
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-3 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Sort */}
                        <div className="lg:w-32">
                            <button
                                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-white"
                            >
                                {sortOrder === 'desc' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
                                <span className="text-sm">Date</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Entries */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {filteredEntries.length === 0 ? (
                    <div className="text-center py-12">
                        {entries.length === 0 ? (
                            <>
                                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Volume2 className="h-12 w-12 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-blue-300 mb-2">No entries yet</h3>
                                <p className="text-gray-400 mb-6">Start your wellness journey by creating your first check-in.</p>
                                <Button
                                    onClick={() => navigate('/dashboard')}
                                    variant="primary"
                                >
                                    Create First Entry
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search className="h-12 w-12 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-blue-300 mb-2">No entries found</h3>
                                <p className="text-gray-400 mb-6">Try adjusting your search or filter criteria.</p>
                                <button
                                    onClick={clearFilters}
                                    className="text-blue-400 hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredEntries.map((entry) => (
                            <div
                                key={entry.id}
                                className="bg-gray-800 rounded-2xl border border-gray-700 hover:border-gray-600 transition-colors p-6"
                            >
                                {/* Entry Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-3 h-3 rounded-full ${getMoodColor(entry.mood_tag)}`}></div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-2xl">{getMoodEmoji(entry.mood_tag)}</span>
                                                <h3 className="text-lg font-semibold text-blue-300 capitalize">
                                                    {entry.mood_tag}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-gray-400">
                                                {formatDate(entry.created_at)} at{' '}
                                                {new Date(entry.created_at).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                    </button>
                                </div>

                                {/* AI Summary */}
                                {entry.text_summary && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-blue-300 mb-2">AI Summary</h4>
                                        <p className="text-gray-300 leading-relaxed">{entry.text_summary}</p>
                                    </div>
                                )}

                                {/* Transcription */}
                                {entry.transcription && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-blue-300 mb-2">Your Words</h4>
                                        <p className="text-gray-300 leading-relaxed italic">"{entry.transcription}"</p>
                                    </div>
                                )}

                                {/* AI Video Response */}
                                {entry.ai_response_url && entry.ai_response_url.includes('tavus') && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center space-x-2">
                                            <Video className="w-4 h-4" />
                                            <span>AI Video Response</span>
                                        </h4>
                                        <div className="bg-gray-900 rounded-lg p-4">
                                            <WeeklyVideoPlayer
                                                videoUrl={entry.ai_response_url}
                                                title="Personal AI Video Response"
                                                onGenerateNewVideo={() => { }}
                                                isGenerating={false}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Audio Controls */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {entry.voice_note_url && (
                                            <button
                                                onClick={() => handlePlayAudio(entry.voice_note_url!, entry.id)}
                                                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 bg-opacity-20 text-blue-400 rounded-lg hover:bg-opacity-30 transition-colors"
                                            >
                                                {playingAudio === entry.id ? (
                                                    <Pause className="h-4 w-4" />
                                                ) : (
                                                    <Play className="h-4 w-4" />
                                                )}
                                                <span className="text-sm">Your Voice Note</span>
                                            </button>
                                        )}

                                        {entry.ai_response_url && !entry.ai_response_url.includes('tavus') && (
                                            <button
                                                onClick={() => handlePlayAudio(entry.ai_response_url!, `${entry.id}-ai`)}
                                                className="flex items-center space-x-2 px-3 py-2 bg-purple-600 bg-opacity-20 text-purple-400 rounded-lg hover:bg-opacity-30 transition-colors"
                                            >
                                                {playingAudio === `${entry.id}-ai` ? (
                                                    <Pause className="h-4 w-4" />
                                                ) : (
                                                    <Play className="h-4 w-4" />
                                                )}
                                                <span className="text-sm">AI Audio Response</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-300">
                                            <Download className="h-4 w-4" />
                                        </button>
                                        <button className="p-2 hover:bg-red-900 rounded-lg transition-colors text-gray-400 hover:text-red-400">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
} 