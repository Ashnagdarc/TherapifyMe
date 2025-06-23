// imported Hooks
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AnalyticsService, DashboardData } from "../services/analyticsService";

// imported UI components
import CheckIn from "../components/dashboard/CheckIn";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";

// imported database component
import { Entry } from "../types/database";

export default function Dashboard() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!profile) return;

    try {
      setIsRefreshing(true);
      const analyticsService = AnalyticsService.getInstance();
      const data = await analyticsService.getDashboardData(profile.id);
      setDashboardData(data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setLoading(false);
    } finally {
      setIsRefreshing(false);
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

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!profile || loading) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [profile, loading, fetchDashboardData]);

  const handleCheckInComplete = () => {
    // Invalidate cache and refresh immediately
    const analyticsService = AnalyticsService.getInstance();
    analyticsService.invalidateUserCache(profile?.id || '');
    fetchDashboardData();
  };

  const handleManualRefresh = () => {
    const analyticsService = AnalyticsService.getInstance();
    analyticsService.invalidateUserCache(profile?.id || '');
    fetchDashboardData();
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

    if (diffInSeconds < 30) return 'Just updated';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400/70 mx-auto"></div>
          <p className="text-slate-400 mt-4 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Subtle background pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_theme(colors.emerald.500/0.05)_0%,_transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_theme(colors.blue.500/0.05)_0%,_transparent_50%)] pointer-events-none"></div>

      {/* Real-time status bar */}
      <div className="relative z-10 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">
                Live Data • {formatLastUpdated()}
              </span>
            </div>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-600/30 transition-colors disabled:opacity-50"
          >
            <span className={`text-sm ${isRefreshing ? 'animate-spin' : ''}`}>
              🔄
            </span>
            <span className="text-xs text-slate-300">
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>

      <div className="relative container mx-auto p-4 grid grid-cols-12 gap-6 min-h-screen">
        {/* Combined Sidebar */}
        <DashboardSidebar
          dashboardData={dashboardData}
          loading={loading || isRefreshing}
          userId={profile.id}
        />

        {/* Center Orb Area */}
        <div className="col-span-9 flex items-center justify-center relative">
          {/* Soft ambient glow behind orb */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
          </div>

          {/* Main Orb Component */}
          <div className="relative z-10">
            <CheckIn onCheckInComplete={handleCheckInComplete} />
          </div>
        </div>
      </div>
    </div>
  );
}
