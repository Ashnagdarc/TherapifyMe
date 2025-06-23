import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const DashboardHeader = () => {
    const { user } = useAuth();

    return (
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">
                    Welcome back, {user?.email || 'User'}!
                </h1>
                <p className="text-gray-500">
                    Ready for your daily check-in?
                </p>
            </div>
        </div>
    );
}; 