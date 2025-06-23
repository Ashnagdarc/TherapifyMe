import React from 'react';
import { CheckCircle, Zap, MessageCircle, Cpu } from 'lucide-react';

const FeatureCard = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-lg shadow-gray-200/50 text-center">
        <div className="flex justify-center items-center mb-5">
            <div className="bg-blue-100/70 p-3 rounded-full">
                {React.cloneElement(icon as React.ReactElement, { className: 'h-7 w-7 text-blue-600', strokeWidth: 1.5 })}
            </div>
        </div>
        <h3 className="font-semibold text-gray-800 h-12 flex items-center justify-center">{title}</h3>
    </div>
);

const features = [
    {
        icon: <CheckCircle />,
        title: 'Encrypted journaling & secure emotional data'
    },
    {
        icon: <Zap />,
        title: 'Built with ElevenLabs, Tavus & Bolt.new'
    },
    {
        icon: <MessageCircle />,
        title: 'Voice-led, not form-led'
    },
    {
        icon: <Cpu />,
        title: 'Minimal by design, human in tone'
    }
];

export const WhyDifferent = () => {
    return (
        <section id="why-different" className="py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why it's different</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} icon={feature.icon} title={feature.title} />
                    ))}
                </div>
            </div>
        </section>
    );
}; 