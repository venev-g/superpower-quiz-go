import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface QuizType {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  gradient: string;
  categoryId: string;
  estimatedTime: string;
}

interface QuizSelectionScreenProps {
  onQuizSelect: (quizType: QuizType) => void;
}

const QuizSelectionScreen: React.FC<QuizSelectionScreenProps> = ({ onQuizSelect }) => {
  const quizTypes: QuizType[] = [
    {
      id: 'multi-intelligence',
      title: "What's Your Hidden Superpower?",
      description: 'Discover your dominant intelligence type and unlock your natural talents',
      emoji: '🧠',
      color: '#ff0000',
      gradient: 'from-red-500 to-pink-500',
      categoryId: 'd37936ca-a151-4b1c-94db-496948513ab7',
      estimatedTime: '5-8 min'
    },
    {
      id: 'personality-type',
      title: 'Who Are You Really?',
      description: 'Uncover your personality patterns and understand your unique traits',
      emoji: '🎭',
      color: '#05c289',
      gradient: 'from-green-500 to-emerald-500',
      categoryId: '42e636ee-0b79-450a-966a-830056fb9875',
      estimatedTime: '6-10 min'
    },
    {
      id: 'learning-style',
      title: 'Crack Your Style for Laser Focus!',
      description: 'Find your optimal learning approach with VARK assessment',
      emoji: '🎯',
      color: '#a23bf7',
      gradient: 'from-purple-500 to-violet-500',
      categoryId: '3a1e7454-01e4-4a7b-bde2-c52c242d1d7d',
      estimatedTime: '4-6 min'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-8 px-4 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4 animate-bounce">🚀</div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
          Choose Your Journey
        </h1>
        <p className="text-lg text-gray-600 font-medium max-w-2xl mx-auto">
          Select a quiz to discover different aspects of your personality and abilities
        </p>
      </div>

      {/* Quiz Selection Cards */}
      <div className="grid gap-6 w-full max-w-4xl">
        {quizTypes.map((quiz) => (
          <Card 
            key={quiz.id}
            className="p-6 bg-white hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-100 hover:border-gray-200 rounded-2xl cursor-pointer"
            onClick={() => onQuizSelect(quiz)}
          >
            <div className="flex items-center space-x-6">
              {/* Quiz Icon */}
              <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${quiz.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                {quiz.emoji}
              </div>
              
              {/* Quiz Details */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">
                    {quiz.title}
                  </h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {quiz.estimatedTime}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {quiz.description}
                </p>
              </div>
              
              {/* Action Button */}
              <div className="flex-shrink-0">
                <Button 
                  className={`bg-gradient-to-r ${quiz.gradient} hover:opacity-90 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300`}
                >
                  Start Quiz
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Section */}
      <div className="text-center space-y-4 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <div className="text-xl mb-2">⚡</div>
            <h4 className="font-semibold text-blue-800 text-sm">Quick Results</h4>
            <p className="text-xs text-blue-600">Get instant insights</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
            <div className="text-xl mb-2">🎯</div>
            <h4 className="font-semibold text-purple-800 text-sm">AI-Powered</h4>
            <p className="text-xs text-purple-600">Advanced analysis</p>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <div className="text-xl mb-2">📊</div>
            <h4 className="font-semibold text-green-800 text-sm">Detailed Reports</h4>
            <p className="text-xs text-green-600">Comprehensive insights</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSelectionScreen;
