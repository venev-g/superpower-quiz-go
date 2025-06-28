
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-8 px-4 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4 animate-bounce">🧠✨</div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
          Unlock Your Superpower Personality in 10 Mins
        </h1>
        <p className="text-lg text-gray-600 font-medium">
          Discover your leadership style. Let's begin.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 w-full max-w-sm">
        <Card className="p-4 bg-gradient-to-r from-blue-100 to-blue-50 border-blue-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h3 className="font-semibold text-blue-800">Quick & Fun</h3>
              <p className="text-sm text-blue-600">Just 10 questions, 10 minutes</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-r from-purple-100 to-purple-50 border-purple-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="font-semibold text-purple-800">Personalized</h3>
              <p className="text-sm text-purple-600">Tailored to your thinking style</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-r from-pink-100 to-pink-50 border-pink-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h3 className="font-semibold text-pink-800">Empowering</h3>
              <p className="text-sm text-pink-600">Unlock your potential</p>
            </div>
          </div>
        </Card>
      </div>

      {/* CTA Button */}
      <Button 
        onClick={onStart}
        size="lg"
        className="w-full max-w-sm h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      >
        Start Quiz 🚀
      </Button>
    </div>
  );
};

export default WelcomeScreen;
