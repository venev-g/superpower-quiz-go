import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Users, Target, TrendingUp, Calendar, Trophy, BookOpen, Activity } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalSessions: number;
  completedSessions: number;
  totalQuestions: number;
  totalResults: number;
  testTypeStats: Array<{
    name: string;
    sessions: number;
    completion_rate: number;
  }>;
  recentActivity: Array<{
    date: string;
    sessions: number;
    completions: number;
  }>;
  categoryStats: Array<{
    category: string;
    questions: number;
  }>;
  userRoleStats: {
    admins: number;
    users: number;
  };
}

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalSessions: 0,
    completedSessions: 0,
    totalQuestions: 0,
    totalResults: 0,
    testTypeStats: [],
    recentActivity: [],
    categoryStats: [],
    userRoleStats: { admins: 0, users: 0 }
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAnalytics = useCallback(async () => {
    try {
      // Get user statistics from profiles and user_roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id');

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role');

      if (rolesError) throw rolesError;

      const userRoleStats = {
        admins: rolesData?.filter(r => r.role === 'admin').length || 0,
        users: (profilesData?.length || 0) - (rolesData?.filter(r => r.role === 'admin').length || 0)
      };

      // Get session statistics from quiz_sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('quiz_sessions')
        .select('completed_at, started_at, current_question, total_questions');

      if (sessionsError) throw sessionsError;

      const totalSessions = sessionsData?.length || 0;
      const completedSessions = sessionsData?.filter(s => s.completed_at !== null).length || 0;

      // Get questions count and category stats
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('id, category_id, question_categories(name)')
        .eq('is_active', true);

      if (questionsError) throw questionsError;

      // Get results count from quiz_results
      const { data: resultsData, error: resultsError } = await supabase
        .from('quiz_results')
        .select('created_at, personality_type');

      if (resultsError) throw resultsError;

      // Process category statistics
      const categoryMap = new Map<string, number>();
      questionsData?.forEach(q => {
        const categoryName = (q.question_categories as { name: string } | null)?.name || 'Uncategorized';
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
      });

      const categoryStats = Array.from(categoryMap.entries()).map(([category, questions]) => ({
        category,
        questions
      })).sort((a, b) => b.questions - a.questions);

      // Process test type statistics (simplified - all sessions grouped together)
      const testTypeStats = [{
        name: 'Personality Quiz',
        sessions: totalSessions,
        completion_rate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
      }];

      // Process recent activity (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const recentActivity = last7Days.map(date => {
        const sessions = sessionsData?.filter(s => 
          s.started_at && s.started_at.startsWith(date)
        ).length || 0;
        
        const completions = sessionsData?.filter(s => 
          s.completed_at && s.completed_at.startsWith(date)
        ).length || 0;

        return { date, sessions, completions };
      });

      setAnalytics({
        totalUsers: profilesData?.length || 0,
        totalSessions,
        completedSessions,
        totalQuestions: questionsData?.length || 0,
        totalResults: resultsData?.length || 0,
        testTypeStats,
        recentActivity,
        categoryStats,
        userRoleStats
      });

    } catch (error: unknown) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const completionRate = analytics.totalSessions > 0 
    ? ((analytics.completedSessions / analytics.totalSessions) * 100).toFixed(1)
    : '0';

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold">{analytics.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {analytics.userRoleStats.admins} admin{analytics.userRoleStats.admins !== 1 ? 's' : ''}, {analytics.userRoleStats.users} user{analytics.userRoleStats.users !== 1 ? 's' : ''}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold">{analytics.totalSessions}</p>
            </div>
            <Activity className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {analytics.completedSessions} completed
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold">{completionRate}%</p>
            </div>
            <Target className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Session completion rate
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold">{analytics.totalQuestions}</p>
            </div>
            <BookOpen className="w-8 h-8 text-orange-500" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Active questions
          </div>
        </Card>
      </div>

      {/* Charts and Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Recent Activity (Last 7 Days)
          </h3>
          <div className="space-y-3">
            {analytics.recentActivity.map((day, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{formatDate(day.date)}</span>
                <div className="flex space-x-4 text-sm">
                  <span className="text-blue-600">{day.sessions} sessions</span>
                  <span className="text-green-600">{day.completions} completed</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Category Statistics */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Question Categories
          </h3>
          <div className="space-y-3">
            {analytics.categoryStats.slice(0, 8).map((category, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">
                  {category.category.replace(/-/g, ' ')}
                </span>
                <span className="text-sm font-medium">{category.questions} questions</span>
              </div>
            ))}
            {analytics.categoryStats.length === 0 && (
              <p className="text-gray-500 text-sm">No categories found</p>
            )}
          </div>
        </Card>

        {/* Test Type Performance */}
        <Card className="p-4 lg:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center">
            <Trophy className="w-4 h-4 mr-2" />
            Test Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Test Type</th>
                  <th className="text-right py-2">Sessions</th>
                  <th className="text-right py-2">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.testTypeStats.map((test, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{test.name}</td>
                    <td className="text-right py-2">{test.sessions}</td>
                    <td className="text-right py-2">{test.completion_rate.toFixed(1)}%</td>
                  </tr>
                ))}
                {analytics.testTypeStats.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-gray-500">
                      No test performance data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
