import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  emoji?: string;
  message?: string;
  subMessage?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  emoji = '🧠',
  message = 'Loading...',
  subMessage
}) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  };

  const containerClasses = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6'
  };

  return (
    <div className={`text-center ${containerClasses[size]}`}>
      <div className={`${sizeClasses[size]} animate-spin`}>
        {emoji}
      </div>
      <div className="space-y-1">
        <p className="text-gray-600 font-medium">{message}</p>
        {subMessage && (
          <p className="text-sm text-gray-500">{subMessage}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
