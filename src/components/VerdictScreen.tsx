
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface VerdictScreenProps {
  answers: number[];
  onRestart: () => void;
}

// Mock personality types based on answer patterns
const personalityTypes = [
  {
    title: "The Analytical Strategist",
    description: "You excel at breaking down complex problems and finding logical solutions. Your systematic approach and attention to detail make you a natural problem-solver.",
    emoji: "🧠",
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "The Visionary Leader",
    description: "You inspire others with your big-picture thinking and innovative ideas. Your ability to see possibilities where others see obstacles sets you apart.",
    emoji: "🚀",
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "The Collaborative Harmonizer",
    description: "You bring people together and create environments where everyone can thrive. Your empathy and communication skills make you a natural team builder.",
    emoji: "🤝",
    color: "from-green-500 to-teal-500"
  },
  {
    title: "The Adaptive Innovator",
    description: "You thrive in changing environments and excel at finding creative solutions. Your flexibility and resourcefulness make you invaluable in dynamic situations.",
    emoji: "⚡",
    color: "from-orange-500 to-red-500"
  }
];

const VerdictScreen: React.FC<VerdictScreenProps> = ({ answers, onRestart }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState(personalityTypes[0]);

  useEffect(() => {
    // Simple algorithm to determine personality type based on answers
    const answerSum = answers.reduce((sum, answer) => sum + answer, 0);
    const personalityIndex = answerSum % personalityTypes.length;
    setSelectedPersonality(personalityTypes[personalityIndex]);
    
    // Show confetti animation
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [answers]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-8 p-4 animate-fade-in">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            >
              {['🎉', '✨', '🌟', '💫', '⭐'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="text-6xl animate-bounce">{selectedPersonality.emoji}</div>
        <h1 className="text-2xl font-bold text-gray-800">
          Your Superpower Revealed!
        </h1>
      </div>

      {/* Verdict Card */}
      <Card className="w-full max-w-md p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-3xl space-y-6 animate-scale-in">
        <div className="text-center space-y-4">
          <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${selectedPersonality.color} text-white font-semibold text-sm`}>
            Personality Type
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedPersonality.title}
          </h2>
          
          <p className="text-gray-600 leading-relaxed">
            {selectedPersonality.description}
          </p>
        </div>

        {/* Motivational Quote */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-100">
          <p className="text-purple-700 font-medium text-center italic">
            "Your unique perspective is your greatest asset. Embrace it and watch yourself soar! ✨"
          </p>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-3">
        <Button
          onClick={onRestart}
          className="w-full h-14 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          Take Another Quiz 🔄
        </Button>
        
        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl border-2 border-purple-200 hover:border-purple-300 text-purple-600 hover:text-purple-700 font-semibold transition-all duration-300"
        >
          Share Results 📱
        </Button>
      </div>
    </div>
  );
};

export default VerdictScreen;
