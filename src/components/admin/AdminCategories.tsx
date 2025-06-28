import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database } from '@/integrations/supabase/types';

type QuestionCategory = Database['public']['Tables']['question_categories']['Row'];

interface CategoryStats {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  questionCount: number;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  const fetchCategories = useCallback(async () => {
    try {
      const { data: categories, error: categoriesError } = await supabase
        .from('question_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categories || []);

      // Get question counts for each category
      const statsPromises = (categories || []).map(async (category) => {
        const { count, error } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id);

        if (error) {
          console.error('Error counting questions for category:', error);
          return { ...category, questionCount: 0 };
        }

        return {
          ...category,
          questionCount: count || 0
        };
      });

      const stats = await Promise.all(statsPromises);
      setCategoryStats(stats);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCategories();
      setLoading(false);
    };
    loadData();
  }, [fetchCategories]);

  const resetForm = () => {
    setNewCategory({
      name: '',
      description: '',
      color: '#3b82f6'
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const categoryData = {
        name: newCategory.name,
        description: newCategory.description || null,
        color: newCategory.color
      };

      let result;
      if (editingId) {
        result = await supabase
          .from('question_categories')
          .update(categoryData)
          .eq('id', editingId);
      } else {
        result = await supabase
          .from('question_categories')
          .insert([categoryData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: `Category ${editingId ? 'updated' : 'created'} successfully`,
      });

      resetForm();
      fetchCategories();
      
      // Switch back to categories tab
      const categoriesTab = document.querySelector('[value="categories"]') as HTMLElement;
      if (categoriesTab) categoriesTab.click();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: `Failed to ${editingId ? 'update' : 'create'} category`,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (category: QuestionCategory) => {
    setNewCategory({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3b82f6'
    });
    setEditingId(category.id);
    
    // Switch to create tab
    const createTab = document.querySelector('[value="create-category"]') as HTMLElement;
    if (createTab) createTab.click();
  };

  const handleDelete = async (id: string) => {
    try {
      // Check if category has questions
      const { data: questions, error: checkError } = await supabase
        .from('questions')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (questions && questions.length > 0) {
        toast({
          title: "Cannot Delete",
          description: "This category has associated questions. Please remove them first.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('question_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">📂</div>
          <p className="text-gray-600">Loading categories and test types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="create-category">
            {editingId ? 'Edit Category' : 'Create Category'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Question Categories ({categoryStats.length})</h3>
            <Button onClick={() => {
              const createTab = document.querySelector('[value="create-category"]') as HTMLElement;
              if (createTab) createTab.click();
            }}>
              Add New Category
            </Button>
          </div>

          <div className="grid gap-4">
            {categoryStats.map((category) => (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {category.color && (
                          <div 
                            className="w-4 h-4 rounded-full border" 
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        {category.name}
                      </CardTitle>
                      {category.description && (
                        <CardDescription>{category.description}</CardDescription>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline">
                          {category.questionCount} question{category.questionCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        const fullCategory = categories.find(c => c.id === category.id);
                        if (fullCategory) handleEdit(fullCategory);
                      }}>
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this category? This will also affect associated questions.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(category.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {categoryStats.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-600">
                    No categories found. Create a category to organize your questions.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="create-category">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Category' : 'Create New Category'}</CardTitle>
              <CardDescription>
                {editingId ? 'Update the category details below' : 'Add a new category to organize questions'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Personality"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this category covers..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={newCategory.color}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Saving...' : (editingId ? 'Update Category' : 'Create Category')}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCategories;
