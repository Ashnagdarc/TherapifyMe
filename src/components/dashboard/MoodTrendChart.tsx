import React from 'react';
import { TrendingUp } from 'lucide-react';

// This is a simplified version of the mood trend data from Dashboard.tsx
interface MoodTrendData {
    date: string;
    mood: string;
    intensity: number;
    count: number;
}

interface MoodTrendChartProps {
    moodTrends: MoodTrendData[];
}

export const MoodTrendChart = ({ moodTrends }: MoodTrendChartProps) => {
    if (!moodTrends || moodTrends.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2 text-blue-500" />
                    7-Day Mood Trend
                </h3>
                <div className="h-48 flex items-center justify-center">
                    <p className="text-gray-500">Not enough data to display mood trend.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-blue-500" />
                7-Day Mood Trend
            </h3>
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                {/* 
                    In a real implementation, a chart library like Recharts or Chart.js 
                    would be used here to render the moodTrends data.
                */}
                <p className="text-gray-600 font-medium">Chart Component Placeholder</p>
            </div>
        </div>
    );
}; 