"use client";

import { deleteProduct, getAllProducts } from "@/api/product";
import FilterDialog from "@/components/product/Filter";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/loader";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Product as ProductType } from "@/db";
import { PAGE_LIMIT } from "@/lib/constants";
import { FiltersType, GetAllProductsRequestType } from "@/lib/product/type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Edit, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";

const ProductsLoading = () => (
  <div className="flex flex-col gap-4 w-full min-h-[75vh] lg:min-h-[85vh] justify-center items-center">
    <Loader />
  </div>
);

function ClientPage() {
  return <ProductContent />;
}

export default function ProductPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ClientPage />
    </Suspense>
  );
}

const ProductContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [search, setSearch] = useState('');

  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialFilters: FiltersType = searchParams.get("filters")
    ? JSON.parse(decodeURIComponent(searchParams.get("filters")!))
    : {};

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [filters, setFilters] = useState<FiltersType>(initialFilters);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (currentPage !== 1) {
      params.set("page", currentPage.toString());
    }
    if (Object.keys(filters).length > 0) {
      params.set("filters", encodeURIComponent(JSON.stringify(filters)));
    }
    if (searchTerm) {
      params.set("search", searchTerm);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [currentPage, filters, router, searchTerm]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  useEffect(() => {
    const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
    const filtersFromUrl = searchParams.get("filters")
      ? JSON.parse(decodeURIComponent(searchParams.get("filters")!))
      : {};

    setCurrentPage(pageFromUrl);
    setFilters(filtersFromUrl);
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  const offset = (currentPage - 1) * PAGE_LIMIT;

  const queryParams: GetAllProductsRequestType = {
    limit: PAGE_LIMIT,
    offset,
    filters,
    search: searchTerm || undefined,
  };

  const {
    data: result,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["products", currentPage, filters, searchTerm],
    queryFn: () => getAllProducts(queryParams),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await deleteProduct(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
    },
    onError: () => {
      toast.error("Please try again");
    },
  });

  const handleDelete = (customerId: string) => {
    deleteMutation.mutate(customerId);
  };

  const products = result?.data ?? [];
  const totalCount = result?.total ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_LIMIT);

  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleCopy = (product: ProductType) => {
    const clipboardString = `Name: ${product.productName || "-"}\nMOQ: ${product.moq || "-"}\nCategory: ${product.mainCategory || "-"}\nType: ${product.type || "-"}\nColor: ${product.color || "-"}\nSize: ${product.size || "-"}`;
    navigator.clipboard.writeText(clipboardString);
    toast.success("Product details copied to clipboard");
  };

  if (isError) {
    return (
      <div className="flex flex-col gap-4 w-full min-h-[75vh] lg:min-h-[85vh] justify-center items-center">
        <p className="text-red-500">Error loading products: {(error as Error)?.message}</p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full min-h-[75vh] lg:min-h-[85vh] justify-between">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">All Products</h1>
          <div className="flex items-center justify-center gap-2 text-center">
            <FilterDialog onFiltersChange={handleFiltersChange} currentFilters={filters} />
            <Button
              className="bg-primary hover:bg-primary/95 gap-3 items-center justify-center text-white"
              onClick={() => router.push(`/dashboard/product-department/new`)}
            >
              <Plus size={16} className="w-8 h-8  ml-0 md:ml-2" />
              <span className="hidden md:block mr-3">Add New</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-2 md:mt-0 text-center">
          <Input
            placeholder="Search by product name..."
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
                <TableHead>Product</TableHead>
                <TableHead>MOQ</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading || isFetching ? (
                <TableRow className="hover:bg-white">
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <Loader />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ?
                (
                  <TableRow className="hover:bg-white">
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No products found
                    </TableCell>
                  </TableRow>
                ) :
                (
                  products.map((product, index) => (
                    <TableRow key={product.productId} className="w-full py-3 gap-4">
                      <TableCell>{offset + index + 1}</TableCell>
                      <TableCell>{product.vnuProductName || "-"}</TableCell>
                      <TableCell>{product.moq || "-"}</TableCell>
                      <TableCell>{product.mainCategory?.[0] || "-"}</TableCell>
                      <TableCell>{product.type || "-"}</TableCell>
                      <TableCell>{product.color || "-"}</TableCell>
                      <TableCell>{product.size || "-"}</TableCell>
                      <TableCell className="flex items-center justify-center gap-2 text-center">
                        <Button
                          className="shrink-0 hover:bg-primary hover:text-white bg-transparent shadow-none text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/product-department/${product.productId}`);
                          }}
                        >
                          <Edit size={16} className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          className="shrink-0 hover:bg-primary hover:text-white text-primary shadow-none bg-transparent px-3 py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy({
                              ...product,
                              type: product.type ?? null,
                              productPattern: product.productPattern ?? null,
                              mainCategory: product.mainCategory ?? null,
                              color: product.color ?? null,
                              subMetallicColor: product.subMetallicColor ?? null,
                              subToneColor: product.subToneColor ?? null,
                              size: product.size ?? null,
                              jariBase: product.jariBase ?? null,
                              images: product.images ?? [],
                              vnuProductName: product.vnuProductName ?? null,
                              purchaseRate: product.purchaseRate ?? null,
                              salesRate: product.salesRate ?? null,
                              supplierId: product.supplierId ?? null,
                            });
                          }}
                        >
                          <Copy size={16} className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="shrink-0 text-red-600 hover:bg-red-200 bg-transparent shadow-none"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 size={16} className="w-8 h-8" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent onClick={(e) => e.stopPropagation()}>
                            <DialogHeader>
                              <DialogTitle>Are you sure you want to delete product {product.productName}?</DialogTitle>
                              <DialogDescription>This product will be permanently deleted.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex gap-2 flex-row justify-end">
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(product.productId)}
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
    </div>);
};