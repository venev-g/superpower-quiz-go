import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type QuizSession = Database['public']['Tables']['quiz_sessions']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];

interface UserWithData extends Profile {
  sessions: QuizSession[];
  sessionCount: number;
  completedSessions: number;
  userRole?: UserRole;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Create a map of user roles
      const rolesMap = new Map<string, UserRole>();
      userRoles?.forEach(role => {
        rolesMap.set(role.user_id, role);
      });

      // Fetch sessions for each user
      const usersWithData: UserWithData[] = [];
      
      for (const profile of profiles || []) {
        const { data: sessions, error: sessionsError } = await supabase
          .from('quiz_sessions')
          .select('*')
          .eq('user_id', profile.id)
          .order('started_at', { ascending: false });

        if (sessionsError) {
          console.error('Error fetching sessions for user:', sessionsError);
          continue;
        }

        const completedSessions = sessions?.filter(s => s.completed_at !== null).length || 0;

        usersWithData.push({
          ...profile,
          sessions: sessions || [],
          sessionCount: sessions?.length || 0,
          completedSessions,
          userRole: rolesMap.get(profile.id)
        });
      }

      setUsers(usersWithData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchUsers();
      setLoading(false);
    };
    loadData();
  }, [fetchUsers]);

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      // Check if user already has a role record
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = row not found
        throw checkError;
      }

      const roleEnum = newRole as Database['public']['Enums']['app_role'];

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: roleEnum })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Create new role
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: roleEnum }]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Delete quiz sessions and related data
      const { data: sessions } = await supabase
        .from('quiz_sessions')
        .select('id')
        .eq('user_id', userId);

      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        
        // Delete quiz results first (they reference sessions)
        await supabase
          .from('quiz_results')
          .delete()
          .in('session_id', sessionIds);
      }
      
      // Delete quiz sessions
      await supabase
        .from('quiz_sessions')
        .delete()
        .eq('user_id', userId);

      // Delete user role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Finally delete the profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User and all associated data deleted successfully",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">👥</div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Users ({users.length})</h3>
        <div className="text-sm text-gray-600">
          Admin users: {users.filter(u => u.userRole?.role === 'admin').length} | 
          Regular users: {users.filter(u => u.userRole?.role !== 'admin').length}
        </div>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    {user.username || 'Unnamed User'}
                  </CardTitle>
                  <CardDescription>ID: {user.id}</CardDescription>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={user.userRole?.role === 'admin' ? 'default' : 'secondary'}>
                      {user.userRole?.role || 'user'}
                    </Badge>
                    <Badge variant="outline">
                      {user.sessionCount} session{user.sessionCount !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="outline">
                      {user.completedSessions} completed
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Select
                    value={user.userRole?.role || 'user'}
                    onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                    disabled={updating === user.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this user? This will permanently remove 
                          all their data including sessions, responses, and results. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteUser(user.id)}>
                          Delete User
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created:</span> {formatDate(user.created_at)}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span> {formatDate(user.updated_at)}
                  </div>
                </div>

                {user.sessions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recent Sessions:</h4>
                    <div className="space-y-1">
                      {user.sessions.slice(0, 3).map((session) => (
                        <div key={session.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <div className="flex gap-2">
                            <Badge variant={
                              session.completed_at ? 'default' : 'secondary'
                            }>
                              {session.completed_at ? 'completed' : 'in_progress'}
                            </Badge>
                            <span className="text-gray-600">
                              {session.current_question || 0}/{session.total_questions || 0} questions
                            </span>
                          </div>
                          <span className="text-gray-500">
                            {formatDate(session.started_at)}
                          </span>
                        </div>
                      ))}
                      {user.sessions.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          ... and {user.sessions.length - 3} more sessions
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {users.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">
                No users found in the system.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
