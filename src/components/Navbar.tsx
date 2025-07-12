
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-purple-100">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🧠</span>
          <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Superpower Quiz
          </span>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-sm"
              >
                Quiz
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-sm"
              >
                Dashboard
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="text-sm"
                >
                  Admin
                </Button>
              )}
            </div>
            
            <span className="text-sm text-gray-600 hidden sm:block">
              Welcome back! 👋
            </span>
            <Button
              onClick={() => signOut(() => navigate('/auth'))}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
