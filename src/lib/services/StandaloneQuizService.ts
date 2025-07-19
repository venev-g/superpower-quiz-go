import { supabase } from '@/integrations/supabase/client';
import { Json, Database } from '@/integrations/supabase/types';

export interface StandaloneQuizQuestion {
  id: string;
  title: string;
  subtitle: string | null;
  options: string[];
  sequence_order: number;
  category_id: string;
}

export interface StandaloneQuizSession {
  id: string;
  user_id: string;
  created_at: string;
  quiz_type: string;
  category_id: string;
  current_question: number;
  total_questions: number;
  answers: number[];
  completed_at: string | null;
}

export interface StandaloneQuizResult {
  success: boolean;
  data?: string | null;
  error?: string;
}

export interface UserQuizResult {
  id: number;
  created_at: string;
  userID: string | null;
  sessionID: string | null;
  'Dominant Intelligence': string | null;
  'Personality Pattern': string | null;
  'Learning Style': string | null;
  final_result: string | null;
  quiz_sessions?: {
    id: string;
    quiz_type: string | null;
    category_id: string | null;
    created_at: string | null;
    completed_at: string | null;
  };
}

export class StandaloneQuizService {
  
  /**
   * Load questions for a specific quiz type by category
   */
  static async loadQuestionsByCategory(categoryId: string): Promise<StandaloneQuizQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          title,
          subtitle,
          options,
          sequence_order,
          category_id
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('sequence_order', { ascending: true });

      if (error) {
        console.error('Error loading questions:', error);
        throw error;
      }

      return (data || []).map(q => ({
        id: q.id,
        title: q.title,
        subtitle: q.subtitle,
        options: Array.isArray(q.options) ? q.options as string[] : [],
        sequence_order: q.sequence_order || 0,
        category_id: q.category_id || ''
      }));
    } catch (error) {
      console.error('Error in loadQuestionsByCategory:', error);
      throw error;
    }
  }

  /**
   * Create a new standalone quiz session
   */
  static async createQuizSession(
    userId: string,
    quizType: string,
    categoryId: string,
    totalQuestions: number
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .insert([{
          user_id: userId,
          quiz_type: quizType,
          category_id: categoryId,
          current_question: 1,
          total_questions: totalQuestions,
          answers: [],
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating quiz session:', error);
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('Error in createQuizSession:', error);
      throw error;
    }
  }

  /**
   * Find existing session or create new one
   */
  static async findOrCreateQuizSession(
    userId: string,
    quizType: string,
    categoryId: string,
    totalQuestions: number
  ): Promise<{ sessionId: string; currentQuestion: number; existingAnswers: number[] }> {
    try {
      // Always look for existing incomplete session first
      const { data: existingSessions, error: findError } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('quiz_type', quizType)
        .eq('category_id', categoryId)
        .is('completed_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (findError) {
        console.error('Error finding existing session:', findError);
        throw findError;
      }

      // If there's an incomplete session, always reuse it
      if (existingSessions && existingSessions.length > 0) {
        const session = existingSessions[0];
        return {
          sessionId: session.id,
          currentQuestion: session.current_question || 1,
          existingAnswers: Array.isArray(session.answers) ? session.answers as number[] : []
        };
      }

      // Only create a new session if no incomplete session exists
      const sessionId = await this.createQuizSession(userId, quizType, categoryId, totalQuestions);
      return {
        sessionId,
        currentQuestion: 1,
        existingAnswers: []
      };
    } catch (error) {
      console.error('Error in findOrCreateQuizSession:', error);
      throw error;
    }
  }

  /**
   * Update quiz session progress
   */
  static async updateQuizSession(
    sessionId: string,
    currentQuestion: number,
    answers: number[]
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('quiz_sessions')
        .update({
          current_question: currentQuestion,
          answers: answers as Json
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating quiz session:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateQuizSession:', error);
      throw error;
    }
  }

  /**
   * Complete quiz session
   */
  static async completeQuizSession(
    sessionId: string,
    answers: number[],
    quizType: string
  ): Promise<void> {
    try {
      // Update session as completed
      const { error: sessionError } = await supabase
        .from('quiz_sessions')
        .update({
          completed_at: new Date().toISOString(),
          answers: answers as Json,
          current_question: answers.length + 1
        })
        .eq('id', sessionId);

      if (sessionError) {
        console.error('Error completing quiz session:', sessionError);
        throw sessionError;
      }
    } catch (error) {
      console.error('Error in completeQuizSession:', error);
      throw error;
    }
  }

  /**
   * Get webhook endpoint for quiz type
   */
  static getWebhookEndpoint(quizType: string): string {
    switch (quizType) {
      case 'multi-intelligence':
        return '/webhook/part1';
      case 'personality-type':
        return '/webhook/part2';
      case 'learning-style':
        return '/webhook/part3';
      default:
        return '/webhook/part1';
    }
  }

  /**
   * Get result column name for detail_result table
   */
  static getResultColumnName(quizType: string): string {
    switch (quizType) {
      case 'multi-intelligence':
        return 'Dominant Intelligence';
      case 'personality-type':
        return 'Personality Pattern';
      case 'learning-style':
        return 'Learning Style';
      default:
        return 'Dominant Intelligence';
    }
  }

  /**
   * Save result to detail_result table
   */
  static async saveDetailResult(
    sessionId: string,
    userId: string,
    quizType: string,
    result: string
  ): Promise<void> {
    try {
      const columnName = this.getResultColumnName(quizType);
      
      // Check if result already exists
      const { data: existingResult, error: findError } = await supabase
        .from('detail_result')
        .select('*')
        .eq('sessionID', sessionId)
        .eq('userID', userId)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding existing result:', findError);
        throw findError;
      }

      if (existingResult) {
        // Update existing result
        const { error: updateError } = await supabase
          .from('detail_result')
          .update({
            [columnName]: result
          })
          .eq('sessionID', sessionId);

        if (updateError) {
          console.error('Error updating existing result:', updateError);
          throw updateError;
        }
      } else {
        // Create new result
        const { error: insertError } = await supabase
          .from('detail_result')
          .insert([{
            sessionID: sessionId,
            userID: userId,
            [columnName]: result
          }]);

        if (insertError) {
          console.error('Error inserting new result:', insertError);
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Error in saveDetailResult:', error);
      throw error;
    }
  }

  /**
   * Get quiz results for user dashboard
   */
  static async getUserQuizResults(userId: string): Promise<UserQuizResult[]> {
    try {
      const { data, error } = await supabase
        .from('detail_result')
        .select(`
          *,
          quiz_sessions!inner(
            id,
            quiz_type,
            category_id,
            created_at,
            completed_at
          )
        `)
        .eq('userID', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user quiz results:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserQuizResults:', error);
      throw error;
    }
  }

  /**
   * Call webhook API for quiz result
   */
  static async callQuizWebhook(
    quizType: string,
    sessionId: string,
    userId: string
  ): Promise<StandaloneQuizResult> {
    try {
      const endpoint = this.getWebhookEndpoint(quizType);
      const webhookUrl = `https://8d6b710191c3.ngrok-free.app${endpoint}`;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed with status ${response.status}`);
      }

      const result = await response.text();
      
      // Save result to database
      await this.saveDetailResult(sessionId, userId, quizType, result);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error calling quiz webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Fetch result from database
   */
  static async fetchResultFromDatabase(
    sessionId: string,
    userId: string,
    quizType: string
  ): Promise<StandaloneQuizResult> {
    try {
      const columnName = this.getResultColumnName(quizType);
      
      const { data, error } = await supabase
        .from('detail_result')
        .select(columnName)
        .eq('sessionID', sessionId)
        .eq('userID', userId)
        .single();

      if (error) {
        console.error('Error fetching result from database:', error);
        throw error;
      }

      return {
        success: true,
        data: data?.[columnName] || null
      };
    } catch (error) {
      console.error('Error in fetchResultFromDatabase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Force create a new session for retaking a quiz
   */
  static async createNewQuizSession(
    userId: string,
    quizType: string,
    categoryId: string,
    totalQuestions: number
  ): Promise<{ sessionId: string; currentQuestion: number; existingAnswers: number[] }> {
    try {
      // Create new session
      const sessionId = await this.createQuizSession(userId, quizType, categoryId, totalQuestions);
      return {
        sessionId,
        currentQuestion: 1,
        existingAnswers: []
      };
    } catch (error) {
      console.error('Error in createNewQuizSession:', error);
      throw error;
    }
  }
}
