
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminRole = async (userId: string) => {
    try {
      console.log('Checking admin role for user:', userId);
      
      // Query user_roles table directly
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError) {
        if (roleError.code === 'PGRST116') {
          // No rows returned - user has no specific role, default to regular user
          console.log('No role found for user, defaulting to regular user');
          setIsAdmin(false);
          return;
        }
        console.error('Error querying user_roles:', roleError);
        setIsAdmin(false);
        return;
      }

      const isUserAdmin = roleData?.role === 'admin';
      console.log('User admin status:', isUserAdmin);
      setIsAdmin(isUserAdmin);
    } catch (error) {
      console.error('Unexpected error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    console.log('useAuth: Setting up auth state listener');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, !!session?.user);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Don't let admin check block the loading state
          checkAdminRole(session.user.id).catch((error) => {
            console.error('Admin role check failed:', error);
            setIsAdmin(false);
          });
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    const getInitialSession = async () => {
      try {
        console.log('useAuth: Checking for existing session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setLoading(false);
          return;
        }

        console.log('Initial session check:', !!session?.user);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Don't let admin check block the loading state
          checkAdminRole(session.user.id).catch((error) => {
            console.error('Admin role check failed:', error);
            setIsAdmin(false);
          });
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Unexpected error in getInitialSession:', error);
        if (mounted) setLoading(false);
      }
    };

    // Safety timeout - if auth doesn't respond in 5 seconds, stop loading
    const timeoutId = setTimeout(() => {
      console.warn('Auth loading timeout - setting loading to false');
      if (mounted) setLoading(false);
    }, 5000);

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const signOut = async (onSignOutComplete?: () => void) => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      setIsAdmin(false);
      if (onSignOutComplete) {
        onSignOutComplete();
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return { user, session, loading, signOut, isAdmin };
};
