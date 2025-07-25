import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Trophy, Calendar, Target, BarChart3, Eye, Play, MessageSquare } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { MentorForm } from '@/components/MentorForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import StandaloneQuizDashboard from '@/components/StandaloneQuizDashboard';

type QuizSession = Database['public']['Tables']['quiz_sessions']['Row'];
type DetailResult = Database['public']['Tables']['detail_result']['Row'];

type UserSession = QuizSession;

interface UserResult extends DetailResult {
  quiz_sessions?: {
    started_at: string;
    completed_at: string | null;
    total_questions: number | null;
    score?: number | null;
  };
}

interface UserAnalytics {
  total_attempts: number;
  completed_attempts: number;
  average_completion_rate: number;
  average_score: number;
  last_attempt_at: string | null;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [results, setResults] = useState<UserResult[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedResult, setSelectedResult] = useState<UserResult | null>(null);
  const { toast } = useToast();

  const handleMentorClick = () => {
    navigate('/mentor');
  };

  const loadUserData = useCallback(async () => {
    if (!user) return;

    try {
      // Load user sessions from quiz_sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Load user results from detail_result
      const { data: resultsData, error: resultsError } = await supabase
        .from('detail_result')
        .select(`
          *,
          quiz_sessions (
            started_at,
            completed_at,
            total_questions,
            score
          )
        `)
        .eq('userID', user.id)
        .order('created_at', { ascending: false });

      if (resultsError) throw resultsError;
      setResults(resultsData || []);

      // Calculate analytics
      const totalAttempts = sessionsData?.length || 0;
      const completedAttempts = sessionsData?.filter(s => s.completed_at !== null).length || 0;
      const averageCompletionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;
      const lastAttemptAt = sessionsData?.[0]?.started_at || null;
      
      // Calculate average score from quiz_sessions
      const sessionsWithScores = sessionsData?.filter(s => s.score !== null) || [];
      const averageScore = sessionsWithScores.length > 0 
        ? sessionsWithScores.reduce((sum, session) => sum + (session.score || 0), 0) / sessionsWithScores.length 
        : 0;

      setAnalytics({
        total_attempts: totalAttempts,
        completed_attempts: completedAttempts,
        average_completion_rate: averageCompletionRate,
        average_score: averageScore,
        last_attempt_at: lastAttemptAt
      });

    } catch (error: unknown) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, loadUserData]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (session: UserSession) => {
    if (session.completed_at) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
    }
  };

  const handleStartNewAssessment = () => {
    navigate('/');
  };

  const handleViewResult = (result: UserResult) => {
    setSelectedResult(result);
  };

  const getResultTitle = (result: UserResult) => {
    return result["Personality Pattern"] || result["Dominant Intelligence"] || result["Learning Style"] || 'Assessment Result';
  };

  const getResultScore = (result: UserResult) => {
    return result.quiz_sessions?.score || 0;
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-4xl animate-spin">📊</div>
            <p className="text-gray-600 mt-4">Loading your dashboard...</p>
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
      <div className="container mx-auto px-4 py-8">
        {!selectedResult ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Your Dashboard
                </h1>
                <p className="text-gray-600 mt-1">Track your assessment progress and results</p>
              </div>
              <div className="flex items-center">
                <Button onClick={handleStartNewAssessment} className="flex items-center">
                  <Play className="w-4 h-4 mr-2" />
                  Start New Assessment
                </Button>
              </div>
            </div>

            {/* Analytics Cards */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Attempts</p>
                      <p className="text-2xl font-bold">{analytics.total_attempts}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold">{analytics.completed_attempts}</p>
                    </div>
                    <Trophy className="w-8 h-8 text-green-500" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold">{analytics.average_completion_rate.toFixed(0)}%</p>
                    </div>
                    <Target className="w-8 h-8 text-purple-500" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Average Score</p>
                      <p className="text-2xl font-bold">{analytics.average_score.toFixed(0)}</p>
                    </div>
                    <Trophy className="w-8 h-8 text-yellow-500" />
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Last Attempt</p>
                      <p className="text-sm font-bold">{formatDate(analytics.last_attempt_at)}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-orange-500" />
                  </div>
                </Card>
              </div>
            )}

            {/* Standalone Quiz Results */}
            <StandaloneQuizDashboard />

            {/* Sessions and Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Sessions */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {sessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        {getStatusBadge(session)}
                        <span className="text-xs text-gray-500">
                          {formatDate(session.started_at)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Progress: {session.current_question || 0}/{session.total_questions || 0}
                      </div>
                      {session.completed_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          Completed: {formatDate(session.completed_at)}
                        </div>
                      )}
                      {session.score && (
                        <div className="text-xs text-gray-500 mt-1">
                          Score: {session.score}/100
                        </div>
                      )}
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No sessions yet. Start your first assessment!</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Assessment Results */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Your Results</h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {results.map((result) => (
                    <div key={result.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">
                          {getResultTitle(result)}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewResult(result)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Score: {getResultScore(result)}/100
                      </p>
                      <div className="text-xs text-gray-500">
                        Completed: {formatDate(result.created_at)}
                      </div>
                    </div>
                  ))}
                  {results.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No results yet. Complete an assessment to see your results!</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          /* Result Detail View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedResult(null)}
              >
                ← Back to Dashboard
              </Button>
              <div>
                <h2 className="text-2xl font-bold">{getResultTitle(selectedResult)}</h2>
                <p className="text-gray-600">Assessment Result</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Assessment Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Completed On</label>
                    <p>{formatDate(selectedResult.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Result Type</label>
                    <p>{getResultTitle(selectedResult)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Score</label>
                    <p className="text-blue-600">{getResultScore(selectedResult)}/100</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p className="text-green-600">✓ Completed</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Your Results</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Assessment Result</label>
                    <div className="mt-2 p-3 bg-blue-50 rounded text-sm">
                      <p className="font-medium">{getResultTitle(selectedResult)}</p>
                      <p className="text-gray-600 mt-1">Score: {getResultScore(selectedResult)}/100</p>
                    </div>
                  </div>
                  {selectedResult.quiz_sessions && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Session Details</label>
                      <div className="mt-2 p-3 bg-green-50 rounded text-sm text-green-800">
                        ✓ Session completed with {selectedResult.quiz_sessions.total_questions} questions
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Mentor Avatar Floating Button */}
        <div
          className="fixed bottom-8 right-8 z-50 group flex flex-col items-center"
          style={{ cursor: 'pointer' }}
          onClick={handleMentorClick}
        >
          {/* Chat bubble - only visible on hover */}
          <div className="mb-2 px-4 py-2 rounded-2xl bg-white text-gray-900 shadow-lg text-base font-semibold relative opacity-0 group-hover:opacity-100 transition-opacity duration-200"
               style={{ maxWidth: '180px' }}>
            Ask your mentor!
            <span className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 shadow-md"></span>
          </div>
          <img
            src="/images/mentor.png"
            alt="Mentor"
            className="mentor-avatar"
            style={{ display: 'block' }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
