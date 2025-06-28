
import React, { useState } from 'react';
import WelcomeScreen from '../components/WelcomeScreen';
import QuizScreen from '../components/QuizScreen';
import VerdictScreen from '../components/VerdictScreen';

export type AppState = 'welcome' | 'quiz' | 'verdict';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>('welcome');
  const [quizProgress, setQuizProgress] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const handleStartQuiz = () => {
    setCurrentScreen('quiz');
  };

  const handleQuizComplete = (finalAnswers: number[]) => {
    setAnswers(finalAnswers);
    setCurrentScreen('verdict');
  };

  const handleRestartQuiz = () => {
    setCurrentScreen('welcome');
    setQuizProgress(0);
    setAnswers([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-md">
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
            onRestart={handleRestartQuiz}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
