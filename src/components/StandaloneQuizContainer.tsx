import React, { useState } from 'react';
import QuizSelectionScreen, { QuizType } from './QuizSelectionScreen';
import StandaloneQuizScreen from './StandaloneQuizScreen';
import StandaloneVerdictScreen from './StandaloneVerdictScreen';

type QuizFlow = 'selection' | 'quiz' | 'verdict';

const StandaloneQuizContainer: React.FC = () => {
  const [currentFlow, setCurrentFlow] = useState<QuizFlow>('selection');
  const [selectedQuizType, setSelectedQuizType] = useState<QuizType | null>(null);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [isRestart, setIsRestart] = useState(false);

  const handleQuizSelect = (quizType: QuizType) => {
    setSelectedQuizType(quizType);
    setIsRestart(false);
    setCurrentFlow('quiz');
  };

  const handleQuizComplete = (sessionId: string) => {
    setCompletedSessionId(sessionId);
    setIsRestart(false);
    setCurrentFlow('verdict');
  };

  const handleBackToSelection = () => {
    setCurrentFlow('selection');
    setSelectedQuizType(null);
    setCompletedSessionId(null);
  };

  const handleBackToQuiz = () => {
    setCurrentFlow('quiz');
    setCompletedSessionId(null);
  };

  const handleRestart = () => {
    setIsRestart(true);
    setCurrentFlow('quiz');
    setCompletedSessionId(null);
  };

  if (currentFlow === 'selection') {
    return <QuizSelectionScreen onQuizSelect={handleQuizSelect} />;
  }

  if (currentFlow === 'quiz' && selectedQuizType) {
    return (
      <StandaloneQuizScreen
        quizType={selectedQuizType}
        onComplete={handleQuizComplete}
        onBack={handleBackToSelection}
        forceNewSession={isRestart}
      />
    );
  }

  if (currentFlow === 'verdict' && selectedQuizType && completedSessionId) {
    return (
      <StandaloneVerdictScreen
        quizType={selectedQuizType}
        sessionId={completedSessionId}
        onBack={handleBackToQuiz}
        onRestart={handleRestart}
      />
    );
  }

  // Fallback to selection screen
  return <QuizSelectionScreen onQuizSelect={handleQuizSelect} />;
};

export default StandaloneQuizContainer;
