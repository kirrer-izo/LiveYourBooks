import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
    id?: string;
    name?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    min?: string;
    max?: string;
    required?: boolean;
    disabled?: boolean;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
    ({ id, name, value, onChange, placeholder, className, min, max, required, disabled, ...props }, ref) => {
        const [isOpen, setIsOpen] = useState(false);
        const [currentMonth, setCurrentMonth] = useState(() => {
            const date = value ? new Date(value) : new Date();
            return new Date(date.getFullYear(), date.getMonth(), 1);
        });
        const containerRef = useRef<HTMLDivElement>(null);
        const inputRef = useRef<HTMLInputElement>(null);

        // Merge refs
        React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

        // Update current month when value changes
        useEffect(() => {
            if (value) {
                const date = new Date(value);
                setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            }
        }, [value]);

        // Close calendar when clicking outside
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };

            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
                return () => document.removeEventListener('mousedown', handleClickOutside);
            }
        }, [isOpen]);

        const formatDate = (dateString: string): string => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            });
        };

        const handleDateSelect = (day: number) => {
            const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateString = selectedDate.toISOString().split('T')[0];
            onChange(dateString);
            setIsOpen(false);
            if (inputRef.current) {
                inputRef.current.focus();
            }
        };

        const navigateMonth = (direction: 'prev' | 'next') => {
            setCurrentMonth(prev => {
                const newDate = new Date(prev);
                if (direction === 'prev') {
                    newDate.setMonth(prev.getMonth() - 1);
                } else {
                    newDate.setMonth(prev.getMonth() + 1);
                }
                return newDate;
            });
        };

        const getDaysInMonth = (date: Date): number => {
            return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        };

        const getFirstDayOfMonth = (date: Date): number => {
            return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        };

        const isToday = (day: number): boolean => {
            const today = new Date();
            const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            return checkDate.toDateString() === today.toDateString();
        };

        const isSelected = (day: number): boolean => {
            if (!value) return false;
            const selectedDate = new Date(value);
            const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            return checkDate.toDateString() === selectedDate.toDateString();
        };

        const isDisabled = (day: number): boolean => {
            const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            if (min) {
                const minDate = new Date(min);
                if (checkDate < minDate) return true;
            }
            if (max) {
                const maxDate = new Date(max);
                if (checkDate > maxDate) return true;
            }
            return false;
        };

        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const days = [];
        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return (
            <div ref={containerRef} className="relative">
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        id={id}
                        name={name}
                        value={formatDate(value)}
                        readOnly
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        placeholder={placeholder || "Select a date"}
                        required={required}
                        disabled={disabled}
                        className={cn(
                            "w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md cursor-pointer",
                            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                            "disabled:bg-gray-100 disabled:cursor-not-allowed",
                            "dark:bg-gray-800 dark:border-gray-700 dark:text-white",
                            className
                        )}
                        {...props}
                    />
                    <Calendar
                        className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none"
                    />
                </div>

                {isOpen && !disabled && (
                    <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-72">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={() => navigateMonth('prev')}
                                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5 text-gray-600" />
                            </button>
                            <h3 className="text-sm font-semibold text-gray-900">{monthName}</h3>
                            <button
                                type="button"
                                onClick={() => navigateMonth('next')}
                                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                <ChevronRight className="h-5 w-5 text-gray-600" />
                            </button>
                        </div>

                        {/* Calendar Days Header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((day, index) => {
                                if (day === null) {
                                    return <div key={`empty-${index}`} className="h-8" />;
                                }
                                const dayDisabled = isDisabled(day);
                                const daySelected = isSelected(day);
                                const dayToday = isToday(day);

                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => !dayDisabled && handleDateSelect(day)}
                                        disabled={dayDisabled}
                                        className={cn(
                                            "h-8 w-8 rounded-md text-sm transition-colors",
                                            "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500",
                                            dayDisabled && "text-gray-300 cursor-not-allowed",
                                            !dayDisabled && !daySelected && "text-gray-700 hover:bg-gray-100",
                                            dayToday && !daySelected && "font-semibold bg-blue-50 text-blue-600",
                                            daySelected && "bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                                        )}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

DatePicker.displayName = "DatePicker";

export default DatePicker;

