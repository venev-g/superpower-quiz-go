
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import WelcomeScreen from '../components/WelcomeScreen';
import QuizScreen from '../components/QuizScreen';
import VerdictScreen from '../components/VerdictScreen';

export type AppState = 'welcome' | 'quiz' | 'verdict';

const Index = () => {
  const { user, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AppState>('welcome');
  const [quizProgress, setQuizProgress] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth';
    }
  }, [user, loading]);

  const handleStartQuiz = () => {
    setCurrentScreen('quiz');
  };

  const handleQuizComplete = (finalAnswers: number[], quizSessionId: string | null) => {
    setAnswers(finalAnswers);
    setSessionId(quizSessionId);
    setCurrentScreen('verdict');
  };

  const handleRestartQuiz = () => {
    setCurrentScreen('welcome');
    setQuizProgress(0);
    setAnswers([]);
    setSessionId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">🧠</div>
          <p className="text-gray-600">Loading your quiz experience...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-4 max-w-md">
        {currentScreen === 'welcome' && (
          <WelcomeScreen onStart={handleStartQuiz} />
        )}
        
        {currentScreen === 'quiz' && (
          <QuizScreen 
            onComplete={handleQuizComplete}
            progress={quizProgress}
            onProgressUpdate={setQuizProgress}
          />
        )}
        
        {currentScreen === 'verdict' && (
          <VerdictScreen 
            answers={answers}
            sessionId={sessionId}
            onRestart={handleRestartQuiz}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
