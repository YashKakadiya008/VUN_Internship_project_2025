"use client";

import { deleteSupplier, getAllSuppliers, SupplierType } from "@/api/suppiler";
import FilterDialog from "@/components/supplier/Filter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Loader from "@/components/ui/loader";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PAGE_LIMIT } from "@/lib/constants";
import { FiltersType } from "@/lib/supplier/type";
import { useMutation } from "@tanstack/react-query";
import { Copy, Edit, FileDown, Plus, Trash2 } from "lucide-react";
import { generateSuppliersReport } from "@/api/report";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";

type Supplier = {
  supplierId: string;
  companyName: string | null;
  mobileNo: string | null;
  address: {
    city: string | null;
    state: string | null;
  };
}

function copySupplierDetails(item: SupplierType): string {
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
    `Name: ${item.supplierName ?? "-"}`,
    `Company: ${item.companyName ?? "-"}`,
    `Mobile: ${item.mobileNo ?? "-"}`,
    locationText ? `Location: ${locationText}` : null,
    locationLink ? `Location Link: ${locationLink}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return textToCopy;
}

const Supplier: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [search, setSearch] = useState('');

  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const getFilterArray = (param: string) => {
    const values = searchParams.getAll(param);
    return values.length > 0 ? values : undefined;
  };
  const initialFilters: FiltersType = {
    stock: getFilterArray("stock"),
    cordingBase: getFilterArray("cordingBase"),
    mainCategory: getFilterArray("mainCategory"),
    type: getFilterArray("type"),
    productionCapacity: getFilterArray("productionCapacity"),
    supplierMachineType: getFilterArray("supplierMachineType"),
    productPattern: getFilterArray("productPattern"),
    workType: getFilterArray("workType"),
    jariBase: getFilterArray("jariBase"),
  };

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [filters, setFilters] = useState<FiltersType>(initialFilters);
  const [suppliers, setSuppliers] = useState<SupplierType[]>([]);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSuppliers = useCallback(async (page: number, filters: FiltersType, searchTerm: string) => {
    try {
      setLoading(true);
      const response = await getAllSuppliers({
        limit: PAGE_LIMIT,
        offset: (page - 1) * PAGE_LIMIT,
        filters: filters,
        search: searchTerm || undefined,
      });
      setSuppliers(response.data);
      setTotalSuppliers(response.total);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      await deleteSupplier(supplierId);
    },
    onSuccess: () => {
      fetchSuppliers(currentPage, filters, searchTerm);
      toast.success("Supplier deleted successfully");
      setDialogOpen(false);
    },
    onError: () => {
      toast.error("Please try again");
    },
  });

  const handleDelete = (customerId: string) => {
    deleteMutation.mutate(customerId);
  };

  const { mutate: exportSuppliers, isPending: isExporting } = useMutation({
    mutationFn: async (filters: FiltersType) => {
      const response = await generateSuppliersReport(filters || {});

      // Create Blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute('download', `suppliers-${new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
        .toISOString()
        .split('T')[0]}.xlsx`);
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
    exportSuppliers(filters);
  };

  useEffect(() => {
    fetchSuppliers(currentPage, filters, searchTerm);
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    if (filters) {
      Object.entries(filters).forEach(([key, values]) => {
        if (values && values.length > 0) {
          values.forEach((value) => params.append(key, value));
        }
      });
    }
    if (searchTerm) {
      params.set("search", searchTerm);
    }
    router.replace(`/dashboard/supplier-department/supplier?${params.toString()}`, { scroll: false });
  }, [currentPage, filters, fetchSuppliers, router, searchTerm]);

  const handleApplyFilters = (newFilters: FiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalSuppliers / PAGE_LIMIT);

  useEffect(() => {
    const urlSearchTerm = searchParams.get('search') || '';
    setSearchTerm(urlSearchTerm);
  }, [searchParams]);

  return (
    <div className="flex flex-col gap-4 w-full min-h-[75vh] lg:min-h-[85vh] justify-between">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <h1 className="text-2xl font-semibold">All Supplier</h1>
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
            <FilterDialog
              onApplyFilters={handleApplyFilters}
              initialFilters={filters}
            />
            <Button
              className="bg-primary hover:bg-primary/95 gap-3 items-center justify-center text-white"
              onClick={() => router.push(`/dashboard/supplier-department/supplier/new`)}
            >
              <Plus size={16} className="w-8 h-8  ml-0 md:ml-2" />
              <span className="hidden md:block mr-3">Add New</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-2 md:mt-0 text-center">
          <Input
            placeholder="Search by supplier name, company name, mobile no, gst no..."
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
        <div className="w-full h-full flex flex-col justify-between">
          <Table className="bg-white">
            <TableHeader>
              <TableRow className="bg-[#F9F9F9] text-[16px] font-semibold w-full justify-between items-center gap-4 rounded-lg py-3">
                <TableHead>No.</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Mobile no.</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-white">
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    <Loader />
                  </TableCell>
                </TableRow>
              ) : suppliers.length > 0 ? (
                suppliers.map((item, index) => (
                  <TableRow
                    key={item.supplierId}
                    className="w-full py-3 gap-4 cursor-pointer"
                    onClick={() => {
                      router.push(`/dashboard/supplier-department/${item.supplierId}`);
                    }}
                  >
                    <TableCell>{(currentPage - 1) * PAGE_LIMIT + index + 1}</TableCell>
                    <TableCell>{item.companyName || "-"}</TableCell>
                    <TableCell>{item.mobileNo || "-"}</TableCell>
                    <TableCell>
                      {item.address.city || "-"} {item.address.state && ","} {item.address.state || ""}
                    </TableCell>
                    <TableCell className="flex gap-2 items-center justify-center">
                      <Button
                        className="shrink-0 hover:bg-primary hover:text-white bg-transparent shadow-none text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/supplier-department/supplier/${item.supplierId}`);
                        }}
                      >
                        <Edit size={16} className="w-8 h-8" />
                        Edit
                      </Button>
                      <Button
                        className="shrink-0 hover:bg-primary hover:text-white text-primary shadow-none bg-transparent px-3 py-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          const text = copySupplierDetails(item)
                          navigator.clipboard.writeText(text);
                          toast.success("Copied to clipboard");
                        }}
                      >
                        <Copy size={16} className="w-8 h-8" />
                        Copy
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
                            <DialogTitle>
                              Are you sure you want to delete this supplier {item.companyName}?
                            </DialogTitle>
                            <DialogDescription>
                              This supplier will be permanently deleted.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="flex gap-2 flex-row justify-end">
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button
                              variant="destructive"
                              onClick={() => handleDelete(item.supplierId)}
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
                  <TableCell colSpan={5} className="text-center py-8">
                    No suppliers found
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
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

    </div>
  );
};

export default Supplier;