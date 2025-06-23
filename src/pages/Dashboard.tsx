// imported Hooks
import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (authLoading) return;
    if (!profile) {
      navigate("/auth");
      return;
    }

    const analyticsService = AnalyticsService.getInstance();
    analyticsService
      .getDashboardData(profile.id)
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch dashboard data:", error);
        setLoading(false);
      });
  }, [profile, authLoading, navigate]);

  const handleCheckInComplete = () => {
    setLoading(true);
    const analyticsService = AnalyticsService.getInstance();
    if (profile) {
      analyticsService
        .getDashboardData(profile.id)
        .then((data) => {
          setDashboardData(data);
          setLoading(false);
        })
        .catch((error) => {
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
    <div className="container mx-auto p-4 grid grid-cols-12 gap-8 h-screen">
      {/* Combined Sidebar */}
      <DashboardSidebar dashboardData={dashboardData} loading={loading} />

      {/* Center Orb */}
      <div className="col-span-9 flex items-center justify-center">
        <CheckIn onCheckInComplete={handleCheckInComplete} />
      </div>
    </div>
  );
}
