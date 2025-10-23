import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head, usePage } from "@inertiajs/react";

const Index = () => {
    const { props } = usePage();
    const {
        readingProgress = { average: 0, completed: 0, in_progress: 0, not_started: 0 },
        habitConsistency = [],
        weeklyData = [],
        achievements = [],
    } = props || {};

    const avgProgress = Math.round(readingProgress.average || 0);
    const habitsToShow = (habitConsistency || []).slice(0, 3);
    const habitColors = [
        { bar: "bg-indigo-600" },
        { bar: "bg-green-600" },
        { bar: "bg-purple-600" },
    ];

    const combinedValues = (weeklyData || []).map(d =>
        (d?.tasks_completed || 0) + (d?.journal_entries || 0) + (d?.habits_completed || 0)
    );
    const maxCombined = Math.max(1, ...combinedValues);

    return (
        <>
        <Head title="Analytics - Live Your Books" />
        <div data-aos="fade-up">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
                        <select className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option>Last 7 days</option>
                            <option>Last 30 days</option>
                            <option>Last 90 days</option>
                            <option>This year</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4">Reading Progress</h3>
                            <div className="h-56 sm:h-64 md:h-72 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4 rounded-full border-8 border-indigo-100 flex items-center justify-center">
                                        <span className="text-3xl font-bold text-indigo-600">{avgProgress}%</span>
                                    </div>
                                    <p className="text-gray-600">
                                        {readingProgress.completed} completed • {readingProgress.in_progress} in progress
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4">Habit Consistency</h3>
                            <div className="h-56 sm:h-64 md:h-72 flex items-center justify-center">
                                <div className="w-full">
                                    {habitsToShow.length === 0 ? (
                                        <div className="text-sm text-gray-500">No active habits yet</div>
                                    ) : (
                                        habitsToShow.map((h, idx) => (
                                            <div key={h.name + idx} className="mb-3">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>{h.name}</span>
                                                    <span>{h.percent}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div className={`${habitColors[idx % habitColors.length].bar} h-2 rounded-full`} style={{ width: `${Math.min(100, Math.max(0, h.percent))}%` }}></div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 mb-6 sm:mb-8">
                        <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
                        <div className="h-72 sm:h-80 overflow-x-auto">
                            <div className="min-w-[520px] sm:min-w-0 flex items-end h-56 sm:h-64 space-x-1 sm:space-x-2 pr-2">
                                {(weeklyData || []).map((d, index) => {
                                    const combined = combinedValues[index] || 0;
                                    const pct = Math.round((combined / maxCombined) * 100);
                                    return (
                                    <div key={d.date || index} className="flex-1 flex flex-col items-center">
                                        <div 
                                            className="w-full bg-indigo-100 rounded-t-sm hover:bg-indigo-200 transition-colors"
                                            style={{ height: `${pct}%` }}
                                        ></div>
                                        <span className="text-xs mt-1 text-gray-500">
                                            {d.day || ''}
                                        </span>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold mb-4">Achievements</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {(achievements || []).map((a, idx) => (
                                <div key={a.label + idx} className={`p-4 border border-gray-100 rounded-lg text-center ${a.unlocked ? '' : 'opacity-60'}`}>
                                    <div className="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center bg-gray-100">
                                        <i data-feather={a.icon} className="text-indigo-600"></i>
                                    </div>
                                    <h4 className="font-medium">{a.label}</h4>
                                    <p className="text-sm text-gray-500">{a.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
        </>
    )
}

Index.layout = page => <AppLayout children={page} title="Analytics" />
export default Index;