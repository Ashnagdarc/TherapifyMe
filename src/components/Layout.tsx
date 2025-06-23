import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { LayoutDashboard, BookOpen, Settings, LogOut, Menu, X } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navLinks = [
    { to: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, text: 'Dashboard' },
    { to: '/journal', icon: <BookOpen className="w-5 h-5" />, text: 'Journal' },
    { to: '/settings', icon: <Settings className="w-5 h-5" />, text: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="sticky top-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              {/* <img src="/therapifyme-logo.svg" alt="TherapifyMe Logo" className="h-8 w-8" /> */}
              <span className="text-xl font-bold text-gray-900">TherapifyMe</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex md:space-x-4">
              {navLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  {link.icon}
                  <span className="ml-2">{link.text}</span>
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <Button onClick={handleSignOut} variant="secondary" size="sm" className="hidden md:flex">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <div className="md:hidden">
                <Button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} variant="ghost" size="sm">
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                {link.icon}
                <span className="ml-3">{link.text}</span>
              </NavLink>
            ))}
            <div className="border-t border-gray-200 my-2"></div>
            <Button onClick={handleSignOut} variant="ghost" size="sm" className="w-full flex justify-start items-center px-3 py-2">
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        )}
      </header>
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}