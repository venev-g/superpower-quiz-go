import { supabase } from '@/integrations/supabase/client';

export interface Standard {
  id: number;
  standard_name: string;
}

export interface Subject {
  id: number;
  standard_id: number;
  subject_name: string;
}

export interface Chapter {
  id: number;
  subject_id: number;
  chapter_number: number;
  chapter_name: string;
}

export interface Topic {
  id: number;
  chapter_id: number;
  topic_name: string;
}

export class CurriculumService {
  // Get all standards
  static async getStandards(): Promise<Standard[]> {
    const { data, error } = await supabase
      .from('standards')
      .select('*')
      .order('standard_name');
    
    if (error) {
      console.error('Error fetching standards:', error);
      return [];
    }
    
    return data || [];
  }

  // Get subjects by standard
  static async getSubjectsByStandard(standardId: number): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('standard_id', standardId)
      .order('subject_name');
    
    if (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
    
    return data || [];
  }

  // Get chapters by subject
  static async getChaptersBySubject(subjectId: number): Promise<Chapter[]> {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('subject_id', subjectId)
      .order('chapter_number');
    
    if (error) {
      console.error('Error fetching chapters:', error);
      return [];
    }
    
    return data || [];
  }

  // Get topics by chapter
  static async getTopicsByChapter(chapterId: number): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('topic_name');
    
    if (error) {
      console.error('Error fetching topics:', error);
      return [];
    }
    
    return data || [];
  }

  // Search standards
  static async searchStandards(query: string): Promise<Standard[]> {
    const { data, error } = await supabase
      .from('standards')
      .select('*')
      .ilike('standard_name', `%${query}%`)
      .order('standard_name');
    
    if (error) {
      console.error('Error searching standards:', error);
      return [];
    }
    
    return data || [];
  }

  // Search subjects
  static async searchSubjects(query: string, standardId?: number): Promise<Subject[]> {
    let queryBuilder = supabase
      .from('subjects')
      .select('*')
      .ilike('subject_name', `%${query}%`);
    
    if (standardId) {
      queryBuilder = queryBuilder.eq('standard_id', standardId);
    }
    
    const { data, error } = await queryBuilder.order('subject_name');
    
    if (error) {
      console.error('Error searching subjects:', error);
      return [];
    }
    
    return data || [];
  }

  // Search chapters
  static async searchChapters(query: string, subjectId?: number): Promise<Chapter[]> {
    let queryBuilder = supabase
      .from('chapters')
      .select('*')
      .ilike('chapter_name', `%${query}%`);
    
    if (subjectId) {
      queryBuilder = queryBuilder.eq('subject_id', subjectId);
    }
    
    const { data, error } = await queryBuilder.order('chapter_number');
    
    if (error) {
      console.error('Error searching chapters:', error);
      return [];
    }
    
    return data || [];
  }

  // Search topics
  static async searchTopics(query: string, chapterId?: number): Promise<Topic[]> {
    let queryBuilder = supabase
      .from('topics')
      .select('*')
      .ilike('topic_name', `%${query}%`);
    
    if (chapterId) {
      queryBuilder = queryBuilder.eq('chapter_id', chapterId);
    }
    
    const { data, error } = await queryBuilder.order('topic_name');
    
    if (error) {
      console.error('Error searching topics:', error);
      return [];
    }
    
    return data || [];
  }
} 