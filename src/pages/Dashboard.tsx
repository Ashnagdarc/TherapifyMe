import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AnalyticsService, DashboardData } from '../services/analyticsService';
import { CheckIn } from '../components/dashboard/CheckIn';
import { CurrentStreak } from '../components/dashboard/CurrentStreak';
import { MoodTrendSidebar } from '../components/dashboard/MoodTrendSidebar';
import { RecentCheckinsSidebar } from '../components/dashboard/RecentCheckinsSidebar';
import { TherapySession } from '../components/dashboard/TherapySession';
import { UserProgress } from '../components/dashboard/UserProgress';
import { MoodInsights } from '../components/dashboard/MoodInsights';
import { Entry } from '../types/database';

export function Dashboard() {
    const { profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!profile) {
            navigate('/auth');
            return;
        }

        const analyticsService = AnalyticsService.getInstance();
        analyticsService.getDashboardData(profile.id)
            .then(data => {
                setDashboardData(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Failed to fetch dashboard data:", error);
                setLoading(false);
            });
    }, [profile, authLoading, navigate]);

    const handleCheckInComplete = () => {
        setLoading(true);
        const analyticsService = AnalyticsService.getInstance();
        if (profile) {
            analyticsService.getDashboardData(profile.id)
                .then(data => {
                    setDashboardData(data);
                    setLoading(false);
                })
                .catch(error => {
                    console.error("Failed to refresh dashboard data:", error);
                    setLoading(false);
                });
        }
    };

    if (loading || !profile) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            <div className="container mx-auto p-4 grid grid-cols-12 gap-8 items-center h-screen">
                {/* Left Sidebar */}
                <div className="col-span-3 space-y-6">
                    <CurrentStreak days={dashboardData?.streakInfo?.current || 0} />
                    <MoodTrendSidebar trends={dashboardData?.moodTrends || []} />
                    <RecentCheckinsSidebar entries={dashboardData?.recentEntries || []} />
                </div>

                {/* Center Orb */}
                <div className="col-span-6">
                    <CheckIn onCheckInComplete={handleCheckInComplete} />
                </div>

                {/* Right Sidebar */}
                <div className="col-span-3 space-y-6">
                    <h3 className="text-sm text-gray-400">This Week's Therapy Session</h3>
                    <TherapySession />
                    <UserProgress stats={dashboardData?.userAnalytics} />
                    <MoodInsights mood={dashboardData?.userAnalytics.dominantMood} />
                </div>
            </div>
        </div>
    );
} 