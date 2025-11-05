import React from "react";
import { Calendar } from "lucide-react";
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
        const inputRef = React.useRef<HTMLInputElement>(null);

        // Merge refs
        React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

        return (
            <div className="relative">
                <input
                    ref={inputRef}
                    type="date"
                    id={id}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    required={required}
                    disabled={disabled}
                    className={cn(
                        "w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md",
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
        );
    }
);

DatePicker.displayName = "DatePicker";

export default DatePicker;

