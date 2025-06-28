
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalUsers: number;
  totalQuizzes: number;
  averageScore: number;
  topPersonalities: Array<{ type: string; count: number }>;
}

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalQuizzes: 0,
    averageScore: 0,
    topPersonalities: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Get total unique users who took quiz
      const { data: usersData, error: usersError } = await supabase
        .from('quiz_results')
        .select('user_id')
        .distinct();

      if (usersError) throw usersError;

      // Get total quiz attempts
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('quiz_results')
        .select('id');

      if (quizzesError) throw quizzesError;

      // Get average score
      const { data: scoresData, error: scoresError } = await supabase
        .from('quiz_results')
        .select('score');

      if (scoresError) throw scoresError;

      // Get personality type distribution
      const { data: personalityData, error: personalityError } = await supabase
        .from('quiz_results')
        .select('personality_type');

      if (personalityError) throw personalityError;

      const averageScore = scoresData?.length 
        ? scoresData.reduce((sum, item) => sum + item.score, 0) / scoresData.length
        : 0;

      const personalityCounts = personalityData?.reduce((acc: any, item) => {
        acc[item.personality_type] = (acc[item.personality_type] || 0) + 1;
        return acc;
      }, {}) || {};

      const topPersonalities = Object.entries(personalityCounts)
        .map(([type, count]) => ({ type, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setAnalytics({
        totalUsers: usersData?.length || 0,
        totalQuizzes: quizzesData?.length || 0,
        averageScore: Math.round(averageScore * 100) / 100,
        topPersonalities
      });
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{analytics.totalUsers}</p>
        </Card>

        <Card className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Quiz Attempts</h3>
          <p className="text-3xl font-bold text-green-600">{analytics.totalQuizzes}</p>
        </Card>

        <Card className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Average Score</h3>
          <p className="text-3xl font-bold text-purple-600">{analytics.averageScore}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Personality Types</h3>
        <div className="space-y-3">
          {analytics.topPersonalities.map((personality, index) => (
            <div key={personality.type} className="flex justify-between items-center">
              <span className="font-medium">{personality.type}</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(personality.count / analytics.totalQuizzes) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600">{personality.count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
