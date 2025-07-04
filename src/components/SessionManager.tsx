import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button_2';
import { Input } from '@/components/ui/Input_2';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LangflowService, Session } from '@/lib/services/LangflowService';
import { Plus, MessageSquare, Clock, Trash2, Edit3 } from 'lucide-react';

interface SessionManagerProps {
  onSessionSelect: (session: Session) => void;
  currentSessionId?: string;
}

export function SessionManager({ onSessionSelect, currentSessionId }: SessionManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionTopic, setNewSessionTopic] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const allSessions = LangflowService.getSessions();
    setSessions(allSessions);
  };

  const handleCreateSession = () => {
    console.log('handleCreateSession called');
    if (!newSessionTopic.trim()) {
      console.log('No topic entered, aborting');
      return;
    }
    
    console.log('Creating session with topic:', newSessionTopic, 'and name:', newSessionName);
    const newSession = LangflowService.createSession(newSessionTopic, newSessionName || undefined);
    console.log('New session created:', newSession);
    setSessions([newSession, ...sessions]);
    setNewSessionName('');
    setNewSessionTopic('');
    setIsCreateDialogOpen(false);
    console.log('Dialog closed, calling onSessionSelect');
    
    // Create initial prompt for the new session
    const initialPrompt = `Explain ${newSessionTopic} with step by step explanation and examples.`;
    
    // Add initial messages to the session
    const initialMessages = [
      { sender: 'user', text: initialPrompt }
    ];
    LangflowService.saveSessionMessages(newSession.id, initialMessages);
    
    // Initialize all session state variables
    LangflowService.saveSessionFirstReplyState(newSession.id, { firstReplyAwaitingYesNo: true });
    LangflowService.saveSessionDifferentApproachState(newSession.id, { useDifferentApproachMode: false });
    LangflowService.saveSessionTextInputState(newSession.id, { isTextInputEnabled: false });
    LangflowService.saveSessionManualInputState(newSession.id, { isManualTextInputEnabled: false });
    LangflowService.saveSessionAutoQuizState(newSession.id, { autoQuizActive: false, autoQuizCount: 0, pendingAutoQuiz: false });
    LangflowService.saveSessionQuizState(newSession.id, { isQuizActive: false, quizQuestionCount: 0 });
    LangflowService.saveSessionFiveYearOldState(newSession.id, { isFiveYearOldMode: false, fiveYearOldStep: 'initial' });
    LangflowService.saveSessionQuizModeState(newSession.id, { isQuizMode: false, quizResponseCount: 0 });
    
    // Call onSessionSelect with the new session and initial messages
    onSessionSelect(newSession);
    
    // Automatically send the initial prompt to get AI response
    setTimeout(async () => {
      try {
        console.log('Sending initial prompt to AI:', initialPrompt);
        const aiResponse = await LangflowService.sendMessage(initialPrompt, newSession.id);
        console.log('Received AI response:', aiResponse);
        
        // Add AI response to messages
        const updatedMessages = [...initialMessages, { 
          sender: 'ai', 
          text: aiResponse,
          isDemo: aiResponse.includes('(Demo Mode)')
        }];
        LangflowService.saveSessionMessages(newSession.id, updatedMessages);
        
        // Update the session in the list to reflect the new message count
        const updatedSession = { ...newSession, messageCount: 2, lastMessageAt: new Date() };
        LangflowService.updateSession(newSession.id, { messageCount: 2, lastMessageAt: new Date() });
        
        // Reload sessions to show updated message count
        loadSessions();
        
      } catch (error) {
        console.error('Error sending initial prompt:', error);
        // Add error message to chat
        const errorMessages = [...initialMessages, { 
          sender: 'ai', 
          text: 'I apologize, but I encountered an error processing your request. Please try again.' 
        }];
        LangflowService.saveSessionMessages(newSession.id, errorMessages);
      }
    }, 100); // Small delay to ensure the chat view is ready
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      LangflowService.deleteSession(sessionId);
      loadSessions();
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Sessions</CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Session Name (Optional)</label>
                  <Input
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="e.g., Math Tutoring Session"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Topic *</label>
                  <Input
                    value={newSessionTopic}
                    onChange={(e) => setNewSessionTopic(e.target.value)}
                    placeholder="e.g., Quantum Physics"
                    className="mt-1"
                    required
                  />
                </div>
                <Button 
                  onClick={handleCreateSession}
                  disabled={!newSessionTopic.trim()}
                  className="w-full"
                >
                  Create Session
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No sessions yet</p>
              <p className="text-sm">Create your first session to get started</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    currentSessionId === session.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onSessionSelect(session)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{session.name}</h4>
                      <p className="text-xs text-gray-600 truncate">{session.topic}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{session.messageCount} messages</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{getTimeAgo(session.lastMessageAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 