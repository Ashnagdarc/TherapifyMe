import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/Button";

import Logo from "./Logo";

import {
  LayoutDashboard,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  Ellipsis,
  NotebookPen,
  Search,
  UserRound,
  PanelRightOpen,
  ArchiveRestore,
  Trash2,
  X,
} from "lucide-react";

interface DashboardContainerProps {
  children: React.ReactNode;
}

interface ProfileAvatarProps {
  onProfileToggle?: any;
}

interface SubNavProps {
  onToggle?: any;
}

interface UserProfileNavProps {
  onProfileToggle?: any;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const navLinks = [
    {
      to: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      text: "Dashboard",
    },
    { to: "/journal", icon: <BookOpen className="w-5 h-5" />, text: "Journal" },
    {
      to: "/settings",
      icon: <Settings className="w-5 h-5" />,
      text: "Settings",
    },
  ];

  return (
    // <div className="min-h-screen bg-gray-900 text-white font-sans">
    //   <header className="sticky top-0 bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-700">
    //     <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    //       <div className="flex items-center justify-between h-16">
    //         <div className="flex items-center space-x-2">
    //           {/* <img src="/therapifyme-logo.svg" alt="TherapifyMe Logo" className="h-8 w-8" /> */}
    //           <span className="text-xl font-bold">TherapifyMe</span>
    //         </div>

    //         {/* Desktop Navigation */}
    //         <nav className="hidden md:flex md:space-x-2">
    //           {navLinks.map((link) => (
    //             <NavLink
    //               key={link.to}
    //               to={link.to}
    //               className={({ isActive }) =>
    //                 `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
    //                   ? "bg-blue-500/20 text-blue-300"
    //                   : "text-gray-300 hover:bg-gray-800 hover:text-white"
    //                 }`
    //               }
    //             >
    //               {link.icon}
    //               <span className="ml-2">{link.text}</span>
    //             </NavLink>
    //           ))}
    //         </nav>

    //         <div className="flex items-center space-x-4">
    //           <Button
    //             onClick={handleSignOut}
    //             variant="ghost"
    //             size="sm"
    //             className="hidden md:flex"
    //           >
    //             <LogOut className="w-4 h-4 mr-2" />
    //             Sign Out
    //           </Button>
    //           <div className="md:hidden">
    //             <Button
    //               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    //               variant="ghost"
    //               size="sm"
    //             >
    //               {isMobileMenuOpen ? (
    //                 <X className="w-6 h-6" />
    //               ) : (
    //                 <Menu className="w-6 h-6" />
    //               )}
    //             </Button>
    //           </div>
    //         </div>
    //       </div>
    //     </div>

    //     {/* Mobile Navigation */}
    //     {isMobileMenuOpen && (
    //       <div className="md:hidden pt-2 pb-3 space-y-1 sm:px-3 bg-gray-900">
    //         {navLinks.map((link) => (
    //           <NavLink
    //             key={link.to}
    //             to={link.to}
    //             onClick={() => setIsMobileMenuOpen(false)}
    //             className={({ isActive }) =>
    //               `flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive
    //                 ? "bg-blue-500/20 text-blue-300"
    //                 : "text-gray-300 hover:bg-gray-800"
    //               }`
    //             }
    //           >
    //             {link.icon}
    //             <span className="ml-3">{link.text}</span>
    //           </NavLink>
    //         ))}
    //         <div className="border-t border-gray-700 my-2"></div>
    //         <Button
    //           onClick={handleSignOut}
    //           variant="ghost"
    //           size="sm"
    //           className="w-full flex justify-start items-center px-3 py-2"
    //         >
    //           <LogOut className="w-5 h-5 mr-3" />
    //           Sign Out
    //         </Button>
    //       </div>
    //     )}
    //   </header>
    //   <main>
    //     {/* The container and padding are removed from here to allow pages to control their own layout */}
    //     {children}
    //   </main>
    // </div>

    // Recreated dashboard layout

    <div className="w-full min-h-svh flex flex-row bg-sky-blue/40 font-lato text-text-blue">
      <DashboardContainer />

      <div className="flex-1">{children}</div>

      <DashboardNavContainer />
    </div>
  );
}

function DashboardContainer({ children }: DashboardContainerProps) {
  const [openDash, setOpenDash] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleDashToggle() {
    setOpenDash(!openDash);
  }

  return (
    <section
      className={`h-svh ${
        !openDash ? "w-[15%] lg:w-[5%]" : "w-[40%] lg:w-[270px]"
      }  flex flex-col items-center gap-[2rem] py-[1rem] px-[0.5rem] text-[15px] text-black bg-grey-2 absolute z-[99] md:static md:z-[9] md:py-[2rem] md:text-[16px]  transition-all duration-300 ease-in `}
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

        <PanelRightOpen className="cursor-pointer" onClick={handleDashToggle} />
      </div>

      {openDash && (
        <div
          className={`w-full flex flex-col items-start gap-[1rem] capitalize ${
            !openDash ? "opacity-0" : "opacity-100"
          } transition-opacity delay-100 duration-300 ease-in `}
        >
          {/* New Entry button */}
          <div className="flex items-center gap-[0.5rem] cursor-pointer ">
            <NotebookPen />
            <p>New Entry</p>
          </div>

          {/* Search bar */}
          <div className=" w-full flex items-center gap-[0.5rem] overflow-hidden ">
            <Search className="cursor-pointer" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Entry"
              className="w-[70%] focus:outline-main ps-[0.5rem] py-[0.3rem] md:ps-[1rem]"
            />
          </div>
        </div>
      )}

      {openDash && children}
    </section>
  );
}

function DashboardNavContainer() {
  const [openNav, setOpenNav] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);

  function handleNavToggle() {
    setOpenNav(!openNav);
  }

  function handleProfileToggleNav() {
    setOpenProfile(!openProfile);
  }

  return (
    <section className="justify-self-end flex flex-col gap-[2rem] pt-[1rem] px-[1rem]">
      <div className=" self-end flex items-center gap-[1rem] md:gap-[2rem] ">
        {!openNav && (
          <Ellipsis className="cursor-pointer" onClick={handleNavToggle} />
        )}

        {!openProfile && (
          <ProfileAvatar onProfileToggle={handleProfileToggleNav} />
        )}
      </div>

      {openNav && <SubNav onToggle={handleNavToggle} />}

      {openProfile && (
        <UserProfileNav onProfileToggle={handleProfileToggleNav} />
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

function SubNav({ onToggle }: SubNavProps) {
  return (
    <div className="w-[225px] h-[150px] flex flex-col items-start gap-[1rem] bg-grey-2 p-[1rem] rounded-[1rem] shadow-xl/30 shadow-black">
      <div className="w-[16px] h-[16px] mb-[1rem]">
        <X className="cursor-pointer" onClick={onToggle} />
      </div>

      <div className="flex items-center gap-[0.7rem] text-black cursor-pointer">
        <ArchiveRestore />
        <p>Archive</p>
      </div>

      <div className="flex items-center gap-[0.7rem] text-red cursor-pointer">
        <Trash2 />
        <p>Delete</p>
      </div>
    </div>
  );
}

function UserProfileNav({ onProfileToggle }: UserProfileNavProps) {
  return (
    <div className=" w-[225px] h-[163px] flex flex-col items-start gap-[1rem] bg-grey-2 p-[1rem] rounded-[1rem] shadow-xl/30 shadow-black ">
      <div className="flex items-center gap-[0.6rem]">
        <span onClick={onProfileToggle}>
          <ProfileAvatar />
        </span>

        {/* placeholder for user name */}
        <p className=" Font-[600] text-[16px]">User</p>
      </div>

      <div className="flex items-center gap-[0.6rem]">
        <Settings />
        <a href="#" className="cursor-pointer hover:text-text-black">
          Settings
        </a>
      </div>

      <div className="flex items-center gap-[0.6rem]">
        <LogOut />
        <a href="#" className="cursor-pointer hover:text-text-black">
          Log Out
        </a>
      </div>
    </div>
  );
}
