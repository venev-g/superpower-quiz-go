import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export interface WebhookResponse {
  success: boolean;
  data?: string;
  error?: string;
}

export interface DatabaseResult {
  success: boolean;
  data?: string;
  error?: string;
}

export class QuizEvaluationService {
  private static readonly WEBHOOK_BASE_URL = 'http://localhost:5678/webhook';

  /**
   * Call external webhook API for quiz part evaluation
   */
  static async callPartWebhook(
    part: number, 
    sessionId: string, 
    userId: string
  ): Promise<WebhookResponse> {
    try {
      const webhookUrl = `${this.WEBHOOK_BASE_URL}/part${part}`;
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100000); // 100 second timeout

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();
      
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error(`Error calling part ${part} webhook:`, error);
      
      // Provide different error messages based on error type
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Webhook request timed out after 5 seconds';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Webhook service is not available (network error)';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Fetch part result from database
   */
  static async fetchPartResult(
    part: number,
    sessionId: string,
    userId: string
  ): Promise<DatabaseResult> {
    try {
      const columnName = this.getPartColumnName(part) as keyof Database['public']['Tables']['detail_result']['Row'];
      console.log('fetchPartResult called with:', { part, sessionId, userId, columnName });
      
      // Select all columns and filter on the client side to avoid column name escaping issues
      const { data, error } = await supabase
        .from('detail_result')
        .select('*')
        .eq('sessionID', sessionId)
        .eq('userID', userId)
        .single();

      console.log('Database query result:', { data: !!data, error: error?.message, dataKeys: data ? Object.keys(data) : [] });

      if (error) {
        console.error('Database error details:', error);
        throw error;
      }

      const resultValue = data && data[columnName] ? String(data[columnName]) : 'No result available';
      console.log('Extracted result value length:', resultValue.length);

      return {
        success: true,
        data: resultValue
      };
    } catch (error) {
      console.error(`Error fetching part ${part} result:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Fetch final report from database
   */
  static async fetchFinalReport(
    sessionId: string,
    userId: string
  ): Promise<DatabaseResult> {
    try {
      const { data, error } = await supabase
        .from('detail_result')
        .select('final_result')
        .eq('sessionID', sessionId)
        .eq('userID', userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data?.final_result || 'No final report available'
      };
    } catch (error) {
      console.error('Error fetching final report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate PDF report
   */
  static generatePDFReport(
    part: number,
    apiResponse: string,
    dbResponse: string,
    fullReport?: string
  ): void {
    const partTitle = this.getPartTitle(part);
    
    // For Part 5, only include the full report if available
    const shouldIncludePart5Results = part !== 5;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Quiz Assessment Report${part === 5 && fullReport ? ' - Complete Assessment' : ` - ${partTitle}`}</title>
          <style>
            body { 
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; 
              margin: 0; 
              padding: 20px; 
              line-height: 1.7;
              color: #2d3748;
              background-color: #f7fafc;
              font-size: 16px;
            }
            .container {
              max-width: 900px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 16px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 30px;
              border-bottom: 3px solid #e2e8f0;
            }
            h1 { 
              color: #553c9a; 
              font-size: 2.8em;
              font-weight: 800;
              margin-bottom: 10px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .subtitle {
              color: #64748b;
              font-size: 1.2em;
              font-weight: 500;
            }
            h2 { 
              color: #4c51bf; 
              border-bottom: 3px solid #e2e8f0;
              padding-bottom: 12px;
              margin-top: 40px;
              margin-bottom: 20px;
              font-size: 1.8em;
              font-weight: 700;
            }
            h3 {
              color: #5a67d8;
              font-size: 1.4em;
              font-weight: 600;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            h4 {
              color: #667eea;
              font-size: 1.2em;
              font-weight: 600;
              margin-top: 25px;
              margin-bottom: 12px;
            }
            .section { 
              margin-bottom: 40px; 
              padding: 25px; 
              border-radius: 12px; 
              box-shadow: 0 4px 6px rgba(0,0,0,0.07);
              border: 1px solid #e2e8f0;
            }
            .api-response { 
              background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
              border-left: 6px solid #8b5cf6;
            }
            .db-response { 
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              border-left: 6px solid #10b981;
            }
            .full-report { 
              background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
              border-left: 6px solid #f59e0b;
            }
            .content {
              font-size: 1.1em;
              line-height: 1.8;
              color: #374151;
            }
            .content p {
              margin-bottom: 16px;
            }
            .content ul, .content ol {
              margin: 16px 0;
              padding-left: 30px;
            }
            .content li {
              margin-bottom: 8px;
            }
            .content strong {
              color: #1f2937;
              font-weight: 700;
            }
            .content em {
              color: #4b5563;
              font-style: italic;
            }
            .content blockquote {
              border-left: 4px solid #d1d5db;
              padding-left: 20px;
              margin: 20px 0;
              font-style: italic;
              color: #6b7280;
            }
            .content code {
              background: #f3f4f6;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              font-size: 0.9em;
            }
            .content pre {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              overflow-x: auto;
              border: 1px solid #e5e7eb;
            }
            .content table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .content th, .content td {
              border: 1px solid #d1d5db;
              padding: 12px;
              text-align: left;
            }
            .content th {
              background: #f9fafb;
              font-weight: 600;
            }
            .timestamp {
              text-align: center;
              color: #9ca3af;
              font-size: 0.95em;
              margin-top: 40px;
              border-top: 2px solid #e5e7eb;
              padding-top: 25px;
              font-style: italic;
            }
            .icon {
              font-size: 1.3em;
              margin-right: 10px;
              vertical-align: middle;
            }
            .json-container {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin: 15px 0;
            }
            .json-key {
              font-weight: 700;
              color: #2d3748;
              font-size: 1.2em;
              margin-bottom: 10px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e2e8f0;
            }
            .json-value {
              color: #4a5568;
              line-height: 1.6;
              margin-bottom: 20px;
            }
            @media print {
              body { background: white; }
              .container { box-shadow: none; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Quiz Assessment Report</h1>
              <div class="subtitle">${part === 5 && fullReport ? 'Complete Assessment Report' : partTitle}</div>
            </div>
            
            ${shouldIncludePart5Results ? `
              <div class="section api-response">
                <h2><span class="icon">🎯</span>Analysis Result</h2>
                <div class="content">
                  ${this.formatContentForPDF(apiResponse, part === 4)}
                </div>
              </div>
              
              <div class="section db-response">
                <h2><span class="icon">📈</span>${this.getDbSectionTitle(part)}</h2>
                <div class="content">
                  ${this.formatContentForPDF(dbResponse, part === 4)}
                </div>
              </div>
            ` : ''}
            
            ${fullReport ? `
              <div class="section full-report">
                <h2><span class="icon">📋</span>Complete Assessment Report</h2>
                <div class="content">
                  ${this.formatContentForPDF(fullReport)}
                </div>
              </div>
            ` : ''}
            
            <div class="timestamp">
              Generated on: ${new Date().toLocaleString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}
            </div>
          </div>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = part === 5 && fullReport ? 
      'complete-assessment-report.html' : 
      `quiz-report-${partTitle.toLowerCase().replace(/\s+/g, '-')}.html`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Format content for PDF generation with proper HTML rendering
   */
  private static formatContentForPDF(content: string, isJson: boolean = false): string {
    if (!content) return '<p>No content available</p>';

    // Handle JSON content for Part 4
    if (isJson) {
      try {
        const data = JSON.parse(content);
        let htmlContent = '';
        for (const [key, value] of Object.entries(data)) {
          htmlContent += `
            <div class="json-container">
              <div class="json-key">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
              <div class="json-value">
                ${typeof value === 'object' ? 
                  `<pre>${JSON.stringify(value, null, 2)}</pre>` : 
                  String(value)
                }
              </div>
            </div>
          `;
        }
        return htmlContent;
      } catch (error) {
        // If JSON parsing fails, treat as regular content
      }
    }

    // Convert markdown-like content to HTML
    let htmlContent = content
      // Convert headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Convert bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert lists
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      // Convert line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap list items in ul tags
    htmlContent = htmlContent.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    
    // Wrap in paragraphs if not already wrapped
    if (!htmlContent.startsWith('<')) {
      htmlContent = `<p>${htmlContent}</p>`;
    }

    return htmlContent;
  }

  /**
   * Get database section title based on part
   */
  private static getDbSectionTitle(part: number): string {
    switch (part) {
      case 1:
      case 2:
      case 3:
        return 'Dominant Intelligence Summary';
      case 4:
        return 'Personality Pattern Summary';
      case 5:
        return 'Learning Style Summary';
      default:
        return 'Intelligence Analysis';
    }
  }

  /**
   * Get part column name for database queries
   */
  private static getPartColumnName(part: number): string {
    switch (part) {
      case 1:
        return 'Part 1 (Dominant Intelligence)';
      case 2:
        return 'Part 2 (Dominant Intelligence)';
      case 3:
        return 'Part 3 (Dominant Intelligence)';
      case 4:
        return 'Personality Style (part 4)';
      case 5:
        return 'Learning Style VARK (part 5)';
      default:
        return 'Part 1 (Dominant Intelligence)';
    }
  }

  /**
   * Get part title for display
   */
  private static getPartTitle(part: number): string {
    switch (part) {
      case 1:
        return 'Part 1: Dominant Intelligence';
      case 2:
        return 'Part 2: Dominant Intelligence';
      case 3:
        return 'Part 3: Dominant Intelligence';
      case 4:
        return 'Part 4: Personality Style';
      case 5:
        return 'Part 5: Learning Style';
      default:
        return 'Quiz Part';
    }
  }

  /**
   * Get part description for display
   */
  static getPartDescription(part: number): string {
    switch (part) {
      case 1:
        return 'Initial assessment of your dominant intelligence patterns';
      case 2:
        return 'Deeper analysis of your intelligence characteristics';
      case 3:
        return 'Complete dominant intelligence profile summary';
      case 4:
        return 'Personality style and behavioral patterns analysis';
      case 5:
        return 'Learning style preferences and final assessment';
      default:
        return 'Quiz assessment';
    }
  }

  /**
   * Get database fetch delay for each part
   */
  static getPartDelay(part: number): number {
    switch (part) {
      case 1:
        return 20000;
      case 2:
        return 20000;
      case 4:
        return 30000;
      case 5:
        return 45000;
      case 3:
        return 35000;
      default:
        return 50000;
    }
  }
}
