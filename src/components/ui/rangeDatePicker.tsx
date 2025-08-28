"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { LucideCalendarFold } from "lucide-react";

const formSchema = z.object({
    dateRange: z
        .object({
            from: z.date().optional(),
            to: z.date().optional(),
        })
        .optional(),
});

type FormValues = z.infer<typeof formSchema>;

// help me to add the props to the component
interface RangeDatePickerProps {
    onChange: (date: DateRange) => void;
    from?: string;
    to?: string;
}



const RangeDatePicker: React.FC<RangeDatePickerProps> = ({ from, to, onChange }) => {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dateRange: {
                from: from ? new Date(from) : undefined,
                to: to ? new Date(to) : undefined,
            },
        },
    });

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
    });

    React.useEffect(() => {
        setDate({
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        });
    }, [from, to]);

    const onClear = () => {
        const cleared = { from: undefined, to: undefined };
        setDate(cleared);
        form.setValue("dateRange", cleared); // ensures UI updates immediately
        onChange(cleared);
    };

    // Update form value when date changes
    React.useEffect(() => {
        if (date) {
            form.setValue("dateRange", date);
            onChange(date);
        }
    }, [date]);

    return (
        <Form {...form}>
            <form className="space-y-4">
                <FormField
                    control={form.control}
                    name="dateRange"
                    render={({ field }) => (
                        <FormItem>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "w-full justify-between text-left font-normal h-11 px-4 py-2 bg-gray-100",
                                                !field.value && "text-[989898]"
                                            )}
                                        >
                                            <span className="text-sm">
                                                {field.value?.from ? (
                                                    field.value.to ? (
                                                        <>
                                                            {format(
                                                                field.value
                                                                    .from,
                                                                "LLL dd, y"
                                                            )}{" "}
                                                            -{" "}
                                                            {format(
                                                                field.value.to,
                                                                "LLL dd, y"
                                                            )}
                                                        </>
                                                    ) : (
                                                        format(
                                                            field.value.from,
                                                            "LLL dd, y"
                                                        )
                                                    )
                                                ) : (
                                                    "Date Range"
                                                )}
                                            </span>
                                            <LucideCalendarFold className="h-6 w-6 text-primary" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                    />
                                    <div className="flex justify-end p-2">
                                        <Button type="submit" onClick={onClear}>Clear</Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
};

export default RangeDatePicker;
