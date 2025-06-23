import React from 'react';
import { Entry, MoodTag } from '../../types/database';
import { Clock, MessageCircle } from 'lucide-react';

// Use a more flexible Entry type that can be either the full Entry or a minimal one
type RecentEntry = Pick<Entry, 'id' | 'mood_tag' | 'transcription' | 'created_at'>;

interface RecentEntriesListProps {
    entries: RecentEntry[];
}

const getMoodColor = (mood: string) => {
    switch (mood) {
        case 'happy': return 'text-green-500';
        case 'excited': return 'text-yellow-500';
        case 'grateful': return 'text-pink-500';
        case 'calm': return 'text-blue-500';
        case 'content': return 'text-cyan-500';
        case 'sad': return 'text-indigo-500';
        case 'anxious': return 'text-purple-500';
        case 'overwhelmed': return 'text-red-600';
        case 'frustrated': return 'text-red-500';

        default:
            return 'text-gray-500';
    }
};

export const RecentEntriesList = ({ entries }: RecentEntriesListProps) => {
    if (!entries || entries.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <h3 className="text-xl font-semibold mb-4">Recent Entries</h3>
                <p className="text-gray-500">You have no recent entries. Complete a check-in to get started!</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Recent Entries</h3>
            <ul className="space-y-4">
                {entries.map((entry) => (
                    <li key={entry.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className={`font-bold capitalize ${getMoodColor(entry.mood_tag)}`}>{entry.mood_tag}</p>
                                <p className="text-sm text-gray-600 truncate max-w-md">
                                    <MessageCircle className="w-4 h-4 inline-block mr-1" />
                                    {entry.transcription}
                                </p>
                            </div>
                            <div className="text-right text-xs text-gray-500 flex-shrink-0">
                                <Clock className="w-3 h-3 inline-block mr-1" />
                                {new Date(entry.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}; 