// "use client";

// import { Button } from "@/components/ui/button"
// import { Checkbox } from "@/components/ui/checkbox"
// import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import { useEffect, useMemo, useState } from "react"

// interface Item {
//     id: string
//     label: string
// }

// interface Props {
//     placeholder?: string
//     className?: string
//     list: Item[]
//     value?: string[] // when passed, use `id` as value
//     onChange?: (value: string[]) => void
// }

// const MultipleSelect: React.FC<Props> = ({ list, value, onChange, className, placeholder }) => {
//     const useIdValue = Boolean(value && value.length >= 0)
//     const [selectedItem, setSelectedItem] = useState<string[]>(value ?? [])

//     useEffect(() => {
//         if (useIdValue && value) {
//             setSelectedItem((prev) => {
//                 const isDifferent =
//                     prev.length !== value.length ||
//                     !prev.every((v) => value.includes(v));
//                 return isDifferent ? value : prev;
//             });
//         }
//     }, [value, useIdValue])

//     const toggleSelection = (item: Item) => {
//         const key = useIdValue ? item.id : item.label
//         const updated = selectedItem.includes(key)
//             ? selectedItem.filter((s) => s !== key)
//             : [...selectedItem, key]

//         setSelectedItem(updated)
//         onChange?.(updated)
//     }

//     const filteredList = useMemo(() => {
//         return list.filter((item) =>
//             item.label.toLowerCase().includes("")
//         )
//     }, [list])

//     return (
//         <div className="space-y-0">
//             <Popover>
//                 <PopoverTrigger asChild>
//                     <Button variant="ghost" role="combobox" className="w-full h-11 justify-between bg-gray-100 min-w-40">
//                         <span className="text-sm">
//                             {selectedItem.length > 0
//                                 ? `${selectedItem.length} selected`
//                                 : placeholder || "Select Item"}
//                         </span>
//                     </Button>
//                 </PopoverTrigger>

//                 <PopoverContent className={className}>
//                     <Command>
//                         <CommandList className="max-h-48 overflow-y-auto" onWheel={(e) => e.stopPropagation()}>
//                             <CommandGroup>
//                                 {filteredList.map((item: Item) => {
//                                     const key = useIdValue ? item.id : item.label
//                                     return (
//                                         <CommandItem
//                                             key={item.id}
//                                             onSelect={() => toggleSelection(item)}
//                                             className="cursor-pointer"
//                                         >
//                                             <div className="flex items-center gap-2">
//                                                 <Checkbox checked={selectedItem.includes(key)} />
//                                                 <span>{item.label}</span>
//                                             </div>
//                                         </CommandItem>
//                                     )
//                                 })}
//                                 {filteredList.length === 0 && (
//                                     <div className="px-4 py-2 text-sm text-gray-500">No results found.</div>
//                                 )}
//                             </CommandGroup>
//                         </CommandList>
//                     </Command>
//                 </PopoverContent>
//             </Popover>
//         </div>
//     )
// }

// export default MultipleSelect;

"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandInput, // ⬅️ Add this import
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Item {
    id: string;
    label: string;
}

interface Props {
    placeholder?: string;
    className?: string;
    list: Item[];
    value?: string[]; // when passed, use `id` as value
    onChange?: (value: string[]) => void;
}

const MultipleSelect: React.FC<Props> = ({
    list,
    value,
    onChange,
    className,
    placeholder,
}) => {
    const useIdValue = Boolean(value && value.length >= 0);
    const [selectedItem, setSelectedItem] = useState<string[]>(value ?? []);
    const [search, setSearch] = useState(""); // ⬅️ Track search query

    useEffect(() => {
        if (useIdValue && value) {
            setSelectedItem((prev) => {
                const isDifferent =
                    prev.length !== value.length ||
                    !prev.every((v) => value.includes(v));
                return isDifferent ? value : prev;
            });
        }
    }, [value, useIdValue]);

    const toggleSelection = (item: Item) => {
        const key = useIdValue ? item.id : item.label;
        const updated = selectedItem.includes(key)
            ? selectedItem.filter((s) => s !== key)
            : [...selectedItem, key];

        setSelectedItem(updated);
        onChange?.(updated);
    };

    const filteredList = useMemo(() => {
        return list.filter((item) =>
            item.label.toLowerCase().includes(search.toLowerCase())
        );
    }, [list, search]);

    return (
        <div className="space-y-0">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        role="combobox"
                        className="w-full h-11 justify-between bg-gray-100 min-w-40"
                    >
                        <span className="text-sm">
                            {selectedItem.length > 0
                                ? `${selectedItem.length} selected`
                                : placeholder || "Select Item"}
                        </span>
                    </Button>
                </PopoverTrigger>

                <PopoverContent className={className}>
                    <Command>
                        <CommandInput
                            placeholder="Search here..."
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList
                            className="max-h-48 overflow-y-auto"
                            onWheel={(e) => e.stopPropagation()}
                        >
                            <CommandGroup>
                                {filteredList.map((item: Item) => {
                                    const key = useIdValue ? item.id : item.label;
                                    return (
                                        <CommandItem
                                            key={item.id}
                                            onSelect={() => toggleSelection(item)}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    checked={selectedItem.includes(key)}
                                                />
                                                <span>{item.label}</span>
                                            </div>
                                        </CommandItem>
                                    );
                                })}
                                {filteredList.length === 0 && (
                                    <div className="px-4 py-2 text-sm text-gray-500">
                                        No results found.
                                    </div>
                                )}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default MultipleSelect;

