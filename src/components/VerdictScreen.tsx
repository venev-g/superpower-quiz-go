
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VerdictScreenProps {
  answers: number[];
  onRestart: () => void;
}

interface PersonalityResult {
  title: string;
  description: string;
  emoji: string;
  color: string;
  score: number;
}

const VerdictScreen: React.FC<VerdictScreenProps> = ({ answers, onRestart }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [result, setResult] = useState<PersonalityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    calculateResult();
  }, [answers]);

  const calculateResult = async () => {
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
      
    } catch (error: any) {
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
  };

  const saveResult = async (personalityResult: PersonalityResult) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      await supabase
        .from('quiz_results')
        .insert([{
          user_id: user.id,
          personality_type: personalityResult.title,
          score: personalityResult.score,
          answers: answers
        }]);

      // Analytics will be updated automatically by the trigger
    } catch (error: any) {
      console.error('Error saving result:', error);
    }
  };

  const handleRestart = () => {
    onRestart();
  };

  const handleViewDashboard = () => {
    window.location.href = '/dashboard';
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
