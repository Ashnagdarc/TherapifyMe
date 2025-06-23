import React from 'react';

interface MoodInsightsProps {
    mood: string | undefined;
}

export const MoodInsights = ({ mood }: MoodInsightsProps) => (
    <div className="bg-gray-800/50 p-4 rounded-lg">
        <h4 className="text-sm text-gray-400 font-medium mb-2">Mood Insights</h4>
        <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
            <p className="text-sm">
                <span className="text-gray-300">Dominant mood:</span>
                <span className="text-white font-medium capitalize ml-1">{mood || '...'}</span>
            </p>
        </div>
    </div>
); 