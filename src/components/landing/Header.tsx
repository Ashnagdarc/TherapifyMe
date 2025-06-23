import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { Zap } from "lucide-react"; // Or any other icon you prefer

import Logo from "../../assets/images/Logo.png";

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
  const navigate = useNavigate();

  return (
    <header className="w-full py-4 flex justify-center sticky top-0 z-50">
      <div className="container h-[68px] bg-white mx-auto px-6 flex justify-between items-center rounded-[1rem] shadow-xl/50 shadow-primery/50">
        <div className="flex items-center gap-[0.4rem]">
          <img
            src={Logo}
            alt="TherapifyMe Logo"
            className="w-8 h-8 md:w-[36px] md:h-[36px]"
          />

          <span className="text-2xl font-bold text-gray-900">TherapifyMe</span>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          {navList.map((item) => (
            <a
              href={item.path}
              className="text-gray-60  hover:text-blue-600 transition-all duration-300 ease-in-out"
            >
              {item.title}
            </a>
          ))}
        </nav>

        <Button
          onClick={() => navigate("/auth")}
          variant="primary"
          className="hidden md:flex bg-gray-900 hover:bg-gray-800"
        >
          <Zap className="w-4 h-4 mr-2" />
          Get Started
        </Button>
      </div>
    </header>
  );
}
