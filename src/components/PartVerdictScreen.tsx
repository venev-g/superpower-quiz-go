import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { QuizEvaluationService } from '@/lib/services/QuizEvaluationService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PartVerdictScreenProps {
  part: number;
  sessionId: string | null;
  userId: string | null;
  onContinue: () => void;
}

const PartVerdictScreen: React.FC<PartVerdictScreenProps> = ({ 
  part, 
  sessionId, 
  userId, 
  onContinue 
}) => {
  const navigate = useNavigate();
  const [apiResponse, setApiResponse] = useState<string>('');
  const [dbResponse, setDbResponse] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [fullReport, setFullReport] = useState<string>('');
  const [fullReportLoading, setFullReportLoading] = useState(false);
  const [initialized, setInitialized] = useState(false); // Flag to prevent multiple initializations
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null); // Track timeout for cleanup
  const { toast } = useToast();

  // Helper function to check if content is JSON
  const isJsonString = (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  // Helper function to format JSON content for Part 4
  const formatJsonContent = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      return (
        <div className="space-y-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="border-l-4 border-purple-300 pl-4">
              <h4 className="font-semibold text-purple-800 text-lg mb-2 capitalize">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h4>
              <div className="text-gray-700 leading-relaxed">
                {typeof value === 'object' ? (
                  <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <p className="text-base">{String(value)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    } catch (error) {
      return <p className="text-gray-700 leading-relaxed">{jsonString}</p>;
    }
  };

  // Helper function to render content based on type
  const renderContent = (content: string, isPart4: boolean = false) => {
    if (!content) return <p className="text-gray-500">No content available</p>;

    // For Part 4, check if it's JSON and format accordingly
    if (isPart4 && isJsonString(content)) {
      return formatJsonContent(content);
    }

    // For markdown content, use ReactMarkdown
    return (
      <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({children, ...props}) => <h1 className="text-2xl font-bold text-purple-800 mb-4" {...props}>{children}</h1>,
            h2: ({children, ...props}) => <h2 className="text-xl font-semibold text-purple-700 mb-3" {...props}>{children}</h2>,
            h3: ({children, ...props}) => <h3 className="text-lg font-medium text-purple-600 mb-2" {...props}>{children}</h3>,
            h4: ({children, ...props}) => <h4 className="text-base font-medium text-purple-600 mb-2" {...props}>{children}</h4>,
            p: ({children, ...props}) => <p className="mb-3 text-gray-700 leading-relaxed" {...props}>{children}</p>,
            ul: ({children, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700" {...props}>{children}</ul>,
            ol: ({children, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-700" {...props}>{children}</ol>,
            li: ({children, ...props}) => <li className="mb-1" {...props}>{children}</li>,
            strong: ({children, ...props}) => <strong className="font-semibold text-purple-800" {...props}>{children}</strong>,
            em: ({children, ...props}) => <em className="italic text-purple-700" {...props}>{children}</em>,
            blockquote: ({children, ...props}) => (
              <blockquote className="border-l-4 border-purple-300 pl-4 italic text-gray-600 my-4" {...props}>{children}</blockquote>
            ),
            code: ({children, className, ...props}) => {
              const isInline = !className?.includes('language-');
              return isInline ? (
                <code className="bg-purple-100 px-1 py-0.5 rounded text-sm font-mono text-purple-800" {...props}>{children}</code>
              ) : (
                <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto" {...props}>{children}</code>
              );
            },
            table: ({children, ...props}) => (
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border-collapse border border-gray-300" {...props}>{children}</table>
              </div>
            ),
            th: ({children, ...props}) => (
              <th className="border border-gray-300 bg-purple-50 px-3 py-2 text-left font-semibold text-purple-800" {...props}>{children}</th>
            ),
            td: ({children, ...props}) => (
              <td className="border border-gray-300 px-3 py-2 text-gray-700" {...props}>{children}</td>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const handleGenerateFullReport = async () => {
    setFullReportLoading(true);
    try {
      // Wait 10 seconds before fetching
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      if (!sessionId || !userId) {
        throw new Error('Missing session ID or user ID');
      }

      const result = await QuizEvaluationService.fetchFinalReport(sessionId, userId);
      
      if (result.success) {
        setFullReport(result.data || 'No final report available');
        setShowFullReport(true);
      } else {
        throw new Error(result.error || 'Failed to fetch final report');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate full report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFullReportLoading(false);
    }
  };

  const handleSaveAsPDF = () => {
    QuizEvaluationService.generatePDFReport(part, apiResponse, dbResponse, showFullReport ? fullReport : undefined);
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  const initializePartVerdict = useCallback(async () => {
    if (initialized) {
      console.log('Already initialized, skipping...');
      return;
    }
    
    if (!sessionId || !userId) {
      console.error('Missing session or user information:', { sessionId, userId });
      setLoading(false);
      toast({
        title: "Error",
        description: "Missing session or user information. Please restart the quiz.",
        variant: "destructive",
      });
      // Auto-continue after 3 seconds if missing session info
      setTimeout(() => {
        onContinue();
      }, 3000);
      return;
    }
    
    console.log('Initializing part verdict for part:', part, 'sessionId:', sessionId, 'userId:', userId);
    setInitialized(true); // Set flag immediately to prevent re-runs
    
    // Add a fallback timeout to ensure loading doesn't get stuck
    const fallbackTimeout = setTimeout(() => {
      console.warn('Initialization taking too long, forcing loading to false');
      setLoading(false);
      setApiResponse('Initialization timed out. You can still continue with the quiz.');
    }, 10000); // 10 seconds fallback
    
    try {
      console.log('Calling webhook for part:', part, 'sessionId:', sessionId, 'userId:', userId);
      // Call webhook API first
      const webhookResult = await QuizEvaluationService.callPartWebhook(part, sessionId, userId);
      
      if (webhookResult.success) {
        setApiResponse(webhookResult.data || 'No response received');
      } else {
        setApiResponse('Failed to get analysis result. Please try again.');
        toast({
          title: "Warning",
          description: webhookResult.error || "Failed to get analysis result. You can still continue with the quiz.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Webhook API error:', error);
      setApiResponse('Failed to get analysis result. Please try again.');
      toast({
        title: "Error", 
        description: "Failed to get analysis result. You can still continue with the quiz.",
        variant: "destructive",
      });
    } finally {
      // Always set loading to false after webhook attempt (success or failure)
      clearTimeout(fallbackTimeout); // Clear the fallback timeout
      setLoading(false);
    }

    // Start database fetch after delay regardless of webhook result
    setDbLoading(true);
    const delay = QuizEvaluationService.getPartDelay(part);
    
    const timeout = setTimeout(async () => {
      try {
        console.log('Fetching database result for part:', part, 'sessionId:', sessionId, 'userId:', userId);
        console.log('About to call QuizEvaluationService.fetchPartResult...');
        const dbResult = await QuizEvaluationService.fetchPartResult(part, sessionId, userId);
        
        console.log('Database fetch result:', { 
          success: dbResult.success, 
          dataLength: dbResult.data?.length || 0,
          error: dbResult.error,
          rawData: dbResult.data?.substring(0, 100) + '...' // First 100 chars
        });
        
        if (dbResult.success) {
          setDbResponse(dbResult.data || 'No result available');
          console.log('Database result fetched successfully for part:', part);
        } else {
          setDbResponse('Failed to fetch database result');
          console.error('Database result fetch failed for part:', part, 'error:', dbResult.error);
          toast({
            title: "Warning",
            description: dbResult.error || "Failed to fetch database result, but you can continue.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Database fetch error for part:', part, error);
        setDbResponse('Failed to fetch database result');
        toast({
          title: "Warning",
          description: "Failed to fetch database result, but you can continue.",
          variant: "destructive",
        });
      } finally {
        setDbLoading(false);
        setTimeoutId(null); // Clear timeout reference
      }
    }, delay);
    
    setTimeoutId(timeout); // Store timeout reference for cleanup
  }, [part, sessionId, userId, initialized, toast, onContinue]);

  useEffect(() => {
    initializePartVerdict();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part, sessionId, userId]); // Only depend on the actual props, not the callback

  // Reset initialized flag when key props change (moving to a different part)
  useEffect(() => {
    // Clean up any pending timeout
    if (timeoutId) {
      console.log('Cleaning up timeout for previous part');
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    setInitialized(false);
    setApiResponse('');
    setDbResponse('');
    setLoading(true);
    setDbLoading(false);
    setShowFullReport(false);
    setFullReport('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part, sessionId, userId]); // Don't include timeoutId to prevent cycles

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (timeoutId) {
        console.log('Component unmounting, cleaning up timeout');
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount, don't depend on timeoutId

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <LoadingSpinner 
            size="lg"
            emoji="🧠"
            message="Analyzing your responses..."
            subMessage={QuizEvaluationService.getPartDescription(part)}
          />
          
          {/* Add skip option after 8 seconds */}
          <div className="mt-8">
            <Button
              onClick={() => {
                console.log('Skipping analysis, continuing with quiz...');
                setLoading(false);
                setApiResponse('Analysis skipped - webhook service not available.');
                setDbResponse('Continuing without external analysis.');
              }}
              variant="outline"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Skip Analysis & Continue 🚀
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6 p-4 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-3 px-4">
        <div className="text-4xl sm:text-5xl animate-bounce">📊</div>
        <h1 className="text-lg sm:text-xl font-bold text-gray-800">
          Part {part} Complete!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
          {QuizEvaluationService.getPartDescription(part)}
        </p>
      </div>

      {/* Results Card */}
      <Card className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-3xl space-y-6">
        {/* API Response Section */}
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-purple-800 flex items-center">
            <span className="mr-2">🎯</span>
            Analysis Result
          </h2>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 sm:p-4 rounded-2xl border border-purple-100">
            <div className="text-sm sm:text-base">
              {renderContent(apiResponse, part === 4)}
            </div>
          </div>
        </div>

        {/* Database Response Section */}
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-green-800 flex items-center">
            <span className="mr-2">📈</span>
            <span className="text-sm sm:text-base">
              {part === 3 ? 'Dominant Intelligence Summary' : 
               part === 4 ? 'Personality Pattern Summary' :
               part === 5 ? 'Learning Style Summary' : 'Intelligence Analysis'}
            </span>
          </h2>
          
          {dbLoading ? (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 sm:p-4 rounded-2xl border border-green-100 flex items-center justify-center min-h-[120px]">
              <LoadingSpinner 
                size="sm"
                emoji="⏳"
                message="Loading database results..."
                subMessage="Processing your responses, please wait..."
              />
            </div>
          ) : (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 sm:p-4 rounded-2xl border border-green-100">
              <div className="text-sm sm:text-base">
                {renderContent(dbResponse, part === 4)}
              </div>
            </div>
          )}
        </div>

        {/* Full Report Section (Part 5 only) */}
        {part === 5 && showFullReport && (
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-orange-800 flex items-center">
              <span className="mr-2">📋</span>
              Complete Assessment Report
            </h2>
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-3 sm:p-4 rounded-2xl border border-orange-100 max-h-64 sm:max-h-96 overflow-y-auto">
              <div className="text-sm sm:text-base">
                {renderContent(fullReport)}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="w-full max-w-4xl mx-auto space-y-3 px-4">
        {part !== 5 ? (
          <Button
            onClick={onContinue}
            className="w-full h-12 sm:h-14 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
          >
            Continue Quiz 🚀
          </Button>
        ) : (
          <div className="space-y-3">
            {!showFullReport && (
              <Button
                onClick={handleGenerateFullReport}
                disabled={fullReportLoading}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {fullReportLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    <span className="hidden sm:inline">Generating Full Report...</span>
                    <span className="sm:hidden">Generating...</span>
                  </>
                ) : (
                  'Generate Full Report 📊'
                )}
              </Button>
            )}
            
            <Button
              onClick={handleSaveAsPDF}
              className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
            >
              Save as PDF 📄
            </Button>
            
            <Button
              onClick={handleReturnToDashboard}
              className="w-full h-12 sm:h-14 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-sm sm:text-base"
            >
              Return to Dashboard 🏠
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartVerdictScreen;
