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

const Edit = ({ task, books, habits }) => {
    const { data, setData, put, processing, errors } = useForm({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        due_date: task.due_date || "",
        book_id: task.book_id ? task.book_id.toString() : "",
        habit_id: task.habit_id ? task.habit_id.toString() : "",
        is_completed: task.is_completed || false,
    });

    const priorities = [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
    ];

    function submit(e) {
        e.preventDefault();
        put(`/tasks/${task.id}`);
    }

    return (
        <>
            <Head title={`Edit Task - ${task.title}`} />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={`/tasks/${task.id}`}
                            className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
                        >
                            ← Back to Task
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Task</h1>
                    </div>
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
                                        {books && books.map((book) => (
                                            <SelectItem key={book.id} value={book.id.toString()}>
                                                {book.title}
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
                                        {habits && habits.map((habit) => (
                                            <SelectItem key={habit.id} value={habit.id.toString()}>
                                                {habit.name}
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
            </div>
        </>
    );
};

Edit.layout = (page) => <AppLayout children={page} title="Edit Task" />;
export default Edit;
