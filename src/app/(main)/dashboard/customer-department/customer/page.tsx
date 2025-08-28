"use client";

import { generateCustomerReport, generateCustomersReport } from "@/api/report";
import FilterDialog from "@/components/customer/Filter";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PAGE_LIMIT } from "@/lib/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, Edit, FileDown, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { deleteCustomer, getAllCustomers } from "@/api/customer";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader";
import { CustomerFilter } from "@/db/type";
import { Customer as CustomerType, GetAllCustomersRequestType, GetAllCustomersResponse } from "@/lib/customer/type";

type FiltersType = {
  workType?: string[];
  machineType?: string[];
  making?: string[];
  materialUsage?: string[];
  type?: string[];
  color?: string[];
  subToneColor?: string[];
  taste?: string[];
  size?: string[];
  range?: string[];
  usageValueMonthly?: string[];
  paymentCycle?: string[];
  customerSaleChoice?: string[];
  customerSaleMethod?: string[];
  subMetallicColor?: string[];
  stage?: string;
  area?: string
}

function copyCustomerDetails(item: CustomerType): string {
  const {
    floor,
    plotNo,
    societyName,
    lane,
    address,
    area,
    city,
    state,
    pincode,
    locationLink,
  } = item.address;

  const locationParts = [
    floor,
    plotNo,
    societyName,
    lane,
    address,
    area,
    city,
    state,
    pincode,
  ];

  const locationText = locationParts.filter(Boolean).join(", ");

  const textToCopy = [
    `Name: ${item.customerName ?? "-"}`,
    `Company: ${item.companyName ?? "-"}`,
    `Mobile: ${item.mobileNo ?? "-"}`,
    `Reference: ${item.reference ?? "-"}`,
    locationText ? `Location: ${locationText}` : null,
    locationLink ? `Location Link: ${locationLink}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return textToCopy;
}

const parseFiltersFromURL = (searchParams: URLSearchParams): FiltersType => {
  const filters: FiltersType = {};
  const filterKeys = [
    "workType",
    "machineType",
    "color",
    "type",
    "taste",
    "subToneColor",
    "customerSaleMethod",
    "customerSaleChoice",
    "subMetallicColor",
    "size",
    "materialUsage",
    "usageValueMonthly",
    "making",
    "range",
    "paymentCycle",
  ];

  filterKeys.forEach((key) => {
    const value = searchParams.get(key);
    if (value) {
      (filters as Record<string, string[]>)[key] = value.split(",");
    }
  });

  return filters;
};

const ClientCustomer: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [search, setSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page, 10) : 1;
  });
  const [filters, setFilters] = useState<FiltersType>(() => parseFiltersFromURL(searchParams));

  const { data, isLoading, isFetching, isError } = useQuery<GetAllCustomersResponse, Error>({
    queryKey: ["customers", currentPage, filters, searchTerm],
    queryFn: async () => {
      const apiFilters = filters ? {
        workType: filters.workType,
        machineType: filters.machineType,
        making: filters.making,
        materialUsage: filters.materialUsage,
        type: filters.type,
        color: filters.color,
        subToneColor: filters.subToneColor,
        taste: filters.taste,
        Size: filters.size,
        range: filters.range,
        usageValueMonthly: filters.usageValueMonthly,
        paymentCycle: filters.paymentCycle,
        customerSaleChoice: filters.customerSaleChoice,
        customerSaleMethod: filters.customerSaleMethod,
        subMetallicColor: filters.subMetallicColor,
        stage: filters.stage,
        area: filters.area
      } : undefined;
      const request: GetAllCustomersRequestType = {
        limit: PAGE_LIMIT,
        offset: (currentPage - 1) * PAGE_LIMIT,
        filters: apiFilters as GetAllCustomersRequestType["filters"],
        search: searchTerm || undefined
      };
      const response = await getAllCustomers(request);

      const mappedData = response.data.map((customer: CustomerType) => ({
        ...customer,
        files: customer.files
          ? customer.files.map((file) => ({
            public_id: file.public_id,
            signedUrl: file.signedUrl ?? "",
            name: file.name || "",
          }))
          : null,
      }));
      return {
        ...response,
        data: mappedData,
      };
    },
    retry: 1,
  });

  const updateURLWithFiltersAndPage = (
    router: ReturnType<typeof useRouter>,
    searchParams: URLSearchParams,
    filters: FiltersType,
    currentPage: number,
    searchTerm?: string
  ) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", currentPage.toString());
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          params.set(key, value.join(","));
        } else if (typeof value === 'string' && value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
    }

    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }
    router.replace(`/dashboard/customer-department/customer?${params.toString()}`, { scroll: false });
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_LIMIT) : 1;
  const customers = data?.data || [];

  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      await deleteCustomer(customerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted successfully");
    },
    onError: () => {
      toast.error("Please try again");
    },
  });

  const handleDelete = (customerId: string) => {
    deleteMutation.mutate(customerId);
  };

  const { mutate: exportCustomers, isPending: isExporting } = useMutation({
    mutationFn: async (filters: CustomerFilter) => {
      const response = await generateCustomersReport(filters);

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
      link.setAttribute('download', `customers-export-${istDate}.xlsx`);
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
    exportCustomers(filters);
  };

  const { mutate: exportCustomer, isPending: isPendingCustomer } = useMutation({
    mutationFn: async ({ customerId, customerName }: { customerId: string; customerName: string }) => {
      const { data, message, success } = await generateCustomerReport(customerId, {});

      if (!success || !data) {
        throw new Error(message || 'Failed to generate report');
      }

      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');

      const istDate = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
      ).toISOString().split('T')[0];

      link.href = url;
      link.setAttribute(
        'download',
        `customer-${customerName.toLowerCase().replace(/\s+/g, '-')}-${istDate}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { customerName, message };
    },
    onSuccess: (result) => {
      toast.success(result.message || `Exported ${result.customerName}'s data successfully`);
    },
    onError: (error: Error, variables) => {
      toast.error(error.message || `Failed to export ${variables.customerName}'s data`);
    },
  });

  const handleExportCustomer = async (customerId: string, customerName: string) => {
    exportCustomer({ customerId, customerName });
  };

  const handleFilterChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search') || '';
    setSearchTerm(urlSearchTerm);
  }, [searchParams]);

  useEffect(() => {
    updateURLWithFiltersAndPage(router, searchParams, filters, currentPage, searchTerm);
  }, [currentPage, filters, router, searchParams, searchTerm]);

  if (isError) {
    toast.error("Please try again");
  }

  return (
    <div className="flex flex-col gap-4 w-full min-h-[75vh] lg:min-h-[85vh] justify-between">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <h1 className="text-2xl font-semibold">All Customers</h1>
          <div className="flex items-center justify-center gap-2 mt-2 md:mt-0 text-center">
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
            <FilterDialog onApplyFilters={handleFilterChange} initialFilters={filters} />
            <Button
              className="bg-primary hover:bg-primary/95 gap-3 items-center justify-center text-white"
              onClick={() => router.push(`/dashboard/customer-department/customer/new`)}
            >
              <Plus size={16} className="w-8 h-8 ml-0 md:ml-2" />
              <span className="hidden md:block mr-3">Add New</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-2 md:mt-0 text-center">
          <Input
            placeholder="Search by customer name, company name, mobile no, gst no..."
            className="w-full bg-gray-200"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setCurrentPage(1);
                setSearchTerm(search || '');
              }
            }}
          />
          <Button
            className="bg-primary hover:bg-primary/95 gap-3 items-center justify-center text-white"
            onClick={() => {
              setCurrentPage(1);
              setSearchTerm(search || '');
            }}
          >
            <span>Search</span>
          </Button>
        </div>
        <div className="w-full h-full flex flex-col justify-between ">
          <Table className="bg-white">
            <TableHeader>
              <TableRow className="bg-[#F9F9F9] text-[16px] font-semibold w-full justify-between items-center gap-4 rounded-lg py-3">
                <TableHead>No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Mobile no.</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isFetching ? (
                <TableRow className="hover:bg-white">
                  <TableCell colSpan={6} className="text-center">
                    <Loader />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow className="hover:bg-white">
                  <TableCell colSpan={6} className="text-center py-8">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((item: CustomerType, index: number) => {
                  const location = [
                    item.address.city,
                    item.address.state,
                  ].filter(Boolean).join(", ") || "-";
                  return (
                    <TableRow
                      key={item.customerId}
                      className="w-full py-3 gap-4 cursor-pointer"
                      onClick={() => {
                        router.push(`/dashboard/customer-department/${item.customerId}`);
                      }}
                    >
                      <TableCell>{(currentPage - 1) * PAGE_LIMIT + index + 1}</TableCell>
                      <TableCell>{item.customerName || "-"}</TableCell>
                      <TableCell>{item.companyName || "-"}</TableCell>
                      <TableCell>{item.mobileNo || "-"}</TableCell>
                      <TableCell>{location}</TableCell>
                      <TableCell className="flex items-center justify-center gap-2 text-center">
                        <Button
                          className="shrink-0 hover:bg-primary hover:text-white bg-transparent shadow-none text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/customer-department/customer/${item.customerId}`);
                          }}
                        >
                          <Edit size={16} className="w-8 h-8" />
                          Edit
                        </Button>
                        <Button
                          className="shrink-0 hover:bg-primary hover:text-white text-primary shadow-none bg-transparent px-3 py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            const text = copyCustomerDetails(item);
                            navigator.clipboard.writeText(text);
                            toast.success("Copied to clipboard");
                          }}
                          title="Copy customer details"
                        >
                          <Copy size={16} className="w-4 h-4" />
                          <span className="sr-only">Copy</span>
                        </Button>
                        <Button
                          className="shrink-0 hover:bg-green-50 hover:text-green-600 text-green-500 shadow-none bg-transparent px-3 py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportCustomer(item.customerId, item.customerName || 'customer');
                          }}
                          disabled={isPendingCustomer}
                          title="Export customer data"
                        >
                          <Download size={16} className="w-4 h-4" />
                          <span className="sr-only">Export</span>
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
                              <DialogTitle>Are you sure you want to delete customer {item.customerName}?</DialogTitle>
                              <DialogDescription>This customer will be permanently deleted.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex gap-2 flex-row justify-end">
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(item.customerId)}
                                disabled={deleteMutation.isPending || deleteMutation.isSuccess}
                              >
                                {deleteMutation.isPending || deleteMutation.isSuccess ? "Deleting..." : "Delete"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </div>
  );
};

export default function CustomerPage() {
  return (
    <Suspense fallback={<div><Loader /></div>}>
      <ClientCustomer />
    </Suspense>
  );
}
