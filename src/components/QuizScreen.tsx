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
  onPartComplete: (part: number, answers: number[], sessionId: string | null) => void;
  progress: number;
  onProgressUpdate: (progress: number) => void;
  allowRestart?: boolean; // Optional prop to allow restarting quiz
  existingSessionId?: string | null; // Pass existing session ID from parent
  existingAnswers?: number[]; // Pass existing answers from parent
}

type Question = Database['public']['Tables']['questions']['Row'];

interface QuestionForQuiz {
  id: string;
  title: string;
  subtitle: string;
  options: string[];
  sequence_order: number;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ onComplete, onPartComplete, progress, onProgressUpdate, allowRestart = false, existingSessionId, existingAnswers }) => {
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
      if (!user || sessionInitialized || questions.length === 0) {
        console.log('Session already initialized, no user, or questions not loaded yet, skipping session creation');
        return;
      }

      console.log('Looking for existing session for user:', user.id, 'currentProgress:', progress);

      // First, check if there's an incomplete session (completed_at is null AND current_question < total)
      const { data: existingSessions, error: findError } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('completed_at', null) // Only find sessions that are not completed
        .lt('current_question', questions.length + 1) // And haven't finished all questions
        .order('started_at', { ascending: false })
        .limit(1);

      if (findError) {
        console.error('Error finding existing sessions:', findError);
        throw findError;
      }

      if (existingSessions && existingSessions.length > 0) {
        // Resume existing session
        const existingSession = existingSessions[0];
        setSessionId(existingSession.id);
        
        // Resume from where user left off - use progress prop if available (coming from part verdict screen)
        // Otherwise use the session's current_question
        let resumeQuestionIndex;
        
        if (progress > 0) {
          // Coming from part verdict screen - use the progress prop to resume
          console.log('Resuming from part verdict screen at progress:', progress);
          resumeQuestionIndex = progress;
        } else {
          // Normal session resumption - use database current_question
          const nextQuestionToAnswer = existingSession.current_question || 1;
          const resumeAnswers = Array.isArray(existingSession.answers) ? existingSession.answers as number[] : [];
          
          // Convert to 0-based index for component state
          resumeQuestionIndex = Math.max(0, nextQuestionToAnswer - 1);
          
          // Set answers from the session
          setAnswers(resumeAnswers);
        }
        
        // Ensure the question index is valid
        const validQuestionIndex = Math.max(0, Math.min(resumeQuestionIndex, questions.length - 1));
        
        console.log('Resuming session:', {
          sessionId: existingSession.id,
          storedCurrentQuestion: existingSession.current_question,
          progressProp: progress,
          resumeQuestionIndex,
          validQuestionIndex,
          answersCount: existingSession.answers ? (existingSession.answers as number[]).length : 0
        });
        
        setCurrentQuestion(validQuestionIndex);
        onProgressUpdate(validQuestionIndex);
        setSessionInitialized(true);
        
        console.log('Resuming existing session:', existingSession.id, 'at question:', validQuestionIndex + 1);
        return;
      }

      // No active session found, create a new one
      console.log('Creating new session for user:', user.id);
      
      try {
        // Create new session directly
        const { data, error } = await supabase
          .from('quiz_sessions')
          .insert({
            user_id: user.id,
            total_questions: questions.length,
            current_question: 1,
            started_at: new Date().toISOString(),
            answers: []
          })
          .select('id')
          .single();

        if (error) {
          console.error('Session creation error details:', error);
          throw error;
        }

        setSessionId(data.id);
        setSessionInitialized(true);
        console.log('Created new session:', data.id);
      } catch (createError) {
        console.error('Error creating session:', createError);
        
        // If the function fails, try direct insert as fallback
        console.log('Attempting fallback session creation...');
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('quiz_sessions')
            .insert({
              user_id: user.id,
              total_questions: questions.length,
              current_question: 1,
              started_at: new Date().toISOString(),
              answers: []
            })
            .select('id')
            .single();

          if (fallbackError) {
            console.error('Fallback session creation also failed:', fallbackError);
            throw fallbackError;
          }

          setSessionId(fallbackData.id);
          setSessionInitialized(true);
          console.log('Created session via fallback:', fallbackData.id);
        } catch (fallbackCreateError) {
          console.error('Both session creation methods failed:', fallbackCreateError);
          
          // As last resort, continue without session for now
          toast({
            title: "Session Warning",
            description: "Could not create quiz session. You can still take the quiz, but progress won't be saved.",
            variant: "destructive",
          });
          setSessionInitialized(true); // Prevent infinite retries
        }
      }
      
    } catch (error: unknown) {
      console.error('Error finding or creating quiz session:', error);
      toast({
        title: "Session Error",
        description: "Failed to initialize quiz session. You can still take the quiz.",
        variant: "destructive",
      });
      setSessionInitialized(true); // Prevent infinite retries
    }
  }, [user, questions.length, onProgressUpdate, sessionInitialized, toast, progress]);

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
      // Use direct update for now since RPC types aren't available
      await supabase
        .from('quiz_sessions')
        .update({
          completed_at: new Date().toISOString(),
          answers: finalAnswers,
          result: quizResult || null,
          current_question: questions.length + 1 // Mark as fully completed (1-based)
        })
        .eq('id', sessionId);
      
      console.log('Quiz session completed:', sessionId);
    } catch (error: unknown) {
      console.error('Error completing quiz session:', error);
    }
  }, [sessionId, questions.length]);

  const updateQuizSession = useCallback(async (newAnswers: number[], questionIndex: number, nextQuestionOverride?: number) => {
    if (!sessionId) return;

    try {
      // Use the override if provided, otherwise calculate normally
      const nextQuestionToSave = nextQuestionOverride || (questionIndex + 2);
      
      await supabase
        .from('quiz_sessions')
        .update({
          current_question: nextQuestionToSave, // Use the calculated or overridden value
          answers: newAnswers
        })
        .eq('id', sessionId);
        
      console.log('Updated session with current_question:', nextQuestionToSave, 'for session:', sessionId);
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
        console.log('Initializing session... Current progress:', progress, 'existingSessionId:', existingSessionId);
        
        // If we have an existing session ID from parent, use it directly
        if (existingSessionId) {
          console.log('Using existing session ID from parent:', existingSessionId);
          setSessionId(existingSessionId);
          setSessionInitialized(true);
          
          // Set the current question based on progress
          if (progress > 0) {
            setCurrentQuestion(progress);
            onProgressUpdate(progress);
          }
          
          // Set existing answers if provided
          if (existingAnswers && existingAnswers.length > 0) {
            console.log('Setting existing answers:', existingAnswers.length);
            setAnswers(existingAnswers);
          }
          
          return;
        }
        
        await findOrCreateQuizSession();
      }
    };
    
    initializeSession();
  }, [authLoading, user, questions.length, sessionId, sessionInitialized, findOrCreateQuizSession, progress, existingSessionId, onProgressUpdate, existingAnswers]);

  const handleAnswerSelect = async (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);
    
    const nextQuestion = currentQuestion + 1;
    onProgressUpdate(nextQuestion);

    // Check for part completions based on question numbers
    const questionNumber = nextQuestion; // 1-based question number
    
    // Update session in database BEFORE any part completion logic
    // For part completions, ensure we save the NEXT question as current_question
    const questionToSave = questionNumber; // This will be the next question to resume from
    await updateQuizSession(newAnswers, currentQuestion, questionToSave);

    if (questionNumber === 9) {
      // Part 1 completed - ensure session is available
      if (sessionId) {
        setTimeout(() => onPartComplete(1, newAnswers, sessionId), 500);
      } else {
        console.error('Session ID not available for part completion, attempting to create session...');
        // Try to create a session quickly
        try {
          await findOrCreateQuizSession();
          if (sessionId) {
            setTimeout(() => onPartComplete(1, newAnswers, sessionId), 500);
          } else {
            // Continue without part evaluation if session creation fails
            setTimeout(() => setCurrentQuestion(nextQuestion), 300);
          }
        } catch (error) {
          console.error('Failed to create session for part completion:', error);
          setTimeout(() => setCurrentQuestion(nextQuestion), 300);
        }
      }
      return;
    } else if (questionNumber === 15) {
      // Part 2 completed
      if (sessionId) {
        setTimeout(() => onPartComplete(2, newAnswers, sessionId), 500);
      } else {
        console.error('Session ID not available for part completion');
        setTimeout(() => setCurrentQuestion(nextQuestion), 300);
      }
      return;
    } else if (questionNumber === 21) {
      // Part 3 completed
      if (sessionId) {
        setTimeout(() => onPartComplete(3, newAnswers, sessionId), 500);
      } else {
        console.error('Session ID not available for part completion');
        setTimeout(() => setCurrentQuestion(nextQuestion), 300);
      }
      return;
    } else if (questionNumber === 33) {
      // Part 4 completed
      if (sessionId) {
        setTimeout(() => onPartComplete(4, newAnswers, sessionId), 500);
      } else {
        console.error('Session ID not available for part completion');
        setTimeout(() => setCurrentQuestion(nextQuestion), 300);
      }
      return;
    } else if (questionNumber === 49) {
      // Part 5 completed
      if (sessionId) {
        setTimeout(() => onPartComplete(5, newAnswers, sessionId), 500);
      } else {
        console.error('Session ID not available for part completion');
        setTimeout(() => setCurrentQuestion(nextQuestion), 300);
      }
      return;
    }

    // For regular question progression (non-part completions)
    await updateQuizSession(newAnswers, currentQuestion); // Use normal update for regular questions

    if (nextQuestion === 24) {
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
    setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
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

  // Safety check to ensure we have a valid question before rendering
  const currentQuestionData = questions[currentQuestion];
  if (!currentQuestionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">🧠</div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between py-4">
      <ProgressTracker current={currentQuestion + 1} total={questions.length} />
      
      <div className="flex-1 flex items-center justify-center px-4">
        <QuestionCard
          question={currentQuestionData}
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
