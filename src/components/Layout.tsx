import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AnalyticsService, DashboardData } from "../services/analyticsService";

import DashboardSidebar from "./dashboard/DashboardSidebar";
import { Button } from "./ui/Button";

import Logo from "./Logo";

import {
  BookOpen,
  Settings,
  LogOut,
  UserRound,
  PanelRightOpen,
} from "lucide-react";

interface DashboardContainerProps {
  children: React.ReactNode;
  dashboardData: DashboardData | null;
  loading: boolean;
  profile: User | null;
  isRefreshing: boolean;
}

interface DashboardNavContainerProps {
  onSignOut?: any;
}

interface ProfileAvatarProps {
  onProfileToggle?: any;
}

interface UserProfileNavProps {
  onProfileToggle?: any;
  signOut?: any;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    }, 30000);

    return () => clearInterval(interval);
  }, [profile, loading, fetchDashboardData]);

  async function handleSignOut() {
    await signOut();
    navigate("/auth");
  }

  return (
    // Recreated dashboard layout

    <div className="w-full min-h-svh flex flex-row bg-sky-blue/40 font-lato text-text-blue">
      {/* only displaying the sidebar on the dashboard page */}
      {currentPath === "/dashboard" && (
        <DashboardContainer
          dashboardData={dashboardData}
          loading={loading}
          profile={profile}
          isRefreshing={isRefreshing}
        />
      )}

      <main className="w-full h-svh flex overflow-y-scroll">{children}</main>

      <DashboardNavContainer onSignOut={handleSignOut} />
    </div>
  );
}

function DashboardContainer({
  dashboardData,
  loading,
  isRefreshing,
  profile,
}: DashboardContainerProps) {
  const [openDash, setOpenDash] = useState(false);

  function handleDashToggle() {
    setOpenDash(!openDash);
  }

  return (
    <section
      className={`${
        openDash && "w-full h-full lg:w-[300px]"
      } w-[10%]  absolute z-[999] flex flex-row items-start transition-all duration-200 ease-in lg:w-[5%]`}
    >
      <div
        className={`${
          !openDash
            ? "w-full items-end pt-[1rem] "
            : "w-[65%] h-svh items-center bg-grey-2 py-[1rem] md:py-[2rem]  lg:w-[270px] "
        }  flex flex-col gap-[2rem]  px-[0.5rem] text-[15px] text-black  md:pt-[0.7rem] md:text-[16px]  transition-all duration-300 ease-in `}
      >
        <div className="w-full flex items-center justify-between">
          {openDash && (
            <div className="flex items-center gap-[0.3rem]">
              <Logo />
              <p className="hidden md:block font-[600] text-[24px] text-text-blue leading-[100%]">
                Therapify
              </p>
            </div>
          )}

          <div
            className={`${
              !openDash &&
              " p-[0.5rem] bg-grey-2 rounded-full border-[3px] border-main shadow-xl/50 shadow-black md:p-[1rem] "
            }`}
          >
            <PanelRightOpen
              className="cursor-pointer"
              onClick={handleDashToggle}
            />
          </div>
        </div>

        {openDash && (
          <div
            className={`w-full flex flex-col items-start gap-[1rem] capitalize ${
              !openDash ? "opacity-0" : "opacity-100"
            } transition-opacity delay-100 duration-300 ease-in `}
          >
            {/* Move to Journal button */}
            <div className="flex items-center gap-[0.5rem] cursor-pointer ">
              <BookOpen />
              <NavLink to="/journal" onClick={() => setOpenDash(!openDash)}>
                Journal Entries
              </NavLink>
            </div>
          </div>
        )}

        {openDash && (
          <DashboardSidebar
            dashboardData={dashboardData}
            loading={loading || isRefreshing}
            userId={profile.id}
          />
        )}
      </div>

      <div
        className={`${
          !openDash ? "hidden" : "flex"
        } bg-black/40 backdrop-blur-xl w-[35%] h-full lg:hidden`}
      ></div>
    </section>
  );
}

function DashboardNavContainer({ onSignOut }: DashboardNavContainerProps) {
  const [openNav, setOpenNav] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);

  function handleNavToggle() {
    setOpenNav(!openNav);
  }

  function handleProfileToggleNav() {
    setOpenProfile(!openProfile);
  }

  return (
    <section
      className={`justify-self-end flex flex-col gap-[2rem] pt-[1rem] px-[1rem] absolute top-0 right-0 left-[0.5rem] z-[99]`}
    >
      <div className=" self-end flex items-center ">
        {!openProfile && (
          <ProfileAvatar onProfileToggle={handleProfileToggleNav} />
        )}
      </div>

      {openProfile && (
        <UserProfileNav
          signOut={onSignOut}
          onProfileToggle={handleProfileToggleNav}
        />
      )}
    </section>
  );
}

function ProfileAvatar({ onProfileToggle }: ProfileAvatarProps) {
  return (
    <div
      className="text-white bg-text-blue p-[0.5rem]  shadow-xl/40 shadow-black border-[2px] border-main rounded-full cursor-pointer"
      onClick={onProfileToggle}
    >
      <UserRound />
    </div>
  );
}

function UserProfileNav({ signOut, onProfileToggle }: UserProfileNavProps) {
  return (
    <div className=" w-[225px] h-[170px] flex flex-col items-start gap-[1rem] bg-grey-2 p-[1rem] rounded-[1rem] shadow-xl/30 shadow-black ">
      <div className="flex items-center gap-[0.6rem] mb-[1rem] ">
        <span onClick={onProfileToggle}>
          <ProfileAvatar />
        </span>

        {/* placeholder for user name */}
        <p className=" Font-[600] text-[16px]">User</p>
      </div>

      <div className="flex items-center gap-[0.6rem]">
        <Settings />
        <NavLink
          to="/settings"
          className="cursor-pointer hover:text-text-black"
        >
          Settings
        </NavLink>
      </div>

      <div
        className="flex items-center gap-[0.6rem] cursor-pointer"
        onClick={signOut}
      >
        <LogOut />
        <p className=" hover:text-text-black">Log Out</p>
      </div>
    </div>
  );
}
