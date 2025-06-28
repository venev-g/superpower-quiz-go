
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';

interface QuizResult {
  id: string;
  personality_type: string;
  score: number;
  created_at: string;
}

interface UserAnalytics {
  total_attempts: number;
  average_score: number;
  last_attempt_at: string;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth';
    }
  }, [user, loading]);

  const loadUserData = async () => {
    try {
      // Load quiz results
      const { data: resultsData, error: resultsError } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (resultsError) throw resultsError;
      setQuizResults(resultsData || []);

      // Load analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('quiz_analytics')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (analyticsError && analyticsError.code !== 'PGRST116') {
        throw analyticsError;
      }

      setAnalytics(analyticsData);
    } catch (error: any) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your data",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="text-4xl animate-spin">📊</div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
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
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Your Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Track your quiz progress and results</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center bg-white/90 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-2">Total Attempts</h3>
            <p className="text-3xl font-bold text-blue-600">
              {analytics?.total_attempts || quizResults.length}
            </p>
          </Card>

          <Card className="p-6 text-center bg-white/90 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-2">Average Score</h3>
            <p className="text-3xl font-bold text-green-600">
              {analytics?.average_score || 
                (quizResults.length > 0 
                  ? Math.round((quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length) * 100) / 100
                  : 0
                )}
            </p>
          </Card>

          <Card className="p-6 text-center bg-white/90 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-2">Last Attempt</h3>
            <p className="text-sm font-medium text-purple-600">
              {analytics?.last_attempt_at || quizResults[0]?.created_at
                ? new Date(analytics?.last_attempt_at || quizResults[0]?.created_at).toLocaleDateString()
                : 'Never'
              }
            </p>
          </Card>
        </div>

        {/* Recent Results */}
        <Card className="p-6 bg-white/90 backdrop-blur-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Quiz Results</h2>
          
          {quizResults.length > 0 ? (
            <div className="space-y-4">
              {quizResults.map((result, index) => (
                <div key={result.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{result.personality_type}</h3>
                      <p className="text-sm text-gray-600">
                        Score: {result.score}/100
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(result.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Attempt #{quizResults.length - index}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-gray-600 mb-4">You haven't taken any quizzes yet!</p>
              <Button onClick={() => window.location.href = '/'}>
                Take Your First Quiz
              </Button>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600"
          >
            Take Quiz Again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
