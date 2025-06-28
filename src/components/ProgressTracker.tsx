
import React from 'react';

interface ProgressTrackerProps {
  current: number;
  total: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ current, total }) => {
  const progressPercentage = (current / total) * 100;

  return (
    <div className="sticky top-4 z-10 bg-white/90 backdrop-blur-sm rounded-2xl p-4 mx-4 shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-600">
          Question {current} of {total}
        </span>
        <span className="text-sm font-bold text-purple-600">
          {Math.round(progressPercentage)}%
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Progress Dots */}
      <div className="flex justify-center mt-3 space-x-2">
        {Array.from({ length: total }, (_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index < current
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 scale-110'
                : index === current - 1
                ? 'bg-purple-400 scale-125 animate-pulse'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;
