
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6 px-4 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <div className="text-5xl mb-3 animate-bounce">🧠✨</div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
          Unlock Your Superpower Personality
        </h1>
        <p className="text-base text-gray-600 font-medium">
          Discover your leadership style in 10 questions
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-3 w-full max-w-sm">
        <Card className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="font-semibold text-blue-800 text-sm">Quick & Fun</h3>
              <p className="text-xs text-blue-600">Just 10 questions, 5 minutes</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🎯</span>
            <div>
              <h3 className="font-semibold text-purple-800 text-sm">AI-Powered</h3>
              <p className="text-xs text-purple-600">Smart personality analysis</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-3 bg-gradient-to-r from-pink-50 to-orange-50 border-pink-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🚀</span>
            <div>
              <h3 className="font-semibold text-pink-800 text-sm">Empowering</h3>
              <p className="text-xs text-pink-600">Unlock your potential</p>
            </div>
          </div>
        </Card>
      </div>

      {/* CTA Button */}
      <Button 
        onClick={onStart}
        size="lg"
        className="w-full max-w-sm h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      >
        Start Quiz 🚀
      </Button>
    </div>
  );
};

export default WelcomeScreen;
