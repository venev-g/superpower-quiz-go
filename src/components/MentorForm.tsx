import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/Input_2';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/Button_2';
import { Info, Paperclip, Send, Loader2, Plus, MessageSquare, MessageSquareOff } from 'lucide-react';
import { LangflowService, Session } from '@/lib/services/LangflowService';
import { SessionManager } from './SessionManager';
import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import { curriculumData, CurriculumStandard, CurriculumSubject, CurriculumChapter, CurriculumTopic } from '@/lib/curriculumData';

const Tooltip = ({ text }: { text: string }) => (
  <span className="ml-2 text-xs text-gray-500 cursor-pointer group relative">
    <Info className="inline w-4 h-4" />
    <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-black text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
      {text}
    </span>
  </span>
);

const userAvatar = (
  <img src="/images/user-avatar.png" alt="User" className="w-10 h-10 rounded-full border-2 border-blue-400 shadow-md bg-white object-cover" />
);
const aiAvatar = (
  <img src="/images/mentor2.png" alt="Super Teacher" className="w-10 h-10 rounded-full border-2 border-purple-400 shadow-md bg-white object-cover" />
);

export function MentorForm({ onClose }: { onClose?: () => void }) {
  const [showChat, setShowChat] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(true);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [form, setForm] = useState({
    standard: '',
    subject: '',
    chapter: '',
    topic: '',
    objectives: '',
    prerequisites: ''
  });

  // Curriculum dropdown states
  const [selectedStandard, setSelectedStandard] = useState<CurriculumStandard | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<CurriculumSubject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<CurriculumChapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<CurriculumTopic | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [selectedQuickResponse, setSelectedQuickResponse] = useState<string>("");

  // Per-session quiz state
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizQuestionCount, setQuizQuestionCount] = useState(0);

  // New state for 5-year-old explanation flow
  const [isFiveYearOldMode, setIsFiveYearOldMode] = useState(false);
  const [fiveYearOldStep, setFiveYearOldStep] = useState<'initial' | 'after_explanation' | 'after_another_example'>('initial');

  // Add new state for first reply and different approach
  const [firstReplyAwaitingYesNo, setFirstReplyAwaitingYesNo] = useState(false);
  const [useDifferentApproachMode, setUseDifferentApproachMode] = useState(false);

  // Add auto quiz detection state
  const [autoQuizActive, setAutoQuizActive] = useState(false);
  const [autoQuizCount, setAutoQuizCount] = useState(0);
  const [pendingAutoQuiz, setPendingAutoQuiz] = useState(false);

  // Add state to control when text input should be enabled
  const [isTextInputEnabled, setIsTextInputEnabled] = useState(false);

  // Add state to track quiz mode and responses
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizResponseCount, setQuizResponseCount] = useState(0);

  // Add state for manual text input toggle
  const [isManualTextInputEnabled, setIsManualTextInputEnabled] = useState(false);

  // Add custom subject, chapter, and topic states
  const [customSubject, setCustomSubject] = useState('');
  const [customChapter, setCustomChapter] = useState('');
  const [customTopic, setCustomTopic] = useState('');

  // Add refs for auto-scroll/auto-focus
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const chapterRef = useRef<HTMLInputElement | null>(null);
  const topicRef = useRef<HTMLInputElement | null>(null);

  // Function to handle manual text input toggle
  const handleManualTextInputToggle = () => {
    setIsManualTextInputEnabled(!isManualTextInputEnabled);
  };

  // Load quiz state when session changes
  useEffect(() => {
    if (currentSession) {
      const quizState = LangflowService.getSessionQuizState(currentSession.id);
      setIsQuizActive(quizState.isQuizActive);
      setQuizQuestionCount(quizState.quizQuestionCount);
      
      // Load 5-year-old mode state
      const fiveYearOldState = LangflowService.getSessionFiveYearOldState(currentSession.id);
      setIsFiveYearOldMode(fiveYearOldState.isFiveYearOldMode);
      setFiveYearOldStep(fiveYearOldState.fiveYearOldStep);
      
      // Load quiz mode state
      const quizModeState = LangflowService.getSessionQuizModeState(currentSession.id);
      setIsQuizMode(quizModeState.isQuizMode);
      setQuizResponseCount(quizModeState.quizResponseCount);
      
      // Load first reply state
      const firstReplyState = LangflowService.getSessionFirstReplyState(currentSession.id);
      setFirstReplyAwaitingYesNo(firstReplyState.firstReplyAwaitingYesNo);
      
      // Load different approach state
      const differentApproachState = LangflowService.getSessionDifferentApproachState(currentSession.id);
      setUseDifferentApproachMode(differentApproachState.useDifferentApproachMode);
      
      // Load auto quiz state
      const autoQuizState = LangflowService.getSessionAutoQuizState(currentSession.id);
      setAutoQuizActive(autoQuizState.autoQuizActive);
      setAutoQuizCount(autoQuizState.autoQuizCount);
      setPendingAutoQuiz(autoQuizState.pendingAutoQuiz);
      
      // Load text input state
      const textInputState = LangflowService.getSessionTextInputState(currentSession.id);
      setIsTextInputEnabled(textInputState.isTextInputEnabled);
      
      // Load manual input state
      const manualInputState = LangflowService.getSessionManualInputState(currentSession.id);
      setIsManualTextInputEnabled(manualInputState.isManualTextInputEnabled);
    } else {
      // Reset all state when no session is selected
      setIsQuizActive(false);
      setQuizQuestionCount(0);
      setIsFiveYearOldMode(false);
      setFiveYearOldStep('initial');
      setIsQuizMode(false);
      setQuizResponseCount(0);
      setFirstReplyAwaitingYesNo(false);
      setUseDifferentApproachMode(false);
      setAutoQuizActive(false);
      setAutoQuizCount(0);
      setPendingAutoQuiz(false);
      setIsTextInputEnabled(false);
      setIsManualTextInputEnabled(false);
    }
  }, [currentSession?.id]); // Use session ID instead of entire session object

  // Save quiz state when it changes
  useEffect(() => {
    if (currentSession) {
      LangflowService.saveSessionQuizState(currentSession.id, { isQuizActive, quizQuestionCount });
    }
  }, [isQuizActive, quizQuestionCount, currentSession?.id]); // Use session ID instead of entire session object

  // Save 5-year-old mode state when it changes
  useEffect(() => {
    if (currentSession) {
      LangflowService.saveSessionFiveYearOldState(currentSession.id, { isFiveYearOldMode, fiveYearOldStep });
    }
  }, [isFiveYearOldMode, fiveYearOldStep, currentSession?.id]);

  // Save quiz mode state when it changes
  useEffect(() => {
    if (currentSession) {
      LangflowService.saveSessionQuizModeState(currentSession.id, { isQuizMode, quizResponseCount });
    }
  }, [isQuizMode, quizResponseCount, currentSession?.id]);

  // Save first reply state when it changes
  useEffect(() => {
    if (currentSession) {
      LangflowService.saveSessionFirstReplyState(currentSession.id, { firstReplyAwaitingYesNo });
    }
  }, [firstReplyAwaitingYesNo, currentSession?.id]);

  // Save different approach state when it changes
  useEffect(() => {
    if (currentSession) {
      LangflowService.saveSessionDifferentApproachState(currentSession.id, { useDifferentApproachMode });
    }
  }, [useDifferentApproachMode, currentSession?.id]);

  // Save auto quiz state when it changes
  useEffect(() => {
    if (currentSession) {
      LangflowService.saveSessionAutoQuizState(currentSession.id, { autoQuizActive, autoQuizCount, pendingAutoQuiz });
    }
  }, [autoQuizActive, autoQuizCount, pendingAutoQuiz, currentSession?.id]);

  // Save text input state when it changes
  useEffect(() => {
    if (currentSession) {
      LangflowService.saveSessionTextInputState(currentSession.id, { isTextInputEnabled });
    }
  }, [isTextInputEnabled, currentSession?.id]);

  // Save manual input state when it changes
  useEffect(() => {
    if (currentSession) {
      LangflowService.saveSessionManualInputState(currentSession.id, { isManualTextInputEnabled });
    }
  }, [isManualTextInputEnabled, currentSession?.id]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChat]);

  // Refresh messages when current session changes
  useEffect(() => {
    if (currentSession) {
      const sessionMessages = LangflowService.getSessionMessages(currentSession.id);
      setMessages(sessionMessages);
    }
  }, [currentSession?.id]);

  // Poll for message updates when in chat view
  useEffect(() => {
    if (!showChat || !currentSession) return;
    
    const interval = setInterval(() => {
      const sessionMessages = LangflowService.getSessionMessages(currentSession.id);
      if (sessionMessages.length !== messages.length) {
        setMessages(sessionMessages);
      }
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, [showChat, currentSession?.id, messages.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSessionSelect = (session: Session) => {
    setCurrentSession(session);
    setShowSessionManager(false);
    setShowChat(true);
    // Load existing messages for this session
    const sessionMessages = LangflowService.getSessionMessages(session.id);
    setMessages(sessionMessages);
    // All state will be loaded by useEffect based on session ID
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', form);
    
    // Add validation to ensure all required fields are filled
    if (!selectedStandard) {
      console.log('Standard is not selected, showing error');
      setError('Please select a standard');
      return;
    }
    if (!selectedSubject) {
      console.log('Subject is not selected, showing error');
      setError('Please select a subject');
      return;
    }
    if (!selectedChapter) {
      console.log('Chapter is not selected, showing error');
      setError('Please select a chapter');
      return;
    }
    if (!selectedTopic) {
      console.log('Topic is not selected, showing error');
      setError('Please select a topic');
      return;
    }
    
    console.log('Starting form submission process...');
    setIsLoading(true);
    setError(null);
    
    try {
      // Always create a new session for mentor requests
      console.log('Creating new session for topic:', form.topic);
      const newSession = LangflowService.createSession(form.topic);
      console.log('New session created:', newSession);
      setCurrentSession(newSession);
      
      // Build the prompt for the Super Teacher bot
      const prompt = `Hey, I need your help to break down the topic "${form.topic}" into 4 simple learning steps.

Here's what you should know:

Standard: ${form.standard}
Subject: ${form.subject}
Chapter: ${form.chapter}
Topic: ${form.topic}
Learning Objective: ${form.objectives}
Prerequisite Knowledge: ${form.prerequisites}

I want a detailed, easy-to-understand explanation for each step. Use simple language, add real-life examples wherever possible, and if there are types, categories, or different variations of the topic, please include those too.

Basically, I want a clear, structured explanation that makes it easy for beginners to understand the topic confidently.`;
      
      console.log('Built prompt:', prompt);
      
      const initialMessages = [
        { sender: 'user', text: prompt }
      ];
      setMessages(initialMessages);
      // Save initial messages to session
      LangflowService.saveSessionMessages(newSession.id, initialMessages);
      setShowChat(true);
      setFirstReplyAwaitingYesNo(true); // Await Yes/No after first reply
      setUseDifferentApproachMode(false); // Reset different approach mode
      setIsTextInputEnabled(false); // Disable text input initially
      console.log('Switched to chat view');

      // Save initial state to session
      LangflowService.saveSessionFirstReplyState(newSession.id, { firstReplyAwaitingYesNo: true });
      LangflowService.saveSessionDifferentApproachState(newSession.id, { useDifferentApproachMode: false });
      LangflowService.saveSessionTextInputState(newSession.id, { isTextInputEnabled: false });
      LangflowService.saveSessionManualInputState(newSession.id, { isManualTextInputEnabled: false });
      LangflowService.saveSessionAutoQuizState(newSession.id, { autoQuizActive: false, autoQuizCount: 0, pendingAutoQuiz: false });

      // Send to Langflow API with the new session ID
      console.log('Sending message to Langflow API...');
      const aiResponse = await LangflowService.sendMessage(prompt, newSession.id);
      console.log('Received Super Teacher response:', aiResponse);
      
      // Check if this is a demo response
      const isDemoResponse = aiResponse.includes('(Demo Mode)');
      
      const updatedMessages = [...initialMessages, { 
        sender: 'ai', 
        text: aiResponse,
        isDemo: isDemoResponse
      }];
      setMessages(updatedMessages);
      // Save updated messages to session
      LangflowService.saveSessionMessages(newSession.id, updatedMessages);
      
      // Show demo mode notification if applicable
      if (isDemoResponse) {
        console.log('Demo mode active - Langflow API not available');
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Failed to get Super Teacher response');
    } finally {
      setIsLoading(false);
      console.log('Form submission completed');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    const updatedMessages = [...messages, { sender: 'user', text: userMessage }];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Save user message to session
    if (currentSession) {
      LangflowService.saveSessionMessages(currentSession.id, updatedMessages);
    }

    // If user is in 'use different approach' mode and types 'I want to ask another question' (or similar), reset the flow
    if (useDifferentApproachMode && /i want to ask( another)? question/i.test(userMessage)) {
      setFirstReplyAwaitingYesNo(true);
      setUseDifferentApproachMode(false);
    }

    // Auto-detect quiz intent
    if (/take\s*quiz/i.test(userMessage)) {
      setPendingAutoQuiz(true);
      setIsQuizMode(true);
      setQuizResponseCount(0);
      setIsTextInputEnabled(false);
    }

    try {
      // Send to Langflow API with session ID
      const aiResponse = await LangflowService.sendMessage(userMessage, currentSession?.id);
      console.log('Super Teacher Response received:', aiResponse);
      console.log('Super Teacher Response length:', aiResponse.length);
      console.log('Super Teacher Response preview:', aiResponse.substring(0, 200) + '...');
      // Ignore JSON object responses
      let isJson = false;
      let parsed;
      try {
        parsed = JSON.parse(aiResponse);
        isJson = typeof parsed === 'object' && parsed !== null;
      } catch (e) {
        isJson = false;
      }
      if (!isJson) {
        // If pendingAutoQuiz, activate quiz mode now
        if (pendingAutoQuiz) {
          setAutoQuizActive(true);
          setAutoQuizCount(0);
          setPendingAutoQuiz(false);
        }
        
        // If in quiz mode, increment response count
        if (isQuizMode) {
          setQuizResponseCount(count => count + 1);
          
          // Check if quiz mode should end after 5 responses
          if (quizResponseCount + 1 >= 5) {
            setIsQuizMode(false);
            setIsTextInputEnabled(false); // Keep disabled to show final buttons
          }
        }
        
        const finalMessages = [...updatedMessages, { sender: 'ai', text: aiResponse }];
        setMessages(finalMessages);
        // Save Super Teacher response to session
        if (currentSession) {
          LangflowService.saveSessionMessages(currentSession.id, finalMessages);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get Super Teacher response');
      console.error('Error in handleSend:', err);
      // Add error message to chat
      const errorMessages = [...updatedMessages, { 
        sender: 'ai', 
        text: 'I apologize, but I encountered an error processing your message. Please try again.' 
      }];
      setMessages(errorMessages);
      // Save error message to session
      if (currentSession) {
        LangflowService.saveSessionMessages(currentSession.id, errorMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickResponse = async (response: string) => {
    // Handle Yes/No after first reply
    if (firstReplyAwaitingYesNo && (response === 'Yes' || response === 'No')) {
      setFirstReplyAwaitingYesNo(false); // Now show the four options after explanation
    }
    // Handle 'Use a different approach'
    if (response === 'Use a different approach') {
      setUseDifferentApproachMode(true);
      setFirstReplyAwaitingYesNo(false);
      setIsQuizActive(false);
      setQuizQuestionCount(0);
      setIsFiveYearOldMode(false);
      setFiveYearOldStep('initial');
      setIsTextInputEnabled(true); // Enable text input for different approach mode
    }
    // If user asks another question in different approach mode, reset flow
    if (useDifferentApproachMode && response === 'I want to ask another question') {
      setUseDifferentApproachMode(false);
      setFirstReplyAwaitingYesNo(true);
      setIsTextInputEnabled(false); // Disable text input when going back to Yes/No
    }
    
    // Quiz start/retake logic
    if (response === 'I want to take quiz' || response === 'Retake the quiz') {
      setIsQuizActive(true);
      setQuizQuestionCount(0); // Reset to 0 for new quiz
      setIsFiveYearOldMode(false); // Exit 5-year-old mode
      setFiveYearOldStep('initial');
      setIsTextInputEnabled(false); // Disable text input during quiz
      setIsQuizMode(true); // Enable quiz mode
      setQuizResponseCount(0); // Reset quiz response count
    }
    if (response === 'I want to ask another question') {
      setIsQuizActive(false);
      setQuizQuestionCount(0);
      setIsFiveYearOldMode(false); // Exit 5-year-old mode
      setFiveYearOldStep('initial');
      setIsTextInputEnabled(false); // Disable text input when asking another question
      setIsQuizMode(false); // Disable quiz mode
      setQuizResponseCount(0); // Reset quiz response count
    }
    
    // 5-year-old mode logic
    if (response === 'I want you to explain like a 5-year-old') {
      setIsFiveYearOldMode(true);
      setFiveYearOldStep('after_explanation');
      setIsQuizActive(false); // Exit quiz mode
      setQuizQuestionCount(0);
      setIsTextInputEnabled(false); // Disable text input during 5-year-old mode
    }
    if (response === 'I understand' && isFiveYearOldMode) {
      setIsFiveYearOldMode(false);
      setFiveYearOldStep('initial');
      setIsTextInputEnabled(true); // Enable text input after understanding
    }
    // Handle "I understand" from main options (not in 5-year-old mode)
    if (response === 'I understand' && !isFiveYearOldMode) {
      setIsTextInputEnabled(true); // Enable text input after understanding
    }
    if (response === 'explain with another example') {
      setFiveYearOldStep('after_another_example');
      setIsTextInputEnabled(false); // Keep disabled during example explanation
    }
    if (response === 'yes' && fiveYearOldStep === 'after_another_example') {
      setIsFiveYearOldMode(false);
      setFiveYearOldStep('initial');
      setIsTextInputEnabled(true); // Enable text input after understanding
    }
    if (response === 'no' && fiveYearOldStep === 'after_another_example') {
      setIsFiveYearOldMode(false);
      setFiveYearOldStep('initial');
      setIsTextInputEnabled(true); // Enable text input after understanding
    }
    
    const updatedMessages = [...messages, { sender: 'user', text: response }];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    // Save user quick response to session
    if (currentSession) {
      LangflowService.saveSessionMessages(currentSession.id, updatedMessages);
    }

    try {
      // Send to Langflow API with session ID
      const aiResponse = await LangflowService.sendMessage(response, currentSession?.id);
      const isDemoResponse = aiResponse.includes('(Demo Mode)');
      // Ignore JSON object responses
      let isJson = false;
      let parsed;
      try {
        parsed = JSON.parse(aiResponse);
        isJson = typeof parsed === 'object' && parsed !== null;
      } catch (e) {
        isJson = false;
      }
      if (!isJson) {
        const finalMessages = [...updatedMessages, { 
          sender: 'ai', 
          text: aiResponse,
          isDemo: isDemoResponse
        }];
        setMessages(finalMessages);
        // Save Super Teacher response to session
        if (currentSession) {
          LangflowService.saveSessionMessages(currentSession.id, finalMessages);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get Super Teacher response');
      const errorMessages = [...updatedMessages, { 
        sender: 'ai', 
        text: 'I apologize, but I encountered an error processing your response. Please try again.' 
      }];
      setMessages(errorMessages);
      // Save error message to session
      if (currentSession) {
        LangflowService.saveSessionMessages(currentSession.id, errorMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizAnswer = async (answer: string) => {
    const updatedMessages = [...messages, { sender: 'user', text: answer }];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);
    
    // Save quiz answer to session
    if (currentSession) {
      LangflowService.saveSessionMessages(currentSession.id, updatedMessages);
    }

    // If auto quiz is active, increment count
    if (autoQuizActive) {
      setAutoQuizCount(count => {
        if (count + 1 >= 5) {
          setAutoQuizActive(false);
          setIsTextInputEnabled(true); // Enable text input after auto quiz completion
          return 0;
        }
        return count + 1;
      });
    }

    try {
      // Increment quiz question count
      setQuizQuestionCount(count => count + 1);
      // Increment quiz response count for quiz mode
      setQuizResponseCount(count => count + 1);
      // Send to Langflow API with session ID
      const aiResponse = await LangflowService.sendMessage(answer, currentSession?.id);
      const isDemoResponse = aiResponse.includes('(Demo Mode)');
      // Ignore JSON object responses
      let isJson = false;
      let parsed;
      try {
        parsed = JSON.parse(aiResponse);
        isJson = typeof parsed === 'object' && parsed !== null;
      } catch (e) {
        isJson = false;
      }
      if (!isJson) {
        const finalMessages = [...updatedMessages, { 
          sender: 'ai', 
          text: aiResponse,
          isDemo: isDemoResponse
        }];
        setMessages(finalMessages);
        // Save Super Teacher response to session
        if (currentSession) {
          LangflowService.saveSessionMessages(currentSession.id, finalMessages);
        }
        
        // Enable text input after quiz completion (5 questions)
        if (quizQuestionCount + 1 >= 5) {
          setIsTextInputEnabled(true);
        }
        
        // Check if quiz mode should end after 5 responses
        if (isQuizMode && quizResponseCount + 1 >= 5) {
          setIsQuizMode(false);
          setIsTextInputEnabled(false); // Keep disabled to show final buttons
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get Super Teacher response');
      const errorMessages = [...updatedMessages, { 
        sender: 'ai', 
        text: 'I apologize, but I encountered an error processing your answer. Please try again.' 
      }];
      setMessages(errorMessages);
      // Save error message to session
      if (currentSession) {
        LangflowService.saveSessionMessages(currentSession.id, errorMessages);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuizQuestions = () => {
    // Quiz questions will be generated by the backend
    return [];
  };

  const generateQuizFeedback = (question: any, isCorrect: boolean, answer: string) => {
    // Feedback will be provided by the backend
    return '';
  };

  const calculateQuizScore = () => {
    // Score calculation will be handled by the backend
    return 0;
  };

  const generateQuizCompletion = (score: number) => {
    // Completion message will be provided by the backend
    return '';
  };

  // Helper to detect if a message is a quiz question (contains (A), (B), (C), (D))
  function isQuizQuestionMessage(text: string) {
    return (
      /\(A\)/.test(text) &&
      /\(B\)/.test(text) &&
      /\(C\)/.test(text) &&
      /\(D\)/.test(text)
    );
  }

  const standards = curriculumData;
  const subjects = selectedStandard
    ? (selectedStandard.subjects.length > 0
        ? selectedStandard.subjects
        : [{ id: -1, subject_name: 'Type your own...', chapters: [] }])
    : [];
  const chapters = selectedSubject
    ? ([{ id: -1, chapter_number: -1, chapter_name: 'Type your own...', topics: [] }, ...selectedSubject.chapters])
    : [];
  const topics = selectedChapter
    ? ([{ id: -1, topic_name: 'Type your own...' }, ...selectedChapter.topics])
    : [];

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      {/* Decorative BG element */}
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-blue-300 via-purple-200 to-pink-200 rounded-full blur-3xl opacity-60 z-0 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-pink-200 via-purple-100 to-blue-200 rounded-full blur-2xl opacity-50 z-0" />
      {/* Science & Math SVGs - new set */}
      {/* Atom */}
      <svg className="absolute left-10 top-10 w-20 h-20 opacity-50 z-0" viewBox="0 0 64 64" fill="none">
        <ellipse cx="32" cy="32" rx="28" ry="12" stroke="#6366F1" strokeWidth="3" />
        <ellipse cx="32" cy="32" rx="12" ry="28" stroke="#6366F1" strokeWidth="3" />
        <circle cx="32" cy="32" r="4" fill="#6366F1" />
      </svg>
      {/* Rocket */}
      <svg className="absolute right-24 top-24 w-16 h-24 opacity-50 z-0" viewBox="0 0 64 96" fill="none">
        <rect x="28" y="16" width="8" height="40" rx="4" fill="#F59E42" />
        <polygon points="32,8 40,24 24,24" fill="#F59E42" />
        <rect x="28" y="56" width="8" height="16" rx="4" fill="#F59E42" />
      </svg>
      {/* Calculator */}
      <svg className="absolute left-1/2 bottom-16 w-20 h-20 opacity-50 z-0" style={{ transform: 'translateX(-50%)' }} viewBox="0 0 64 64" fill="none">
        <rect x="12" y="12" width="40" height="40" rx="8" fill="#10B981" />
        <rect x="20" y="20" width="8" height="8" fill="#fff" />
        <rect x="36" y="20" width="8" height="8" fill="#fff" />
        <rect x="20" y="36" width="8" height="8" fill="#fff" />
        <rect x="36" y="36" width="8" height="8" fill="#fff" />
      </svg>
      {/* Microscope */}
      <svg className="absolute right-10 bottom-24 w-20 h-20 opacity-50 z-0" viewBox="0 0 64 64" fill="none">
        <rect x="28" y="12" width="8" height="28" rx="4" fill="#6366F1" />
        <rect x="20" y="40" width="24" height="8" rx="4" fill="#6366F1" />
        <circle cx="32" cy="52" r="6" fill="#6366F1" />
      </svg>
      {/* Math Sigma */}
      <svg className="absolute left-16 bottom-32 w-16 h-16 opacity-50 z-0" viewBox="0 0 64 64" fill="none">
        <text x="50%" y="60%" textAnchor="middle" fill="#BE185D" fontSize="48" fontWeight="bold" dy=".3em">Σ</text>
      </svg>
      {/* DNA Double Helix */}
      <svg className="absolute left-32 top-1/2 w-16 h-32 opacity-50 z-0" style={{ transform: 'translateY(-50%)' }} viewBox="0 0 64 128" fill="none">
        <path d="M16 16 Q32 64 16 112" stroke="#0C4A6E" strokeWidth="4" fill="none" />
        <path d="M48 16 Q32 64 48 112" stroke="#0C4A6E" strokeWidth="4" fill="none" />
        <line x1="16" y1="32" x2="48" y2="32" stroke="#0EA5E9" strokeWidth="2" />
        <line x1="16" y1="64" x2="48" y2="64" stroke="#0EA5E9" strokeWidth="2" />
        <line x1="16" y1="96" x2="48" y2="96" stroke="#0EA5E9" strokeWidth="2" />
      </svg>
      {/* Planet with Rings */}
      <svg className="absolute right-40 top-1/2 w-20 h-20 opacity-50 z-0" style={{ transform: 'translateY(-50%)' }} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="12" fill="#FBBF24" />
        <ellipse cx="32" cy="36" rx="20" ry="6" fill="none" stroke="#F59E42" strokeWidth="3" />
      </svg>
      {/* Lightbulb */}
      <svg className="absolute right-10 top-10 w-14 h-14 opacity-50 z-0" viewBox="0 0 64 64" fill="none">
        <ellipse cx="32" cy="28" rx="12" ry="16" fill="#FDE68A" />
        <rect x="28" y="44" width="8" height="10" rx="4" fill="#F59E42" />
        <rect x="30" y="54" width="4" height="6" rx="2" fill="#F59E42" />
      </svg>
      
      {/* Main UI */}
      <div className={`transition-all duration-700 ease-in-out w-full h-full ${showChat ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`} style={{ position: showChat ? 'absolute' : 'relative', zIndex: 10 }}>
        {!showChat && (
          <div className="w-full max-w-2xl mx-auto p-4 h-full flex items-center justify-center">
            {/* Mentor Form only, no session sidebar */}
            <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto shadow-2xl border-0 bg-gradient-to-br from-blue-50 to-purple-100 relative z-10 p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-blue-900 flex items-center gap-2">
                  Super Teacher Request
                </CardTitle>
                <p className="text-gray-600 mt-1 text-sm">Fill out the details for your learning module. Your Super Teacher will help you craft the perfect lesson!</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Standard */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1 flex items-center">
                    Standard
                    <Tooltip text="Select your grade level (9 or 10)" />
                  </label>
                  <SearchableDropdown
                    options={standards.map(s => ({ id: s.id, name: s.standard_name }))}
                    value={selectedStandard ? { id: selectedStandard.id, name: selectedStandard.standard_name } : null}
                    onValueChange={option => {
                      setSelectedStandard(option ? standards.find(s => s.id === option.id) || null : null);
                      setForm(prev => ({ ...prev, standard: option ? option.name : '' }));
                      setTimeout(() => {
                        subjectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        subjectRef.current?.focus();
                      }, 100);
                    }}
                    placeholder="Select Standard"
                    searchPlaceholder="Search standards..."
                  />
                </div>
                {/* Subject */}
                <div ref={subjectRef}>
                  <label className="block text-sm font-semibold text-gray-800 mb-1 flex items-center">
                    Subject
                    <Tooltip text="The subject area (e.g., Mathematics, Science & Technology)" />
                  </label>
                  <SearchableDropdown
                    options={subjects.map(s => ({ id: s.id, name: s.subject_name }))}
                    value={selectedSubject ? { id: selectedSubject.id, name: selectedSubject.subject_name } : null}
                    onValueChange={option => {
                      setSelectedSubject(option ? subjects.find(s => s.id === option.id) || null : null);
                      setForm(prev => ({ ...prev, subject: option ? option.name : '' }));
                      if (option && option.id === -1) setCustomSubject('');
                      setTimeout(() => {
                        chapterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        chapterRef.current?.focus();
                      }, 100);
                    }}
                    placeholder="Select Subject"
                    searchPlaceholder="Search subjects..."
                    disabled={!selectedStandard}
                  />
                  {selectedSubject && selectedSubject.id === -1 && (
                    <input
                      ref={chapterRef}
                      type="text"
                      value={customSubject}
                      onChange={e => {
                        setCustomSubject(e.target.value);
                        setForm(prev => ({ ...prev, subject: e.target.value }));
                      }}
                      placeholder="Type your subject..."
                      className="mt-2 w-full border rounded px-3 py-2"
                    />
                  )}
                </div>
                {/* Chapter */}
                <div ref={chapterRef}>
                  <label className="block text-sm font-semibold text-gray-800 mb-1 flex items-center">
                    Chapter
                    <Tooltip text="The specific chapter or unit within the subject" />
                  </label>
                  <SearchableDropdown
                    options={chapters.map(c => ({ id: c.id, name: c.chapter_name }))}
                    value={selectedChapter ? { id: selectedChapter.id, name: selectedChapter.chapter_name } : null}
                    onValueChange={option => {
                      setSelectedChapter(option ? chapters.find(c => c.id === option.id) || null : null);
                      setForm(prev => ({ ...prev, chapter: option ? option.name : '' }));
                      if (option && option.id === -1) setCustomChapter('');
                      setTimeout(() => {
                        topicRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        topicRef.current?.focus();
                      }, 100);
                    }}
                    placeholder="Select Chapter"
                    searchPlaceholder="Search chapters..."
                    disabled={!selectedSubject}
                  />
                  {selectedChapter && selectedChapter.id === -1 && (
                    <input
                      ref={topicRef}
                      type="text"
                      value={customChapter}
                      onChange={e => {
                        setCustomChapter(e.target.value);
                        setForm(prev => ({ ...prev, chapter: e.target.value }));
                      }}
                      placeholder="Type your chapter..."
                      className="mt-2 w-full border rounded px-3 py-2"
                    />
                  )}
                </div>
                {/* Topic */}
                <div ref={topicRef}>
                  <label className="block text-sm font-semibold text-gray-800 mb-1 flex items-center">
                    Topic
                    <Tooltip text="The specific topic or concept within the chapter" />
                  </label>
                  <SearchableDropdown
                    options={topics.map(t => ({ id: t.id, name: t.topic_name }))}
                    value={selectedTopic ? { id: selectedTopic.id, name: selectedTopic.topic_name } : null}
                    onValueChange={option => {
                      setSelectedTopic(option ? topics.find(t => t.id === option.id) || null : null);
                      setForm(prev => ({ ...prev, topic: option ? option.name : '' }));
                      if (option && option.id === -1) setCustomTopic('');
                    }}
                    placeholder="Select Topic"
                    searchPlaceholder="Search topics..."
                    disabled={!selectedChapter}
                  />
                  {selectedTopic && selectedTopic.id === -1 && (
                    <input
                      type="text"
                      value={customTopic}
                      onChange={e => {
                        setCustomTopic(e.target.value);
                        setForm(prev => ({ ...prev, topic: e.target.value }));
                      }}
                      placeholder="Type your topic..."
                      className="mt-2 w-full border rounded px-3 py-2"
                    />
                  )}
                </div>
                {/* Learning Objectives */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1 flex items-center">
                    Learning Objectives
                    <Tooltip text="What do you want to achieve? List objectives, one per line." />
                  </label>
                  <Textarea name="objectives" value={form.objectives} onChange={handleChange} rows={2} placeholder="e.g.\nExplain spooky action at distance\nCalculate entanglement probability" className="bg-white/80" />
                </div>
                {/* Prerequisite Knowledge */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1 flex items-center">
                    Prerequisite Knowledge
                    <Tooltip text="What should the learner already know? List prerequisites, one per line." />
                  </label>
                  <Textarea name="prerequisites" value={form.prerequisites} onChange={handleChange} rows={1} placeholder="e.g.\nbasic quantum mechanics\nlinear algebra" className="bg-white/80" />
                </div>
                <div className="pt-2 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isLoading || !selectedStandard || !selectedSubject || !selectedChapter || !selectedTopic}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending to Super Teacher...
                      </>
                    ) : (
                      'Send to Super Teacher'
                    )}
                  </Button>
                </div>
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
              </CardContent>
            </form>
          </div>
        )}
      </div>
      
      {/* Chat UI */}
      {showChat && (
        <div className="absolute inset-0 w-full h-full flex flex-col z-20 transition-all duration-700 ease-in-out opacity-100 scale-100">
          {/* Chat header */}
          <div className="w-full flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-lg z-30">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="mr-2 p-2 rounded bg-white/10 hover:bg-white/20 text-white focus:outline-none"
                onClick={() => setShowSessionManager((v) => !v)}
                title={showSessionManager ? 'Hide sessions' : 'Show sessions'}
              >
                {/* Hamburger icon */}
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect y="4" width="24" height="2" rx="1" fill="currentColor"/><rect y="11" width="24" height="2" rx="1" fill="currentColor"/><rect y="18" width="24" height="2" rx="1" fill="currentColor"/></svg>
              </button>
              <img src="/images/mentor2.png" alt="Super Teacher" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-purple-400 shadow-md bg-white object-cover" />
              <span className="text-white text-lg sm:text-2xl font-bold tracking-wide drop-shadow">Super Teacher</span>
              {currentSession && (
                <span className="text-white/80 text-sm">• {currentSession.name}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-xs sm:text-sm font-medium">Advanced Learning Assistant</span>
              {isManualTextInputEnabled && (
                <span className="text-white/90 text-xs sm:text-sm font-medium bg-green-500/20 px-2 py-1 rounded-full flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Keyboard Mode
                </span>
              )}
              <button
                type="button"
                className="ml-4 px-3 py-1 rounded bg-white/20 hover:bg-white/40 text-white font-semibold text-sm transition"
                onClick={() => window.location.href = '/dashboard'}
              >
                Back
              </button>
            </div>
          </div>
          
          {/* Chat content with session manager */}
          <div className="flex-1 flex overflow-hidden">
            {/* Session Manager Sidebar (only in chat) */}
            {showSessionManager && (
              <div className="w-80 border-r border-gray-200 bg-white p-4 overflow-y-auto transition-all duration-300">
                <SessionManager 
                  onSessionSelect={handleSessionSelect}
                  currentSessionId={currentSession?.id}
                />
              </div>
            )}
            
            {/* Chat messages */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 sm:py-8 flex flex-col gap-4 sm:gap-6 max-h-[calc(100vh-120px)] min-h-0 pb-40" style={{ minHeight: 0 }}>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-end w-full`}>
                    {msg.sender === 'ai' && (
                      <div className="mr-2 sm:mr-3">{aiAvatar}</div>
                    )}
                    <div className={`relative max-w-full overflow-x-auto px-4 sm:px-6 py-3 sm:py-4 rounded-3xl shadow-xl text-base font-medium transition-all whitespace-pre-wrap break-words
                      ${msg.sender === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-br-2xl rounded-tr-3xl animate-fade-in-right'
                        : 'bg-gradient-to-br from-purple-200 to-pink-200 text-gray-900 rounded-bl-2xl rounded-tl-3xl animate-fade-in-left'}
                    `}>
                      {msg.sender === 'ai' ? msg.text.replace(/\*\*/g, '') : msg.text}
                      {msg.sender === 'ai' && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Response length: {msg.text.length} characters</span>
                          {msg.isDemo && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Demo Mode
                            </span>
                          )}
                          <button
                            className="text-xs text-blue-600 underline ml-2"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.text);
                              alert('Raw response copied to clipboard!');
                            }}
                          >
                            Copy Raw Response
                          </button>
                        </div>
                      )}
                    </div>
                    {msg.sender === 'user' && (
                      <div className="ml-2 sm:mr-3">{userAvatar}</div>
                    )}
                  </div>
                ))}
                
                {/* Quick Response Buttons - Show after Super Teacher response */}
                {(() => {
                  if (messages.length === 0 || isLoading) return null;
                  const lastMessage = messages[messages.length - 1];
                  if (lastMessage.sender !== 'ai') return null;

                  // 1. Yes/No after first reply
                  if (firstReplyAwaitingYesNo) {
                    return (
                      <div className="flex justify-start items-end w-full">
                        <div className="mr-2 sm:mr-3">{aiAvatar}</div>
                        <div className="flex flex-wrap gap-2 max-w-[90vw] sm:max-w-xl">
                          <button onClick={() => handleQuickResponse('Yes')} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">Yes</button>
                          <button onClick={() => handleQuickResponse('No')} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">No</button>
                        </div>
                      </div>
                    );
                  }

                  // 2. If in 'use different approach' mode, do not show any buttons, only allow typing
                  if (useDifferentApproachMode) {
                    return null;
                  }

                  // Show A/B/C/D buttons if the last AI message is a quiz question and not in special modes
                  if (
                    isQuizQuestionMessage(lastMessage.text) &&
                    !useDifferentApproachMode &&
                    !isFiveYearOldMode
                  ) {
                    return (
                      <div className="flex justify-start items-end w-full">
                        <div className="mr-2 sm:mr-3">{aiAvatar}</div>
                        <div className="flex flex-wrap gap-2 max-w-[90vw] sm:max-w-xl">
                          <button onClick={() => handleQuizAnswer('A')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">A</button>
                          <button onClick={() => handleQuizAnswer('B')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">B</button>
                          <button onClick={() => handleQuizAnswer('C')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">C</button>
                          <button onClick={() => handleQuizAnswer('D')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">D</button>
                        </div>
                      </div>
                    );
                  }

                  // Quiz mode: Show retake/ask another question after 5 responses in quiz mode
                  if (!isQuizMode && quizResponseCount >= 5 && isQuizQuestionMessage(lastMessage.text)) {
                    return (
                      <div className="flex justify-start items-end w-full">
                        <div className="mr-2 sm:mr-3">{aiAvatar}</div>
                        <div className="flex flex-wrap gap-2 max-w-[90vw] sm:max-w-xl">
                          <button onClick={() => handleQuickResponse('I want to ask another question')} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">I want to ask another question</button>
                          <button onClick={() => handleQuickResponse('Retake the quiz')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">Retake the quiz</button>
                        </div>
                      </div>
                    );
                  }

                  // Quiz mode: Show retake/ask another question after 5 questions (count 5), but only if the user actually took the quiz
                  if (isQuizActive && quizQuestionCount >= 5) {
                    // Check if the last 5 user messages were quiz answers (A/B/C/D)
                    const userQuizAnswers = messages.filter(m => m.sender === 'user' && ['A','B','C','D'].includes(m.text)).slice(-5);
                    if (userQuizAnswers.length === 5) {
                      return (
                        <div className="flex justify-start items-end w-full">
                          <div className="mr-2 sm:mr-3">{aiAvatar}</div>
                          <div className="flex flex-wrap gap-2 max-w-[90vw] sm:max-w-xl">
                            <button onClick={() => handleQuickResponse('I want to ask another question')} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">I want to ask another question</button>
                            <button onClick={() => handleQuickResponse('Retake the quiz')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">Retake the quiz</button>
                          </div>
                        </div>
                      );
                    }
                  }
                  
                  // 5-year-old mode: Show different buttons based on step
                  if (isFiveYearOldMode) {
                    if (fiveYearOldStep === 'after_explanation') {
                      return (
                        <div className="flex justify-start items-end w-full">
                          <div className="mr-2 sm:mr-3">{aiAvatar}</div>
                          <div className="flex flex-wrap gap-2 max-w-[90vw] sm:max-w-xl">
                            <button onClick={() => handleQuickResponse('I understand')} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">✅ I understand</button>
                            <button onClick={() => handleQuickResponse('explain with another example')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">🔄 Explain with another example</button>
                          </div>
                        </div>
                      );
                    }
                    
                    if (fiveYearOldStep === 'after_another_example') {
                      return (
                        <div className="flex justify-start items-end w-full">
                          <div className="mr-2 sm:mr-3">{aiAvatar}</div>
                          <div className="flex flex-wrap gap-2 max-w-[90vw] sm:max-w-xl">
                            <button onClick={() => handleQuickResponse('yes')} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">✅ Yes</button>
                            <button onClick={() => handleQuickResponse('no')} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">❌ No</button>
                          </div>
                        </div>
                      );
                    }
                  }
                  
                  // After 5 quiz answers in autoQuizActive mode, show only 'I want to ask another question' and 'Retake the quiz' buttons
                  if (autoQuizActive && autoQuizCount >= 5) {
                    return (
                      <div className="flex justify-start items-end w-full">
                        <div className="mr-2 sm:mr-3">{aiAvatar}</div>
                        <div className="flex flex-wrap gap-2 max-w-[90vw] sm:max-w-xl">
                          <button onClick={() => handleQuickResponse('I want to ask another question')} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">I want to ask another question</button>
                          <button onClick={() => handleQuickResponse('Retake the quiz')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors shadow-md">Retake the quiz</button>
                        </div>
                      </div>
                    );
                  }
                  
                  // 3. After explanation, show four options
                  return (
                    <div className="flex justify-start items-end w-full">
                      <div className="mr-2 sm:mr-3">{aiAvatar}</div>
                      <form
                        className="flex flex-wrap gap-2 max-w-[90vw] sm:max-w-xl items-center mb-8 z-20 relative"
                        style={{ paddingBottom: '1rem', justifyContent: 'flex-start' }}
                        onSubmit={e => e.preventDefault()}
                      >
                        <label className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-colors shadow-md cursor-pointer">
                          <input
                            type="radio"
                            name="quick-response"
                            value="I understand"
                            checked={selectedQuickResponse === "I understand"}
                            onChange={() => {
                              setSelectedQuickResponse("I understand");
                              handleQuickResponse("I understand");
                              setSelectedQuickResponse("");
                            }}
                            className="accent-green-600"
                          />
                          <span>✅ I understand</span>
                        </label>
                        <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors shadow-md cursor-pointer">
                          <input
                            type="radio"
                            name="quick-response"
                            value="I want to take quiz"
                            checked={selectedQuickResponse === "I want to take quiz"}
                            onChange={() => {
                              setSelectedQuickResponse("I want to take quiz");
                              handleQuickResponse("I want to take quiz");
                              setSelectedQuickResponse("");
                            }}
                            className="accent-blue-600"
                          />
                          <span>🧠 I want to take quiz</span>
                        </label>
                        <label className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full text-sm font-medium transition-colors shadow-md cursor-pointer">
                          <input
                            type="radio"
                            name="quick-response"
                            value="I want you to explain like a 5-year-old"
                            checked={selectedQuickResponse === "I want you to explain like a 5-year-old"}
                            onChange={() => {
                              setSelectedQuickResponse("I want you to explain like a 5-year-old");
                              handleQuickResponse("I want you to explain like a 5-year-old");
                              setSelectedQuickResponse("");
                            }}
                            className="accent-purple-600"
                          />
                          <span>👶 I want you to explain like a 5-year-old</span>
                        </label>
                        <label className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-sm font-medium transition-colors shadow-md cursor-pointer">
                          <input
                            type="radio"
                            name="quick-response"
                            value="Use a different approach"
                            checked={selectedQuickResponse === "Use a different approach"}
                            onChange={() => {
                              setSelectedQuickResponse("Use a different approach");
                              handleQuickResponse("Use a different approach");
                              setSelectedQuickResponse("");
                            }}
                            className="accent-pink-600"
                          />
                          <span>🔄 Use a different approach</span>
                        </label>
                      </form>
                    </div>
                  );
                })()}
                {/* Loading indicator for Super Teacher response */}
                {isLoading && (
                  <div className="flex justify-start items-end w-full">
                    <div className="mr-2 sm:mr-3">{aiAvatar}</div>
                    <div className="relative max-w-[90vw] sm:max-w-xl px-4 sm:px-6 py-3 sm:py-4 rounded-3xl shadow-xl bg-gradient-to-br from-purple-200 to-pink-200 rounded-bl-2xl rounded-tl-3xl">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <span className="text-gray-600 text-sm">Super Teacher is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
                                {/* Chat input */}
              <div className="w-full flex justify-center z-40 fixed bottom-0 left-0 pointer-events-none">
                <form onSubmit={handleSend} className="w-full max-w-3xl flex flex-row items-end gap-3 bg-white/95 rounded-2xl shadow-2xl px-4 py-3 mx-auto border border-gray-200 pointer-events-auto">
                  {/* Manual text input toggle button */}
                  <button 
                    type="button" 
                    onClick={handleManualTextInputToggle}
                    className={`p-2 rounded-full transition-all duration-200 relative group ${
                      isManualTextInputEnabled 
                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                    }`}
                    title={isManualTextInputEnabled ? 'Disable keyboard mode' : 'Enable keyboard mode (bypass button restrictions)'}
                  >
                    {isManualTextInputEnabled ? (
                      <MessageSquareOff className="w-5 h-5" />
                    ) : (
                      <MessageSquare className="w-5 h-5" />
                    )}
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {isManualTextInputEnabled ? 'Disable keyboard mode' : 'Enable keyboard mode'}
                    </span>
                  </button>
                  {/* Attachment button (future) */}
                  <button type="button" disabled className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition" title="Attach file (coming soon)">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  {/* Multiline input */}
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={
                      isLoading 
                        ? "Super Teacher is thinking..." 
                        : !isTextInputEnabled && !isManualTextInputEnabled
                          ? "Use the buttons above to continue..." 
                          : isManualTextInputEnabled
                            ? "Keyboard mode: Type your message..."
                            : "Type your message..."
                    }
                    rows={1}
                    maxLength={1000}
                    disabled={isLoading || (!isTextInputEnabled && !isManualTextInputEnabled)}
                    className="flex-1 resize-none bg-white rounded-xl px-5 py-4 text-lg sm:text-xl shadow-none border border-gray-200 focus:ring-2 focus:ring-blue-400 min-h-[48px] max-h-40 text-left transition placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ minHeight: '48px', maxHeight: '160px', overflowY: 'auto' }}
                    onInput={e => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = '48px';
                      target.style.height = Math.min(target.scrollHeight, 160) + 'px';
                    }}
                  />
                  {/* Send button */}
                  <button
                    type="submit"
                    className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!input.trim() || isLoading || (!isTextInputEnabled && !isManualTextInputEnabled)}
                    title="Send"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-6 h-6" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Back button for mentor request form */}
      {!showChat && (
        <button
          type="button"
          className="absolute top-4 left-4 px-4 py-2 rounded bg-white/80 hover:bg-white text-blue-700 font-semibold shadow z-20"
          onClick={() => window.location.href = '/dashboard'}
        >
          Back
        </button>
      )}
    </div>
  );
}

// Add animation for chat bubble
// In your global CSS (e.g., globals.css), add:
// @keyframes fade-in-right { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
// @keyframes fade-in-left { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
// .animate-fade-in-right { animation: fade-in-right 0.5s ease; }
// .animate-fade-in-left { animation: fade-in-left 0.5s ease; } 