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
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      {/* Orb Section */}
      <div className="text-center mb-8">
        {/* Soft ambient glow behind orb */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-72 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-cyan-400/30 rounded-full blur-3xl"></div>
          </div>

          {/* Main Orb Component - Preserved exactly as user requested */}
          <div className="relative z-10 mb-8">
            <CheckIn onCheckInComplete={handleCheckInComplete} />
          </div>
        </div>

        {/* Greeting */}
        <h1 className="text-3xl font-light text-gray-800 mb-2">
          {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-gray-600 mb-8">
          How are you feeling today?
        </p>
      </div>
    </div>
  );
}
