"use client";

import { getAllCustomersIdAndName, getAllSuppliersIdAndName } from "@/api/order";
import { generateSalesReportWithFilter, getAllSalesData } from "@/api/report";
import MultipleSelect from "@/components/supplier/MultipleSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader";
import { Pagination } from "@/components/ui/pagination";
import RangeDatePicker from "@/components/ui/rangeDatePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ENTITY_FILTER, PAGE_LIMIT, STAGE_FILTER, TYPE_FILTER } from "@/lib/constants";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FileDown, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import toast from "react-hot-toast";

function ReportsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
    const [entityFilter, setEntityFilter] = useState(searchParams.get('entity') || 'none');
    const [stageFilter, setStageFilter] = useState(searchParams.get('stage') || 'all');
    const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const searchFromUrl = searchParams.get("search") || '';

    const [localDateRange, setLocalDateRange] = useState<DateRange>({
        from: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
        to: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    });

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const startDate = startDateParam
        ? Math.floor(new Date(startDateParam).getTime() / 1000)
        : undefined;
    const endDate = endDateParam
        ? Math.floor(new Date(endDateParam).setHours(23, 59, 59, 999) / 1000)
        : undefined;

    const initialPage = parseInt(searchParams.get("page") || "1", 10);
    const [currentPage, setCurrentPage] = useState(initialPage);

    const { data: customers = [] } = useQuery({
        queryKey: ["customers"],
        queryFn: getAllCustomersIdAndName,
    });

    const { data: suppliers = [] } = useQuery({
        queryKey: ["suppliers"],
        queryFn: getAllSuppliersIdAndName,
    });

    const handleDateChange = (date: DateRange) => {
        console.log(date);
        
        setLocalDateRange(date);
    };

    const handleApplyFilters = () => {
        const queryParams = new URLSearchParams();
        if (startDateParam && endDateParam) {
            queryParams.set("startDate", startDateParam);
            queryParams.set("endDate", endDateParam);
        }
        if (entityFilter) queryParams.set("entity", entityFilter);
        if (stageFilter !== "all") queryParams.set("stage", stageFilter);
        if (typeFilter !== "all") queryParams.set("type", typeFilter);
        if (selectedEntities.length > 0) {
            selectedEntities.forEach((id) => queryParams.append("entityIds", id));
        }
        if (search) queryParams.set("search", search);
        if (localDateRange.from && localDateRange.to) {
            const startDate = new Date(localDateRange.from.setHours(0, 0, 0, 0));
            const endDate = new Date(localDateRange.to.setHours(23, 59, 59, 999));
            queryParams.set("startDate", startDate.toISOString());
            queryParams.set("endDate", endDate.toISOString());
        }else{
            queryParams.delete("startDate");
            queryParams.delete("endDate");
        }
        queryParams.set("page", "1");
        router.push(`?${queryParams.toString()}`);
        setCurrentPage(1);
    };

    const handleSearch = () => {
        const queryParams = new URLSearchParams(searchParams.toString());
        if (search.trim()) {
            queryParams.set("search", search.trim());
        } else {
            queryParams.delete("search");
        }
        queryParams.set("page", "1");
        router.push(`?${queryParams.toString()}`);
        setCurrentPage(1);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleResetFilters = () => {
        router.push("?");

        setEntityFilter("none");
        setStageFilter("all");
        setTypeFilter("all");
        setSelectedEntities([]);
        setCurrentPage(1);
        setSearch('');
        setLocalDateRange({ from: undefined, to: undefined });
    };

    useEffect(() => {
        const searchFromUrl = searchParams.get("search") || '';
        setSearch(searchFromUrl);
        setLocalDateRange({
            from: startDateParam ? new Date(startDateParam) : undefined,
            to: endDateParam ? new Date(endDateParam) : undefined,
        });
    }, [searchParams, startDateParam, endDateParam]);

    // Get filters from URL parameters
    const entityFromUrl = searchParams.get("entity") || "none";
    const stageFromUrl = searchParams.get("stage") || "all";
    const typeFromUrl = searchParams.get("type") || "all";
    const entityIdsFromUrl = searchParams.getAll("entityIds");
    const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);

    const { data: salesData, isLoading: salesLoading, error: salesError } = useQuery({
        queryKey: ["sales", entityFromUrl, entityIdsFromUrl, typeFromUrl, stageFromUrl, startDate, endDate, pageFromUrl, searchFromUrl],
        queryFn: () => getAllSalesData({
            filter: {
                type: entityFromUrl !== "none" ? (entityFromUrl.toLowerCase()) as "customer" | "supplier" : undefined,
                id: entityIdsFromUrl.length > 0 ? entityIdsFromUrl : undefined,
                orderType: typeFromUrl !== "all" ? (typeFromUrl) as "Order" | "Sample" : undefined,
                stage: stageFromUrl !== "all" ? (stageFromUrl) as "Development" | "Delivery" | "Completed" : undefined,
                from: startDate,
                to: endDate,
            },
            page: currentPage,
            limit: PAGE_LIMIT,
            search: searchFromUrl,
        }),
    });

    const { mutate: exportSales } = useMutation({
        mutationFn: async (filters: { type: "customer" | "supplier" | undefined; stage?: "Development" | "Delivery" | "Completed" | undefined; id?: string[] | undefined; orderType?: "Order" | "Sample" | undefined; from?: number | undefined; to?: number | undefined; }) => {
            const response = await generateSalesReportWithFilter(filters);
            // Create Blob and trigger download
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            // Generate Indian date
            const istDate = new Date(
                new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
            )
                .toISOString()
                .split('T')[0];
            link.href = url;
            link.setAttribute('download', `sales-export-${istDate}.xlsx`);
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
            console.error("Export failed:", err);
            toast.error('Failed to download report (No data found)');
        },
    });

    const handleExport = () => {
        exportSales({
            type: entityFromUrl !== "none" ? (entityFromUrl.toLowerCase()) as "customer" | "supplier" : undefined,
            id: entityIdsFromUrl.length > 0 ? entityIdsFromUrl : undefined,
            orderType: typeFromUrl !== "all" ? (typeFromUrl) as "Order" | "Sample" : undefined,
            stage: stageFromUrl !== "all" ? (stageFromUrl) as "Development" | "Delivery" | "Completed" : undefined,
            from: startDate,
            to: endDate,
        });
    };
    const totalPages = salesData?.metadata?.total ? Math.ceil(salesData.metadata.total / PAGE_LIMIT) : 1;
    const displayEntityFilter = searchParams.get("entity") || "Customer";
    const displayCurrentPage = parseInt(searchParams.get("page") || "1", 10);

    return (
        <div className="flex flex-col gap-4 w-full min-h-[75vh] lg:min-h-[85vh] justify-between">
            <div className="flex flex-col gap-4 h-full">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                    <h1 className="text-2xl font-semibold">Reports</h1>
                    <div className="flex items-center justify-center gap-2 mt-2 md:mt-0 text-center">
                        <Button
                            variant="outline"
                            className="gap-2 items-center border-primary/20 hover:border-primary/40 bg-white hover:bg-primary/5 transition-all duration-200 group"
                            onClick={handleExport}
                        >
                            <FileDown size={16} className="w-8 h-8 ml-0 md:ml-3 text-primary" />
                            <span className="hidden md:block mr-3">
                                Export
                            </span>
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2 md:mt-0 text-center">
                    <Input
                        placeholder="Search by product name, order id, supplier name, customer name, company name, mobile no..."
                        className="w-full bg-gray-200"
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                    />
                    <Button
                        className="bg-primary hover:bg-primary/95 gap-3 items-center justify-center text-white shrink-0"
                        onClick={handleSearch}
                    >
                        <span>Search</span>
                    </Button>
                </div>

                <div className="flex flex-col lg:flex-row w-full gap-4 md:items-center">
                    <div className="flex flex-col lg:flex-row justify-between w-full gap-4">
                        <div className="flex flex-wrap  w-full gap-4">
                            <div className="w-fit">
                                <Select
                                    value={entityFilter}
                                    onValueChange={(value) => {
                                        setEntityFilter(value);
                                        setSelectedEntities([]);
                                    }}
                                >
                                    <SelectTrigger className="w-full min-w-30 ring-0">
                                        <SelectValue defaultValue="Customer" placeholder="Select Entity" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {ENTITY_FILTER.map((item) => (
                                            <SelectItem
                                                key={item.id}
                                                value={item.name}
                                            >
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-fit">
                                {entityFilter === "Customer" ? (
                                    <MultipleSelect
                                        list={customers.map((customer) => ({
                                            id: customer.id,
                                            value: customer.id,
                                            label: customer.companyName
                                        }))}
                                        value={selectedEntities}
                                        onChange={setSelectedEntities}
                                        className="w-full p-1"
                                        placeholder="Select Customer"
                                    />
                                ) : entityFilter === "Supplier" ? (
                                    <MultipleSelect
                                        list={suppliers.map((supplier) => ({
                                            id: supplier.id,
                                            value: supplier.id,
                                            label: supplier.name,
                                        }))}
                                        value={selectedEntities}
                                        onChange={setSelectedEntities}
                                        className="w-full p-1"
                                        placeholder="Select Supplier"
                                    />
                                ) : (
                                    <div className="text-gray-500 italic p-1">
                                        Please select customer or supplier
                                    </div>
                                )}

                            </div>
                            <div className="w-fit">
                                <Select
                                    value={typeFilter}
                                    onValueChange={(value) => {
                                        setTypeFilter(value);
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
                                                value={item.name}
                                            >
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-fit">
                                <Select
                                    value={stageFilter}
                                    onValueChange={(value) => {
                                        setStageFilter(value);
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
                                                value={item.name}
                                            >
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-fit">
                                <RangeDatePicker
                                    from={startDateParam || undefined}
                                    to={endDateParam || undefined}
                                    onChange={handleDateChange}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                className="flex gap-3 shadow-none items-center justify-center min-w-20"
                                onClick={handleApplyFilters}
                            >
                                <span>Apply</span>
                            </Button>
                            <Button
                                className={`flex hover:bg-red-50 gap-3 shadow-none items-center justify-center ${startDateParam || endDateParam || stageFilter !== "all" || typeFilter !== "all" || entityFilter !== "none" || selectedEntities.length > 0
                                    ? "bg-transparent text-red-400"
                                    : "bg-transparent text-gray-400 cursor-not-allowed"
                                    }`}
                                onClick={handleResetFilters}
                                disabled={
                                    !startDateParam && !endDateParam && stageFilter === "all" && entityFilter === "none" && typeFilter === "all" && selectedEntities.length === 0
                                }
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
                                <TableHead>{displayEntityFilter === "Customer" ? "Customer Company" : "Supplier Company"}</TableHead>
                                <TableHead>Product Name</TableHead>
                                <TableHead>{displayEntityFilter === "Customer" ? "Supplier Company" : "Customer Company"}</TableHead>
                                <TableHead>Order Type</TableHead>
                                <TableHead>Stage</TableHead>
                                <TableHead>Target Date</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {salesLoading ? (
                                <TableRow className="hover:bg-white">
                                    <TableCell colSpan={displayEntityFilter === "Customer" ? 8 : 8} className="text-center py-8 text-gray-500">
                                        <Loader />
                                    </TableCell>
                                </TableRow>
                            ) : salesData?.data && salesData.data.length !== 0 ? (
                                salesData.data.map((item, index) => (
                                    <TableRow
                                        key={index}
                                        className="w-full py-3 gap-4 cursor-pointer hover:bg-gray-50"
                                    >
                                        {displayEntityFilter === "Supplier" ? (
                                            <>
                                                <TableCell className="py-5">{(displayCurrentPage - 1) * PAGE_LIMIT + index + 1}</TableCell>
                                                <TableCell className="hover:underline" onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    navigator.clipboard.writeText(item.orderId ?? "")
                                                    toast.success("Order ID copied to clipboard");
                                                }}>
                                                    {item.orderId ? `${(item.orderId).toUpperCase().slice(0, 6)}...` : "-"}
                                                </TableCell>
                                                <TableCell className="">
                                                    {item.supplierCompany
                                                        ? item.supplierCompany.length > 20
                                                            ? `${item.supplierCompany.slice(0, 20)}...`
                                                            : item.supplierCompany
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="">
                                                    {item.productName || "-"}
                                                </TableCell>

                                                <TableCell>
                                                    {item.customerCompany
                                                        ? item.customerCompany.length > 20
                                                            ? `${item.customerCompany.slice(0, 20)}...`
                                                            : item.customerCompany
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="">{item.orderType || "-"}</TableCell>
                                                <TableCell className="">{item.stage || "-"}</TableCell>
                                                <TableCell className="">{ item.targetDate && format(new Date(item.targetDate), "dd-MM-yyyy") || "-"}</TableCell>
                                            </>
                                        ) : (
                                            <>
                                                <TableCell className="py-5">{(displayCurrentPage - 1) * PAGE_LIMIT + index + 1}</TableCell>
                                                <TableCell className="hover:underline" onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    navigator.clipboard.writeText(item.orderId ?? "")
                                                    toast.success("Order ID copied to clipboard");
                                                }}>
                                                    {item.orderId ? `${(item.orderId).toUpperCase().slice(0, 6)}...` : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {item.customerCompany
                                                        ? item.customerCompany.length > 20
                                                            ? `${item.customerCompany.slice(0, 20)}...`
                                                            : item.customerCompany
                                                        : "-"}
                                                </TableCell>
                                                <TableCell className="">{item.productName || "-"}</TableCell>
                                                <TableCell>
                                                    {item.supplierCompany
                                                        ? item.supplierCompany.length > 20
                                                            ? `${item.supplierCompany.slice(0, 20)}...`
                                                            : item.supplierCompany
                                                        : "-"}
                                                </TableCell>
                                                <TableCell>{item.orderType || "-"}</TableCell>
                                                <TableCell>{item.stage || "-"}</TableCell>
                                                <TableCell>{ item.targetDate &&  format(new Date(item.targetDate), "dd-MM-yyyy") || "-"}</TableCell>
                                            </>
                                        )}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow className="hover:bg-white">
                                    <TableCell colSpan={displayEntityFilter === "Customer" ? 8 : 8} className="text-center py-8">
                                        {entityFilter === "none"
                                            ? "Please select customer or supplier"
                                            : salesError
                                                ? "Error loading reports"
                                                : "No Reports found Apply or modify filters"}

                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {totalPages > 1 && (
                <Pagination
                    currentPage={displayCurrentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                        const queryParams = new URLSearchParams(searchParams.toString());
                        queryParams.set("page", page.toString());
                        router.push(`?${queryParams.toString()}`);
                    }}
                />
            )}
        </div>
    );
}

export default ReportsPage;