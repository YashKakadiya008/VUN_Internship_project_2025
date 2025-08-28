"use client";

import { deleteOrder, getAllOrdersBySupplierId } from "@/api/order";
import { generateOrderReportBySupplier } from "@/api/report";
import AddOrder from "@/components/supplier/AddOrder";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader";
import { Pagination } from "@/components/ui/pagination";
import RangeDatePicker from "@/components/ui/rangeDatePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { PAGE_LIMIT, STAGE_FILTER, TYPE_FILTER } from "@/lib/constants";
import { OrderWithCustomerAndAddress } from "@/lib/order/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Copy, Edit, FileDown, Plus, Trash2, X } from "lucide-react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import toast from "react-hot-toast";

type TableOrder = {
    id: string;
    orderId: string;
    product: string | null;
    company: string | null;
    mobile: string | null;
    location: string | null;
    stage: string | null;
    createdDate: string;
    original: OrderWithCustomerAndAddress;
};

const SupplierSalesDetails = () => {
    const { id } = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [editOrderDialog, setEditOrderDialog] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const [selectedOrder, setSelectedOrder] = useState<OrderWithCustomerAndAddress | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [stageFilter, setStageFilter] = useState(searchParams.get('stage') || 'all');
    const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
    const [startDate, setStartDate] = useState<string | undefined>(searchParams.get('startDate') || undefined);
    const [endDate, setEndDate] = useState<string | undefined>(searchParams.get('endDate') || undefined);

    const { data: orders, isLoading, error } = useQuery({
        queryKey: ["orders", id],
        queryFn: () => getAllOrdersBySupplierId(id as string),
    });

    const { mutate: exportOrdersBySupplier, isPending: isExporting } = useMutation({
        mutationFn: async (filters: string[]) => {
            const response = await generateOrderReportBySupplier(filters, id as string);

            // Create Blob and trigger download
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `orders-supplier-${id}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        },
        onSuccess: () => {
            toast.success('Report generated successfully');
        },
        onError: (error) => {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report (No data found)');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (orderId: string) => {
            await deleteOrder(orderId);
        },
        onSuccess: () => {
            queryClient.refetchQueries({ queryKey: ["orders"] });
            toast.success("Order deleted successfully");
            setDialogOpen(false);
        },
        onError: () => {
            toast.error("Please try again");
        },
    });

    const handleDelete = (customerId: string) => {
        deleteMutation.mutate(customerId);
    };

    if (error) return <div>Error: {error.message}</div>;

    const baseTableOrders: Omit<TableOrder, "id">[] = orders ? orders.map((order) => {
        const address = order.customer?.address;
        const location = address
            ? address.city && address.state
                ? `${address.city}, ${address.state}`
                : address.area && address.city
                    ? `${address.area}, ${address.city}`
                    : address.state
                        ? address.state
                        : address.city
                            ? address.city
                            : address.area || ""
            : "";

        return {
            orderId: order.orderId,
            product: order.productName,
            company: order.customer?.companyName || null,
            mobile: order.customer?.mobileNo || null,
            location,
            stage: order.stage,
            createdDate: format(new Date(order.createdAt), "dd-MM-yyyy"),
            original: order,
        };
    }) : [];

    const filteredData = baseTableOrders.filter((item) => {
        // Search term filter
        const matchesSearch =
            (item.product?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            item.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.company?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (item.location?.toLowerCase() || "").includes(searchTerm.toLowerCase());

        // Stage filter
        const matchesStage = stageFilter === 'all' ||
            (item.stage?.toLowerCase() === stageFilter.toLowerCase());

        // Type filter  
        const matchesType = typeFilter === 'all' ||
            (item.original.type?.toLowerCase() === typeFilter.toLowerCase());

        // Date range filter
        let matchesDateRange = true;
        if (startDate && endDate) {
            const itemDate = new Date(item.original.createdAt);
            const start = new Date(startDate);
            const end = new Date(endDate);
            matchesDateRange = itemDate >= start && itemDate <= end;
        }

        return matchesSearch && matchesStage && matchesType && matchesDateRange;
    });


    const tableOrders: TableOrder[] = filteredData.map((item, index) => ({
        ...item,
        id: (index + 1).toString()
    }));

    const filterIds = filteredData.map((item) => item.original.orderId);

    const handleExport = () => {
        exportOrdersBySupplier(filterIds);
    };

    const totalPages = Math.ceil(tableOrders.length / PAGE_LIMIT);
    const paginatedData = tableOrders.slice(
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
        setCurrentPage(1);
        router.replace(pathname);
    };


    return (
        <div className="flex flex-col gap-4 w-full min-h-[75vh] lg:min-h-[85vh] justify-between">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row lg:items-center items-start gap-2 w-full justify-between">
                    <div className="flex items-center gap-4 hover:bg-gray-50 cursor-pointer rounded-sm px-2 py-1" onClick={() => router.back()}>
                        <ArrowLeft
                            size={16}
                            className="w-6 h-6"
                        />
                        <h1 className="text-2xl font-semibold">Sales</h1>
                    </div>
                    <div className="flex w-fit items-center gap-2 text-center">
                        <Button
                            variant="outline"
                            disabled={isExporting}
                            className="gap-2 items-center border-primary/20 hover:border-primary/40 bg-white hover:bg-primary/5 transition-all duration-200 group"
                            onClick={handleExport}
                        >
                            <FileDown size={16} className="w-8 h-8 ml-0 md:ml-3 text-primary" />
                            <span className="hidden md:block mr-3">
                                Export
                            </span>
                        </Button>

                        <Button
                            className="bg-primary hover:bg-primary/95 gap-3 items-center justify-center text-white"
                            onClick={() => {
                                setSelectedOrder(null);
                                setEditOrderDialog(true);
                            }}
                        >
                            <Plus size={16} className="w-8 h-8 ml-2" />
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
                                <TableHead>Order Id</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Mobile</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Stage</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Target Date</TableHead>
                                <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {
                                isLoading ? (
                                    <TableRow className="hover:bg-white">
                                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                            <Loader />
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedData.length > 0 ? (

                                    paginatedData.map((item) => (

                                        <TableRow key={item.id} className="align-middle">
                                            <TableCell>{item.id ?? "-"}</TableCell>
                                            <TableCell className="hover:underline cursor-pointer" onClick={() => {
                                                navigator.clipboard.writeText(item.orderId ?? "")
                                                toast.success("Order ID copied to clipboard");
                                            }}>
                                                {item.orderId ? `${(item.orderId).toUpperCase().slice(0, 6)}...` : "-"}
                                            </TableCell>
                                            <TableCell>{item.product ?? '-'}</TableCell>
                                            <TableCell>{item.company ?? '-'}</TableCell>
                                            <TableCell>{item.mobile ?? '-'}</TableCell>
                                            <TableCell>{item.location ?? '-'}</TableCell>
                                            <TableCell>{item.original.type ?? '-'}</TableCell>
                                            <TableCell>{item.stage ?? '-'}</TableCell>
                                            <TableCell>{item.original.description ?? '-'}</TableCell>
                                            <TableCell>{item.original.targetDate ? format(item.original.targetDate, "dd-MM-yyyy") : '-'}</TableCell>
                                            <TableCell className="flex gap-2 items-center justify-center">
                                                <Button
                                                    className="shrink-0 hover:bg-primary hover:text-white bg-transparent shadow-none text-primary"
                                                    onClick={() => {
                                                        setSelectedOrder(item.original);
                                                        setEditOrderDialog(true);
                                                    }}
                                                >
                                                    <Edit size={16} className="w-8 h-8" /> <span>Edit</span>
                                                </Button>
                                                <Button
                                                    className="shrink-0 hover:bg-primary hover:text-white text-primary shadow-none bg-transparent px-3 py-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(
                                                            `Product: ${item.product || "-"}\nCompany: ${item.company || "-"}\nMobile: ${item.mobile || "-"}\nLocation: ${item.location || "-"}\nStage: ${item.stage || "-"}\nCreated Date: ${item.createdDate ? format(item.createdDate, "dd-MM-yyyy") : "-"}`
                                                        );
                                                        toast.success("Copied to clipboard");
                                                    }}
                                                >
                                                    <Copy size={16} className="w-8 h-8" /> Copy
                                                </Button>
                                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen} >
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            className="shrink-0 text-red-600 hover:bg-red-200 bg-transparent shadow-none"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDialogOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 size={16} className="w-8 h-8" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent onClick={(e) => e.stopPropagation()}>
                                                        <DialogHeader>
                                                            <DialogTitle className="leading-6">Are you sure you want to delete this order for {item.product}?</DialogTitle>
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
                                ) : (
                                    <TableRow className="hover:bg-white">
                                        <TableCell colSpan={9} className="text-center py-6">
                                            <div className="flex flex-col items-center justify-center py-4">
                                                <p className="text-lg font-medium">No orders found for this supplier</p>
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
                supplierId={id as string}
                open={editOrderDialog}
                setOpen={setEditOrderDialog}
                data={
                    selectedOrder
                        ? {
                            orderId: selectedOrder.orderId,
                            customerId: selectedOrder.customerId || "",
                            supplierId: selectedOrder.supplierId || "",
                            productName: selectedOrder.productName || "",
                            type: selectedOrder.type || "",
                            stage: selectedOrder.stage || "",
                            description: selectedOrder.description || "",
                            targetDate: selectedOrder.targetDate
                                ? format(new Date(selectedOrder.targetDate), "yyyy-MM-dd")
                                : "",
                            images: selectedOrder.images?.map((img) => img.signedUrl) || [],
                        }
                        : undefined
                }
            />
        </div>
    );
};

export default SupplierSalesDetails;