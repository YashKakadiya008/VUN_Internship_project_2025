"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

interface Item {
  id: string;
  name: string;
}

interface Props {
  className?: string;
  list: Item[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  useNameAsValue?: boolean;
  onAddItem?: (name: string) => void; // Callback to add new item to the list
}

const DropdownSelect: React.FC<Props> = ({
  list,
  value = "",
  onChange,
  className,
  placeholder = "Select an item",
  useNameAsValue = false,
  onAddItem,
}) => {
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  // Update selectedId when value changes
  useEffect(() => {
    if (useNameAsValue) {
      const item = list.find((item) => item.name === value);
      setSelectedId(item?.id || "");
    } else {
      setSelectedId(value);
    }
  }, [value, list, useNameAsValue]);

  const handleSelect = (id: string) => {
    const newId = id === selectedId ? "" : id;
    setSelectedId(newId);

    const selectedItem = list.find((item) => item.id === newId);
    const newValue = useNameAsValue ? selectedItem?.name || "" : newId;

    onChange?.(newValue);
    setSearch(""); // Clear search after selection
    setOpen(false);
  };

  const handleAddNew = () => {
    if (search.trim() && !list.some((item) => item.name.toLowerCase() === search.toLowerCase())) {
      onAddItem?.(search.trim());
      const newId = `${list.length + 1}`; // Simple ID generation (customize as needed)
      setSelectedId(newId);
      onChange?.(useNameAsValue ? search.trim() : newId);
      setSearch("");
      setOpen(false);
    }
  };

  const filteredList = useMemo(() => {
    return list.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [list, search]);

  const selectedLabel = useMemo(() => {
    const item = list.find((item) => item.id === selectedId);
    return item?.name || placeholder;
  }, [selectedId, list, placeholder]);

  return (
    <div className={cn("space-y-0 w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-gray-100"
          >
            <span className="truncate">{selectedLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput
              placeholder="Search or type to add..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-48 overflow-y-auto">
              <CommandGroup>
                {filteredList.map((item: Item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={handleSelect}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedId === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.name}
                  </CommandItem>
                ))}
                {search.trim() &&
                  filteredList.length === 0 &&
                  !list.some(
                    (item) => item.name.toLowerCase() === search.toLowerCase()
                  ) && (
                    <CommandItem
                      value={`add-${search}`}
                      onSelect={handleAddNew}
                      className="cursor-pointer"
                    >
                      Add &quot;{search}&quot;
                    </CommandItem>
                  )}
                {filteredList.length === 0 &&
                  (!search.trim() ||
                    list.some(
                      (item) => item.name.toLowerCase() === search.toLowerCase()
                    )) && (
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

export default DropdownSelect;