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
    <FadeInOnScroll id="why-different" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-3xl tracking-[-0.89px] md:text-[80.59px] md:leading-[57.92px] font-[700] text-text-blue-900">
            Why it's different
          </p>
        </div>
        <div className="grid justify-center gap-[2rem] md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
            />
          ))}
        </div>
      </div>
    </FadeInOnScroll>
  );
}

function FeatureCard({ icon, title }: FeatureCardProps) {
  return (
    <div className=" px-[1px] pb-[1px] rounded-2xl bg-[linear-gradient(to_bottom,_#ffffff,_#0093e5)] shadow-lg/40 shadow-dark">
      <div className="w-[270px] h-[206px] flex flex-col items-start justify-center gap-[2rem] p-6 text-left bg-white rounded-2xl ">
        <div className="flex justify-center items-center">
          <div className=" h-[50px] w-[50px] flex items-center justify-center bg-main backdrop-blur-md rounded-[9px]  ">
            {React.cloneElement(icon as ReactElement, {
              className: "h-7 w-7 text-white",
              strokeWidth: 1.5,
            })}
          </div>
        </div>

        <p className="font-[400] text-text-blue text-[16px] h-12 flex items-center justify-center md:text-[20px]">
          {title}
        </p>
      </div>
    </div>
  );
}
