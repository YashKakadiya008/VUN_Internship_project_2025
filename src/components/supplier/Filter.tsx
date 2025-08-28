"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import MultipleSelect from './MultipleSelect';
import { CORDING_BASE, MAIN_CATEGORY, PRODUCTION_CAPACITY, PRODUCTS_PATTERN, STOCK, SUPPLIER_MACHINE_TYPE, TYPE } from "@/lib/supplierConstant";
import { useRouter } from "next/navigation";

interface FilterState {
  stock?: string[];
  cordingBase?: string[];
  mainCategory?: string[];
  type?: string[];
  productionCapacity?: string[];
  supplierMachineType?: string[];
  productPattern?: string[];
}

interface FilterDialogProps {
  onApplyFilters: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export const FilterDialog = ({ onApplyFilters, initialFilters }: FilterDialogProps) => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters || {});

  const router = useRouter();

  const handleFilterChange = (category: keyof FilterState, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [category]: value.length === 0 ? undefined : value,
    }));
  };

  const resetFilters = () => {
    setFilters({});

    onApplyFilters({});

    // Clear URL parameters
    const currentPath = window.location.pathname;
    // add page=1 in the URL

    router.push(`${currentPath}?page=1`);

  };

  const handleApply = () => {
    // Only include non-empty filters in the payload
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([value]) => value && value.length > 0)
    );
    onApplyFilters(cleanedFilters);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/95 gap-3 items-center justify-items-start text-white">
          <SlidersHorizontal size={16} className="w-8 h-8 ml-0 md:ml-3" />
          <span className="hidden md:block mr-3">Filter</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full lg:min-w-[1000px] h-[90vh] overflow-hidden p-0">
        <DialogHeader className="flex flex-row items-start justify-between px-6 py-4 border-b">
          <DialogTitle className="text-lg font-medium">Filter</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-2 lg:px-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(220px,max-content))] gap-4 bg-gray-50 md:p-3 rounded-lg">
            <div className="flex-1 space-y-3 border-0 md:border-r-1">
              <h3 className="font-medium text-gray-900">Stock</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                items={STOCK}
                value={filters.stock ?? []}
                onChange={(value: string[]) => handleFilterChange('stock', value)}
                className="flex flex-col gap-0"
              />
            </div>

            <div className="space-y-4 border-0 lg:border-r-1">
              <h3 className="flex-1 font-medium text-gray-900">Cording Base</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={2}
                items={CORDING_BASE}
                value={filters.cordingBase ?? []}
                onChange={(value: string[]) => handleFilterChange('cordingBase', value)}
              />
            </div>

            <div className="space-y-4 border-0">
              <h3 className="flex-1 font-medium text-gray-900">Main Category</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={2}
                items={MAIN_CATEGORY}
                value={filters.mainCategory ?? []}
                onChange={(value: string[]) => handleFilterChange('mainCategory', value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(220px,max-content))] gap-4 bg-gray-50 p-3 rounded-lg">
            <div className="space-y-4 border-0 md:border-r-1">
              <h3 className="font-medium text-gray-900">Type</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                items={TYPE}
                value={filters.type ?? []}
                onChange={(value: string[]) => handleFilterChange('type', value)}
              />
            </div>

            <div className="space-y-4 pe-4 border-0 lg:border-r-1">
              <h3 className="font-medium text-gray-900">Production Capacity</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={3}
                items={PRODUCTION_CAPACITY}
                value={filters.productionCapacity ?? []}
                onChange={(value: string[]) => handleFilterChange('productionCapacity', value)}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Supplier Machine Type</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={3}
                items={SUPPLIER_MACHINE_TYPE}
                value={filters.supplierMachineType ?? []}
                onChange={(value: string[]) => handleFilterChange('supplierMachineType', value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(220px,max-content))] gap-4 bg-gray-50 p-3 rounded-lg">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Product Pattern</h3>
              <MultipleSelect
                list={PRODUCTS_PATTERN}
                value={filters.productPattern ?? []}
                onChange={(value: string[]) => handleFilterChange('productPattern', value)}
                className="w-60 p-1"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 px-6 pb-6">
          <Button
            variant="ghost"
            onClick={()=>{
              resetFilters()
              setOpen(false);
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            Reset all
          </Button>
          <Button
            onClick={handleApply}
            className="bg-slate-800 hover:bg-slate-700 text-white px-8"
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;