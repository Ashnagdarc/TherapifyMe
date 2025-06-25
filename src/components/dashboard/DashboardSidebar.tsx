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
      <div className="col-span-3 space-y-3 p-4 bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl h-full flex flex-col justify-between border border-slate-700/50 shadow-2xl">
        <div className="animate-pulse">
          <div className="h-16 bg-slate-700/60 rounded-xl"></div>
          <div className="mt-3 h-32 bg-slate-700/60 rounded-xl"></div>
          <div className="mt-3 h-24 bg-slate-700/60 rounded-xl"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-12 bg-slate-700/60 rounded-xl"></div>
          <div className="mt-3 h-16 bg-slate-700/60 rounded-xl"></div>
          <div className="mt-3 h-12 bg-slate-700/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className=" w-full flex flex-col items-center gap-[2rem] rounded-[0.4rem] h-full overflow-y-auto shadow-2xl relative transition-all duration-300 ease-in ">
      {/* Top section */}
      <div className=" w-full flex flex-col items-center ">
        <div className="text-center">
          <p className=" font-medium text-[18px] text-text-blue mb-1 md:text-[20px]">
            {getGreeting()}
          </p>
          <div className="w-12 h-0.5 bg-gradient-to-r from-emerald-400 to-blue-400 mx-auto rounded-full"></div>
        </div>

        <div className="w-full flex flex-col gap-[1rem] lg:w-[90%] ">
          <CurrentStreak days={dashboardData.streakInfo?.current || 0} />
          <MoodTrendSidebar trends={dashboardData.moodTrends || []} />
          <RecentCheckinsSidebar entries={dashboardData.recentEntries || []} />
        </div>
      </div>

      {/* Bottom section */}
      <div className="w-full flex flex-col items-center border-t border-slate-700/50">
        <div className="text-center">
          <h3 className="text-xs font-medium text-text-blue pt-2 mb-2">
            This Week's Summary
          </h3>
          <div className="w-8 h-0.5 bg-gradient-to-r from-slate-500 to-slate-600 mx-auto rounded-full"></div>
        </div>

        <div className="w-full flex flex-col gap-[1rem] lg:w-[90%] ">
          <TherapySession userId={userId} />
          <UserProgress stats={dashboardData.userAnalytics} />
          <MoodInsights mood={dashboardData.userAnalytics.dominantMood} />
        </div>
      </div>
    </div>
  );
}
