"use client";

import {
  createOrder,
  getAllCustomersIdAndName,
  getAllSuppliersIdAndName,
  updateOrder,
} from "@/api/order";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { STAGE_FILTER, TYPE_FILTER } from "@/lib/constants";
import { CreateOrderRequestType, UpdateOrderRequestType } from "@/lib/order/type";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import { ImagePlus, Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import DatePicker from "../ui/datePicker";

const orderFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  productName: z.string().optional(),
  type: z.string().optional(),
  stage: z.string().optional(),
  description: z.string().optional(),
  targetDate: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface OrderData {
  orderId?: string;
  customerId?: string;
  supplierId?: string;
  productName?: string;
  type?: string;
  stage?: string;
  description?: string;
  targetDate?: string;
  images?: string[];
}

interface AddOrderProps {
  data?: OrderData;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  supplierId: string;
}

const AddOrder: React.FC<AddOrderProps> = ({ data, open, setOpen, supplierId }) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: getAllCustomersIdAndName,
    enabled: open,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getAllSuppliersIdAndName,
    enabled: open,
  });

  const selectedSupplier = suppliers.find((s) => s.id === supplierId);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerId: "",
      supplierId: supplierId || "",
      productName: "",
      type: "",
      stage: "",
      description: "",
      targetDate: "",
    },
  });

  useEffect(() => {
    if (supplierId) {
      form.setValue("supplierId", supplierId);
    }
  }, [supplierId, form]);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderData: CreateOrderRequestType) => createOrder(orderData),
    onSuccess: () => {
      toast.success("Order created successfully!");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create order");
    },
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: (orderData: UpdateOrderRequestType) => updateOrder(orderData),
    onSuccess: () => {
      toast.success("Order updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update order");
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setImageFiles(files);

    // Create preview for first image
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(files[0]);
  };

  const onSubmit = (formData: OrderFormData) => {
    const baseOrderData = {
      customerId: formData.customerId,
      supplierId: formData.supplierId,
      productName: formData.productName || null,
      type: formData.type || null,
      stage: formData.stage || null,
      description: formData.description || null,
      targetDate: formData.targetDate
        ? new Date(formData.targetDate).toISOString()
        : null,
      "images[]": imageFiles.length > 0 ? imageFiles : undefined,
    };

    if (data?.orderId) {
      const updateData: UpdateOrderRequestType = {
        ...baseOrderData,
        orderId: data.orderId,
        existingImages: existingImages,
      };
      updateOrderMutation.mutate(updateData);
    } else {
      const createData: CreateOrderRequestType = baseOrderData;
      createOrderMutation.mutate(createData);
    }
  };

  const resetForm = useCallback(() => {
    form.reset({
      customerId: "",
      supplierId: supplierId,
      productName: "",
      type: "",
      stage: "",
      description: "",
      targetDate: "",
    });
    setImageFiles([]);
    setImagePreview(null);
    setExistingImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (supplierId) {
      form.trigger("supplierId");
    }
  }, [form, supplierId]);

  // Populate form when editing
  useEffect(() => {
    if (data && open) {
      form.setValue("customerId", data.customerId || "");
      form.setValue("supplierId", data.supplierId || supplierId || "");
      form.setValue("productName", data.productName || "");
      form.setValue("type", data.type || "");
      form.setValue("stage", data.stage || "");
      form.setValue("description", data.description || "");

      if (data.targetDate) {
        try {
          const date = new Date(data.targetDate);
          if (isValid(date)) {
            form.setValue("targetDate", format(date, "yyyy-MM-dd"));
          } else {
            form.setValue("targetDate", data.targetDate);
          }
        } catch (error) {
          console.error("Error parsing target date:", error);
          console.warn("Invalid date format:", data.targetDate);
          form.setValue("targetDate", data.targetDate || "");
        }
      }

      if (data.images) {
        setExistingImages(data.images);
        setImagePreview(data.images[0] || null);
      }
    } else if (open) {
      resetForm();
      form.setValue("supplierId", supplierId || "");
    }
  }, [data, open, form, supplierId, resetForm]);

  const isLoading = createOrderMutation.isPending || updateOrderMutation.isPending;
  const isEdit = !!data?.orderId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl min-w-[300px] p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium">
            {isEdit ? "Edit" : "Add"} Order
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-1">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              {/* Image Upload */}
              <div className="flex flex-col justify-center gap-2">
                <p className="text-primary">Image</p>
                <label
                  htmlFor="image-upload"
                  className="h-32 w-full rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 cursor-pointer group relative flex items-center justify-center hover:bg-gray-50"
                >
                  {imagePreview || (existingImages.length > 0 && !imageFiles.length) ? (
                    <>
                      <div
                        className="bg-cover bg-center bg-no-repeat h-full w-full rounded-lg"
                        style={{
                          backgroundImage: `url(${imagePreview || existingImages[0]})`,
                        }}
                      />
                      <div className="flex bg-black/50 justify-center rounded-lg absolute duration-200 group-hover:opacity-80 inset-0 items-center opacity-0 transition-opacity">
                        <ImagePlus className="h-5 text-white w-5" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <ImagePlus className="h-8 text-gray-400 w-8" />
                      <span className="text-xs mt-1 text-gray-400">
                        Add Image
                      </span>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              {/* Customer and Supplier */}
              <div className="flex flex-col md:flex-row w-full gap-4">
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem
                                  key={customer.id}
                                  value={customer.id}
                                >
                                  {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={() => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <FormControl>
                          <Input
                            value={selectedSupplier?.name || (suppliers.length > 0 ? "Supplier not found" : "Loading...")}
                            disabled
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Product Name and Type */}
              <div className="flex flex-col md:flex-row w-full gap-4">
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="productName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Product Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {TYPE_FILTER.map((item) => (
                                <SelectItem key={item.id} value={item.name}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Stage and Sample */}
              <div className="flex flex-col md:flex-row w-full gap-4">
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stage</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Stage" />
                            </SelectTrigger>
                            <SelectContent>
                              {STAGE_FILTER.map((item) => (
                                <SelectItem key={item.id} value={item.name}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description"
                        {...field}
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target Date */}
              <FormField
                control={form.control}
                name="targetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString())}
                        className="w-full h-11"
                        placeholder="Select a date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DialogFooter>
          <div className="w-full flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading}
              className="bg-primary"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update" : "Create"} Order
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrder;