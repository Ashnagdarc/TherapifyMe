import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Zap, Menu, X } from "lucide-react"; // Or any other icon you prefer

import Logo from "../Logo";
import { useState } from "react";

const navList = [
  {
    path: "#home",
    title: "Home",
  },
  {
    path: "#how-it-works",
    title: "How it works",
  },
  {
    path: "#why-different",
    title: "Why it's different",
  },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  function handleNavToggle() {
    setIsOpen(!isOpen);
  }

  return (
    <header
      className={`w-full ${
        isOpen &&
        " h-dvh bg-black/20 backdrop-blur-2xl transition-all duration-200 ease-in"
      } py-4 flex flex-col items-center gap-[2rem] sticky top-0 z-50 md:flex-row md:justify-center md:gap-0`}
    >
      <div className="w-[95%] h-[68px] flex justify-between items-center bg-white mx-auto px-6  rounded-[1rem] shadow-xl/50 shadow-primery/50">
        <div className="flex items-center gap-[0.4rem]">
          <Logo />

          <span className="text-2xl font-bold text-gray-900">TherapifyMe</span>
        </div>

        {!isOpen ? (
          <Menu className="md:hidden" onClick={handleNavToggle} />
        ) : (
          <X className="md:hidden" onClick={handleNavToggle} />
        )}

        <NavList className="hidden md:flex items-center gap-[2rem]" />

        <CTAButton className="hidden md:flex gap-[0.5rem] bg-gray-900 hover:bg-gray-800" />
      </div>

      {isOpen && (
        <div className="w-[80%] h-[35svh] flex flex-col items-center justify-between py-[1rem] bg-white rounded-[0.6rem] shadow-xl/50 shadow-black/70 md:hidden">
          <NavList className="flex flex-col items-center gap-[1rem]" />

          <CTAButton className="flex items-center gap-[0.5rem] bg-gray-900 hover:bg-gray-800 " />
        </div>
      )}
    </header>
  );
}

function NavList({ className = "" }) {
  return (
    <nav className={className}>
      {navList.map((item) => (
        <a
          href={item.path}
          className=" font-[600]  text-[16px] text-gray-60 hover:text-blue-600 transition-all duration-300 ease-in-out capitalize md:font-[300] md:text-[18px]  "
        >
          {item.title}
        </a>
      ))}
    </nav>
  );
}

function CTAButton({ className = "" }) {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate("/auth")}
      variant="primary"
      className={className}
    >
      <Zap className="w-4 h-4" />
      Get Started
    </Button>
  );
}
