
import React, { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';
import ProgressTracker from './ProgressTracker';
import MotivationPopup from './MotivationPopup';

interface QuizScreenProps {
  onComplete: (answers: number[]) => void;
  progress: number;
  onProgressUpdate: (progress: number) => void;
}

// Mock quiz data - in a real app this would come from an API
const quizQuestions = [
  {
    id: 1,
    title: "When facing a complex problem, you prefer to:",
    subtitle: "Logical-Mathematical",
    options: [
      "Break it down into smaller, manageable parts",
      "Look for patterns and connections",
      "Trust your intuition and gut feeling",
      "Seek advice from others first"
    ]
  },
  {
    id: 2,
    title: "Your ideal work environment is:",
    subtitle: "Spatial Intelligence",
    options: [
      "A quiet, organized space with minimal distractions",
      "A collaborative area with lots of interaction",
      "A dynamic space that changes frequently",
      "A comfortable, personalized environment"
    ]
  },
  {
    id: 3,
    title: "When learning something new, you:",
    subtitle: "Learning Style",
    options: [
      "Read extensively and take detailed notes",
      "Dive in and learn by doing",
      "Discuss it with others to understand",
      "Visualize concepts and create mental maps"
    ]
  },
  {
    id: 4,
    title: "Your approach to leadership is:",
    subtitle: "Leadership Philosophy",
    options: [
      "Lead by example and set clear standards",
      "Inspire and motivate through vision",
      "Collaborate and build consensus",
      "Adapt your style to each situation"
    ]
  },
  {
    id: 5,
    title: "When making important decisions, you:",
    subtitle: "Decision Making",
    options: [
      "Analyze all available data thoroughly",
      "Consider the impact on all stakeholders",
      "Trust your experience and instincts",
      "Seek multiple perspectives before deciding"
    ]
  },
  {
    id: 6,
    title: "Your greatest strength in teams is:",
    subtitle: "Team Dynamics",
    options: [
      "Bringing structure and organization",
      "Generating creative ideas and solutions",
      "Facilitating communication and harmony",
      "Driving results and maintaining focus"
    ]
  },
  {
    id: 7,
    title: "When facing setbacks, you typically:",
    subtitle: "Resilience",
    options: [
      "Analyze what went wrong and adjust",
      "Stay optimistic and keep pushing forward",
      "Seek support from your network",
      "Take time to reflect and recharge"
    ]
  },
  {
    id: 8,
    title: "Your communication style is best described as:",
    subtitle: "Communication",
    options: [
      "Direct and to-the-point",
      "Enthusiastic and inspiring",
      "Thoughtful and considerate",
      "Adaptable to the audience"
    ]
  },
  {
    id: 9,
    title: "You're most energized by:",
    subtitle: "Energy Source",
    options: [
      "Solving complex challenges",
      "Creating something new",
      "Helping others succeed",
      "Achieving ambitious goals"
    ]
  },
  {
    id: 10,
    title: "Your vision of success includes:",
    subtitle: "Success Definition",
    options: [
      "Mastering your craft and expertise",
      "Making a meaningful impact",
      "Building strong relationships",
      "Achieving recognition and influence"
    ]
  }
];

const QuizScreen: React.FC<QuizScreenProps> = ({ onComplete, progress, onProgressUpdate }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showMotivation, setShowMotivation] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);
    
    const nextQuestion = currentQuestion + 1;
    onProgressUpdate(nextQuestion);

    if (nextQuestion === 5) {
      setShowMotivation(true);
    } else if (nextQuestion === quizQuestions.length) {
      setTimeout(() => onComplete(newAnswers), 500);
    } else {
      setTimeout(() => setCurrentQuestion(nextQuestion), 300);
    }
  };

  const handleMotivationClose = () => {
    setShowMotivation(false);
    setTimeout(() => setCurrentQuestion(5), 300);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-4">
      <ProgressTracker current={currentQuestion + 1} total={quizQuestions.length} />
      
      <div className="flex-1 flex items-center justify-center px-4">
        <QuestionCard
          question={quizQuestions[currentQuestion]}
          onAnswerSelect={handleAnswerSelect}
          questionNumber={currentQuestion + 1}
        />
      </div>

      {showMotivation && (
        <MotivationPopup
          onClose={handleMotivationClose}
          message="You think like Elon Musk! Keep going →"
        />
      )}
    </div>
  );
};

export default QuizScreen;
