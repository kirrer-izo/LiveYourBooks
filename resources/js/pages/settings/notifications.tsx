import { Head, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

import AppLayout from '../../layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Clock } from 'lucide-react';

import { router } from '@inertiajs/react';

interface NotificationPreferences {
    habit_reminders_enabled: boolean;
    habit_reminder_time: string;
    habit_reminder_days: number[];
    journal_reminders_enabled: boolean;
    journal_reminder_time: string;
    journal_reminder_days: number[];
    task_reminders_enabled: boolean;
    task_reminder_time: string;
    task_reminder_days: number[];
    timezone: string;
}

const DAYS = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
];

interface Props {
    preferences: NotificationPreferences;
    timezones: string[];
}

export default function Notifications({ preferences: initialPreferences, timezones }: Props) {
    const { flash } = usePage().props as unknown as { flash: { success?: string; error?: string } };
    const [preferences, setPreferences] = useState<NotificationPreferences>(initialPreferences);
    const [saving, setSaving] = useState(false);

    // Update preferences when they change from server
    useEffect(() => {
        if (initialPreferences) {
            setPreferences(initialPreferences);
        }
    }, [initialPreferences]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        setSaving(true);
        router.post('/settings/notifications', preferences, {
            preserveScroll: true,
            onSuccess: () => {
                // Success message will be handled by flash messages
            },
            onError: (errors) => {
                console.error('Failed to save preferences', errors);
            },
            onFinish: () => {
                setSaving(false);
            },
        });
    };

    const toggleDay = (type: 'habit' | 'journal' | 'task', day: number) => {
        const daysField = `${type}_reminder_days` as keyof NotificationPreferences;
        const currentDays = (preferences[daysField] as number[]) || [];
        const newDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day].sort();

        setPreferences({
            ...preferences,
            [daysField]: newDays,
        });
    };

    return (
        <AppLayout>
            <Head title="Notification settings" />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notification Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Customize when and how you receive reminders for habits, journal entries, and tasks
                    </p>
                </div>

                {flash?.success && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300 text-sm">
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
                        {flash.error}
                    </div>
                )}

                <div className="space-y-6">

                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Habit Reminders */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Habit Reminders
                                </CardTitle>
                                <CardDescription>
                                    Get reminders to log your daily habits
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="habit_reminders_enabled"
                                        checked={preferences.habit_reminders_enabled}
                                        onCheckedChange={(checked) =>
                                            setPreferences({
                                                ...preferences,
                                                habit_reminders_enabled: checked as boolean,
                                            })
                                        }
                                    />
                                    <Label htmlFor="habit_reminders_enabled" className="cursor-pointer">
                                        Enable habit reminders
                                    </Label>
                                </div>

                                {preferences.habit_reminders_enabled && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="habit_reminder_time">Reminder Time</Label>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="habit_reminder_time"
                                                    type="time"
                                                    value={preferences.habit_reminder_time}
                                                    onChange={(e) =>
                                                        setPreferences({
                                                            ...preferences,
                                                            habit_reminder_time: e.target.value,
                                                        })
                                                    }
                                                    className="max-w-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Days of Week</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {DAYS.map((day) => (
                                                    <div key={day.value} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`habit_day_${day.value}`}
                                                            checked={preferences.habit_reminder_days.includes(day.value)}
                                                            onCheckedChange={() => toggleDay('habit', day.value)}
                                                        />
                                                        <Label
                                                            htmlFor={`habit_day_${day.value}`}
                                                            className="cursor-pointer text-sm"
                                                        >
                                                            {day.label.slice(0, 3)}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Journal Reminders */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Journal Nudges
                                </CardTitle>
                                <CardDescription>
                                    Receive prompts to reflect if no journal entry is made
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="journal_reminders_enabled"
                                        checked={preferences.journal_reminders_enabled}
                                        onCheckedChange={(checked) =>
                                            setPreferences({
                                                ...preferences,
                                                journal_reminders_enabled: checked as boolean,
                                            })
                                        }
                                    />
                                    <Label htmlFor="journal_reminders_enabled" className="cursor-pointer">
                                        Enable journal reminders
                                    </Label>
                                </div>

                                {preferences.journal_reminders_enabled && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="journal_reminder_time">Reminder Time</Label>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="journal_reminder_time"
                                                    type="time"
                                                    value={preferences.journal_reminder_time}
                                                    onChange={(e) =>
                                                        setPreferences({
                                                            ...preferences,
                                                            journal_reminder_time: e.target.value,
                                                        })
                                                    }
                                                    className="max-w-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Days of Week</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {DAYS.map((day) => (
                                                    <div key={day.value} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`journal_day_${day.value}`}
                                                            checked={preferences.journal_reminder_days.includes(day.value)}
                                                            onCheckedChange={() => toggleDay('journal', day.value)}
                                                        />
                                                        <Label
                                                            htmlFor={`journal_day_${day.value}`}
                                                            className="cursor-pointer text-sm"
                                                        >
                                                            {day.label.slice(0, 3)}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Task Reminders */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Task Reminders
                                </CardTitle>
                                <CardDescription>
                                    Get notified about upcoming and due tasks
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="task_reminders_enabled"
                                        checked={preferences.task_reminders_enabled}
                                        onCheckedChange={(checked) =>
                                            setPreferences({
                                                ...preferences,
                                                task_reminders_enabled: checked as boolean,
                                            })
                                        }
                                    />
                                    <Label htmlFor="task_reminders_enabled" className="cursor-pointer">
                                        Enable task reminders
                                    </Label>
                                </div>

                                {preferences.task_reminders_enabled && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="task_reminder_time">Reminder Time</Label>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="task_reminder_time"
                                                    type="time"
                                                    value={preferences.task_reminder_time}
                                                    onChange={(e) =>
                                                        setPreferences({
                                                            ...preferences,
                                                            task_reminder_time: e.target.value,
                                                        })
                                                    }
                                                    className="max-w-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Days of Week</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {DAYS.map((day) => (
                                                    <div key={day.value} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`task_day_${day.value}`}
                                                            checked={preferences.task_reminder_days.includes(day.value)}
                                                            onCheckedChange={() => toggleDay('task', day.value)}
                                                        />
                                                        <Label
                                                            htmlFor={`task_day_${day.value}`}
                                                            className="cursor-pointer text-sm"
                                                        >
                                                            {day.label.slice(0, 3)}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Timezone */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Timezone
                                </CardTitle>
                                <CardDescription>
                                    Choose the timezone used to schedule reminder times
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2 max-w-xl">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <select
                                        id="timezone"
                                        className="border rounded px-3 py-2 bg-background text-foreground"
                                        value={preferences.timezone}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                timezone: e.target.value,
                                            })
                                        }
                                    >
                                        {timezones.map((tz) => (
                                            <option key={tz} value={tz}>
                                                {tz}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Preferences'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

