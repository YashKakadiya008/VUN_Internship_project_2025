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
import {
  COLOR,
  CUSTOMER_SALE_CHOICE,
  CUSTOMER_SALE_METHOD,
  MACHINE_TYPE,
  MAKING,
  MATERIAL_USAGE,
  MONTHLY_USAGE,
  PAYMENT_CYCLE,
  RANGE,
  SIZE,
  SUB_METALIC_COLOR,
  SUB_TONE_TO_TONE_COLOR,
  TASTE,
  TYPE,
  WORK_TYPE,
} from "@/lib/customerConstant";
import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import DropdownSelect from "../supplier/DropdownSelect";
import { STAGE_FILTER } from "@/lib/constants";
import { getAllArea } from "@/api/customer";
import { useQuery } from "@tanstack/react-query";
import { area } from "@/lib/customer/type";

export type FiltersType = {
  workType?: string[];
  machineType?: string[];
  color?: string[];
  type?: string[];
  taste?: string[];
  subToneColor?: string[];
  customerSaleMethod?: string[];
  customerSaleChoice?: string[];
  subMetallicColor?: string[];
  size?: string[];
  materialUsage?: string[];
  usageValueMonthly?: string[];
  making?: string[];
  range?: string[];
  paymentCycle?: string[];
  stage?: string;
  area?: string
};

type FilterDialogProps = {
  onApplyFilters: (filters: FiltersType) => void;
  initialFilters: FiltersType;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({ onApplyFilters, initialFilters }) => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FiltersType>(initialFilters);
  const router = useRouter();

  // Sync filters state when initialFilters change
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const { data: area = [] as { id: string, name: string }[] } = useQuery({
    queryKey: ["ares"],
    queryFn: getAllArea,
  });

  const handleFilterChange = (category: keyof FiltersType, value: string | string[]) => {
    setFilters((prev) => ({
      ...prev,
      [category]: Array.isArray(value)
        ? (value.length === 0 ? undefined : value)
        : (value || undefined)
    }));
  };
  const resetFilters = () => {
    const emptyFilters: FiltersType = {
      workType: undefined,
      machineType: undefined,
      color: undefined,
      type: undefined,
      taste: undefined,
      subToneColor: undefined,
      customerSaleMethod: undefined,
      customerSaleChoice: undefined,
      subMetallicColor: undefined,
      size: undefined,
      materialUsage: undefined,
      usageValueMonthly: undefined,
      making: undefined,
      range: undefined,
      paymentCycle: undefined,
      stage: undefined,
      area: undefined
    };


    setFilters(emptyFilters);

    onApplyFilters(emptyFilters);


    const currentPath = window.location.pathname;

    router.push(`${currentPath}?page=1`);
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
          <DialogTitle className="text-lg font-medium">Filter</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-2 lg:px-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-3 rounded-lg">
            <div className="space-y-3 border-0 md:border-r-1">
              <h3 className="font-medium text-gray-900">Work Type</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                items={WORK_TYPE}
                value={filters?.workType ?? []}
                onChange={(value: string[]) => handleFilterChange("workType", value)}
                className="flex flex-col gap-0"
              />
            </div>

            <div className="space-y-4 border-0 lg:border-r-1">
              <h3 className="font-medium text-gray-900">Machine Type</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={4}
                items={MACHINE_TYPE}
                value={filters?.machineType ?? []}
                onChange={(value: string[]) => handleFilterChange("machineType", value)}
              />
            </div>

            <div className="space-y-4 border-0 md:border-r-1">
              <h3 className="font-medium text-gray-900">Color</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                items={COLOR}
                value={filters?.color ?? []}
                onChange={(value: string[]) => handleFilterChange("color", value)}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Type</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                items={TYPE}
                value={filters?.type ?? []}
                onChange={(value: string[]) => handleFilterChange("type", value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-3 rounded-lg">
            <div className="space-y-4 border-0 md:border-r-1">
              <h3 className="font-medium text-gray-900">Taste</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={4}
                items={TASTE}
                value={filters?.taste ?? []}
                onChange={(value: string[]) => handleFilterChange("taste", value)}
              />
            </div>

            <div className="space-y-4 border-0 lg:border-r-1">
              <h3 className="font-medium text-gray-900">Sub Tone to Tone Color</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={2}
                items={SUB_TONE_TO_TONE_COLOR}
                value={filters?.subToneColor ?? []}
                onChange={(value: string[]) => handleFilterChange("subToneColor", value)}
              />
            </div>

            <div className="space-y-4 border-0 md:border-r-1">
              <h3 className="font-medium text-gray-900">Customer Sale Method</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                items={CUSTOMER_SALE_METHOD}
                value={filters?.customerSaleMethod ?? []}
                onChange={(value: string[]) => handleFilterChange("customerSaleMethod", value)}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Customer Sale Choice</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                items={CUSTOMER_SALE_CHOICE}
                value={filters?.customerSaleChoice ?? []}
                onChange={(value: string[]) => handleFilterChange("customerSaleChoice", value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-50 p-3 rounded-lg">
            <div className="space-y-4 border-0 md:border-r-1">
              <h3 className="font-medium text-gray-900">Sub Metallic Color</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={4}
                items={SUB_METALIC_COLOR}
                value={filters?.subMetallicColor ?? []}
                onChange={(value: string[]) => handleFilterChange("subMetallicColor", value)}
              />
            </div>

            <div className="space-y-4 border-0 lg:border-r-1">
              <h3 className="font-medium text-gray-900">Size</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={4}
                items={SIZE}
                value={filters.size ?? []}
                onChange={(value: string[]) => handleFilterChange("size", value)}
              />
            </div>

            <div className="space-y-4 border-0 md:border-r-1">
              <h3 className="font-medium text-gray-900">Material Usage</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={4}
                items={MATERIAL_USAGE}
                value={filters.materialUsage ?? []}
                onChange={(value: string[]) => handleFilterChange("materialUsage", value)}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Usage Value</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={4}
                items={MONTHLY_USAGE}
                value={filters.usageValueMonthly ?? []}
                onChange={(value: string[]) => handleFilterChange("usageValueMonthly", value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 p-3 rounded-lg">
            <div className="space-y-4 border-0 md:border-r-1">
              <h3 className="font-medium text-gray-900">Making</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={3}
                items={MAKING}
                value={filters.making ?? []}
                onChange={(value: string[]) => handleFilterChange("making", value)}
              />
            </div>

            <div className="space-y-4 border-0 lg:border-r-1">
              <h3 className="font-medium text-gray-900">Range</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={2}
                items={RANGE}
                value={filters.range ?? []}
                onChange={(value: string[]) => handleFilterChange("range", value)}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Payment Cycle</h3>
              <Checkbox
                multiple
                containerClassName="gap-1 flex-col flex-wrap items-start"
                itemsPerColumn={2}
                items={PAYMENT_CYCLE}
                value={filters.paymentCycle ?? []}
                onChange={(value: string[]) => handleFilterChange("paymentCycle", value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 p-3 rounded-lg">
            {/* stage dropdown  */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Stage</h3>
              <DropdownSelect
                list={STAGE_FILTER}
                value={filters.stage ?? ""}
                onChange={(value) => {
                  handleFilterChange("stage", value);
                }}
                placeholder="Select a stage"
                useNameAsValue={true}
              />
            </div>
            {/* area dropdown  */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Area</h3>
              <DropdownSelect
                list={area as area[]}
                value={filters.area ?? ""}
                onChange={(value) => {
                  handleFilterChange("area", value);
                }}
                placeholder="Select an area"
              />
            </div>

          </div>

        </div>

        <div className="flex items-center justify-end gap-4 px-6 pb-6">
          <Button
            variant="ghost"
            onClick={() => {
              resetFilters();
              setOpen(false);
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            Reset all
          </Button>
          <Button
            onClick={() => {
              onApplyFilters(filters);
              setOpen(false);
            }}
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