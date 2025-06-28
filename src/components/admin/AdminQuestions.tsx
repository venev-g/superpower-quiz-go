import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database } from '@/integrations/supabase/types';

type Question = Database['public']['Tables']['questions']['Row'] & {
  question_categories?: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
  };
};
type QuestionCategory = Database['public']['Tables']['question_categories']['Row'];

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [newQuestion, setNewQuestion] = useState({
    title: '',
    subtitle: '',
    category_id: '',
    is_active: true,
    sequence_order: 0,
    options: ['', '', '', ''] // Default 4 options
  });

  const fetchQuestions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          question_categories (
            id,
            name,
            description,
            color
          )
        `)
        .order('sequence_order');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('question_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchQuestions(), fetchCategories()]);
      setLoading(false);
    };
    loadData();
  }, [fetchQuestions, fetchCategories]);

  const resetForm = () => {
    setNewQuestion({
      title: '',
      subtitle: '',
      category_id: '',
      is_active: true,
      sequence_order: 0,
      options: ['', '', '', '']
    });
    setEditingId(null);
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const questionData = {
        title: newQuestion.title,
        subtitle: newQuestion.subtitle || null,
        category_id: newQuestion.category_id || null,
        is_active: newQuestion.is_active,
        sequence_order: newQuestion.sequence_order,
        options: newQuestion.options.filter(opt => opt.trim())
      };

      let result;
      if (editingId) {
        result = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingId);
      } else {
        result = await supabase
          .from('questions')
          .insert([questionData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: editingId ? "Question updated successfully" : "Question created successfully",
      });

      await fetchQuestions();
      resetForm();
    } catch (error: unknown) {
      console.error('Error saving question:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save question",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (question: Question) => {
    setNewQuestion({
      title: question.title,
      subtitle: question.subtitle || '',
      category_id: question.category_id || '',
      is_active: question.is_active ?? true,
      sequence_order: question.sequence_order || 0,
      options: Array.isArray(question.options) ? 
        (question.options as string[]).concat(['', '', '', '']).slice(0, 4) : 
        ['', '', '', '']
    });
    setEditingId(question.id);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully",
      });

      await fetchQuestions();
    } catch (error: unknown) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const updateOption = (index: number, value: string) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const addOption = () => {
    setNewQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    if (newQuestion.options.length > 2) {
      setNewQuestion(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">🔄</div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Questions Management</h2>
          <p className="text-gray-600">Create and manage quiz questions</p>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Questions List</TabsTrigger>
          <TabsTrigger value="create">
            {editingId ? 'Edit Question' : 'Create Question'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-4">
            {questions.map((question) => (
              <Card key={question.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{question.title}</CardTitle>
                      {question.subtitle && (
                        <CardDescription>{question.subtitle}</CardDescription>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant={question.is_active ? "default" : "secondary"}>
                          {question.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">Order: {question.sequence_order}</Badge>
                        {question.question_categories && (
                          <Badge 
                            variant="outline"
                            style={{ 
                              backgroundColor: question.question_categories.color + '20',
                              borderColor: question.question_categories.color || undefined
                            }}
                          >
                            {question.question_categories.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(question)}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the question.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(question.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                {Array.isArray(question.options) && question.options.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Options:</Label>
                      <div className="grid gap-1">
                        {(question.options as string[]).map((option, index) => (
                          <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                            {index + 1}. {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Question' : 'Create New Question'}</CardTitle>
              <CardDescription>
                {editingId ? 'Update the question details below' : 'Fill out the form below to create a new question'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateQuestion} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Question Title</Label>
                    <Textarea
                      id="title"
                      value={newQuestion.title}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter the question text"
                      required
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle (Optional)</Label>
                    <Input
                      id="subtitle"
                      value={newQuestion.subtitle}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="Question subtitle or category"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newQuestion.category_id}
                      onValueChange={(value) => setNewQuestion(prev => ({ ...prev, category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sequence_order">Order</Label>
                    <Input
                      id="sequence_order"
                      type="number"
                      value={newQuestion.sequence_order}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, sequence_order: parseInt(e.target.value) || 0 }))}
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Answer Options</Label>
                  <div className="space-y-2">
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        {newQuestion.options.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOption(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOption}
                      className="w-full"
                    >
                      Add Option
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={newQuestion.is_active}
                    onCheckedChange={(checked) => setNewQuestion(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Saving...' : (editingId ? 'Update Question' : 'Create Question')}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {editingId ? 'Cancel Edit' : 'Reset'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminQuestions;
