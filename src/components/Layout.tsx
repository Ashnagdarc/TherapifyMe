import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Home, BookOpen, Settings, LogOut, Mic } from 'lucide-react';

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Check-In', href: '/check-in', icon: Mic },
    { name: 'Journal', href: '/journal', icon: BookOpen },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  if (!user) {
    return <Outlet />;
  }

  // For dashboard, render it directly without layout wrapper
  if (location.pathname === '/dashboard') {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-xs border-b border-grey">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primery">TherapifyMe</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 bg-white shadow-xs">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-2xl font-bold text-primery">TherapifyMe</h1>
            </div>
            <div className="mt-8 flex-grow flex flex-col">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <button
                      key={item.name}
                      onClick={() => navigate(item.href)}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-colors ${isActive
                        ? 'bg-main text-white'
                        : 'text-text-black hover:bg-grey-2'
                        }`}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-grey'
                          }`}
                      />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
              <div className="px-2 pb-4">
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-hidden">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-grey">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`flex flex-col items-center py-2 px-1 text-xs font-medium rounded-md transition-colors ${isActive
                  ? 'text-main bg-blue-50'
                  : 'text-grey hover:text-text-black'
                  }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                {item.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}