// Type definitions for the Mentor Chat system

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  isDemo?: boolean;
  timestamp?: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface QuizFeedback {
  isCorrect: boolean;
  explanation: string;
  correctAnswer: string;
}

export interface LangflowApiResponse {
  outputs?: Array<{
    outputs?: Array<{
      results?: {
        message?: {
          data?: {
            text?: string;
          };
        };
      };
    }>;
  }>;
  result?: {
    text: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ApiPayload {
  input_value: string;
  output_type: string;
  input_type: string;
  session_id: string;
}

export interface SessionQuizState {
  isQuizActive: boolean;
  quizQuestionCount: number;
}

export interface SessionFiveYearOldState {
  isFiveYearOldMode: boolean;
  fiveYearOldStep: 'initial' | 'after_explanation' | 'after_another_example';
}

export interface SessionQuizModeState {
  isQuizMode: boolean;
  quizResponseCount: number;
}

export interface SessionFirstReplyState {
  firstReplyAwaitingYesNo: boolean;
}

export interface SessionDifferentApproachState {
  useDifferentApproachMode: boolean;
}

export interface SessionAutoQuizState {
  autoQuizActive: boolean;
  autoQuizCount: number;
  pendingAutoQuiz: boolean;
}

export interface SessionTextInputState {
  isTextInputEnabled: boolean;
}

export interface SessionManualInputState {
  isManualTextInputEnabled: boolean;
}

export interface MentorFormData {
  topic: string;
  objectives: string;
  prerequisites: string;
  standards: string;
}
