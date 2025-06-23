import React from 'react';
import { UserPlus, Mic, MessageSquare, BarChart, Video } from 'lucide-react';

const StepCard = ({ number, title, description, icon, align, top, left }: {
    number: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    align: 'left' | 'right';
    top: string;
    left: string;
}) => {
    return (
        <div
            className="absolute p-6 bg-white rounded-2xl shadow-xl border border-gray-200/80 w-80"
            style={{ top, left }}
        >
            <div className={`flex ${align === 'left' ? 'flex-row' : 'flex-row-reverse'} items-start gap-4`}>
                <span className="text-3xl font-bold text-gray-200">{number}</span>
                <div className={align === 'left' ? 'text-left' : 'text-right'}>
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <p className="text-gray-500 mt-1">{description}</p>
                </div>
            </div>
            <div className={`absolute -${align === 'left' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md`}>
                {icon}
            </div>
        </div>
    );
};

export const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-24 bg-white dotted-background">
            <div className="container mx-auto px-6">
                <div className="text-center mb-20">
                    <span className="text-blue-600 font-semibold">Step by step</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">How It Works</h2>
                </div>

                <div className="relative h-[900px]">
                    {/* Background SVG Curve - simplified for positioning */}
                    <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 800 900" preserveAspectRatio="none">
                        <path
                            d="M400 0 C400 150, 650 150, 650 300 S400 450, 400 450 C400 450, 150 450, 150 600 S400 750, 400 900"
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth="2"
                            strokeDasharray="8, 8"
                        />
                    </svg>

                    <StepCard
                        number="01"
                        title="Sign Up in Seconds"
                        description="Just your name and email. Nothing else."
                        icon={<UserPlus className="h-6 w-6 text-gray-500" />}
                        align="left"
                        top="2%"
                        left="15%"
                    />
                    <StepCard
                        number="02"
                        title="Speak How You Feel"
                        description="Record a quick voice note. No pressure, no scripts."
                        icon={<Mic className="h-6 w-6 text-gray-500" />}
                        align="right"
                        top="25%"
                        left="calc(100% - 32rem - 15%)"
                    />
                    <StepCard
                        number="03"
                        title="Calm Voice Response"
                        description="An AI voice replies—thoughtful, affirming, emotionally aware."
                        icon={<MessageSquare className="h-6 w-6 text-gray-500" />}
                        align="left"
                        top="50%"
                        left="15%"
                    />
                    <StepCard
                        number="04"
                        title="Track Your Mood"
                        description="Your sessions are logged privately so you can see your emotional patterns over time."
                        icon={<BarChart className="h-6 w-6 text-gray-500" />}
                        align="right"
                        top="75%"
                        left="calc(100% - 32rem - 15%)"
                    />
                </div>
            </div>
        </section>
    );
}; 