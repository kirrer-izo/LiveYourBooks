import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import Layout from '@/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Brain, Calendar, Target, BookOpen, User, BookMarked, CheckSquare, Sparkles, Plus } from 'lucide-react';

export default function AIFeatures({ thinkers, books }) {
    const [activeTab, setActiveTab] = useState('summary');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({});

    // Summary state
    const [summaryData, setSummaryData] = useState({
        startDate: new Date().toISOString().split('T')[0]
    });

    // Advice state
    const [adviceData, setAdviceData] = useState({
        thinkerId: '',
        bookId: '',
        lifeArea: '',
        goals: []
    });

    // Routine state
    const [routineData, setRoutineData] = useState({
        wakeUpTime: '06:30',
        sleepTime: '22:00',
        workHours: '9:00-17:00',
        focusAreas: []
    });

    const [error, setError] = useState(null);
    const [savingToJournal, setSavingToJournal] = useState(false);
    const [generatingTasks, setGeneratingTasks] = useState(false);
    
    // Habit suggestions state
    const [habitData, setHabitData] = useState({
        bookId: '',
        thinkerId: '',
        lifeArea: '',
        goals: []
    });
    const [habitSuggestions, setHabitSuggestions] = useState([]);
    const [creatingHabit, setCreatingHabit] = useState(null);

    const handleGenerateSummary = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/ai/generate-summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify(summaryData),
            });

            const data = await response.json();
            if (data.success) {
                setResults(prev => ({ ...prev, summary: data.summary }));
            } else {
                setError(data.message || 'Failed to generate summary');
            }
        } catch (error) {
            console.error('Error generating summary:', error);
            setError('Failed to generate summary. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAdvice = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/ai/generate-advice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify(adviceData),
            });

            const data = await response.json();
            if (data.success) {
                setResults(prev => ({ ...prev, advice: data.advice }));
            } else {
                setError(data.message || 'Failed to generate advice');
            }
        } catch (error) {
            console.error('Error generating advice:', error);
            setError('Failed to generate advice. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateRoutine = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/ai/generate-routine', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify(routineData),
            });

            const data = await response.json();
            if (data.success) {
                // Ensure routine has the expected structure
                if (data.routine && data.routine.routine && data.routine.routine.time_blocks) {
                    setResults(prev => ({ ...prev, routine: data.routine.routine }));
                } else if (data.routine && data.routine.time_blocks) {
                    setResults(prev => ({ ...prev, routine: data.routine }));
                } else {
                    setError('Invalid routine format received');
                }
            } else {
                setError(data.message || 'Failed to generate routine');
            }
        } catch (error) {
            console.error('Error generating routine:', error);
            setError('Failed to generate routine. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const addGoal = () => {
        const goal = prompt('Enter a new goal:');
        if (goal) {
            setAdviceData(prev => ({
                ...prev,
                goals: [...prev.goals, goal]
            }));
        }
    };

    const removeGoal = (index) => {
        setAdviceData(prev => ({
            ...prev,
            goals: prev.goals.filter((_, i) => i !== index)
        }));
    };

    const handleSaveToJournal = async () => {
        if (!results.advice) return;
        
        setSavingToJournal(true);
        setError(null);
        try {
            const response = await fetch('/ai/save-advice-to-journal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify({
                    advice: results.advice.advice || results.advice,
                    thinker: results.advice.thinker,
                    book: results.advice.book,
                }),
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message || 'Advice saved to journal successfully!');
            } else {
                setError(data.message || 'Failed to save advice to journal');
            }
        } catch (error) {
            console.error('Error saving to journal:', error);
            setError('Failed to save advice to journal. Please try again.');
        } finally {
            setSavingToJournal(false);
        }
    };

    const handleGenerateTasks = async () => {
        if (!results.advice) return;
        
        setGeneratingTasks(true);
        setError(null);
        try {
            const response = await fetch('/ai/generate-tasks-from-advice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify({
                    advice: results.advice.advice || results.advice,
                    book_id: adviceData.bookId ? parseInt(adviceData.bookId) : null,
                }),
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message || `${data.count || 0} task(s) created successfully!`);
            } else {
                setError(data.message || 'Failed to generate tasks');
            }
        } catch (error) {
            console.error('Error generating tasks:', error);
            setError('Failed to generate tasks. Please try again.');
        } finally {
            setGeneratingTasks(false);
        }
    };

    const addFocusArea = () => {
        const area = prompt('Enter a focus area:');
        if (area) {
            setRoutineData(prev => ({
                ...prev,
                focusAreas: [...prev.focusAreas, area]
            }));
        }
    };

    const removeFocusArea = (index) => {
        setRoutineData(prev => ({
            ...prev,
            focusAreas: prev.focusAreas.filter((_, i) => i !== index)
        }));
    };

    const handleGenerateHabitSuggestions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/ai/generate-habit-suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify(habitData),
            });

            const data = await response.json();
            if (data.success) {
                setHabitSuggestions(data.suggestions || []);
            } else {
                setError(data.message || 'Failed to generate habit suggestions');
            }
        } catch (error) {
            console.error('Error generating habit suggestions:', error);
            setError('Failed to generate habit suggestions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHabit = async (suggestion) => {
        setCreatingHabit(suggestion.name);
        setError(null);
        try {
            const response = await fetch('/ai/create-habit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify({
                    name: suggestion.name,
                    frequency: suggestion.frequency,
                    target: 1,
                    book_id: habitData.bookId ? parseInt(habitData.bookId) : null,
                    description: suggestion.description,
                }),
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message || 'Habit created successfully!');
                // Remove the suggestion from the list
                setHabitSuggestions(prev => prev.filter(s => s.name !== suggestion.name));
            } else {
                setError(data.message || 'Failed to create habit');
            }
        } catch (error) {
            console.error('Error creating habit:', error);
            setError('Failed to create habit. Please try again.');
        } finally {
            setCreatingHabit(null);
        }
    };

    const addHabitGoal = () => {
        const goal = prompt('Enter a goal for habit suggestions:');
        if (goal) {
            setHabitData(prev => ({
                ...prev,
                goals: [...prev.goals, goal]
            }));
        }
    };

    const removeHabitGoal = (index) => {
        setHabitData(prev => ({
            ...prev,
            goals: prev.goals.filter((_, i) => i !== index)
        }));
    };

    return (
        <Layout>
            <Head title="AI Features" />
            
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">AI-Powered Features</h1>
                    <p className="text-gray-600 mt-2">
                        Leverage AI to enhance your personal growth journey with intelligent insights and recommendations.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="summary" className="flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            Weekly Summary
                        </TabsTrigger>
                        <TabsTrigger value="advice" className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Personalized Advice
                        </TabsTrigger>
                        <TabsTrigger value="habits" className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Habit Suggestions
                        </TabsTrigger>
                        <TabsTrigger value="routine" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Routine Builder
                        </TabsTrigger>
                    </TabsList>

                    {/* Weekly Summary Tab */}
                    <TabsContent value="summary" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Brain className="h-5 w-5" />
                                    Weekly Growth Summary
                                </CardTitle>
                                <CardDescription>
                                    Get AI-powered insights into your weekly progress, habits, and growth patterns.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="startDate">Start Date</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={summaryData.startDate}
                                            onChange={(e) => setSummaryData(prev => ({ ...prev, startDate: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                
                                <Button 
                                    onClick={handleGenerateSummary} 
                                    disabled={loading}
                                    className="w-full"
                                >
                                    {loading ? 'Generating...' : 'Generate Weekly Summary'}
                                </Button>

                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}
                                
                                {results.summary && (
                                    <div className="mt-6 space-y-4">
                                        <h3 className="text-lg font-semibold">Your Weekly Summary</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            {results.summary.data && (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-blue-600">
                                                            {results.summary.data.habits?.total_habits || 0}
                                                        </div>
                                                        <div className="text-sm text-gray-600">Habits</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-green-600">
                                                            {results.summary.data.habits?.average_completion_rate || 0}%
                                                        </div>
                                                        <div className="text-sm text-gray-600">Completion Rate</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-purple-600">
                                                            {results.summary.data.tasks?.completion_rate || 0}%
                                                        </div>
                                                        <div className="text-sm text-gray-600">Task Completion</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-orange-600">
                                                            {results.summary.data.overall_consistency || 0}%
                                                        </div>
                                                        <div className="text-sm text-gray-600">Consistency</div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="prose max-w-none">
                                                <p className="whitespace-pre-wrap">{results.summary.insights?.text || 'No insights available'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Personalized Advice Tab */}
                    <TabsContent value="advice" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Personalized Advice
                                </CardTitle>
                                <CardDescription>
                                    Get customized advice based on your selected thinker, books, and personal goals.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="thinker">Thinker (Optional)</Label>
                                        <Select 
                                            value={adviceData.thinkerId} 
                                            onValueChange={(value) => setAdviceData(prev => ({ ...prev, thinkerId: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a thinker" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {thinkers && thinkers.length > 0 ? (
                                                    thinkers.map((thinker) => (
                                                        <SelectItem key={thinker.id} value={thinker.id.toString()}>
                                                            {thinker.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="" disabled>No thinkers available</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="book">Book (Optional)</Label>
                                        <Select 
                                            value={adviceData.bookId} 
                                            onValueChange={(value) => setAdviceData(prev => ({ ...prev, bookId: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a book" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {books.map((book) => (
                                                    <SelectItem key={book.id} value={book.id.toString()}>
                                                        {book.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="lifeArea">Life Area (Optional)</Label>
                                    <Select 
                                        value={adviceData.lifeArea} 
                                        onValueChange={(value) => setAdviceData(prev => ({ ...prev, lifeArea: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a life area" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="health">Health & Wellness</SelectItem>
                                            <SelectItem value="career">Career & Professional</SelectItem>
                                            <SelectItem value="relationships">Relationships</SelectItem>
                                            <SelectItem value="personal_growth">Personal Growth</SelectItem>
                                            <SelectItem value="learning">Learning & Development</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Personal Goals</Label>
                                    <div className="space-y-2">
                                        {adviceData.goals.map((goal, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <span className="flex-1 text-sm">{goal}</span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => removeGoal(index)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={addGoal}
                                            className="w-full"
                                        >
                                            Add Goal
                                        </Button>
                                    </div>
                                </div>
                                
                                <Button 
                                    onClick={handleGenerateAdvice} 
                                    disabled={loading}
                                    className="w-full"
                                >
                                    {loading ? 'Generating...' : 'Generate Personalized Advice'}
                                </Button>

                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}
                                
                                {results.advice && (
                                    <div className="mt-6 space-y-4">
                                        <h3 className="text-lg font-semibold">Your Personalized Advice</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            {results.advice.thinker && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <User className="h-4 w-4" />
                                                    <span className="text-sm font-medium">{results.advice.thinker}</span>
                                                    {results.advice.book && (
                                                        <>
                                                            <span className="text-gray-400">•</span>
                                                            <BookOpen className="h-4 w-4" />
                                                            <span className="text-sm text-gray-600">{results.advice.book}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            <div className="prose max-w-none mb-4">
                                                <p className="whitespace-pre-wrap">{results.advice.advice || results.advice}</p>
                                            </div>
                                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                                                <Button
                                                    onClick={handleSaveToJournal}
                                                    disabled={savingToJournal}
                                                    variant="outline"
                                                    className="flex items-center gap-2"
                                                >
                                                    <BookMarked className="h-4 w-4" />
                                                    {savingToJournal ? 'Saving...' : 'Save to Journal'}
                                                </Button>
                                                <Button
                                                    onClick={handleGenerateTasks}
                                                    disabled={generatingTasks}
                                                    variant="outline"
                                                    className="flex items-center gap-2"
                                                >
                                                    <CheckSquare className="h-4 w-4" />
                                                    {generatingTasks ? 'Generating...' : 'Generate Tasks'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Habit Suggestions Tab */}
                    <TabsContent value="habits" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5" />
                                    AI Habit Suggestions
                                </CardTitle>
                                <CardDescription>
                                    Get personalized habit suggestions based on your books, goals, and current activities.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="habit-thinker">Thinker (Optional)</Label>
                                        <Select 
                                            value={habitData.thinkerId} 
                                            onValueChange={(value) => setHabitData(prev => ({ ...prev, thinkerId: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a thinker" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {thinkers && thinkers.length > 0 ? (
                                                    thinkers.map((thinker) => (
                                                        <SelectItem key={thinker.id} value={thinker.id.toString()}>
                                                            {thinker.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="" disabled>No thinkers available</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="habit-book">Book (Optional)</Label>
                                        <Select 
                                            value={habitData.bookId} 
                                            onValueChange={(value) => setHabitData(prev => ({ ...prev, bookId: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a book" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {books.map((book) => (
                                                    <SelectItem key={book.id} value={book.id.toString()}>
                                                        {book.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="habit-life-area">Life Area (Optional)</Label>
                                    <Select 
                                        value={habitData.lifeArea} 
                                        onValueChange={(value) => setHabitData(prev => ({ ...prev, lifeArea: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a life area" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="health">Health & Wellness</SelectItem>
                                            <SelectItem value="career">Career & Professional</SelectItem>
                                            <SelectItem value="relationships">Relationships</SelectItem>
                                            <SelectItem value="personal_growth">Personal Growth</SelectItem>
                                            <SelectItem value="learning">Learning & Development</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Goals (Optional)</Label>
                                    <div className="space-y-2">
                                        {habitData.goals.map((goal, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <span className="flex-1 text-sm">{goal}</span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => removeHabitGoal(index)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={addHabitGoal}
                                            className="w-full"
                                        >
                                            Add Goal
                                        </Button>
                                    </div>
                                </div>
                                
                                <Button 
                                    onClick={handleGenerateHabitSuggestions} 
                                    disabled={loading}
                                    className="w-full"
                                >
                                    {loading ? 'Generating...' : 'Generate Habit Suggestions'}
                                </Button>

                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}
                                
                                {habitSuggestions.length > 0 && (
                                    <div className="mt-6 space-y-4">
                                        <h3 className="text-lg font-semibold">Suggested Habits</h3>
                                        <div className="space-y-3">
                                            {habitSuggestions.map((suggestion, index) => (
                                                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium mb-1">{suggestion.name}</div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge variant="secondary">{suggestion.frequency}</Badge>
                                                        </div>
                                                        {suggestion.description && (
                                                            <div className="text-sm text-gray-600">{suggestion.description}</div>
                                                        )}
                                                    </div>
                                                    <Button
                                                        onClick={() => handleCreateHabit(suggestion)}
                                                        disabled={creatingHabit === suggestion.name}
                                                        size="sm"
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                        {creatingHabit === suggestion.name ? 'Creating...' : 'Add Habit'}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Routine Builder Tab */}
                    <TabsContent value="routine" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Daily Routine Builder
                                </CardTitle>
                                <CardDescription>
                                    Generate a personalized daily routine based on your preferences and current habits.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="wakeUpTime">Wake Up Time</Label>
                                        <Input
                                            id="wakeUpTime"
                                            type="time"
                                            value={routineData.wakeUpTime}
                                            onChange={(e) => setRoutineData(prev => ({ ...prev, wakeUpTime: e.target.value }))}
                                        />
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="sleepTime">Sleep Time</Label>
                                        <Input
                                            id="sleepTime"
                                            type="time"
                                            value={routineData.sleepTime}
                                            onChange={(e) => setRoutineData(prev => ({ ...prev, sleepTime: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="workHours">Work Hours</Label>
                                    <Input
                                        id="workHours"
                                        placeholder="e.g., 9:00-17:00"
                                        value={routineData.workHours}
                                        onChange={(e) => setRoutineData(prev => ({ ...prev, workHours: e.target.value }))}
                                    />
                                </div>

                                <div>
                                    <Label>Focus Areas</Label>
                                    <div className="space-y-2">
                                        {routineData.focusAreas.map((area, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <span className="flex-1 text-sm">{area}</span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => removeFocusArea(index)}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={addFocusArea}
                                            className="w-full"
                                        >
                                            Add Focus Area
                                        </Button>
                                    </div>
                                </div>
                                
                                <Button 
                                    onClick={handleGenerateRoutine} 
                                    disabled={loading}
                                    className="w-full"
                                >
                                    {loading ? 'Generating...' : 'Generate Daily Routine'}
                                </Button>

                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                        {error}
                                    </div>
                                )}
                                
                                {results.routine && (
                                    <div className="mt-6 space-y-4">
                                        <h3 className="text-lg font-semibold">Your Daily Routine</h3>
                                        <div className="space-y-3">
                                            {(results.routine.time_blocks || []).map((block, index) => (
                                                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Clock className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm font-medium">
                                                            {block.start_time} - {block.end_time}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium">{block.activity}</div>
                                                        <div className="text-sm text-gray-600">{block.description}</div>
                                                    </div>
                                                    <Badge variant="secondary">{block.category}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}
