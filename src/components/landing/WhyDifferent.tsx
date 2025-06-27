import React, { ReactNode, ReactElement } from "react";
import { WandSparkles, Zap, AudioLines, Cpu } from "lucide-react";

import FadeInOnScroll from "../ui/FadeIn";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
}

const features = [
  {
    icon: <WandSparkles />,
    title: "Encrypted journaling & secure emotional data",
  },
  {
    icon: <Zap />,
    title: "Built with ElevenLabs, Tavus & Bolt.new",
  },
  {
    icon: <AudioLines />,
    title: "Voice-led, not form-led",
  },
  {
    icon: <Cpu />,
    title: "Minimal by design, human in tone",
  },
];

export default function WhyDifferent() {
  return (
    <div className="py-24 bg-gradient-to-b from-white via-gray-25 to-gray-50">
      <FadeInOnScroll id="why-different" className="w-full">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-slate-800 mb-4">
              Why it's different
            </h2>
          </div>
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                />
              ))}
            </div>
          </div>
        </div>
      </FadeInOnScroll>
    </div>
  );
}

function FeatureCard({ icon, title }: FeatureCardProps) {
  return (
    <div className="group relative">
      {/* Card with gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Main card content */}
      <div className="relative bg-white rounded-2xl p-6 shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 min-h-[200px] flex flex-col justify-center items-center text-center">
        <div className="mb-6">
          <div className="h-14 w-14 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            {React.cloneElement(icon as ReactElement, {
              className: "h-7 w-7 text-white",
              strokeWidth: 2,
            })}
          </div>
        </div>

        <p className="text-slate-700 text-sm md:text-base font-medium leading-relaxed max-w-[200px]">
          {title}
        </p>
      </div>
    </div>
  );
}
