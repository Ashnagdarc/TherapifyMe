// imported Hooks
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AnalyticsService, DashboardData } from "../services/analyticsService";
import { useScreenWidth } from "../hooks/useScreenWidth";

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

  const width = useScreenWidth();

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

  function handleCheckInComplete() {
    // Invalidate cache and refresh immediately
    const analyticsService = AnalyticsService.getInstance();
    analyticsService.invalidateUserCache(profile?.id || "");
    fetchDashboardData();
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
  }

  if (loading || !profile) {
    return (
      <div className="w-full min-h-screen bg-grey-2 flex items-center justify-center">
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
    <div
      className={`w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center px-8 pt-24 pb-[2rem] ${
        width <= 375 && "pt-[10rem]"
      } ${width >= 1200 && "pt-[10rem]"} `}
    >
      {/* Greeting Section - Moved above orb */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent animate-pulse">
          Hello {profile?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-xl font-semibold text-gray-600 mb-2">
          {getGreeting()}
        </p>
        <p className="text-lg text-gray-600">How are you feeling today?</p>
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
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <CheckIn onCheckInComplete={handleCheckInComplete} />
          </div>
        </div>
      </div>
    </div>
  );
}
