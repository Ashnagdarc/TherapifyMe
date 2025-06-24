import { Facebook, Twitter, Linkedin } from "lucide-react";

import Logo from "../Logo";

const socialIcons = [
  { icon: <Facebook /> },
  { icon: <Linkedin /> },
  { icon: <Twitter /> },
];

export default function Footer() {
  return (
    <footer className="py-12 bg-white border-t border-gray-200">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <Logo />

          <span className="font-[700] text-[20px] text-text-blue md:text-[25.22px]">
            TherapifyMe
          </span>
        </div>

        <span className="text-dark text-[12.26px] mb-4 md:mb-0">
          &copy; 2025 TherapifyMe. All rights reserved.
        </span>

        <div className="flex items-center gap-[1.3rem]">
          {socialIcons.map((icon, i) => (
            <a
              href="#"
              className="text-dark hover:text-main transition-color duration-300 ease-in"
            >
              {icon.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
