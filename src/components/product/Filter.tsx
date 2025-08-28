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
import { COLOR, SIZE, SUB_METALIC_COLOR, SUB_TONE_TO_TONE_COLOR, WORK_TYPE } from "@/lib/customerConstant";
import { FiltersType } from "@/lib/product/type";
import { JARI_BASE } from "@/lib/productConstant";
import { CORDING_BASE, MAIN_CATEGORY, PRODUCTS_PATTERN } from "@/lib/supplierConstant";
import { SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MultipleSelect from "../supplier/MultipleSelect";
import { useQuery } from "@tanstack/react-query";
import { getAllSuppliersIdAndName } from "@/api/order";
import DropdownSelect from "../supplier/DropdownSelect";

interface FilterDialogProps {
  onFiltersChange: (filters: FiltersType) => void;
  currentFilters: FiltersType;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({ onFiltersChange, currentFilters }) => {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FiltersType>(currentFilters);
  
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getAllSuppliersIdAndName,
  });

  // conver supplier data into -> Id and label
  const supplierOptions = suppliers.map((supplier) => ({
    id: supplier.id,
    name: supplier.name,
  }));

  useEffect(() => {
    if (open) {
      const filtersFromUrl = searchParams.get("filters")
        ? JSON.parse(decodeURIComponent(searchParams.get("filters")!))
        : currentFilters;
      setFilters(filtersFromUrl);
    }
  }, [open, searchParams, currentFilters]);

  const handleFilterChange = (category: keyof FiltersType, value: string | string[]) => {
    setFilters((prev) => {
      // Handle the special case for supplierId which is a single string
      if (category === 'supplierId') {
        return {
          ...prev,
          supplierId: value as string || undefined,
        };
      }
      
      // For all other cases, handle as array
      const arrayValue = Array.isArray(value) ? value : [value];
      return {
        ...prev,
        [category]: arrayValue.length === 0 ? undefined : arrayValue,
      };
    });
  };

  const resetFilters = () => {
    const emptyFilters: FiltersType = {
      type: undefined,
      color: undefined,
      cordingBase: undefined,
      mainCategory: undefined,
      subToneColor: undefined,
      subMetallicColor: undefined,
      jariBase: undefined,
      size: undefined,
      productPattern: undefined,
      supplierId: undefined
    };
    // Reset URL filters

    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    setOpen(false);
  };

  const applyFilters = () => {
    // Create a new object with the same structure as FiltersType
    const cleanedFilters: FiltersType = { ...filters };
    
    // Filter out empty values
    for (const key in cleanedFilters) {
      const value = cleanedFilters[key as keyof FiltersType];
      
      // Remove empty strings
      if (typeof value === 'string' && value.trim() === '') {
        delete cleanedFilters[key as keyof FiltersType];
      }
      // Remove empty arrays
      else if (Array.isArray(value) && value.length === 0) {
        delete cleanedFilters[key as keyof FiltersType];
      }
      // Remove undefined values
      else if (value === undefined) {
        delete cleanedFilters[key as keyof FiltersType];
      }
    }

    onFiltersChange(cleanedFilters);
    setOpen(false);
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/95 gap-3 items-center justify-center text-white">
          <SlidersHorizontal size={16} className="w-8 h-8 ml-0 md:ml-3" />
          <span className="hidden md:block mr-3">Filter</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full lg:min-w-[1000px] h-[90vh] overflow-hidden p-0">
        <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b">
          <DialogTitle className="text-lg font-medium">Filter Products</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-2 lg:px-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(200px,max-content))] gap-4 bg-gray-50 p-3 rounded-lg">
            <div className="space-y-3 border-0 md:border-r-1">
              <h3 className="font-medium text-gray-900">Type</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                items={WORK_TYPE}
                value={filters.type ?? []}
                onChange={(value: string[]) => handleFilterChange("type", value)}
                className="flex flex-col gap-0"
              />
            </div>

            <div className="space-y-4 border-0 lg:border-r-1">
              <h3 className="font-medium text-gray-900">Color</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={2}
                items={COLOR}
                value={filters.color ?? []}
                onChange={(value: string[]) => handleFilterChange("color", value)}
              />
            </div>

            <div className="space-y-4 border-0">
              <h3 className="font-medium text-gray-900">Cording Base</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={2}
                items={CORDING_BASE}
                value={filters.cordingBase ?? []}
                onChange={(value: string[]) => handleFilterChange("cordingBase", value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(200px,max-content))] gap-4 bg-gray-50 p-3 rounded-lg">
            <div className="space-y-3 border-0 md:border-r-1">
              <h3 className="font-medium text-gray-900">Main Category</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                items={MAIN_CATEGORY}
                itemsPerColumn={4}
                value={filters.mainCategory ?? []}
                onChange={(value: string[]) => handleFilterChange("mainCategory", value)}
              />
            </div>

            <div className="space-y-4 border-0 md:border-r-1">
              <h3 className="font-medium text-gray-900">Sub Tone to Tone Color</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={3}
                items={SUB_TONE_TO_TONE_COLOR}
                value={filters.subToneColor ?? []}
                onChange={(value: string[]) => handleFilterChange("subToneColor", value)}
              />
            </div>

            <div className="space-y-4 border-0">
              <h3 className="font-medium text-gray-900">Sub Metallic Color</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={3}
                items={SUB_METALIC_COLOR}
                value={filters.subMetallicColor ?? []}
                onChange={(value: string[]) => handleFilterChange("subMetallicColor", value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(200px,max-content))] gap-6 bg-gray-50 p-3 rounded-lg">
            <div className="space-y-4 border-0 md:border-r-1">
              <h3 className="font-medium text-gray-900">Jari Base</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                items={JARI_BASE}
                itemsPerColumn={4}
                value={filters.jariBase ?? []}
                onChange={(value: string[]) => handleFilterChange("jariBase", value)}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Size</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                items={SIZE}
                itemsPerColumn={4}
                value={filters.size ?? []}
                onChange={(value: string[]) => handleFilterChange("size", value)}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Product Pattern</h3>
              <MultipleSelect
                list={PRODUCTS_PATTERN}
                value={filters.productPattern ?? []}
                onChange={(value: string[]) => handleFilterChange("productPattern", value)}
                className="w-60 p-1"
              />
              
              <h3 className="font-medium text-gray-900">Select Supplier</h3>
              <DropdownSelect
                list={supplierOptions}
                value={filters.supplierId}
                onChange={(value: string) => handleFilterChange("supplierId", value)}
                className="w-60 p-1"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 px-6 pb-6">
          <Button
            variant="ghost"
            onClick={resetFilters}
            className="text-gray-600 hover:text-gray-800"
          >
            Reset all
          </Button>
          <Button
            onClick={applyFilters}
            className="bg-slate-800 hover:bg-slate-700 text-white px-8"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;