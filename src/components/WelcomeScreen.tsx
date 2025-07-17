
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WelcomeScreenProps {
  onStart: () => void;
  onStartStandalone?: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, onStartStandalone }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6 px-4 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <div className="text-5xl mb-3 animate-bounce">🧠✨</div>
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
          Unlock Your Superpower Personality
        </h1>
        <p className="text-base text-gray-600 font-medium">
          Discover your unique traits and abilities
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-3 w-full max-w-sm">
        <Card className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:shadow-md transition-all duration-300">
          <div className="flex items-center space-x-3">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="font-semibold text-blue-800 text-sm">Quick & Fun</h3>
              <p className="text-xs text-blue-600">Multiple assessment options</p>
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

      {/* Quiz Options */}
      <div className="w-full max-w-sm space-y-3">
        

        {/* Standalone Quizzes Button */}
        {onStartStandalone && (
          <Button 
            onClick={onStartStandalone}
            variant="outline"
            size="lg"
            className="w-full h-12 text-lg font-semibold border-2 border-purple-200 hover:border-purple-300 text-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Individual Tests 🎯
          </Button>
        )}
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center max-w-sm">
        Choose complete assessment for comprehensive results or individual tests for focused insights
      </p>
    </div>
  );
};

export default WelcomeScreen;
