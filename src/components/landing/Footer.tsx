import React from 'react';
import { Facebook, Twitter, Linkedin } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="py-12 bg-white border-t border-gray-200">
            <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
                <div className="flex items-center space-x-2 mb-4 md:mb-0">
                    {/* Placeholder for logo */}
                    <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
                    <span className="text-xl font-bold text-gray-900">TherapifyMe</span>
                </div>
                <span className="text-gray-500 text-sm mb-4 md:mb-0">
                    &copy; 2025 TherapifyMe. All rights reserved.
                </span>
                <div className="flex space-x-4">
                    <a href="#" className="text-gray-400 hover:text-blue-600 transition"><Facebook /></a>
                    <a href="#" className="text-gray-400 hover:text-blue-600 transition"><Linkedin /></a>
                    <a href="#" className="text-gray-400 hover:text-blue-600 transition"><Twitter /></a>
                </div>
            </div>
        </footer>
    );
}; 