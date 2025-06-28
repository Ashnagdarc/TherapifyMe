import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AnalyticsService, DashboardData } from "../services/analyticsService";
import { User } from "../types/database";

import DashboardSidebar from "./dashboard/DashboardSidebar";

import Logo from "./Logo";

import {
  BookOpen,
  Settings,
  LogOut,
  UserRound,
  PanelRightOpen,
  MoreHorizontal,
} from "lucide-react";

interface DashboardContainerProps {
  children: React.ReactNode;
  dashboardData: DashboardData | null;
  loading: boolean;
  profile: User | null;
  isRefreshing: boolean;
  openSidebar: boolean;
  onSidebarToggle: () => void;
}

interface DashboardNavContainerProps {
  onSignOut?: any;
  onSidebarToggle: () => void;
  showSidebarToggle: boolean;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);

  const { profile, loading: authLoading } = useAuth();
  const { signOut } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const fetchDashboardData = useCallback(async () => {
    if (!profile) return;

    try {
      setIsRefreshing(true);
      const analyticsService = AnalyticsService.getInstance();
      const data = await analyticsService.getDashboardData(profile.id);
      setDashboardData(data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [profile]);

  useEffect(() => {
    if (authLoading || !profile) return;

    fetchDashboardData();
  }, [profile, authLoading, fetchDashboardData]);

  useEffect(() => {
    if (!profile || loading) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 300000);

    return () => clearInterval(interval);
  }, [profile, loading, fetchDashboardData]);

  async function handleSignOut() {
    await signOut();
    navigate("/auth");
  }

  function handleSidebarToggle() {
    setOpenSidebar(!openSidebar);
  }

  return (
    // Recreated dashboard layout

    <div className="w-full min-h-svh flex flex-row bg-gray-50 font-lato text-text-blue">
      {/* only displaying the sidebar on the dashboard page */}
      {currentPath === "/dashboard" && (
        <DashboardContainer
          dashboardData={dashboardData}
          loading={loading}
          profile={profile}
          isRefreshing={isRefreshing}
          openSidebar={openSidebar}
          onSidebarToggle={handleSidebarToggle}
        >
          {children}
        </DashboardContainer>
      )}

      <main className="w-full h-svh flex overflow-y-scroll">{children}</main>

      <DashboardNavContainer
        onSignOut={handleSignOut}
        onSidebarToggle={handleSidebarToggle}
        showSidebarToggle={currentPath === "/dashboard"}
      />
    </div>
  );
}

function DashboardContainer({
  dashboardData,
  loading,
  isRefreshing,
  profile,
  openSidebar,
  onSidebarToggle,
}: DashboardContainerProps) {
  return (
    <section
      className={`${
        openSidebar && "w-full h-full lg:w-[300px]"
      } w-[10%] absolute z-[998] flex flex-row items-start transition-all duration-200 ease-in lg:w-[5%]`}
    >
      <div
        className={`${
          !openSidebar
            ? "w-full items-end pt-[1rem] "
            : "w-[65%] h-svh items-center bg-grey-2 py-[1rem] md:py-[2rem] lg:w-[270px] "
        } flex flex-col gap-[2rem] px-[0.5rem] text-[15px] text-black md:pt-[0.7rem] md:text-[16px] transition-all duration-300 ease-in `}
      >
        {openSidebar && (
          <div className="w-full flex items-center justify-between pt-16">
            <div className="flex items-center gap-[0.3rem]">
              <Logo />
              <p className="hidden md:block font-[600] text-[24px] text-text-blue leading-[100%]">
                Therapify
              </p>
            </div>
          </div>
        )}

        {openSidebar && (
          <div
            className={`w-full flex flex-col items-start gap-[1rem] capitalize ${
              !openSidebar ? "opacity-0" : "opacity-100"
            } transition-opacity delay-100 duration-300 ease-in `}
          >
            {/* Move to Journal button */}
            <div className="flex items-center gap-[0.5rem] cursor-pointer ">
              <BookOpen />
              <NavLink to="/journal" onClick={onSidebarToggle}>
                Journal Entries
              </NavLink>
            </div>
          </div>
        )}

        {openSidebar && profile && (
          <DashboardSidebar
            dashboardData={dashboardData}
            loading={loading || isRefreshing}
            userId={profile.id}
          />
        )}
      </div>

      <div
        className={`${
          !openSidebar ? "hidden" : "flex"
        } bg-black/40 backdrop-blur-xl w-[35%] h-full lg:hidden`}
        onClick={onSidebarToggle}
      ></div>
    </section>
  );
}

function DashboardNavContainer({
  onSignOut,
  onSidebarToggle,
  showSidebarToggle,
}: DashboardNavContainerProps) {
  const [openMenu, setOpenMenu] = useState(false);
  const { profile } = useAuth();

  function handleMenuToggle() {
    setOpenMenu(!openMenu);
  }

  return (
    <div className="fixed top-0 right-0 left-0 z-[1000] bg-gray-50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Sidebar Toggle */}
        <div className="flex items-center">
          {showSidebarToggle && (
            <SidebarToggle onSidebarToggle={onSidebarToggle} />
          )}
        </div>

        {/* Right side - Profile and Menu */}
        <div className="flex items-center gap-3">
          {/* Three Dots Menu */}
          <div className="relative">
            <button
              onClick={handleMenuToggle}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            {openMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 py-3 z-50 animate-in slide-in-from-top-2 duration-200">
                <NavLink
                  to="/settings"
                  onClick={() => setOpenMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-white/50 transition-all duration-200 rounded-xl mx-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </NavLink>
                <hr className="my-2 border-white/30 mx-2" />
                <button
                  onClick={() => {
                    setOpenMenu(false);
                    onSignOut();
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50/70 transition-all duration-200 w-full text-left rounded-xl mx-2"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {openMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpenMenu(false)}
        />
      )}
    </div>
  );
}

// Add SidebarToggle component
function SidebarToggle({ onSidebarToggle }: { onSidebarToggle: () => void }) {
  return (
    <button
      onClick={onSidebarToggle}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <PanelRightOpen className="w-5 h-5 text-gray-600" />
    </button>
  );
}
