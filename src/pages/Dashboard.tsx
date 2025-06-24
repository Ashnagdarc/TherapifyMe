// imported Hooks
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AnalyticsService, DashboardData } from "../services/analyticsService";
import { AmbientMusicService } from "../services/ambientMusicService";

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
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

    // Initialize and start ambient music when user logs in
    AmbientMusicService.initialize();
    // Start music after a small delay to allow user interaction
    setTimeout(() => {
      AmbientMusicService.startMusic();
    }, 1000);
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

  const handleMusicToggle = () => {
    const newMusicState = AmbientMusicService.toggleMusic();
    setMusicEnabled(newMusicState);
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

      {/* Real-time status bar and header */}
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

          <div className="flex items-center space-x-2">
            {/* Hamburger for mobile - now on the right */}
            <button
              className="lg:hidden p-2 rounded-md bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Open sidebar"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-menu text-white"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <button
              onClick={handleMusicToggle}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-600/30 transition-colors"
              title={musicEnabled ? 'Turn off ambient music' : 'Turn on ambient music'}
            >
              <span className="text-sm">
                {musicEnabled ? '🎵' : '🔇'}
              </span>
              <span className="text-xs text-slate-300">
                {musicEnabled ? 'Music On' : 'Music Off'}
              </span>
            </button>

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
      </div>

      {/* Responsive grid layout */}
      <div className="relative container mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-6 min-h-screen">
        {/* Sidebar: responsive, collapsible on mobile */}
        <div
          className={
            "fixed inset-0 z-40 bg-black/40 transition-opacity lg:static lg:col-span-3 lg:bg-transparent " +
            (sidebarOpen ? "block" : "hidden lg:block")
          }
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className={
              "absolute left-0 top-0 h-full w-72 max-w-full bg-gradient-to-b from-slate-800/90 to-slate-900/90 backdrop-blur-md shadow-2xl border-r border-slate-700/50 transform transition-transform duration-300 " +
              (sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
            }
            onClick={(e) => e.stopPropagation()}
          >
            <DashboardSidebar
              dashboardData={dashboardData}
              loading={loading || isRefreshing}
              userId={profile.id}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
        {/* Main content: orb area, responsive */}
        <div className="col-span-1 md:col-span-9 flex items-center justify-center relative min-h-[60vh]">
          {/* Soft ambient glow behind orb */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-72 md:w-96 md:h-96 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
          </div>

          {/* Main Orb Component */}
          <div className="relative z-10 w-full max-w-xl mx-auto">
            <CheckIn onCheckInComplete={handleCheckInComplete} />
          </div>
        </div>
      </div>
    </div>
  );
}
