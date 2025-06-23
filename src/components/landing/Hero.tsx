import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Zap } from 'lucide-react';

// Placeholder for assets
const userAvatar1 = '/avatars/avatar1.png';
const userAvatar2 = '/avatars/avatar2.png';
const userAvatar3 = '/avatars/avatar3.png';
const heroImageUrl = '/hero-app-mockup.png';

export const Hero = () => {
    const navigate = useNavigate();

    return (
        <section id="home" className="py-20 md:py-28 bg-white dotted-background">
            <div className="container mx-auto px-6 text-center">
                <div className="flex items-center justify-center space-x-3 mb-6">
                    {/* Decorative Toggle Switch */}
                    <div className="w-14 h-8 flex items-center bg-gray-200 rounded-full p-1 cursor-pointer">
                        <div className="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform"></div>
                    </div>
                    <span className="text-sm text-gray-600">Join 200+ people enjoying TherapifyMe today</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                    Think clearer. Feel<br />lighter. Speak freely.
                </h1>
                <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
                    TherapifyMe is a browser-based wellness companion that uses voice and
                    empathetic AI for emotional check-ins anytime, anywhere.
                </p>
                <Button onClick={() => navigate('/auth')} variant="primary" size="lg" className="mt-10">
                    <Zap className="w-5 h-5 mr-2" />
                    Get Started
                </Button>
                <div className="mt-20 px-8 flex justify-center">
                    <img
                        src="/Frame 26.png"
                        alt="TherapifyMe app interface showing a conversation with the AI assistant"
                        className="max-w-3xl w-full h-auto"
                    />
                </div>
            </div>
        </section>
    );
}; 