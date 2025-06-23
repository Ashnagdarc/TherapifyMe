import React from 'react';
import { MoodTrendData } from '../../services/analyticsService';

interface MoodTrendSidebarProps {
    trends: MoodTrendData[];
}

const dayMapping = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MoodTrendSidebar = ({ trends }: MoodTrendSidebarProps) => {

    const getTrendForDay = (dayIndex: number) => {
        const dayStr = dayMapping[dayIndex];
        // This is a placeholder logic. In a real scenario, you'd map dates to days.
        return trends.find(t => new Date(t.date).getDay() === dayIndex);
    }

    return (
        <div className="bg-gray-800/50 p-4 rounded-lg">
            <h4 className="text-sm text-gray-400 font-medium mb-3">7-Day Mood Trend</h4>
            <div className="space-y-2">
                {dayMapping.map((day, index) => {
                    const trend = getTrendForDay(index);
                    const hasData = trend && trend.count > 0;

                    return (
                        <div key={day} className="flex items-center justify-between text-xs">
                            <span className="text-gray-300 w-8">{day}</span>
                            <div className="flex-1 h-1.5 bg-gray-700 rounded-full mx-2">
                                {hasData && (
                                    <div
                                        className="h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                                        style={{ width: `${(trend.intensity / 10) * 100}%` }} // Example: intensity 0-10 scale
                                    ></div>
                                )}
                            </div>
                            <span className="text-gray-500 w-2">-</span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}; 