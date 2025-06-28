import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Sparkles, Menu, X } from "lucide-react"; // Or any other icon you prefer

import Logo from "../Logo";

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
      className={`w-full ${isOpen &&
        " h-dvh backdrop-blur-3xl transition-all duration-200 ease-in"
        } py-2 flex flex-col items-center gap-[1rem] fixed top-2 z-50 md:flex-row md:justify-center md:gap-0`}
    >
      <div className="w-[90%] max-w-4xl h-[60px] mx-auto px-4 rounded-2xl relative overflow-hidden border border-white/20"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)'
        }}
      >
        <div className="relative z-10 flex justify-between items-center h-full">
          <div className="flex items-center gap-[0.4rem]">
            <Logo />
            <span className="text-[25px] font-bold text-text-blue">
              TherapifyMe
            </span>
          </div>

          {!isOpen ? (
            <Menu className="md:hidden" onClick={handleNavToggle} />
          ) : (
            <X className="md:hidden" onClick={handleNavToggle} />
          )}

          <NavList className="hidden md:flex items-center gap-[2rem]" />

          <CTAButton className="hidden md:flex gap-[0.5rem] bg-gray-900 hover:bg-gray-800" />
        </div>
      </div>

      {isOpen && (
        <div className="w-[80%] h-[35svh] bg-[linear-gradient(to_bottom,_#CCE1FF_0%,_#CCE1FF_30%,_#E0EEFF_100%)] rounded-[1.2rem] relative overflow-hidden md:hidden">
          <div className="relative z-10 flex flex-col items-center justify-between py-[1rem] h-full">
            <NavList className="flex flex-col items-center gap-[1rem]" />
            <CTAButton className="flex items-center gap-[0.5rem] bg-gray-900 hover:bg-gray-800 " />
          </div>
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
          key={item.title}
          href={item.path}
          className=" font-[500] text-[16px] text-text-blue/70 hover:text-text-blue transition-all duration-300 ease-in-out capitalize md:font-[400] md:text-[17.64px] md:tracking-[-0.5px] md:leading-[25.2px]  "
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
      <Sparkles className="w-4 h-4" />
      Get Started
    </Button>
  );
}
