import React from "react";
import Silk from "./Silk";

interface SilkBackgroundProps {
  children: React.ReactNode;
}

export default function SilkBackground({ children }: SilkBackgroundProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Silk
          speed={5}
          scale={1}
          color="#7B7481"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
