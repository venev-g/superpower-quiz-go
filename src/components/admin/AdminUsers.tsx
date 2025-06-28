
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface UserResult {
  id: string;
  personality_type: string;
  score: number;
  created_at: string;
  profiles: {
    username: string;
  } | null;
}

const AdminUsers = () => {
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserResults();
  }, []);

  const loadUserResults = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_results')
        .select(`
          id,
          personality_type,
          score,
          created_at,
          user_id,
          profiles!inner(username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserResults(data || []);
    } catch (error: any) {
      console.error('Error loading user results:', error);
      toast({
        title: "Error",
        description: "Failed to load user results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading user results...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">User Results</h2>

      <div className="grid gap-4">
        {userResults.map((result) => (
          <Card key={result.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">
                  {result.profiles?.username || 'Unknown User'}
                </h3>
                <p className="text-sm text-gray-600">{result.personality_type}</p>
                <p className="text-sm text-gray-500">
                  Score: {result.score} | Date: {new Date(result.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {userResults.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No user results found.
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
