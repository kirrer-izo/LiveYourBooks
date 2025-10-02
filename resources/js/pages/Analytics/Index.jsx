import React from "react";
import AppLayout from "../../layouts/AppLayout";
import { Head } from "@inertiajs/react";

const Index = () => {
    return (
        <>
        <Head title="Analytics - Live Your Books" />
        <div data-aos="fade-up">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
                        <select className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option>Last 7 days</option>
                            <option>Last 30 days</option>
                            <option>Last 90 days</option>
                            <option>This year</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4">Reading Progress</h3>
                            <div className="h-64 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-40 h-40 mx-auto mb-4 rounded-full border-8 border-indigo-100 flex items-center justify-center">
                                        <span className="text-3xl font-bold text-indigo-600">75%</span>
                                    </div>
                                    <p className="text-gray-600">You're making great progress!</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold mb-4">Habit Consistency</h3>
                            <div className="h-64 flex items-center justify-center">
                                <div className="w-full">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Morning Journal</span>
                                        <span>85%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Exercise</span>
                                        <span>72%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                                    </div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Reading</span>
                                        <span>91%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '91%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8">
                        <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
                        <div className="h-80">
                            <div className="flex items-end h-64 space-x-2">
                                {[20, 45, 60, 75, 80, 65, 90].map((value, index) => (
                                    <div key={index} className="flex-1 flex flex-col items-center">
                                        <div 
                                            className="w-full bg-indigo-100 rounded-t-sm hover:bg-indigo-200 transition-colors"
                                            style={{ height: `${value}%` }}
                                        ></div>
                                        <span className="text-xs mt-1 text-gray-500">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold mb-4">Achievements</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 border border-gray-100 rounded-lg text-center">
                                <div className="w-16 h-16 mx-auto mb-2 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <i data-feather="book" className="text-indigo-600"></i>
                                </div>
                                <h4 className="font-medium">Book Worm</h4>
                                <p className="text-sm text-gray-500">Read 5 books</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg text-center">
                                <div className="w-16 h-16 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                                    <i data-feather="zap" className="text-green-600"></i>
                                </div>
                                <h4 className="font-medium">7-Day Streak</h4>
                                <p className="text-sm text-gray-500">Consistent for a week</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg text-center">
                                <div className="w-16 h-16 mx-auto mb-2 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <i data-feather="edit" className="text-yellow-600"></i>
                                </div>
                                <h4 className="font-medium">Reflective</h4>
                                <p className="text-sm text-gray-500">10 journal entries</p>
                            </div>
                            <div className="p-4 border border-gray-100 rounded-lg text-center">
                                <div className="w-16 h-16 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center">
                                    <i data-feather="check-circle" className="text-purple-600"></i>
                                </div>
                                <h4 className="font-medium">Task Master</h4>
                                <p className="text-sm text-gray-500">Completed 20 tasks</p>
                            </div>
                        </div>
                    </div>
                </div>
        </>
    )
}

Index.layout = page => <AppLayout children={page} title="Analytics" />
export default Index;