import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import DatePicker from "../../components/ui/date-picker";
import { Textarea } from "../../components/ui/textarea";
import InputError from "../../components/input-error";

const Edit = ({ task, books = [], habits = [] }) => {
    // Debug logging
    React.useEffect(() => {
        console.log('Edit component rendered', { task, books, habits });
    }, [task, books, habits]);

    // Early return if task is not provided
    if (!task || !task.id) {
        return (
            <>
                <Head title="Task Not Found" />
                <div className="text-center py-12">
                    <p className="text-gray-500">Task not found</p>
                    <Link href="/tasks" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
                        ← Back to Tasks
                    </Link>
                </div>
            </>
        );
    }

    // Format due_date for DatePicker (expects YYYY-MM-DD format)
    const formatDateForPicker = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "";
            return date.toISOString().split('T')[0];
        } catch (e) {
            return "";
        }
    };

    // Ensure books and habits are arrays
    const booksArray = Array.isArray(books) ? books : [];
    const habitsArray = Array.isArray(habits) ? habits : [];

    const { data, setData, put, processing, errors } = useForm({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        due_date: formatDateForPicker(task.due_date),
        book_id: task.book_id ? String(task.book_id) : "",
        habit_id: task.habit_id ? String(task.habit_id) : "",
        is_completed: task.is_completed || false,
    });

    const priorities = [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
    ];

    function submit(e) {
        e.preventDefault();
        if (!task.id) {
            console.error('Task ID is missing');
            return;
        }
        put(`/tasks/${task.id}`);
    }

    return (
        <>
            <Head title={`Edit Task - ${task.title || 'Task'}`} />
            
            <div className="mb-4">
                <Link
                    href={`/tasks/${task.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-800 inline-block"
                >
                    ← Back to Task
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Edit Task</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-6">
                        {/* Task Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Task Title</Label>
                            <Input
                                id="title"
                                name="title"
                                value={data.title}
                                onChange={(e) => setData("title", e.target.value)}
                                placeholder="e.g., Read Chapter 1"
                                required
                            />
                            <InputError message={errors.title} />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={data.description}
                                onChange={(e) => setData("description", e.target.value)}
                                placeholder="Add more details about the task..."
                                rows={4}
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Priority */}
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select onValueChange={(value) => setData("priority", value)} value={data.priority}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorities.map((p) => (
                                            <SelectItem key={p.value} value={p.value}>
                                                {p.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.priority} />
                            </div>

                            {/* Due Date */}
                            <div className="space-y-2">
                                <Label htmlFor="due_date">Due Date (Optional)</Label>
                                <DatePicker
                                    id="due_date"
                                    name="due_date"
                                    value={data.due_date || ""}
                                    onChange={(value) => setData("due_date", value)}
                                />
                                <InputError message={errors.due_date} />
                            </div>
                        </div>
                        
                        {/* Associated Book */}
                        <div className="space-y-2">
                            <Label htmlFor="book_id">Associated Book (Optional)</Label>
                            <Select onValueChange={(value) => setData("book_id", value)} value={data.book_id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a book" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {booksArray.map((book) => (
                                        <SelectItem key={book.id} value={String(book.id)}>
                                            {book.title || 'Untitled'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.book_id} />
                        </div>

                        {/* Associated Habit */}
                        <div className="space-y-2">
                            <Label htmlFor="habit_id">Associated Habit (Optional)</Label>
                            <Select onValueChange={(value) => setData("habit_id", value)} value={data.habit_id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a habit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {habitsArray.map((habit) => (
                                        <SelectItem key={habit.id} value={String(habit.id)}>
                                            {habit.name || 'Untitled'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.habit_id} />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-3">
                            <Link
                                href={`/tasks/${task.id}`}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </Link>
                            <Button type="submit" disabled={processing}>
                                {processing ? "Updating..." : "Update Task"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </>
    );
};

Edit.layout = (page) => <AppLayout>{page}</AppLayout>;
export default Edit;
