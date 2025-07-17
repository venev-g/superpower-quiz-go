import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Calendar, Target } from 'lucide-react';
import { StandaloneQuizService, UserQuizResult } from '@/lib/services/StandaloneQuizService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';

const StandaloneQuizDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [results, setResults] = useState<UserQuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<UserQuizResult | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userResults = await StandaloneQuizService.getUserQuizResults(user.id);
        setResults(userResults);
      } catch (error) {
        console.error('Error loading results:', error);
        toast({
          title: "Error",
          description: "Failed to load quiz results.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadResults();
    }
  }, [user, toast]);

  const reloadResults = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userResults = await StandaloneQuizService.getUserQuizResults(user.id);
      setResults(userResults);
    } catch (error) {
      console.error('Error loading results:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz results.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getQuizTypeInfo = (quizType: string | null) => {
    switch (quizType) {
      case 'multi-intelligence':
        return {
          title: "What's Your Hidden Superpower?",
          emoji: '🧠',
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          column: 'Dominant Intelligence'
        };
      case 'personality-type':
        return {
          title: 'Who Are You Really?',
          emoji: '🎭',
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          column: 'Personality Pattern'
        };
      case 'learning-style':
        return {
          title: 'Crack Your Style for Laser Focus!',
          emoji: '🎯',
          color: 'bg-purple-500',
          textColor: 'text-purple-700',
          bgColor: 'bg-purple-50',
          column: 'Learning Style'
        };
      default:
        return {
          title: 'Unknown Quiz',
          emoji: '❓',
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          column: 'Unknown'
        };
    }
  };

  const getResultContent = (result: UserQuizResult) => {
    const quizInfo = getQuizTypeInfo(result.quiz_sessions?.quiz_type);
    return result[quizInfo.column as keyof UserQuizResult] as string || 'No result available';
  };

  const handleDownloadPDF = (result: UserQuizResult) => {
    try {
      const quizInfo = getQuizTypeInfo(result.quiz_sessions?.quiz_type);
      const content = getResultContent(result);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(quizInfo.title, margin, 30);
      
      // Date
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date(result.created_at).toLocaleDateString()}`, margin, 45);
      
      // Content - clean and format the result  
      const resultContent = getResultContent(result);
      const cleanedContent = parseAndCleanMarkdown(resultContent);
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(cleanedContent.replace(/[#*]/g, ''), maxWidth);
      doc.text(lines, margin, 65);
      
      // Save the PDF
      doc.save(`${quizInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}_Result.pdf`);
      
      toast({
        title: "Success",
        description: "PDF report saved successfully!",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const parseAndCleanMarkdown = (content: string): string => {
    if (!content) return '';
    
    // Try to parse if it's JSON format
    try {
      // Check if content starts with [{"output": pattern
      if (content.startsWith('[{"output":')) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed[0] && parsed[0].output) {
          return parsed[0].output;
        }
      }
      
      // Check if content starts with {"output": pattern
      if (content.startsWith('{"output":')) {
        const parsed = JSON.parse(content);
        if (parsed.output) {
          return parsed.output;
        }
      }
    } catch (e) {
      // If parsing fails, continue with the original content
      console.log('Content is not JSON, treating as plain text');
    }
    
    // Clean up common formatting issues
    const cleanContent = content
      .replace(/\\n/g, '\n') // Convert literal \n to actual newlines
      .replace(/\\"/g, '"') // Convert escaped quotes
      .replace(/\\\\/g, '\\') // Convert escaped backslashes
      .trim();
    
    return cleanContent;
  };

  const renderMarkdown = (content: string) => {
    const cleanContent = parseAndCleanMarkdown(content);
    
    return (
      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({children}) => <h1 className="text-2xl font-bold text-gray-800 mb-4">{children}</h1>,
            h2: ({children}) => <h2 className="text-xl font-semibold text-gray-800 mb-3">{children}</h2>,
            h3: ({children}) => <h3 className="text-lg font-semibold text-gray-800 mb-2">{children}</h3>,
            p: ({children}) => <p className="mb-3 text-gray-700">{children}</p>,
            ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
            li: ({children}) => <li className="text-gray-700">{children}</li>,
            strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
            em: ({children}) => <em className="italic text-gray-800">{children}</em>,
            blockquote: ({children}) => (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">
                {children}
              </blockquote>
            ),
            code: ({children, className}) => {
              const isBlock = className?.includes('language-');
              return isBlock ? (
                <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
                  <code className="text-sm">{children}</code>
                </pre>
              ) : (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
              );
            },
          }}
        >
          {cleanContent}
        </ReactMarkdown>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Individual Quiz Results</h2>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Individual Quiz Results</h2>
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Individual Quiz Results Yet</h3>
          <p className="text-gray-600 mb-4">
            Take individual quizzes to discover specific aspects of your personality and abilities.
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            Take Individual Quiz
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Individual Quiz Results</h2>
        <Badge variant="outline" className="text-sm">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {results.map((result) => {
          const quizInfo = getQuizTypeInfo(result.quiz_sessions?.quiz_type);
          const content = getResultContent(result);
          
          return (
            <Card key={result.id} className={`p-6 ${quizInfo.bgColor} border-l-4 ${quizInfo.color.replace('bg-', 'border-')}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{quizInfo.emoji}</span>
                    <div>
                      <h3 className={`font-semibold ${quizInfo.textColor}`}>
                        {quizInfo.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(result.created_at).toLocaleDateString()}
                        </span>
                        {result.quiz_sessions?.completed_at && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-700 text-sm mb-4 line-clamp-3">
                    {content.substring(0, 200)}...
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedResult(result)}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <span className="text-2xl">{quizInfo.emoji}</span>
                          <span>{quizInfo.title}</span>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        {renderMarkdown(content)}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadPDF(result)}
                    className="flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>PDF</span>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StandaloneQuizDashboard;
