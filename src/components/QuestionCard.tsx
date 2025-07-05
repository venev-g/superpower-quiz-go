
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Question {
  id: string;
  title: string;
  subtitle: string;
  options: string[];
  sequence_order?: number;
}

interface QuestionCardProps {
  question: Question;
  onAnswerSelect: (answerIndex: number) => void;
  questionNumber: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  onAnswerSelect, 
  questionNumber 
}) => {
  // Safety check to prevent undefined errors
  if (!question) {
    return (
      <Card className="w-full max-w-md p-5 bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-3xl">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">🧠</div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md p-5 bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-3xl animate-fade-in">
      <div className="space-y-5">
        {/* Question Header */}
        <div className="text-center space-y-2">
          <div className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full inline-block">
            {question.subtitle || ''}
          </div>
          <h2 className="text-lg font-bold text-gray-800 leading-tight">
            {question.title || 'Loading...'}
          </h2>
        </div>

        {/* Answer Options */}
        <div className="space-y-2">
          {(question.options || []).map((option, index) => (
            <Button
              key={index}
              onClick={() => onAnswerSelect(index)}
              variant="outline"
              className="w-full h-auto p-3 text-left justify-start text-wrap bg-gradient-to-r from-white to-gray-50 hover:from-blue-50 hover:to-purple-50 border-gray-200 hover:border-purple-300 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md text-sm"
            >
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-500">
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-gray-700 font-medium">{option}</span>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default QuestionCard;
