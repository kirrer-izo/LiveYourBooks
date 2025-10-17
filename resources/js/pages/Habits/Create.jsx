import React from 'react';
import AppLayout from '../../layouts/AppLayout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import InputError from '../../components/input-error';

// We'll expect `books` and `tasks` to be passed as props from the controller
const Create = ({ books, tasks }) => {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        target: '',
        book_id: '',
        task_id: '',
        is_active: true, // Default to active
    });

    function submit(e) {
        e.preventDefault();
        post('/habits');
    }

    return (
        <>
            <Head title='Create Habit' />

            <Card>
                <CardHeader>
                    <CardTitle>Create a New Habit</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Habit Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g., Read for 30 minutes"
                                required
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="target">Target / Description</Label>
                            <Input
                                id="target"
                                name="target"
                                value={data.target}
                                onChange={(e) => setData('target', e.target.value)}
                                placeholder="Select number of days between 1-365"
                            />
                            <InputError message={errors.target} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="book_id">Associated Book (Optional)</Label>
                            <Select onValueChange={(value) => setData('book_id', value)} value={data.book_id}>
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

                 
                        <div className="space-y-2">
                            <Label htmlFor="task_id">Associated Task (Optional)</Label>
                             <Select onValueChange={(value) => setData('task_id', value)} value={data.task_id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a task" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={null}>None</SelectItem>
                                    {tasks.map((task) => (
                                        <SelectItem key={task.id} value={task.id.toString()}>
                                            {task.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.task_id} />
                        </div>
                        
                     
                        <div className="flex items-center space-x-2">
                             <Checkbox
                                id="is_active"
                                name="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked)}
                            />
                            <Label htmlFor="is_active">Set habit as active</Label>
                            <InputError message={errors.is_active} />
                        </div>

                   
                        <div className="flex justify-end">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating...' : 'Create Habit'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </>
    );
};

Create.layout = (page) => <AppLayout children={page} title="Create Habit" />;
export default Create;