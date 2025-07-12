import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthSimple = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    console.log('useAuthSimple: Setting up auth state listener');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, !!session?.user);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    const getInitialSession = async () => {
      try {
        console.log('useAuthSimple: Checking for existing session');
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
        setLoading(false);
      } catch (error) {
        console.error('Unexpected error in getInitialSession:', error);
        if (mounted) setLoading(false);
      }
    };

    // Safety timeout
    const timeoutId = setTimeout(() => {
      console.warn('Auth loading timeout - setting loading to false');
      if (mounted) setLoading(false);
    }, 3000);

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
      if (onSignOutComplete) {
        onSignOutComplete();
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return { user, session, loading, signOut, isAdmin: false };
};
