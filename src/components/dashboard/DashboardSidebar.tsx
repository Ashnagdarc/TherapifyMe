import CurrentStreak from "./CurrentStreak";
import MoodTrendSidebar from "./MoodTrendSidebar";
import RecentCheckinsSidebar from "./RecentCheckinsSidebar";
import TherapySession from "./TherapySession";
import UserProgress from "./UserProgress";
import MoodInsights from "./MoodInsights";
import { DashboardData } from "../../services/analyticsService";

interface DashboardSidebarProps {
    dashboardData: DashboardData | null;
    loading: boolean;
}

const DashboardSidebar = ({ dashboardData, loading }: DashboardSidebarProps) => {
    if (loading || !dashboardData) {
        return (
            <div className="col-span-3 space-y-6 p-4 bg-gray-800 rounded-lg h-full flex flex-col justify-between">
                <div className="animate-pulse">
                    <div className="h-24 bg-gray-700 rounded"></div>
                    <div className="mt-6 h-48 bg-gray-700 rounded"></div>
                    <div className="mt-6 h-32 bg-gray-700 rounded"></div>
                </div>
                <div className="animate-pulse">
                    <div className="h-16 bg-gray-700 rounded"></div>
                    <div className="mt-6 h-24 bg-gray-700 rounded"></div>
                    <div className="mt-6 h-16 bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="col-span-3 space-y-6 p-4 bg-gray-800 rounded-lg h-full flex flex-col justify-between overflow-y-auto">
            {/* Top section */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Good Morning</h2>
                <CurrentStreak days={dashboardData.streakInfo?.current || 0} />
                <MoodTrendSidebar trends={dashboardData.moodTrends || []} />
                <RecentCheckinsSidebar entries={dashboardData.recentEntries || []} />
            </div>

            {/* Bottom section */}
            <div>
                <h3 className="text-sm text-gray-400 mb-2">This Week's Summary</h3>
                <TherapySession />
                <UserProgress stats={dashboardData.userAnalytics} />
                <MoodInsights mood={dashboardData.userAnalytics.dominantMood} />
            </div>
        </div>
    );
};

export default DashboardSidebar; 