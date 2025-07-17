import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { QuizType } from './QuizSelectionScreen';
import { StandaloneQuizService, StandaloneQuizQuestion } from '@/lib/services/StandaloneQuizService';

interface StandaloneQuizScreenProps {
  quizType: QuizType;
  onComplete: (sessionId: string) => void;
  onBack: () => void;
  forceNewSession?: boolean;
}

const StandaloneQuizScreen: React.FC<StandaloneQuizScreenProps> = ({ 
  quizType, 
  onComplete, 
  onBack,
  forceNewSession = false 
}) => {
  const [questions, setQuestions] = useState<StandaloneQuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadQuestions = useCallback(async () => {
    if (!user || sessionInitialized) return;
    
    try {
      setLoading(true);
      const questionsData = await StandaloneQuizService.loadQuestionsByCategory(quizType.categoryId);
      setQuestions(questionsData);
      
      // Find or create session
      const sessionData = forceNewSession 
        ? await StandaloneQuizService.createNewQuizSession(
            user.id,
            quizType.id,
            quizType.categoryId,
            questionsData.length
          )
        : await StandaloneQuizService.findOrCreateQuizSession(
            user.id,
            quizType.id,
            quizType.categoryId,
            questionsData.length
          );
      
      setSessionId(sessionData.sessionId);
      setCurrentQuestion(Math.max(0, sessionData.currentQuestion - 1));
      setAnswers(sessionData.existingAnswers);
      setSessionInitialized(true);
      
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, quizType, toast, forceNewSession, sessionInitialized]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Reset session initialization when forceNewSession changes
  useEffect(() => {
    if (forceNewSession) {
      setSessionInitialized(false);
    }
  }, [forceNewSession]);

  const handleAnswerSelect = async (answerIndex: number) => {
    if (!sessionId || !user) return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
    
    try {
      // Update session in database
      await StandaloneQuizService.updateQuizSession(
        sessionId,
        currentQuestion + 2, // Next question (1-based)
        newAnswers
      );
      
      // Check if this is the last question
      if (currentQuestion + 1 === questions.length) {
        setSubmitting(true);
        
        // Complete the quiz
        await StandaloneQuizService.completeQuizSession(
          sessionId,
          newAnswers,
          quizType.id
        );
        
        onComplete(sessionId);
      } else {
        // Move to next question
        setCurrentQuestion(currentQuestion + 1);
      }
    } catch (error) {
      console.error('Error handling answer:', error);
      toast({
        title: "Error",
        description: "Failed to save answer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1 && answers[currentQuestion] !== undefined) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">{quizType.emoji}</div>
          <p className="text-gray-600">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Please log in to take the quiz.</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-600">No questions available for this quiz.</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  const currentQuestionData = questions[currentQuestion];
  const progressPercentage = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-800">
                {quizType.title}
              </h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>
            
            <div className="w-20"> {/* Spacer */}</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`bg-gradient-to-r ${quizType.gradient} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <Card className="w-full max-w-2xl p-8 bg-white shadow-xl rounded-2xl">
          <div className="space-y-6">
            {/* Question */}
            <div className="text-center space-y-3">
              <div className="text-4xl mb-4">{quizType.emoji}</div>
              <h2 className="text-xl font-semibold text-gray-800">
                {currentQuestionData.title}
              </h2>
              {currentQuestionData.subtitle && (
                <p className="text-gray-600">
                  {currentQuestionData.subtitle}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestionData.options.map((option, index) => (
                <Button
                  key={index}
                  variant={answers[currentQuestion] === index ? "default" : "outline"}
                  className={`w-full p-4 text-left justify-start h-auto whitespace-normal ${
                    answers[currentQuestion] === index
                      ? `bg-gradient-to-r ${quizType.gradient} text-white`
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={submitting}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                      answers[currentQuestion] === index
                        ? 'border-white bg-white/20 text-white'
                        : 'border-gray-300 text-gray-500'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                  </div>
                </Button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
              
              <div className="text-sm text-gray-500">
                {currentQuestion + 1} / {questions.length}
              </div>
              
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentQuestion === questions.length - 1 || answers[currentQuestion] === undefined}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StandaloneQuizScreen;
