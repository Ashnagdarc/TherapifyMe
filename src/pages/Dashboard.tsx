// imported Hooks
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AnalyticsService, DashboardData } from "../services/analyticsService";

// imported UI components
import CheckIn from "../components/dashboard/CheckIn";

export default function Dashboard() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!profile) return;

    try {
      const analyticsService = AnalyticsService.getInstance();
      const data = await analyticsService.getDashboardData(profile.id);
      setDashboardData(data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (authLoading) return;
    if (!profile) {
      navigate("/auth");
      return;
    }
    fetchDashboardData();
  }, [profile, authLoading, navigate, fetchDashboardData]);

  // Auto-refresh every 30 seconds (keep for future use)

  // useEffect(() => {
  //   if (!profile || loading) return;

  //   const interval = setInterval(() => {
  //     fetchDashboardData();
  //   }, 30000); // 30 seconds

  //   return () => clearInterval(interval);
  // }, [profile, loading, fetchDashboardData]);

  function handleCheckInComplete() {
    // Invalidate cache and refresh immediately
    const analyticsService = AnalyticsService.getInstance();
    analyticsService.invalidateUserCache(profile?.id || "");
    fetchDashboardData();
  }

  function formatLastUpdated() {
    if (!lastUpdated) return "";
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - lastUpdated.getTime()) / 1000
    );

    if (diffInSeconds < 30) return "Just updated";
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;

    return lastUpdated.toLocaleTimeString();
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-grey-2 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main/70 mx-auto"></div>
          <p className="text-text-blue/70 mt-4 text-sm">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-sky-blue/20 font-lato text-text-blue md:w-full">
      {/* Real-time status bar and header */}
      <div className="z-10 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>

              <p className="text-xs text-slate-400">
                Live Data • {formatLastUpdated()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive grid layout */}
      <div className="w-[300px] h-full p-4 flex flex-col gap-[0.5rem] md:w-full">
        {/* Main content: orb area, responsive */}
        <div className=" w-full h-full flex items-center justify-center relative">
          {/* Soft ambient glow behind orb */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-72 md:w-96 md:h-96 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
          </div>

          {/* Main Orb Component */}
          <div className="relative z-10 w-full h-full flex items-center justify-center ">
            <CheckIn onCheckInComplete={handleCheckInComplete} />
          </div>
        </div>
      </div>
    </div>
  );
}
