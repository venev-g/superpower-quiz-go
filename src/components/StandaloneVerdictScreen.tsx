import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download, Share2, RotateCcw, Eye } from 'lucide-react';
import { QuizType } from './QuizSelectionScreen';
import { StandaloneQuizService } from '@/lib/services/StandaloneQuizService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';

interface StandaloneVerdictScreenProps {
  quizType: QuizType;
  sessionId: string;
  onBack: () => void;
  onRestart: () => void;
}

const StandaloneVerdictScreen: React.FC<StandaloneVerdictScreenProps> = ({ 
  quizType, 
  sessionId, 
  onBack, 
  onRestart 
}) => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const hasCalledAPI = useRef(false);

  const fetchResult = useCallback(async () => {
    if (!user || hasCalledAPI.current) return;
    
    try {
      setLoading(true);
      hasCalledAPI.current = true; // Prevent multiple calls
      
      // First try to call the webhook
      const webhookResult = await StandaloneQuizService.callQuizWebhook(
        quizType.id,
        sessionId,
        user.id
      );
      
      if (webhookResult.success && webhookResult.data) {
        setResult(webhookResult.data);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        // Fallback to database result
        const dbResult = await StandaloneQuizService.fetchResultFromDatabase(
          sessionId,
          user.id,
          quizType.id
        );
        
        if (dbResult.success && dbResult.data) {
          setResult(dbResult.data);
        } else {
          // Provide a fallback message
          setResult(`# ${quizType.title} Result\n\nThank you for completing the ${quizType.title} quiz! Your results are being processed and will be available shortly.`);
        }
      }
    } catch (error) {
      console.error('Error fetching result:', error);
      toast({
        title: "Error",
        description: "Failed to fetch results. Please try again.",
        variant: "destructive",
      });
      setResult(`# ${quizType.title} Result\n\nThank you for completing the quiz! There was an issue fetching your detailed results, but your responses have been saved.`);
    } finally {
      setLoading(false);
    }
  }, [user, quizType, sessionId, toast]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  const handleSaveAsPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(quizType.title, margin, 30);
      
      // Date
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 45);
      
      // Content - clean and format the result
      const cleanedContent = parseAndCleanMarkdown(result);
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(cleanedContent.replace(/[#*]/g, ''), maxWidth);
      doc.text(lines, margin, 65);
      
      // Save the PDF
      doc.save(`${quizType.title.replace(/[^a-zA-Z0-9]/g, '_')}_Result.pdf`);
      
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: quizType.title,
          text: `I just completed the ${quizType.title} quiz! Check out my results.`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Link copied to clipboard!",
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const handleViewDashboard = () => {
    navigate('/dashboard');
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
      <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({children}) => (
              <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-2">
                {children}
              </h1>
            ),
            h2: ({children}) => (
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-6">
                {children}
              </h2>
            ),
            h3: ({children}) => (
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">
                {children}
              </h3>
            ),
            p: ({children}) => (
              <p className="mb-4 text-gray-700 leading-relaxed">
                {children}
              </p>
            ),
            ul: ({children}) => (
              <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
                {children}
              </ul>
            ),
            ol: ({children}) => (
              <ol className="list-decimal list-inside mb-4 space-y-2 ml-4">
                {children}
              </ol>
            ),
            li: ({children}) => (
              <li className="text-gray-700 leading-relaxed">
                {children}
              </li>
            ),
            strong: ({children}) => (
              <strong className="font-bold text-gray-900">
                {children}
              </strong>
            ),
            em: ({children}) => (
              <em className="italic text-gray-800">
                {children}
              </em>
            ),
            blockquote: ({children}) => (
              <blockquote className="border-l-4 border-blue-500 pl-6 italic text-gray-700 my-6 bg-blue-50 py-4 rounded-r-lg">
                {children}
              </blockquote>
            ),
            code: ({children, className}) => {
              const isBlock = className?.includes('language-');
              return isBlock ? (
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4">
                  <code className="text-sm text-gray-800 font-mono">{children}</code>
                </pre>
              ) : (
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                  {children}
                </code>
              );
            },
            // Handle emoji and special characters better
            text: ({children}) => {
              if (typeof children === 'string') {
                // Process emoji patterns
                return children;
              }
              return children;
            }
          }}
        >
          {cleanContent}
        </ReactMarkdown>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">{quizType.emoji}</div>
          <p className="text-gray-600">Analyzing your responses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            >
              {['🎉', '✨', '🌟', '💫', '⭐'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-800">
                Your Results
              </h1>
              <p className="text-sm text-gray-600">
                {quizType.title}
              </p>
            </div>
            
            <div className="w-20"> {/* Spacer */}</div>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="text-6xl animate-bounce">{quizType.emoji}</div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Quiz Complete!
            </h2>
            <p className="text-lg text-gray-600">
              Here are your personalized results for {quizType.title}
            </p>
          </div>

          {/* Results Card */}
          <Card className="p-8 bg-white shadow-xl rounded-2xl">
            {result ? renderMarkdown(result) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No results available yet. Please try again later.</p>
              </div>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={handleViewDashboard}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              <Eye className="h-4 w-4" />
              <span>View Dashboard</span>
            </Button>
            
            <Button
              onClick={handleSaveAsPDF}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Save as PDF</span>
            </Button>
            
            <Button
              onClick={handleShare}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <Share2 className="h-4 w-4" />
              <span>Share Results</span>
            </Button>
            
            <Button
              onClick={onRestart}
              variant="outline"
              className="flex items-center justify-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retake Quiz</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandaloneVerdictScreen;
