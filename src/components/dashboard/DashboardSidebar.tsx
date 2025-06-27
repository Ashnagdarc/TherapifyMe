import CurrentStreak from "./CurrentStreak";
import RecentCheckinsSidebar from "./RecentCheckinsSidebar";
import { DashboardData } from "../../services/analyticsService";

interface DashboardSidebarProps {
  dashboardData: DashboardData | null;
  loading: boolean;
  userId: string;
  onClose?: () => void;
}

export default function DashboardSidebar({
  dashboardData,
  loading,
  userId,
  onClose,
}: DashboardSidebarProps) {
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  }

  if (loading || !dashboardData) {
    return (
      <div className="w-full flex flex-col gap-4 p-4">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg"></div>
          <div className="mt-3 h-20 bg-gray-200 rounded-lg"></div>
          <div className="mt-3 h-16 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 p-4 h-full overflow-y-auto">
      {/* Greeting */}
      <div className="text-center">
        <p className="font-medium text-lg text-gray-800">
          {getGreeting()}
        </p>
        <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full mt-2"></div>
      </div>

      {/* Current Streak */}
      <CurrentStreak days={dashboardData.streakInfo?.current || 0} />

      {/* Recent Check-ins */}
      <RecentCheckinsSidebar entries={dashboardData.recentEntries || []} />

      {/* Quick Stats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Total Entries</span>
            <span className="text-sm font-medium text-gray-800">
              {dashboardData.userAnalytics.totalEntries}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Active Days</span>
            <span className="text-sm font-medium text-gray-800">
              {dashboardData.userAnalytics.activeDays}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Dominant Mood</span>
            <span className="text-sm font-medium text-gray-800 capitalize">
              {dashboardData.userAnalytics.dominantMood}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
