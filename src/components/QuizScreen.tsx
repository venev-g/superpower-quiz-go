import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import QuestionCard from './QuestionCard';
import ProgressTracker from './ProgressTracker';
import MotivationPopup from './MotivationPopup';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

interface QuizScreenProps {
  onComplete: (answers: number[]) => void;
  progress: number;
  onProgressUpdate: (progress: number) => void;
}

type Question = Database['public']['Tables']['questions']['Row'];

interface QuestionForQuiz {
  id: string;
  title: string;
  subtitle: string;
  options: string[];
  sequence_order: number;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ onComplete, progress, onProgressUpdate }) => {
  const [questions, setQuestions] = useState<QuestionForQuiz[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showMotivation, setShowMotivation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const loadQuestions = useCallback(async () => {
    try {
      if (!user) {
        console.log('No authenticated user, skipping question load');
        return;
      }

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .order('sequence_order', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our QuestionForQuiz interface
      const transformedQuestions: QuestionForQuiz[] = (data || []).map(q => {
        let options: string[] = [];
        
        if (Array.isArray(q.options)) {
          // Handle both string arrays and object arrays
          options = q.options.map((option) => {
            if (typeof option === 'string') {
              return option;
            } else if (option && typeof option === 'object' && option !== null && 'text' in option) {
              return String((option as { text: string }).text);
            }
            return String(option);
          });
        }
        
        return {
          id: q.id,
          title: q.title,
          subtitle: q.subtitle || '',
          options: options,
          sequence_order: q.sequence_order || 0
        };
      });
      
      setQuestions(transformedQuestions);
    } catch (error: unknown) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  const createQuizSession = useCallback(async () => {
    try {
      if (!user) {
        console.log('No authenticated user, skipping session creation');
        return;
      }

      const { data, error } = await supabase
        .from('quiz_sessions')
        .insert({
          user_id: user.id,
          total_questions: questions.length,
          current_question: 0,
          started_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      setSessionId(data.id);
    } catch (error: unknown) {
      console.error('Error creating quiz session:', error);
    }
  }, [user, questions.length]);

  const updateQuizSession = useCallback(async (newAnswers: number[], questionIndex: number) => {
    if (!sessionId) return;

    try {
      await supabase
        .from('quiz_sessions')
        .update({
          current_question: questionIndex + 1,
          answers: newAnswers
        })
        .eq('id', sessionId);
    } catch (error: unknown) {
      console.error('Error updating quiz session:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    const initializeQuiz = async () => {
      // Wait for auth to finish loading and ensure user is authenticated
      if (authLoading) {
        return;
      }
      
      if (!user) {
        console.log('No authenticated user, skipping quiz initialization');
        setLoading(false);
        return;
      }
      
      await loadQuestions();
      await createQuizSession();
    };
    
    initializeQuiz();
  }, [loadQuestions, createQuizSession, user, authLoading]);

  const handleAnswerSelect = async (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);
    
    const nextQuestion = currentQuestion + 1;
    onProgressUpdate(nextQuestion);

    // Update session in database
    await updateQuizSession(newAnswers, currentQuestion);

    if (nextQuestion === 5) {
      setShowMotivation(true);
    } else if (nextQuestion === questions.length) {
      setTimeout(() => onComplete(newAnswers), 500);
    } else {
      setTimeout(() => setCurrentQuestion(nextQuestion), 300);
    }
  };

  const handleMotivationClose = () => {
    setShowMotivation(false);
    setTimeout(() => setCurrentQuestion(5), 300);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">🧠</div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <p className="text-gray-600">Please sign in to access the quiz.</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">❌</div>
          <p className="text-gray-600">No questions available. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between py-4">
      <ProgressTracker current={currentQuestion + 1} total={questions.length} />
      
      <div className="flex-1 flex items-center justify-center px-4">
        <QuestionCard
          question={questions[currentQuestion]}
          onAnswerSelect={handleAnswerSelect}
          questionNumber={currentQuestion + 1}
        />
      </div>

      {showMotivation && (
        <MotivationPopup
          onClose={handleMotivationClose}
          message="You're halfway there! Keep going! 🚀"
        />
      )}
    </div>
  );
};

export default QuizScreen;
