import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head } from "@inertiajs/react";

const Index = () => {
                const habits = [
                { id: 1, name: "Morning Journal", streak: 14, frequency: "daily" },
                { id: 2, name: "Exercise", streak: 5, frequency: "daily" },
                { id: 3, name: "Read 30 mins", streak: 21, frequency: "daily" },
            ];
               const [habitList, setHabitList] = React.useState(habits);
            const [newHabit, setNewHabit] = React.useState('');
            const [showHabitForm, setShowHabitForm] = React.useState(false);
            const [frequency, setFrequency] = React.useState('daily');

            const handleAddHabit = (e) => {
                e.preventDefault();
                if (newHabit.trim() === '') return;
                
                const habit = {
                    id: habitList.length + 1,
                    name: newHabit,
                    streak: 0,
                    frequency: frequency
                };
                
                setHabitList([...habitList, habit]);
                setNewHabit('');
                setShowHabitForm(false);
            };

            const incrementStreak = (habitId) => {
                setHabitList(habitList.map(habit => 
                    habit.id === habitId ? { ...habit, streak: habit.streak + 1 } : habit
                ));
            };
    return (
        <>
        <Head title="Habits - Live Your Books" />
<div data-aos="fade-up">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Habit Tracker</h2>
                        <button
                            onClick={() => setShowHabitForm(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                            New Habit
                        </button>
                    </div>

                    {showHabitForm && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Create New Habit</h3>
                                <button 
                                    onClick={() => setShowHabitForm(false)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <i data-feather="x"></i>
                                </button>
                            </div>
                            <form onSubmit={handleAddHabit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Habit Name</label>
                                    <input
                                        type="text"
                                        value={newHabit}
                                        onChange={(e) => setNewHabit(e.target.value)}
                                        placeholder="e.g. Morning Journal"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                    <select
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowHabitForm(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    >
                                        Create Habit
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {habitList.length === 0 ? (
                        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
                            <i data-feather="activity" className="w-12 h-12 mx-auto text-gray-400"></i>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No habits yet</h3>
                            <p className="mt-1 text-gray-500">Start by creating your first habit</p>
                            <button
                                onClick={() => setShowHabitForm(true)}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Create Habit
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {habitList.map(habit => (
                                <div key={habit.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-semibold">{habit.name}</h3>
                                            <p className="text-sm text-gray-500 capitalize">{habit.frequency} habit</p>
                                        </div>
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                                            {habit.streak} day streak
                                        </span>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>Current streak</span>
                                            <span>{habit.streak} days</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-indigo-600 h-2 rounded-full" 
                                                style={{ width: `${Math.min(habit.streak * 10, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-between">
                                        <button 
                                            onClick={() => incrementStreak(habit.id)}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                        >
                                            Complete Today
                                        </button>
                                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                                            View History
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
        </>
    )
}

Index.layout = page => <AppLayout children={page} title="Habits" />;
export default Index;