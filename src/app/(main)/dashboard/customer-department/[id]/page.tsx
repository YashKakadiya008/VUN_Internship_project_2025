"use client";

import { deleteOrder, getAllOrdersByCustomerId, getAllSuppliersIdAndName } from "@/api/order";
import { generateOrderReportByOrderId } from "@/api/report";
import { FileDown } from "lucide-react";

import AddOrder from "@/components/customer/AddOrder";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader";
import { Pagination } from "@/components/ui/pagination";
import RangeDatePicker from "@/components/ui/rangeDatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PAGE_LIMIT, STAGE_FILTER, TYPE_FILTER } from "@/lib/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import { ArrowLeft, Copy, Edit, Plus, Trash2, X } from "lucide-react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import toast from "react-hot-toast";

type EnrichedProductImage = {
  public_id: string;
  name: string;
  signedUrl: string;
}

type OrderDataType = {
  orderId: string;
  customerId?: string;
  supplierId?: string;
  productName?: string;
  type?: string;
  stage?: string;
  description?: string;
  targetDate?: string;
  images?: EnrichedProductImage[];
}

const CustomerSalesDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [editOrderDialog, setEditOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDataType | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [stageFilter, setStageFilter] = useState(searchParams.get('stage') || 'all');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');

  const [currentPage, setCurrentPage] = useState(1);

  const [startDate, setStartDate] = useState<string | undefined>(searchParams.get('startDate') || undefined);
  const [endDate, setEndDate] = useState<string | undefined>(searchParams.get('endDate') || undefined);

  useEffect(() => {
    updateURL();
  }, [searchTerm, stageFilter, typeFilter, startDate, endDate]);

  const { data: orders = [], isLoading, isFetching } = useQuery({
    queryKey: ["orders", id],
    queryFn: () => getAllOrdersByCustomerId(id as string),
    enabled: !!id,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getAllSuppliersIdAndName,
  });

  const deleteMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await deleteOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order deleted successfully");
    },
    onError: () => {
      toast.error("Please try again");
    },
  });

  const handleDelete = (customerId: string) => {
    deleteMutation.mutate(customerId);
  };

  const supplierMap = suppliers.reduce((acc, supplier) => {
    acc[supplier.id] = supplier.name;
    return acc;
  }, {} as Record<string, string>);

  const updateURL = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (searchTerm) params.set('search', searchTerm);
    else params.delete('search');

    if (stageFilter !== 'all') params.set('stage', stageFilter);
    else params.delete('stage');

    if (typeFilter !== 'all') params.set('type', typeFilter);
    else params.delete('type');

    if (startDate) params.set('startDate', startDate);
    else params.delete('startDate');

    if (endDate) params.set('endDate', endDate);
    else params.delete('endDate');

    router.replace(`${pathname}?${params.toString()}`);
  }, [searchTerm, stageFilter, typeFilter, startDate, endDate, pathname, router, searchParams]);

  const filteredData = orders.filter((item) => {
    const matchesSearch =
      (item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplierId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false) ||
      (item.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

    const matchesStage =
      stageFilter === "all" ||
      (item.stage && item.stage.toLowerCase() === stageFilter.toLowerCase());
    const matchesType =
      typeFilter === "all" ||
      (item.type && item.type.toLowerCase() === typeFilter.toLowerCase());

    const itemDate = item.targetDate ? new Date(item.targetDate) : null;
    const matchesDate =
      startDate && endDate
        ? itemDate &&
        isValid(itemDate) &&
        itemDate >= new Date(startDate) &&
        itemDate <= new Date(endDate)
        : true;
    return matchesSearch && matchesStage && matchesType && matchesDate;
  });
  const filterIds: string[] = filteredData.map((item) => item.orderId);

  const { mutate: exportOrders, isPending: isExporting } = useMutation({
    mutationFn: async ({
      orderIds,
      customerId,
    }: {
      orderIds: string[];
      customerId: string;
    }) => {
      const response = await generateOrderReportByOrderId(orderIds, customerId);

      // Create Blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute(
        'download',
        `orders-customer-${customerId}-${new Date(
          new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
        )
          .toISOString()
          .split('T')[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
      return response;
    },
    onSuccess: () => {
      toast.success('Report downloaded successfully');
    },
    onError: (err) => {
      console.error('Export failed:', err);
      toast.error('Failed to download report (No data found)');
    },
  });

  const handleExport = async () => {
    exportOrders({ orderIds: filterIds, customerId: id as string });
  };

  const totalPages = Math.ceil(filteredData.length / PAGE_LIMIT);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_LIMIT,
    currentPage * PAGE_LIMIT
  );

  const handleDateChange = async (date: DateRange) => {
    if (date.from && date.to) {
      const startDate = new Date(date.from.setHours(0, 0, 0, 0));
      const endDate = new Date(date.to.setHours(23, 59, 59, 999));
      setEndDate(endDate.toISOString());
      setStartDate(startDate.toISOString());
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStageFilter('all');
    setTypeFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
    router.replace(pathname);
  };

  return (
    <div className="flex flex-col gap-4 w-full min-h-[75vh] lg:min-h-[85vh] justify-between">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 hover:bg-gray-50 cursor-pointer rounded-sm px-2 py-1" onClick={() => router.back()}>
            <ArrowLeft
              size={16}
              className="w-6 h-6"
            />
            <h1 className="text-2xl font-semibold">Sales</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="outline"
              className="gap-2 items-center border-primary/20 hover:border-primary/40 bg-white hover:bg-primary/5 transition-all duration-200 group"
            >
              <FileDown
                size={16}
                className="text-primary group-hover:text-primary-dark transition-colors duration-200"
              />
              <span className="font-medium text-primary group-hover:text-primary-dark transition-colors duration-200">
                Export
              </span>
            </Button>
            <Button
              className="bg-primary hover:bg-primary/95 gap-2 items-center justify-center text-white"
              onClick={() => {
                setSelectedOrder(undefined);
                setEditOrderDialog(true);
              }}
            >
              <Plus size={16} className="w-8 h-8  ml-0 md:ml-2" />
              <span className="hidden md:block mr-3">Add Order</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row w-full gap-4 md:items-center">
          <div className="w-full lg:flex-1">
            <Input
              placeholder="Search by product name, order id, supplier id, customer id..."
              className="w-full bg-gray-200"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full">
              <RangeDatePicker from={startDate} to={endDate} onChange={handleDateChange} />
            </div>
            <div className="w-full">
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full min-w-30 ring-0">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Type</SelectItem>
                  {TYPE_FILTER.map((item) => (
                    <SelectItem
                      key={item.id}
                      value={item.name.toLowerCase()}
                    >
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Select
                value={stageFilter}
                onValueChange={(value) => {
                  setStageFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full min-w-30 ring-0">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stage</SelectItem>
                  {STAGE_FILTER.map((item) => (
                    <SelectItem
                      key={item.id}
                      value={item.name.toLowerCase()}
                    >
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full">
              <Button
                className={`flex hover:bg-red-50 gap-3 shadow-none items-center justify-center ${searchTerm || startDate || endDate || stageFilter !== "all" || typeFilter !== "all"
                  ? "bg-transparent text-red-400"
                  : "bg-transparent text-gray-400 cursor-not-allowed"
                  }`}
                onClick={() => resetFilters()}
                disabled={!searchTerm && !startDate && !endDate && stageFilter === "all" && typeFilter === "all"}
              >
                <X size={16} className="w-8 h-8" />
                <span>Reset All</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full h-full flex flex-col justify-between">
          <Table className="bg-white">
            <TableHeader>
              <TableRow className="bg-[#F9F9F9] text-[16px] font-semibold w-full justify-between items-center gap-4 rounded-lg py-3">
                <TableHead>No.</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Target Date</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isFetching ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader />
                  </TableCell>
                </TableRow>
              ) : filteredData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <TableRow key={item.orderId}>
                    <TableCell>
                      {(currentPage - 1) * PAGE_LIMIT + index + 1}
                    </TableCell>
                    <TableCell className="hover:underline cursor-pointer" onClick={() => {
                      navigator.clipboard.writeText(item.orderId ?? "")
                      toast.success("Order ID copied to clipboard");
                    }}>
                      {item.orderId ? `${(item.orderId).toUpperCase().slice(0, 6)}...` : "-"}
                    </TableCell>
                    <TableCell>{item.productName || "-"}</TableCell>
                    <TableCell>
                      {supplierMap[item.supplierId] || item.supplierId || ""}
                    </TableCell>
                    <TableCell>{item.type || "-"}</TableCell>
                    <TableCell>{item.stage || "-"}</TableCell>
                    <TableCell>{item.description || "-"}</TableCell>
                    <TableCell>
                      {item.targetDate
                        ? format(new Date(item.targetDate), "dd-MM-yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell className="flex gap-2 items-center justify-center">
                      <Button
                        className="shrink-0 hover:bg-primary hover:text-white bg-transparent shadow-none text-primary"
                        onClick={() => {
                          const enrichedImages = item.images as EnrichedProductImage[];
                          setSelectedOrder({
                            orderId: item.orderId,
                            customerId: item.customerId,
                            supplierId: item.supplierId,
                            productName: item.productName ?? '',
                            type: item.type ?? "",
                            stage: item.stage ?? "",
                            description: item.description ?? "",
                            targetDate: item.targetDate ?? "",
                            images: enrichedImages
                          });
                          setEditOrderDialog(true);
                        }}
                      >
                        <Edit size={16} className="w-8 h-8" /> <span>Edit</span>
                      </Button>
                      <Button
                        className="shrink-0 hover:bg-primary hover:text-white text-primary shadow-none bg-transparent px-3 py-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(
                              `Product: ${item.productName ?? "-"}\nOrder: ${item.orderId}\nType: ${item.type ?? "-"}\nTarget Date: ${item.targetDate ? format(item.targetDate, "dd-MM-yyyy") : "-"}\nStage: ${item.stage ?? "-"}\nSupplier: ${supplierMap[item.supplierId] ?? "-"}`
                            );
                            toast.success("Copied to clipboard");
                          }
                        }}
                      >
                        <Copy size={16} className="w-8 h-8" />
                        Copy
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            className="shrink-0 text-red-500 hover:bg-red-100 bg-transparent shadow-none"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 size={16} className="w-8 h-8" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent onClick={(e) => e.stopPropagation()}>
                          <DialogHeader>
                            <DialogTitle className="leading-6">Are you sure you want to delete this order for {item.productName}?</DialogTitle>
                            <DialogDescription>This order will be permanently deleted.</DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="flex gap-2 flex-row justify-end">
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button
                              variant="destructive"
                              onClick={() => handleDelete(item.orderId)}
                              disabled={deleteMutation.isPending || deleteMutation.isSuccess}
                            >
                              {deleteMutation.isPending || deleteMutation.isSuccess ? "Deleting..." : "Delete"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (<TableRow className="hover:bg-white">
                <TableCell colSpan={8} className="text-center py-6">
                  <div className="flex flex-col items-center justify-center py-4">
                    <p className="text-lg font-medium">
                      {searchTerm || startDate || endDate || stageFilter !== "all" || typeFilter !== "all"
                        ? "No orders match your filters"
                        : "No orders found for this customer"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <AddOrder
        customerId={id as string}
        data={
          selectedOrder
            ? {
              ...selectedOrder,
              images: selectedOrder.images?.map((img) => img.signedUrl),
            }
            : undefined
        }
        open={editOrderDialog}
        setOpen={setEditOrderDialog}
      />
    </div>
  );
};

export default CustomerSalesDetails;
