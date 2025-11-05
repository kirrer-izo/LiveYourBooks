import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import DatePicker from './ui/date-picker';
import { Edit, Check, X, Plus, Trash2 } from 'lucide-react';

const TaskGenerator = ({ book, onTasksGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);

  const generateTasks = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/books/${book.id}/generate-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate tasks');
      }

      // For now, we'll simulate generated tasks since the backend returns a redirect
      // In a real implementation, you'd want to return JSON with the generated tasks
      const mockTasks = [
        {
          id: 'temp-1',
          title: 'Read 20 pages daily',
          description: 'Set aside 30 minutes each day to read 20 pages of the book',
          priority: 'high',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: 'task',
          isSelected: true,
        },
        {
          id: 'temp-2',
          title: 'Morning reflection journal',
          description: 'Write 3 key insights from the book each morning',
          priority: 'medium',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: 'habit',
          isSelected: true,
        },
        {
          id: 'temp-3',
          title: 'Apply one concept weekly',
          description: 'Choose one concept from the book and apply it for a full week',
          priority: 'high',
          due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: 'task',
          isSelected: false,
        },
      ];

      setGeneratedTasks(mockTasks);
      setShowGenerator(true);
    } catch (error) {
      console.error('Error generating tasks:', error);
      alert('Failed to generate tasks. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateTask = (taskId, updates) => {
    setGeneratedTasks(tasks =>
      tasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  const toggleTaskSelection = (taskId) => {
    updateTask(taskId, { isSelected: !generatedTasks.find(t => t.id === taskId).isSelected });
  };

  const deleteTask = (taskId) => {
    setGeneratedTasks(tasks => tasks.filter(task => task.id !== taskId));
  };

  const addNewTask = () => {
    const newTask = {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      priority: 'medium',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'task',
      isSelected: true,
    };
    setGeneratedTasks([...generatedTasks, newTask]);
    setEditingTask(newTask.id);
  };

  const saveTasks = async () => {
    const selectedTasks = generatedTasks.filter(task => task.isSelected);
    
    try {
      const response = await fetch('/api/tasks/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          tasks: selectedTasks.map(task => ({
            title: task.title,
            description: task.description,
            priority: task.priority,
            due_date: task.due_date,
            book_id: book.id,
            type: task.type,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save tasks');
      }

      onTasksGenerated?.(selectedTasks);
      setShowGenerator(false);
      setGeneratedTasks([]);
    } catch (error) {
      console.error('Error saving tasks:', error);
      alert('Failed to save tasks. Please try again.');
    }
  };

  const TaskForm = ({ task, onSave, onCancel }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Edit Task</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={task.title}
            onChange={(e) => updateTask(task.id, { title: e.target.value })}
            placeholder="Enter task title"
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={task.description}
            onChange={(e) => updateTask(task.id, { description: e.target.value })}
            placeholder="Enter task description"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={task.priority}
              onValueChange={(value) => updateTask(task.id, { priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <DatePicker
              id="due_date"
              value={task.due_date || ""}
              onChange={(value) => updateTask(task.id, { due_date: value })}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="type">Type</Label>
          <Select
            value={task.type}
            onValueChange={(value) => updateTask(task.id, { type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="habit">Habit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (!showGenerator) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-4">Generate Tasks from Book</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Let AI analyze "{book.title}" and generate personalized tasks and habits for you.
        </p>
        <Button onClick={generateTasks} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Tasks'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Generated Tasks & Habits</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addNewTask}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          <Button onClick={saveTasks}>
            <Check className="w-4 h-4 mr-2" />
            Save Selected ({generatedTasks.filter(t => t.isSelected).length})
          </Button>
        </div>
      </div>

      {editingTask && (
        <TaskForm
          task={generatedTasks.find(t => t.id === editingTask)}
          onSave={() => setEditingTask(null)}
          onCancel={() => setEditingTask(null)}
        />
      )}

      <div className="space-y-4">
        {generatedTasks.map((task) => (
          <Card key={task.id} className={task.isSelected ? 'border-blue-500' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Checkbox
                    checked={task.isSelected}
                    onCheckedChange={() => toggleTaskSelection(task.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{task.title || 'Untitled Task'}</h4>
                      <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                        {task.priority}
                      </Badge>
                      <Badge variant="outline">
                        {task.type}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Due: {task.due_date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTask(task.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
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

      {generatedTasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No tasks generated yet. Click "Generate Tasks" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default TaskGenerator;
