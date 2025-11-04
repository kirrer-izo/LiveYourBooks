import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '../../layouts/AppLayout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Toggle } from '../../components/ui/toggle';
import { Trash2, Plus, Edit, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

const ThinkersIndex = () => {
  const { thinkers, predefinedThinkers } = usePage().props;
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [editingThinker, setEditingThinker] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    description: '',
    advice_style: '',
  });

  const handleAddPredefined = (thinkerType) => {
    router.post('/thinkers', {
      type: thinkerType.value,
    }, {
      onSuccess: () => {
        setShowAddDialog(false);
      },
    });
  };

  const handleAddCustom = () => {
    router.post('/thinkers', formData, {
      onSuccess: () => {
        setShowCustomDialog(false);
        setFormData({
          type: '',
          name: '',
          description: '',
          advice_style: '',
        });
      },
    });
  };

  const handleEdit = (thinker) => {
    setEditingThinker(thinker);
    setFormData({
      name: thinker.name || '',
      description: thinker.description || '',
      advice_style: thinker.advice_style || '',
    });
  };

  const handleUpdate = () => {
    if (editingThinker) {
      router.put(`/thinkers/${editingThinker.id}`, formData, {
        onSuccess: () => {
          setEditingThinker(null);
          setFormData({
            type: '',
            name: '',
            description: '',
            advice_style: '',
          });
        },
      });
    }
  };

  const handleToggle = (thinker) => {
    router.post(`/thinkers/${thinker.id}/toggle`);
  };

  const handleDelete = (thinker) => {
    if (confirm('Are you sure you want to remove this thinker?')) {
      router.delete(`/thinkers/${thinker.id}`);
    }
  };

  const resetForm = () => {
    setFormData({
      type: '',
      name: '',
      description: '',
      advice_style: '',
    });
    setEditingThinker(null);
  };

  return (
    <>
      <Head title="Thinkers - Live Your Books" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Thinkers</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Add thinkers and mentors to guide your personal growth journey
            </p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Thinker
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a Thinker</DialogTitle>
                  <DialogDescription>
                    Choose from our curated list of renowned thinkers or add your own custom mentor.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {predefinedThinkers.map((thinker) => (
                      <Card 
                        key={thinker.value} 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleAddPredefined(thinker)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{thinker.displayName}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {thinker.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                Style: {thinker.adviceStyle}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setShowAddDialog(false);
                        setShowCustomDialog(true);
                      }}
                    >
                      Add Custom Thinker
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Thinkers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {thinkers.map((thinker) => (
            <Card key={thinker.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{thinker.display_name}</CardTitle>
                    <CardDescription className="mt-1">
                      {thinker.description}
                    </CardDescription>
                  </div>
                  <Badge variant={thinker.is_active ? "default" : "secondary"}>
                    {thinker.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {thinker.advice_style}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(thinker)}
                    >
                      {thinker.is_active ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </Button>
                    
                    {thinker.is_custom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(thinker)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(thinker)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {thinkers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No thinkers yet</h3>
              <p>Add your first thinker to get started with personalized advice</p>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Thinker
            </Button>
          </div>
        )}

        {/* Custom Thinker Dialog */}
        <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Thinker</DialogTitle>
              <DialogDescription>
                Create your own personal mentor or thinker.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., My Grandmother, My Coach, etc."
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this thinker..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="advice_style">Advice Style</Label>
                <Textarea
                  id="advice_style"
                  value={formData.advice_style}
                  onChange={(e) => setFormData({ ...formData, advice_style: e.target.value })}
                  placeholder="How does this thinker approach advice? What's their style?"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCustom}>
                  Add Thinker
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Custom Thinker Dialog */}
        <Dialog open={!!editingThinker} onOpenChange={() => setEditingThinker(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Custom Thinker</DialogTitle>
              <DialogDescription>
                Update your custom thinker's information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_name">Name *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="edit_advice_style">Advice Style</Label>
                <Textarea
                  id="edit_advice_style"
                  value={formData.advice_style}
                  onChange={(e) => setFormData({ ...formData, advice_style: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingThinker(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate}>
                  Update Thinker
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

ThinkersIndex.layout = (page) => <AppLayout children={page} title="Thinkers" />;
export default ThinkersIndex;
