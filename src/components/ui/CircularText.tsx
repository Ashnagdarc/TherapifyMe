import React from 'react';

interface CircularTextProps {
    text: string;
    radius?: number;
    fontSize?: number;
    className?: string;
}

export default function CircularText({
    text = "built using bolt.new",
    radius = 80,
    fontSize = 14,
    className = ""
}: CircularTextProps) {
    // Split text into individual characters
    const characters = text.split('');

    // Calculate the angle between each character
    const angleStep = 360 / characters.length;

    return (
        <div className={`relative ${className}`} style={{ width: radius * 2, height: radius * 2 }}>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                {characters.map((char, index) => {
                    const angle = index * angleStep;
                    const radian = (angle * Math.PI) / 180;

                    // Calculate position for each character
                    const x = Math.cos(radian - Math.PI / 2) * radius + radius;
                    const y = Math.sin(radian - Math.PI / 2) * radius + radius;

                    return (
                        <span
                            key={index}
                            className="absolute font-bold tracking-widest select-none"
                            style={{
                                left: x,
                                top: y,
                                fontSize: `${fontSize}px`,
                                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                                transformOrigin: 'center',
                                color: '#1e293b',
                                fontWeight: '900',
                                animationDelay: `${index * 0.1}s`,
                            }}
                        >
                            {char === ' ' ? '\u00A0' : char}
                        </span>
                    );
                })}
            </div>
        </div>
    );
} 