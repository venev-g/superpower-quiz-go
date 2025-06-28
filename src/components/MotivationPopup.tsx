
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MotivationPopupProps {
  message: string;
  onClose: () => void;
}

const MotivationPopup: React.FC<MotivationPopupProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-4 animate-scale-in">
        <div className="text-4xl animate-bounce">🎉</div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-gray-800">
            Halfway There!
          </h3>
          <p className="text-base text-purple-600 font-semibold">
            {message}
          </p>
        </div>
        
        <Button
          onClick={onClose}
          className="w-full h-10 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
        >
          Continue Quiz ✨
        </Button>
      </Card>
    </div>
  );
};

export default MotivationPopup;
