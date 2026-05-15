"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { GlassButton } from "./GlassFormComponents";

interface GlassDateRangePickerProps {
    date?: DateRange;
    setDate: (date?: DateRange) => void;
    className?: string;
    placeholder?: string;
}

export function GlassDateRangePicker({
    date,
    setDate,
    className,
    placeholder = "Select date range",
}: GlassDateRangePickerProps) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <GlassButton
                        id="date"
                        variant="glass"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                        icon={<CalendarIcon className="mr-2 h-4 w-4" />}
                    >
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </GlassButton>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#1a1a1a]/95 backdrop-blur-xl border-white/10" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        className="bg-transparent border-none text-white"
                        classNames={{
                            day_selected: "bg-emerald-500/80 text-white hover:bg-emerald-500 hover:text-white focus:bg-emerald-500 focus:text-white",
                            day_today: "bg-white/10 text-white",
                            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white rounded-md transition-all",
                            day_range_middle: "aria-selected:bg-emerald-500/20 aria-selected:text-white",
                            head_cell: "text-white/50 w-9 font-normal text-[0.8rem]",
                            caption: "flex justify-center pt-1 relative items-center text-white",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white border border-white/10 hover:bg-white/10 rounded-md transition-all",
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

interface GlassDatePickerProps {
    date?: Date;
    setDate: (date?: Date) => void;
    className?: string;
    placeholder?: string;
}

export function GlassDatePicker({
    date,
    setDate,
    className,
    placeholder = "Pick a date",
}: GlassDatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <GlassButton
                    variant="glass"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        className
                    )}
                    icon={<CalendarIcon className="mr-2 h-4 w-4" />}
                >
                    {date ? format(date, "PPP") : <span>{placeholder}</span>}
                </GlassButton>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#1a1a1a]/95 backdrop-blur-xl border-white/10">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="bg-transparent border-none text-white"
                    classNames={{
                        day_selected: "bg-emerald-500/80 text-white hover:bg-emerald-500 hover:text-white focus:bg-emerald-500 focus:text-white",
                        day_today: "bg-white/10 text-white",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white rounded-md transition-all",
                        head_cell: "text-white/50 w-9 font-normal text-[0.8rem]",
                        caption: "flex justify-center pt-1 relative items-center text-white",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white border border-white/10 hover:bg-white/10 rounded-md transition-all",
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}
