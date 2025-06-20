import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Mic, Heart, BookOpen, Video, Zap } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      {/* Header */}
      <header className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primery">TherapifyMe</h1>
            {/* Bolt.new Badge */}
            <div className="flex items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <Zap className="h-4 w-4 mr-1 animate-pulse" />
              <span>Built with Bolt.new</span>
            </div>
          </div>
          <div className="space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/auth')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-main to-purple-600 rounded-full mx-auto flex items-center justify-center">
                <Mic className="h-12 w-12 text-white" />
              </div>
            </div>

            <h1 className="text-4xl font-bold text-primery sm:text-5xl md:text-6xl">
              Your AI Voice
              <span className="block text-main">Mental Wellness</span>
              <span className="block">Companion</span>
            </h1>

            <p className="mt-6 max-w-2xl mx-auto text-xl text-text-black">
              Check in with your emotions through voice. Get personalized AI responses
              and track your mental wellness journey with compassionate support.
            </p>

            <div className="mt-10">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-4"
              >
                Start Your Check-In
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white p-8 rounded-2xl shadow-xs border border-grey hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 bg-main bg-opacity-10 rounded-lg flex items-center justify-center mb-6">
                <Mic className="h-6 w-6 text-main" />
              </div>
              <h3 className="text-xl font-semibold text-primery mb-4">Voice Check-Ins</h3>
              <p className="text-text-black">
                Simply speak how you're feeling. Our AI listens with compassion and
                responds with personalized, calming voice messages.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xs border border-grey hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 bg-teal-500 bg-opacity-10 rounded-lg flex items-center justify-center mb-6">
                <BookOpen className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-primery mb-4">Digital Journal</h3>
              <p className="text-text-black">
                Automatically log your sessions. Track your emotional patterns and
                see your wellness journey unfold over time.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xs border border-grey hover:shadow-sm transition-shadow">
              <div className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center mb-6">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-primery mb-4">Weekly Therapy</h3>
              <p className="text-text-black">
                Receive personalized AI therapy videos weekly, providing continuous
                support and guidance for your mental wellness.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 bg-gradient-to-r from-main to-purple-600 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to prioritize your mental wellness?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands who are already using TherapifyMe to check in with
              their emotions and build healthier mental habits.
            </p>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-4 bg-white text-main hover:bg-grey-2"
            >
              Start Your Journey
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 bg-white border-t border-grey">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-primery mb-4">TherapifyMe</h3>
            <p className="text-text-black mb-8">
              AI-powered mental wellness companion for students, creators, and anyone
              prioritizing their mental health.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-grey">
              <a href="#" className="hover:text-text-black transition-colors">About</a>
              <a href="#" className="hover:text-text-black transition-colors">Privacy</a>
              <a href="#" className="hover:text-text-black transition-colors">Terms</a>
              <a href="#" className="hover:text-text-black transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}