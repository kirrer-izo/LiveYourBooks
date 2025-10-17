import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, useForm } from "@inertiajs/react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import InputError from "../../components/input-error";

// Expect `books` and `habits` to be passed as props from the controller
const Create = ({ books, habits }) => {
    const { data, setData, post, processing, errors } = useForm({
        title: "",
        description: "",
        priority: "medium", // Defaulting to medium, you can change this
        due_date: "",
        book_id: "",
        habit_id: "",
    });

    // Define priority options
    const priorities = [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
    ];

    function submit(e) {
        e.preventDefault();
        post("/tasks");
    }

    return (
        <>
            <Head title="Create Task" />

            <Card>
                <CardHeader>
                    <CardTitle>Create a New Task</CardTitle>
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

                        {/* Description (Optional) */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Input // You can swap this with <Textarea> if you have it
                                id="description"
                                name="description"
                                value={data.description}
                                onChange={(e) => setData("description", e.target.value)}
                                placeholder="Add more details about the task..."
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

                            {/* Due Date (Optional) */}
                            <div className="space-y-2">
                                <Label htmlFor="due_date">Due Date (Optional)</Label>
                                <Input
                                    id="due_date"
                                    name="due_date"
                                    type="date"
                                    value={data.due_date}
                                    onChange={(e) => setData("due_date", e.target.value)}
                                />
                                <InputError message={errors.due_date} />
                            </div>
                        </div>
                        
                        {/* Associated Book Dropdown (Optional) */}
                        <div className="space-y-2">
                            <Label htmlFor="book_id">Associated Book (Optional)</Label>
                            <Select onValueChange={(value) => setData("book_id", value)} value={data.book_id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a book" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={null}>None</SelectItem>
                                    {books.map((book) => (
                                        <SelectItem key={book.id} value={book.id.toString()}>
                                            {book.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.book_id} />
                        </div>

                        {/* Associated Habit Dropdown (Optional) */}
                        <div className="space-y-2">
                            <Label htmlFor="habit_id">Associated Habit (Optional)</Label>
                            <Select onValueChange={(value) => setData("habit_id", value)} value={data.habit_id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a habit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={null}>None</SelectItem>
                                    {habits.map((habit) => (
                                        <SelectItem key={habit.id} value={habit.id.toString()}>
                                            {habit.name} {/* Assuming habit has a 'name' field */}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.habit_id} />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing}>
                                {processing ? "Creating..." : "Create Task"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </>
    );
};

Create.layout = (page) => <AppLayout children={page} title="Create Task" />;
export default Create;