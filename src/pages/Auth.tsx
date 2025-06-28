import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Session } from '@supabase/supabase-js';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        console.log('User from session:', session?.user);
        console.log('Session valid:', !!session);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User logged in, redirecting...');
          setTimeout(() => {
            window.location.href = '/';
          }, 500);
        } else {
          console.log('No valid session found');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Initial session check:', { session, error });
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('Existing session found, redirecting...');
        window.location.href = '/';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!username.trim()) {
        throw new Error('Username is required');
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Check your email to verify your account.",
      });
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Sign up failed:', err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting to sign in with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign in response:', { data, error });

      if (error) {
        console.error('Sign in error details:', error);
        
        // Handle specific error cases more gracefully
        if (error.message.includes('Email not confirmed')) {
          setShowResendConfirmation(true);
          toast({
            title: "Email Not Confirmed",
            description: "Please check your email and click the confirmation link before signing in.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      if (data?.user) {
        console.log('User signed in successfully:', data.user);
        toast({
          title: "Success",
          description: "Signed in successfully!",
        });
      }
    } catch (error: unknown) {
      const err = error as { message: string; code?: string };
      console.error('Sign in failed:', err);
      toast({
        title: "Error",
        description: `${err.message} (Code: ${err.code || 'unknown'})`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      toast({
        title: "Confirmation Email Sent",
        description: "Please check your email for the confirmation link.",
      });
      setShowResendConfirmation(false);
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center space-y-4">
            <div className="text-4xl">✨</div>
            <h2 className="text-xl font-bold">Welcome back!</h2>
            <p className="text-gray-600">Redirecting you to your quiz...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <Card className="p-8 max-w-md w-full bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl">
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="text-4xl">🧠✨</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-600">
              {isSignUp ? 'Join thousands discovering their superpowers' : 'Sign in to continue your journey'}
            </p>
          </div>

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            {isSignUp && (
              <div>
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>
            )}
            
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>
            
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 rounded-xl font-semibold"
            >
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {!isSignUp && (
            <div className="text-center">
              <button
                onClick={() => {
                  setEmail('admin@quiz.com');
                  setPassword('admin123');
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                🔧 Fill Admin Credentials (for testing)
              </button>
            </div>
          )}

          {showResendConfirmation && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                Didn't receive the confirmation email? Check your spam folder or
                <button
                  onClick={handleResendConfirmation}
                  className="text-purple-600 hover:text-purple-700 font-medium ml-1"
                >
                  click here to resend
                </button>.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Auth;
