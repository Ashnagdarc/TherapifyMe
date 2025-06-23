import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Zap } from 'lucide-react'; // Or any other icon you prefer

export const Header = () => {
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    {/* Placeholder for logo */}
                    <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
                    <span className="text-2xl font-bold text-gray-900">TherapifyMe</span>
                </div>
                <nav className="hidden md:flex items-center space-x-8">
                    <a href="#home" className="text-gray-600 hover:text-blue-600 transition">Home</a>
                    <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition">How it works</a>
                    <a href="#why-different" className="text-gray-600 hover:text-blue-600 transition">Why it's different</a>
                </nav>
                <Button
                    onClick={() => navigate('/auth')}
                    variant="primary"
                    className="hidden md:flex bg-gray-900 hover:bg-gray-800"
                >
                    <Zap className="w-4 h-4 mr-2" />
                    Get Started
                </Button>
            </div>
        </header>
    );
}; 