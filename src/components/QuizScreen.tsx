
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import QuestionCard from './QuestionCard';
import ProgressTracker from './ProgressTracker';
import MotivationPopup from './MotivationPopup';
import { useToast } from '@/hooks/use-toast';

interface QuizScreenProps {
  onComplete: (answers: number[]) => void;
  progress: number;
  onProgressUpdate: (progress: number) => void;
}

interface Question {
  id: string;
  title: string;
  subtitle: string;
  options: string[];
  sequence_order: number;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ onComplete, progress, onProgressUpdate }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showMotivation, setShowMotivation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadQuestions();
    createQuizSession();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .order('sequence_order');

      if (error) throw error;
      
      // Transform the data to match our Question interface
      const transformedQuestions: Question[] = (data || []).map(q => ({
        id: q.id,
        title: q.title,
        subtitle: q.subtitle || '',
        options: Array.isArray(q.options) ? q.options as string[] : [],
        sequence_order: q.sequence_order
      }));
      
      setQuestions(transformedQuestions);
    } catch (error: any) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createQuizSession = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .insert([{
          user_id: (await supabase.auth.getUser()).data.user?.id,
          total_questions: 10
        }])
        .select()
        .single();

      if (error) throw error;
      setSessionId(data.id);
    } catch (error: any) {
      console.error('Error creating quiz session:', error);
    }
  };

  const updateQuizSession = async (newAnswers: number[], questionIndex: number) => {
    if (!sessionId) return;

    try {
      await supabase
        .from('quiz_sessions')
        .update({
          current_question: questionIndex + 1,
          answers: newAnswers
        })
        .eq('id', sessionId);
    } catch (error: any) {
      console.error('Error updating quiz session:', error);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">🧠</div>
          <p className="text-gray-600">Loading questions...</p>
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
