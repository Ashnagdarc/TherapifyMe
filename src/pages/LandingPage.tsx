import React, { useState } from "react";
import { useNavigate, NavigateFunction } from "react-router-dom";
import { useScreenWidth } from "../hooks/useScreenWidth";

// imported reusable components
import { Button } from "../components/ui/Button";
import { Mic, Heart, BookOpen, Video, Zap, Menu, X } from "lucide-react";

// component prop types
type HeaderProps = {
  navigate: NavigateFunction;
};

type MainProps = {
  navigate: NavigateFunction;
  children: React.ReactNode;
};

type CTASectionProps = {
  navigate: NavigateFunction;
};

export function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center gap-[3rem] font-montserrat bg-gradient-to-br from-purple-50 via-white to-teal-50">
      <Header navigate={navigate} />

      <Main navigate={navigate}>
        <MainCTASection navigate={navigate} />
      </Main>

      <Footer />
    </div>
  );
}

function Header({ navigate }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const screenWidth = useScreenWidth();

  function handleNavToggle() {
    if (screenWidth > 430) return;
    setIsOpen(!isOpen);
  }

  return (
    <header className=" w-full flex items-center py-[1.5rem] px-[0.7rem] bg-grey-2 shadow-xl/40 shadow-grey fixed sm:px-[1.5rem] lg:min-h-[100px] lg:px-[2rem]">
      <div className=" w-full flex items-start justify-between md:items-center">
        <div className="flex flex-col gap-[0.5rem] md:flex-row md:items-center md:gap-[1rem] ">
          <h1 className="text-2xl font-bold text-primery">TherapifyMe</h1>

          {/* Bolt.new Badge */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
            <Zap className="h-4 w-4 animate-pulse" />
            <span>Built with Bolt.new</span>
          </div>
        </div>

        {/* mobile header nav bar */}
        {screenWidth <= 430 ? (
          <div className="flex flex-col items-end gap-[0.7rem] md:flex-row md:items-center md:gap-[1rem]">
            {!isOpen ? (
              <Menu onClick={() => handleNavToggle()} />
            ) : (
              <X onClick={() => handleNavToggle()} />
            )}

            {isOpen && (
              <div className="flex flex-col items-center gap-[0.5rem] p-[1rem] bg-accent shadow-xl/40 shadow-black rounded-[0.7rem] fixed top-[10rem] z-[99] ">
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Sign In
                </Button>

                <Button variant="primary" onClick={() => navigate("/auth")}>
                  Get Started
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-[1rem]">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>

            <Button variant="primary" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

function Main({ navigate, children }: MainProps) {
  return (
    <main className="px-4 mt-[12rem] sm:px-6 lg:px-8">
      <div className="w-full flex flex-col items-center gap-[2rem]">
        <div className=" w-full flex flex-col items-center gap-[2rem] text-center">
          <div className="animate-pulse">
            <div className="w-24 h-24 bg-gradient-to-br from-main to-purple-600 rounded-full mx-auto flex items-center justify-center">
              <Mic className="h-12 w-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-primery sm:text-5xl md:text-6xl">
            Your AI Voice
            <span className="block text-main">Mental Wellness</span>
            <span className="block">Companion</span>
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-text-black">
            Check in with your emotions through voice. Get personalized AI
            responses and track your mental wellness journey with compassionate
            support.
          </p>

          <div className="">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-4"
            >
              Start Your Check-In
            </Button>
          </div>
        </div>

        {/* Features */}
        <MainFeaturesSection />

        {/* CTA Section */}
        {children}
      </div>
    </main>
  );
}

function MainFeaturesSection() {
  return (
    <div className=" grid grid-cols-1 gap-[2rem] mt-[4rem] sm:grid-cols-2 md:grid-cols-3">
      <div className="flex flex-col gap-[1.5rem] bg-white p-8 rounded-2xl shadow-xs border border-grey hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 bg-main/80 bg-opacity-10 rounded-lg flex items-center justify-center">
          <Mic className="h-6 w-6 text-main" />
        </div>
        <h3 className="text-xl font-semibold text-primery">Voice Check-Ins</h3>
        <p className="text-text-black">
          Simply speak how you're feeling. Our AI listens with compassion and
          responds with personalized, calming voice messages.
        </p>
      </div>

      <div className="flex flex-col gap-[1.5rem] bg-white p-8 rounded-2xl shadow-xs border border-grey hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 bg-teal-500 bg-opacity-10 rounded-lg flex items-center justify-center ">
          <BookOpen className="h-6 w-6 text-teal-600" />
        </div>
        <h3 className="text-xl font-semibold text-primery ">Digital Journal</h3>
        <p className="text-text-black">
          Automatically log your sessions. Track your emotional patterns and see
          your wellness journey unfold over time.
        </p>
      </div>

      <div className="flex flex-col gap-[1.5rem] bg-white p-8 rounded-2xl shadow-xs border border-grey hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center">
          <Video className="h-6 w-6 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-primery">Weekly Therapy</h3>
        <p className="text-text-black">
          Receive personalized AI therapy videos weekly, providing continuous
          support and guidance for your mental wellness.
        </p>
      </div>
    </div>
  );
}

function MainCTASection({ navigate }: CTASectionProps) {
  return (
    <div className=" flex flex-col items-center gap-[2rem] mt-[4rem] bg-gradient-to-r from-main to-purple-600 rounded-3xl p-12 text-center">
      <h2 className="text-3xl font-bold text-white ">
        Ready to prioritize your mental wellness?
      </h2>

      <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-[2rem] ">
        Join thousands who are already using TherapifyMe to check in with their
        emotions and build healthier mental habits.
      </p>

      <Button
        variant="secondary"
        size="lg"
        onClick={() => navigate("/auth")}
        className="text-lg px-8 py-4 bg-white text-main hover:bg-grey-2"
      >
        Start Your Journey
      </Button>
    </div>
  );
}

function Footer() {
  const footerNavList = [
    { name: "about", path: "#" },
    { name: "privacy", path: "#" },
    { name: "terms", path: "#" },
    { name: "support", path: "#" },
  ];

  return (
    <footer className="w-full mt-[4rem] bg-white border-t border-grey shadow-reverse-shadow shadow-grey/80 ">
      <div className="w-full flex flex-col items-center gap-[1.5rem] px-4 py-12 sm:px-6 md:py-[2rem] lg:px-8 ">
        <div className="text-center flex flex-col items-center gap-[1rem]">
          <h3 className="text-lg font-semibold text-primery">TherapifyMe</h3>

          <p className="text-text-black mb-[1rem]">
            AI-powered mental wellness companion for students, creators, and
            anyone prioritizing their mental health.
          </p>

          <ul className="flex justify-center gap-[1.5rem] capitalize text-sm text-grey md:gap-[2rem]">
            {footerNavList.map((item) => (
              <li className="hover:text-text-black transition-colors">
                <a href={item.path}>{item.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
