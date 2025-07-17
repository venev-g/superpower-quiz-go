
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import WelcomeScreen from '../components/WelcomeScreen';
import QuizScreen from '../components/QuizScreen';
import VerdictScreen from '../components/VerdictScreen';
import PartVerdictScreen from '../components/PartVerdictScreen';
import StandaloneQuizContainer from '../components/StandaloneQuizContainer';

export type AppState = 'welcome' | 'quiz' | 'verdict' | 'part-verdict' | 'standalone';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState<AppState>('welcome');
  const [quizProgress, setQuizProgress] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPart, setCurrentPart] = useState<number>(1);
  const [quizKey, setQuizKey] = useState(0); // Key to force re-render without losing state

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleStartQuiz = () => {
    setCurrentScreen('quiz');
  };

  const handleStartStandalone = () => {
    setCurrentScreen('standalone');
  };

  const handleQuizComplete = (finalAnswers: number[], quizSessionId: string | null) => {
    setAnswers(finalAnswers);
    setSessionId(quizSessionId);
    setCurrentScreen('verdict');
  };

  const handlePartComplete = (part: number, finalAnswers: number[], quizSessionId: string | null) => {
    console.log('Part completion:', { part, answersCount: finalAnswers.length, sessionId: quizSessionId, currentProgress: quizProgress });
    setAnswers(finalAnswers);
    setSessionId(quizSessionId);
    setCurrentPart(part);
    setCurrentScreen('part-verdict');
  };

  const handlePartContinue = useCallback(() => {
    console.log('Part continue - returning to quiz with progress:', quizProgress, 'sessionId:', sessionId);
    // Don't reset the quiz state, just switch screens to continue from current progress
    setCurrentScreen('quiz');
  }, [quizProgress, sessionId]);

  const handleRestartQuiz = () => {
    setCurrentScreen('welcome');
    setQuizProgress(0);
    setAnswers([]);
    setSessionId(null);
    setCurrentPart(1);
    // Force a complete reset by changing the key when actually restarting
    setQuizKey(prev => prev + 1);
  };

  const handleBackToWelcome = () => {
    setCurrentScreen('welcome');
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
      
      <div className="container mx-auto px-4 py-4 max-w-full sm:max-w-md lg:max-w-6xl">
        {currentScreen === 'welcome' && (
          <WelcomeScreen 
            onStart={handleStartQuiz} 
            onStartStandalone={handleStartStandalone}
          />
        )}
        
        {currentScreen === 'standalone' && (
          <StandaloneQuizContainer />
        )}
        
        {currentScreen === 'quiz' && (
          <QuizScreen 
            key={`quiz-${quizKey}`} // Use key to force remount only on true restart
            onComplete={handleQuizComplete}
            onPartComplete={handlePartComplete}
            progress={quizProgress}
            onProgressUpdate={setQuizProgress}
            existingSessionId={sessionId} // Pass the session ID to prevent creating new one
            existingAnswers={answers} // Pass existing answers to maintain state
          />
        )}
        
        {currentScreen === 'part-verdict' && (
          <PartVerdictScreen
            part={currentPart}
            sessionId={sessionId}
            userId={user?.id || null}
            onContinue={handlePartContinue}
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
