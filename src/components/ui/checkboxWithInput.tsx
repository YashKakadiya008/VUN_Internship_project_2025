import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export interface CheckboxInputItem {
  id: string;
  label: string;
}

export interface SelectedItem {
  label: string;
  value: string;
}

interface CheckboxWithInputProps {
  items: CheckboxInputItem[];
  value?: SelectedItem[]; // Added value prop
  onChange?: (selected: SelectedItem[]) => void;
}

export default function CheckboxWithInput({
  items,
  value = [],
  onChange,
}: CheckboxWithInputProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  // Sync with external form state
  useEffect(() => {
    if (value) {
      setCheckedItems(value.map((v) => v.label));
      setInputValues(
        value.reduce((acc, cur) => {
          acc[cur.label] = cur.value;
          return acc;
        }, {} as Record<string, string>)
      );
    }
  }, [value]);

  const handleCheckboxChange = (lable: string, checked: boolean) => {
    const updated = checked
      ? [...checkedItems, lable]
      : checkedItems.filter((itemLable) => itemLable !== lable);
    setCheckedItems(updated);

    if (onChange) {
      const data = updated.map((label) => ({
        label,
        value: inputValues[label] || "",
      }));
      onChange(data);
    }
  };

  const handleInputChange = (label: string, value: string) => {
    const updatedValues = { ...inputValues, [label]: value };
    setInputValues(updatedValues);

    if (onChange) {
      const data = (checkedItems || []).map((label) => ({
        label,
        value: updatedValues[label] || "",
      }));
      onChange(data);
    }
  };

  return (
    <div className="flex flex-wrap w-full gap-3">
      {items.map((item) => {
        const isChecked = checkedItems.includes(item.label);
        return (
          <div key={item.id} className="flex items-center gap-2">
            <Checkbox
              id={`check-${item.id}`}
              checked={isChecked}
              onCheckedChange={(checked) =>
                handleCheckboxChange(item.label, !!checked)
              }
            />
            <label htmlFor={`check-${item.id}`}>{item.label}</label>
            <Input
              type="number"
              value={inputValues[item.label] || ""}
              onChange={(e) => handleInputChange(item.label, e.target.value)}
              disabled={!isChecked}
              className="w-30"
            />
          </div>
        );
      })}
    </div>
  );
}
