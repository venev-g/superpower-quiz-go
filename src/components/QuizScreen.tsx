import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import QuestionCard from './QuestionCard';
import ProgressTracker from './ProgressTracker';
import MotivationPopup from './MotivationPopup';
import { useToast } from '@/hooks/use-toast';
import { Database, Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

interface QuizScreenProps {
  onComplete: (answers: number[], sessionId: string | null) => void;
  progress: number;
  onProgressUpdate: (progress: number) => void;
  allowRestart?: boolean; // Optional prop to allow restarting quiz
}

type Question = Database['public']['Tables']['questions']['Row'];

interface QuestionForQuiz {
  id: string;
  title: string;
  subtitle: string;
  options: string[];
  sequence_order: number;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ onComplete, progress, onProgressUpdate, allowRestart = false }) => {
  const [questions, setQuestions] = useState<QuestionForQuiz[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showMotivation, setShowMotivation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionInitialized, setSessionInitialized] = useState(false);
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

  const findOrCreateQuizSession = useCallback(async () => {
    try {
      if (!user || sessionInitialized) {
        console.log('Session already initialized or no user, skipping session creation');
        return;
      }

      console.log('Looking for existing session for user:', user.id);

      // First, check if there's an active session (not completed)
      const { data: existingSessions, error: findError } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('completed_at', null)
        .order('started_at', { ascending: false })
        .limit(1);

      if (findError) throw findError;

      if (existingSessions && existingSessions.length > 0) {
        // Resume existing session
        const existingSession = existingSessions[0];
        setSessionId(existingSession.id);
        
        // Resume from where user left off
        const resumeQuestionIndex = existingSession.current_question || 0;
        const resumeAnswers = Array.isArray(existingSession.answers) ? existingSession.answers as number[] : [];
        
        setCurrentQuestion(resumeQuestionIndex);
        setAnswers(resumeAnswers);
        onProgressUpdate(resumeQuestionIndex);
        setSessionInitialized(true);
        
        console.log('Resuming existing session:', existingSession.id, 'at question:', resumeQuestionIndex);
        return;
      }

      // No active session found, create a new one
      console.log('Creating new session for user:', user.id);
      
      try {
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

        if (error) {
          // If constraint violation, it means another session was created concurrently
          if (error.code === '23505') {
            console.log('Concurrent session detected, retrying...');
            // Retry finding the session
            const { data: newCheck } = await supabase
              .from('quiz_sessions')
              .select('*')
              .eq('user_id', user.id)
              .is('completed_at', null)
              .order('started_at', { ascending: false })
              .limit(1);
            
            if (newCheck && newCheck.length > 0) {
              const session = newCheck[0];
              setSessionId(session.id);
              setCurrentQuestion(session.current_question || 0);
              setAnswers(Array.isArray(session.answers) ? session.answers as number[] : []);
              onProgressUpdate(session.current_question || 0);
              setSessionInitialized(true);
              console.log('Using concurrent session:', session.id);
              return;
            }
          }
          throw error;
        }

        setSessionId(data.id);
        setSessionInitialized(true);
        console.log('Created new session:', data.id);
      } catch (createError) {
        console.error('Error creating session:', createError);
        throw createError;
      }
      
    } catch (error: unknown) {
      console.error('Error finding or creating quiz session:', error);
    }
  }, [user, questions.length, onProgressUpdate, sessionInitialized]);

  const startNewQuizSession = useCallback(async () => {
    try {
      if (!user) return;

      // Complete any existing active session
      await supabase
        .from('quiz_sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('completed_at', null);

      // Reset component state
      setCurrentQuestion(0);
      setAnswers([]);
      setSessionId(null);
      setSessionInitialized(false);
      onProgressUpdate(0);

      // Create new session
      await findOrCreateQuizSession();
    } catch (error) {
      console.error('Error starting new quiz session:', error);
    }
  }, [user, onProgressUpdate, findOrCreateQuizSession]);

  const completeQuizSession = useCallback(async (finalAnswers: number[], quizResult?: Json) => {
    if (!sessionId) return;

    try {
      await supabase
        .from('quiz_sessions')
        .update({
          completed_at: new Date().toISOString(),
          answers: finalAnswers,
          result: quizResult || null,
          current_question: questions.length // Mark as fully completed
        })
        .eq('id', sessionId);
      
      console.log('Quiz session completed:', sessionId);
    } catch (error: unknown) {
      console.error('Error completing quiz session:', error);
    }
  }, [sessionId, questions.length]);

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
      
      // Load questions only once
      if (questions.length === 0) {
        await loadQuestions();
      }
    };
    
    initializeQuiz();
  }, [user, authLoading, loadQuestions, questions.length]);

  // Separate effect for session management after questions are loaded
  useEffect(() => {
    const initializeSession = async () => {
      if (!authLoading && user && questions.length > 0 && !sessionId && !sessionInitialized) {
        console.log('Initializing session...');
        await findOrCreateQuizSession();
      }
    };
    
    initializeSession();
  }, [authLoading, user, questions.length, sessionId, sessionInitialized, findOrCreateQuizSession]);

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
      // Quiz completed - pass control to VerdictScreen to handle results
      setTimeout(() => onComplete(newAnswers, sessionId), 500);
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
