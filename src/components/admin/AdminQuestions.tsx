
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Plus } from 'lucide-react';

interface Question {
  id: string;
  title: string;
  subtitle: string;
  options: any;
  sequence_order: number;
  category_id: string;
  question_type: string;
  rating_min?: number;
  rating_max?: number;
  rating_labels?: string[];
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
}

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadQuestions();
    loadCategories();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('sequence_order');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('question_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSaveQuestion = async (questionData: any) => {
    try {
      if (editingQuestion) {
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestion.id);

        if (error) throw error;
        toast({ title: "Success", description: "Question updated successfully" });
      } else {
        const { error } = await supabase
          .from('questions')
          .insert([questionData]);

        if (error) throw error;
        toast({ title: "Success", description: "Question created successfully" });
      }

      loadQuestions();
      setEditingQuestion(null);
    } catch (error: any) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: "Failed to save question",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Question deleted successfully" });
      loadQuestions();
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading questions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Questions</h2>
        <Button onClick={() => setEditingQuestion({} as Question)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="grid gap-4">
        {questions.map((question) => (
          <Card key={question.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold">{question.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{question.subtitle}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Type: {question.question_type} | Order: {question.sequence_order} | 
                  Active: {question.is_active ? 'Yes' : 'No'}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingQuestion(question)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteQuestion(question.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editingQuestion && (
        <QuestionForm
          question={editingQuestion}
          categories={categories}
          onSave={handleSaveQuestion}
          onCancel={() => setEditingQuestion(null)}
        />
      )}
    </div>
  );
};

interface QuestionFormProps {
  question: Question;
  categories: Category[];
  onSave: (data: any) => void;
  onCancel: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ question, categories, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: question.title || '',
    subtitle: question.subtitle || '',
    question_type: question.question_type || 'single_choice',
    category_id: question.category_id || '',
    sequence_order: question.sequence_order || 1,
    is_active: question.is_active ?? true,
    options: Array.isArray(question.options) ? question.options : [],
    rating_min: question.rating_min || 1,
    rating_max: question.rating_max || 5,
    rating_labels: question.rating_labels || []
  });

  const [optionText, setOptionText] = useState('');

  const handleAddOption = () => {
    if (optionText.trim()) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, optionText.trim()]
      }));
      setOptionText('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_: any, i: number) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        {question.id ? 'Edit Question' : 'Add New Question'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Subtitle</label>
          <Input
            value={formData.subtitle}
            onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Question Type</label>
            <Select
              value={formData.question_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, question_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single_choice">Single Choice</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="rating_scale">Rating Scale</SelectItem>
                <SelectItem value="multiselect">Multi-Select</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sequence Order</label>
            <Input
              type="number"
              value={formData.sequence_order}
              onChange={(e) => setFormData(prev => ({ ...prev, sequence_order: parseInt(e.target.value) }))}
              min="1"
            />
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
            />
            <label htmlFor="is_active" className="text-sm font-medium">Active</label>
          </div>
        </div>

        {formData.question_type !== 'rating_scale' && (
          <div>
            <label className="block text-sm font-medium mb-1">Options</label>
            <div className="space-y-2">
              {formData.options.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input value={option} readOnly className="flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex space-x-2">
                <Input
                  placeholder="Add new option"
                  value={optionText}
                  onChange={(e) => setOptionText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                />
                <Button type="button" onClick={handleAddOption}>Add</Button>
              </div>
            </div>
          </div>
        )}

        {formData.question_type === 'rating_scale' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Min Rating</label>
              <Input
                type="number"
                value={formData.rating_min}
                onChange={(e) => setFormData(prev => ({ ...prev, rating_min: parseInt(e.target.value) }))}
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Rating</label>
              <Input
                type="number"
                value={formData.rating_max}
                onChange={(e) => setFormData(prev => ({ ...prev, rating_max: parseInt(e.target.value) }))}
                min="2"
              />
            </div>
          </div>
        )}

        <div className="flex space-x-2 pt-4">
          <Button type="submit">Save Question</Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AdminQuestions;
