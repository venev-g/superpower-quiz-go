
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface VerdictScreenProps {
  answers: number[];
  sessionId: string | null;
  onRestart: () => void;
}

interface PersonalityResult {
  title: string;
  description: string;
  emoji: string;
  color: string;
  score: number;
  traits?: string[];
}

const VerdictScreen: React.FC<VerdictScreenProps> = ({ answers, sessionId, onRestart }) => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const [result, setResult] = useState<PersonalityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const saveResult = useCallback(async (personalityResult: PersonalityResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (sessionId) {
        // Update the existing session with the result
        await supabase
          .from('quiz_sessions')
          .update({
            result: { 
              personality_type: personalityResult.title,
              description: personalityResult.description,
              traits: personalityResult.traits || []
            },
            score: personalityResult.score
          })
          .eq('id', sessionId);

        // Save the quiz result
        await supabase
          .from('quiz_results')
          .insert([{
            session_id: sessionId,
            user_id: user.id,
            personality_type: personalityResult.title,
            score: personalityResult.score,
            answers: answers
          }]);
      } else {
        // Fallback: create session if somehow sessionId is missing
        console.warn('No sessionId provided, creating new session as fallback');
        const { data: session, error: sessionError } = await supabase
          .from('quiz_sessions')
          .insert([{
            user_id: user.id,
            completed_at: new Date().toISOString(),
            current_question: answers.length,
            total_questions: answers.length,
            score: personalityResult.score,
            result: { 
              personality_type: personalityResult.title,
              description: personalityResult.description,
              traits: personalityResult.traits || []
            },
            answers: answers
          }])
          .select()
          .single();

        if (sessionError) throw sessionError;

        // Save the quiz result
        await supabase
          .from('quiz_results')
          .insert([{
            session_id: session.id,
            user_id: user.id,
            personality_type: personalityResult.title,
            score: personalityResult.score,
            answers: answers
          }]);
      }

    } catch (error: unknown) {
      console.error('Error saving result:', error);
    }
  }, [answers, sessionId]);

  const calculateResult = useCallback(async () => {
    try {
      // Call edge function to calculate personality result
      const { data, error } = await supabase.functions.invoke('calculate-personality', {
        body: { answers }
      });

      if (error) throw error;

      setResult(data);
      
      // Save result to database
      await saveResult(data);
      
      // Show confetti animation
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
      
    } catch (error: unknown) {
      console.error('Error calculating result:', error);
      toast({
        title: "Error",
        description: "Failed to calculate your result. Please try again.",
        variant: "destructive",
      });
      
      // Fallback result
      setResult({
        title: "The Adaptive Innovator",
        description: "You thrive in changing environments and excel at finding creative solutions. Your flexibility makes you invaluable.",
        emoji: "⚡",
        color: "from-orange-500 to-red-500",
        score: 75
      });
    } finally {
      setLoading(false);
    }
  }, [answers, toast, saveResult]);

  useEffect(() => {
    calculateResult();
  }, [answers, calculateResult]);

  const handleRestart = () => {
    onRestart();
  };

  const handleViewDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">🧠</div>
          <p className="text-gray-600">Calculating your superpower...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6 p-4 animate-fade-in">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            >
              {['🎉', '✨', '🌟', '💫', '⭐'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="text-5xl animate-bounce">{result.emoji}</div>
        <h1 className="text-xl font-bold text-gray-800">
          Your Superpower Revealed!
        </h1>
      </div>

      {/* Verdict Card */}
      <Card className="w-full max-w-md p-6 bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-3xl space-y-4 animate-scale-in">
        <div className="text-center space-y-3">
          <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${result.color} text-white font-semibold text-xs`}>
            Score: {result.score}/100
          </div>
          
          <h2 className="text-xl font-bold text-gray-800">
            {result.title}
          </h2>
          
          <p className="text-gray-600 leading-relaxed text-sm">
            {result.description}
          </p>
        </div>

        {/* Motivational Quote */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-2xl border border-purple-100">
          <p className="text-purple-700 font-medium text-center italic text-sm">
            "Your unique perspective is your greatest asset. Embrace it! ✨"
          </p>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-2">
        <Button
          onClick={handleViewDashboard}
          className="w-full h-12 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          View Dashboard 📊
        </Button>
        
        <Button
          onClick={handleRestart}
          className="w-full h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          Take Another Quiz 🔄
        </Button>
        
        <Button
          variant="outline"
          className="w-full h-10 rounded-xl border-2 border-purple-200 hover:border-purple-300 text-purple-600 font-semibold"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'My Personality Quiz Result',
                text: `I just discovered I'm ${result.title}! Take the quiz to find your superpower.`,
                url: window.location.origin
              });
            }
          }}
        >
          Share Results 📱
        </Button>
      </div>
    </div>
  );
};

export default VerdictScreen;
