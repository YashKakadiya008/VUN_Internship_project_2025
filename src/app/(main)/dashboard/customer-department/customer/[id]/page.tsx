"use client";

import { createCustomer, getAllArea, getCustomerById, updateCustomer } from "@/api/customer";
import DropdownSelect from "@/components/customer/AreaDropdownSelect";
import CustomerProductImg from "@/components/customer/CustomerProductImg";
import DocumentFileInput from "@/components/customer/FileInput";
import ImageViewer from "@/components/customer/ImageViewer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import CheckboxWithInput, { CheckboxInputItem } from "@/components/ui/checkboxWithInput";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Loader from "@/components/ui/loader";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { STATES } from "@/lib/constants";
import {
    COLOR,
    CUSTOMER_SALE_CHOICE,
    CUSTOMER_SALE_METHOD,
    MACHINE_TYPE_WITH_NUMBER,
    MAKING,
    MATERIAL_USAGE,
    MONTHLY_USAGE,
    OPEN_FOR_COLLAB,
    PAYMENT_CYCLE,
    RANGE,
    SIZE,
    SUB_METALIC_COLOR,
    SUB_TONE_TO_TONE_COLOR,
    TASTE,
    TYPE,
    WORK_TYPE,
} from "@/lib/customerConstant";
import { DocumentType } from "@/types";
import { AddCustomerField, addCustomerSchema } from "@/types/customer";
import { CustomerData } from "@/types/customerData";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

const items: CheckboxInputItem[] = MACHINE_TYPE_WITH_NUMBER;

const AddCustomer: React.FC = () => {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const queryClient = useQueryClient();
    const isEditing = id !== "new";

    const addCustomerForm = useForm<AddCustomerField>({
        defaultValues: {
            companyName: "",
            customerName: "",
            reference: "",
            mobileNo: "",
            gstNo: "",
            floor: "",
            plotNo: "",
            societyName: "",
            lane: "",
            address: "",
            area: "",
            city: "",
            state: "",
            pincode: "",
            locationLink: "",
            workType: [],
            machineType: [],
            making: [],
            materialUsage: [],
            type: [],
            color: [],
            subMetallicColor: [],
            subToneColor: [],
            taste: [],
            size: [],
            range: "",
            usageValueMonthly: "",
            paymentCycle: "",
            customerProductGallery: [],
            traditionalSariServer: "",
            openForCollab: "no",
            customerSaleChoice: [],
            customerSaleMethod: [],
            notes: "",
            document: [],
        },
        resolver: zodResolver(addCustomerSchema),
        mode: "onSubmit",
    });

    const [documentFiles, setDocumentFiles] = useState<(File | DocumentType)[]>([]);
    const [galleryImages, setGalleryImages] = useState<
        { file: File; buffer: string; note?: string; public_id?: string }[]
    >([]);
    const [addImageDialog, setAddImageDialog] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ name: string; buffer: string } | null>(null);

    const handleAddFiles = (files: File[]) => {
        setDocumentFiles((prev) => [...prev, ...files]);
        addCustomerForm.setValue("document", [...documentFiles, ...files]);
    };

    const handleRemoveFile = (index: number) => {
        const updated = [...documentFiles];
        updated.splice(index, 1);
        setDocumentFiles(updated);
        addCustomerForm.setValue("document", updated.length > 0 ? updated : undefined);
    };

    const handleAddGalleryImage = (image: { file: File; buffer: string; note?: string }) => {
        setGalleryImages((prev) => [...prev, image]);
    };

    const handleRemoveGallery = (index: number) => {
        const updated = [...galleryImages];
        updated.splice(index, 1);
        setGalleryImages(updated);
    };

    const { data: customerData, isLoading: isCustomerLoading } = useQuery<CustomerData>({
        queryKey: ["customer", id],
        queryFn: () => getCustomerById(id as string),
        enabled: isEditing,
        staleTime: 5 * 60 * 1000, // 5 minutes
    }); useEffect(() => {
        if (isEditing && customerData) {
            const data = customerData as CustomerData;
            addCustomerForm.reset({
                companyName: data.companyName || "",
                customerName: data.customerName || "",
                reference: data.reference || "",
                mobileNo: data.mobileNo || "",
                gstNo: data.gstNo || "",
                floor: data.address?.floor || "",
                plotNo: data.address?.plotNo || "",
                societyName: data.address?.societyName || "",
                lane: data.address?.lane || "",
                address: data.address?.address || "",
                area: data.address?.area || "",
                city: data.address?.city || "",
                state: data.address?.state || "",
                pincode: data.address?.pincode || "",
                locationLink: data.address?.locationLink || "",
                workType: data.workType || [],
                machineType: data.machineType || [],
                making: data.making || [],
                materialUsage: data.materialUsage || [],
                type: data.type || [],
                color: data.color || [],
                subMetallicColor: data.subMetallicColor || [],
                subToneColor: data.subToneColor || [],
                taste: data.taste || [],
                size: data.size || [],
                range: data.range || "",
                usageValueMonthly: data.usageValueMonthly || "",
                paymentCycle: data.paymentCycle || "",
                customerProductGallery: data.productImages || [],
                traditionalSariServer: "",
                openForCollab: data.openForCollab || "no",
                customerSaleChoice: data.customerSaleChoice || [],
                customerSaleMethod: data.customerSaleMethod || [],
                notes: data.notes || "",
                document: data.files || [],
            });
            setDocumentFiles(data.files || []);
            setGalleryImages(
                (data.productImages || []).map((img) => ({
                    file: new File([], img.name),
                    buffer: img.signedUrl,
                    note: img.note,
                    public_id: img.public_id,
                }))
            );
        }
    }, [customerData, isEditing, addCustomerForm]);

    const createCustomerMutation = useMutation({
        mutationFn: (data: {
            formData: AddCustomerField;
            files: (File | DocumentType)[];
            galleryImages: { file: File; buffer: string; note?: string; public_id?: string }[];
        }) => {
            const apiFormData = {
                ...data.formData,
                type: data.formData.type || [],
                workType: data.formData.workType || [],
                making: data.formData.making || [],
                materialUsage: data.formData.materialUsage || [],
                color: data.formData.color || [],
                subMetallicColor: data.formData.subMetallicColor || [],
                subToneColor: data.formData.subToneColor || [],
                taste: data.formData.taste || [],
                size: data.formData.size || [],
                customerSaleChoice: data.formData.customerSaleChoice || [],
                customerSaleMethod: data.formData.customerSaleMethod || [],
                machineType: data.formData.machineType.map(item => ({
                    label: item.label,
                    value: item.value || ''
                })),
                productImageNotes: data.galleryImages.map(img => img.note || ''),
                fileNotes: data.files.map(file => typeof file === 'object' && 'note' in file ? file.note || '' : ''),
            };
            return createCustomer(apiFormData, data.files, data.galleryImages);
        },
        onSuccess: () => {
            toast.success("Customer created successfully!");
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["ares"] });

            router.push("/dashboard/customer-department/customer");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create customer");
        },
    });

    const updateCustomerMutation = useMutation({
        mutationFn: (data: {
            customerId: string;
            formData: AddCustomerField;
            files: (File | DocumentType)[];
            galleryImages: { file: File; buffer: string; note?: string; public_id?: string }[];
            existingFiles: string[];
            existingImages: string[];
        }) => {
            const apiFormData = {
                ...data.formData,
                customerId: data.customerId,
                type: data.formData.type || [],
                workType: data.formData.workType || [],
                making: data.formData.making || [],
                materialUsage: data.formData.materialUsage || [],
                color: data.formData.color || [],
                subMetallicColor: data.formData.subMetallicColor || [],
                subToneColor: data.formData.subToneColor || [],
                taste: data.formData.taste || [],
                size: data.formData.size || [],
                customerSaleChoice: data.formData.customerSaleChoice || [],
                customerSaleMethod: data.formData.customerSaleMethod || [],
                machineType: data.formData.machineType.map(item => ({
                    label: item.label,
                    value: item.value || ''
                })),
                productImageNotes: data.galleryImages.map(img => img.note || ''),
                fileNotes: data.files.map(file => typeof file === 'object' && 'note' in file ? file.note || '' : ''),
                existingProductImages: data.existingImages,
                existingFiles: data.existingFiles
            };

            return updateCustomer(
                data.customerId,
                apiFormData,
                data.files,
                data.galleryImages,
                data.existingFiles,
                data.existingImages
            );
        },
        onSuccess: () => {
            toast.success("Customer updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["customer", id] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            router.push("/dashboard/customer-department/customer");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update customer");
        },
    });

    const { data: area = [] as { id: string, name: string }[] } = useQuery({
        queryKey: ["ares"],
        queryFn: getAllArea,
    });

    const [areaList, setAreaList] = useState<{ id: string; name: string }[]>(
        Array.isArray(area) ? area : []
    );

    const onSubmit = (data: AddCustomerField) => {
        const existingFiles = documentFiles
            .filter((file): file is DocumentType => typeof file === 'object' && 'public_id' in file && file.public_id !== undefined)
            .map((file: DocumentType) => file.public_id as string);
        const existingImages = galleryImages
            .filter((img) => img.public_id)
            .map((img) => img.public_id!);
        if (isEditing) {
            updateCustomerMutation.mutate({
                customerId: id as string,
                formData: data,
                files: documentFiles,
                galleryImages,
                existingFiles,
                existingImages,
            });
        } else {
            createCustomerMutation.mutate({
                formData: data,
                files: documentFiles,
                galleryImages,
            });
        }
    };

    if (isEditing && isCustomerLoading) {
        return <div><Loader /></div>;
    }

    const handleAddArea = (name: string) => {
        const newId = `${areaList.length + 1}`;
        const newArea = { id: newId, name };
        setAreaList([...areaList, newArea]);
        // form.setValue("area", name); // Update form value to the new area's name
    };

    return (
        <div className="flex flex-col gap-6 w-full h-full">
            <div className="flex items-center gap-4">
                <ArrowLeft
                    size={16}
                    className="w-6 h-6 hover:bg-gray-100 cursor-pointer rounded-sm"
                    onClick={() => router.back()}
                />
                <h1 className="text-2xl font-semibold">{isEditing ? "Edit" : "Add"} Customer</h1>
            </div>

            <Form {...addCustomerForm}>
                <form className="flex flex-col gap-6" onSubmit={addCustomerForm.handleSubmit(onSubmit)}>
                    {/* Company and Customer Name */}
                    <div className="flex flex-col md:flex-row w-full gap-6">
                        <div className="w-full">
                            <FormField
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter Company Name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="w-full">
                            <FormField
                                name="customerName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Customer Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter Customer Name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Mobile No and GST No */}
                    <div className="flex flex-col md:flex-row w-full gap-4">
                        <div className="w-full">
                             <FormField
                                name="reference"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reference</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter Reference " {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            /> 
                        </div>
                        <div className="w-full">
                            <FormField
                                name="mobileNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mobile No</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter Mobile Number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="w-full">
                            <FormField
                                name="gstNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>GST No</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter GST Number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Floor and Plot No */}
                    <div className="flex flex-col md:flex-row w-full gap-4">
                        <div className="w-full">
                            <FormField
                                name="floor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Floor</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g, 3rd floor" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="w-full">
                            <FormField
                                name="plotNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Plot No</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g, 23-B" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Society Name and Lane */}
                    <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-4">
                            <FormField
                                name="societyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Society Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter Society Name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="lane"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lane</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter lane" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="area"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Area</FormLabel>
                                        <DropdownSelect
                                            list={areaList}
                                            value={field.value}
                                            onChange={field.onChange}
                                            useNameAsValue={true}
                                            onAddItem={handleAddArea}
                                            placeholder="Select or type an area"
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                    </div>
                    {/* Address and Area */}
                    <div className="flex-2 flex-col w-full gap-4">
                        <FormField
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter full address"
                                            {...field}
                                            className="border-none ring-0 focus:ring-0 focus:ring-offset-0"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* City and State */}
                    <div className="flex flex-col md:flex-row w-full gap-4">
                        <div className="w-full">
                            <FormField
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter city name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="w-full">
                            <FormField
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>State</FormLabel>
                                        <FormControl>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className="w-full ring-0">
                                                    <SelectValue placeholder="Select state" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATES.map((state) => (
                                                        <SelectItem key={state.id} value={state.name}>
                                                            {state.name}
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

                    {/* Pincode and Location Link */}
                    <div className="flex flex-col md:flex-row w-full gap-4">
                        <div className="w-full">
                            <FormField
                                name="pincode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pincode</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter pincode" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="w-full">
                            <FormField
                                name="locationLink"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Location Link</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://maps.google.com/..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="workType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Work Type</FormLabel>
                                <FormControl>
                                    <Checkbox
                                        multiple
                                        containerClassName="flex flex-wrap gap-5"
                                        items={WORK_TYPE}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="machineType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Machine Type with Numbers</FormLabel>
                                <FormControl>
                                    <CheckboxWithInput
                                        items={items}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="making"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Making</FormLabel>
                                <FormControl>
                                    <Checkbox
                                        multiple
                                        containerClassName="flex flex-wrap gap-5"
                                        items={MAKING}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="materialUsage"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Material Usage</FormLabel>
                                <FormControl>
                                    <Checkbox
                                        multiple
                                        containerClassName="flex flex-wrap gap-5"
                                        items={MATERIAL_USAGE}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Type</FormLabel>
                                <FormControl>
                                    <Checkbox
                                        multiple
                                        containerClassName="flex flex-wrap gap-5"
                                        items={TYPE}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="color"
                        render={({ field }) => {
                            const selectedColors = field.value || [];
                            const showMetallic = selectedColors.includes('Mettalic Color');
                            const showToneToTone = selectedColors.includes('Tone to Tone');
                            return (
                                <FormItem>
                                    <FormLabel className="text-base">Color</FormLabel>
                                    <FormControl>
                                        <Checkbox
                                            multiple
                                            containerClassName="flex flex-wrap gap-5"
                                            items={COLOR}
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    
                                    {showMetallic && (
                                        <>
                                            <hr className="w-full bg-secondary my-4" />
                                            <FormField
                                                name="subMetallicColor"
                                                render={({ field: subField }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-base">Sub Metallic Color</FormLabel>
                                                        <FormControl>
                                                            <Checkbox
                                                                multiple
                                                                containerClassName="flex flex-wrap gap-5"
                                                                items={SUB_METALIC_COLOR}
                                                                value={subField.value}
                                                                onChange={subField.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </>
                                    )}
                                    {showToneToTone && (
                                        <>
                                            <hr className="w-full bg-secondary my-4" />
                                            <FormField
                                                name="subToneColor"
                                                render={({ field: subField }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-base">Sub Tone to Tone Color</FormLabel>
                                                        <FormControl>
                                                            <Checkbox
                                                                multiple
                                                                containerClassName="flex flex-wrap gap-5"
                                                                items={SUB_TONE_TO_TONE_COLOR}
                                                                value={subField.value}
                                                                onChange={subField.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </>
                                    )}
                                </FormItem>
                            );
                        }}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="taste"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Taste</FormLabel>
                                <FormControl>
                                    <Checkbox
                                        multiple
                                        containerClassName="flex flex-wrap gap-5"
                                        items={TASTE}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="size"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Size</FormLabel>
                                <FormControl>
                                    <Checkbox
                                        multiple
                                        containerClassName="flex flex-wrap gap-5"
                                        items={SIZE}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="range"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Range</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex flex-wrap gap-6 cursor-pointer"
                                    >
                                        {RANGE.map((item) => (
                                            <FormItem key={item.id} className="flex items-center gap-3">
                                                <FormControl>
                                                    <RadioGroupItem value={item.label} />
                                                </FormControl>
                                                <FormLabel className="font-normal text-base cursor-pointer">
                                                    {item.label}
                                                </FormLabel>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="usageValueMonthly"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Usage Value (Monthly)</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex flex-wrap gap-6"
                                    >
                                        {MONTHLY_USAGE.map((item) => (
                                            <FormItem key={item.id} className="flex items-center gap-3">
                                                <FormControl>
                                                    <RadioGroupItem value={item.label} />
                                                </FormControl>
                                                <FormLabel className="font-normal text-base cursor-pointer">
                                                    {item.label}
                                                </FormLabel>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="paymentCycle"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Payment Cycle</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex flex-wrap gap-6"
                                    >
                                        {PAYMENT_CYCLE.map((item) => (
                                            <FormItem key={item.id} className="flex items-center gap-3 ">
                                                <FormControl>
                                                    <RadioGroupItem value={item.label} />
                                                </FormControl>
                                                <FormLabel className="font-normal text-base cursor-pointer">{item.label}</FormLabel>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="customerProductGallery"
                        render={() => (
                            <FormItem>
                                <FormLabel className="text-base">Customer Product Gallery</FormLabel>
                                <FormControl>
                                    <div className="flex flex-wrap gap-3">
                                        <div
                                            className="flex h-40 w-40 cursor-pointer bg-gray-100 flex-col justify-center rounded-sm items-center"
                                            onClick={() => setAddImageDialog(true)}
                                        >
                                            <ImagePlus className="h-8 text-gray-400 w-8" />
                                            <span className="text-xs mt-1 text-gray-400">Add Image</span>
                                        </div>
                                        {galleryImages.map((img, idx) => (
                                            <div key={idx} className="relative flex flex-col justify-between items-center w-fit gap-2">
                                                <div className="absolute top-0 right-0 bg-black/30 rounded-sm z-10">
                                                    <X
                                                        className="h-5 w-5 text-white cursor-pointer"
                                                        onClick={() => handleRemoveGallery(idx)}
                                                    />
                                                </div>
                                                <div
                                                    className="cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedImage({
                                                            buffer: img.buffer,
                                                            name: img.file?.name || `new-image-${idx}`
                                                        });
                                                        setViewerOpen(true);
                                                    }}
                                                >
                                                    <Image
                                                        height={200}
                                                        width={200}
                                                        src={img.buffer}
                                                        alt={img.note || `upload-${idx}`}
                                                        className="w-32 h-32 object-cover rounded"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-600">{img.note || "No note"}</p>
                                            </div>
                                        ))}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="openForCollab"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Open for Collab</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex flex-wrap gap-6"
                                    >
                                        {OPEN_FOR_COLLAB.map((item) => (
                                            <FormItem key={item} className="flex items-center gap-3">
                                                <FormControl>
                                                    <RadioGroupItem value={item} />
                                                </FormControl>
                                                <FormLabel className="font-normal text-base">{item}</FormLabel>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="customerSaleChoice"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Customer Sale Choice</FormLabel>
                                <FormControl>
                                    <Checkbox
                                        multiple
                                        containerClassName="flex flex-wrap gap-5"
                                        items={CUSTOMER_SALE_CHOICE}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="customerSaleMethod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Customer Sale Method</FormLabel>
                                <FormControl>
                                    <Checkbox
                                        multiple
                                        containerClassName="flex flex-wrap gap-5"
                                        items={CUSTOMER_SALE_METHOD}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Write here."
                                        {...field}
                                        className="border-none ring-0 focus:ring-0 focus:ring-offset-0"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className="w-full bg-secondary" />
                    <FormField
                        name="document"
                        render={() => (
                            <FormItem>
                                <FormLabel>Choose Files</FormLabel>
                                <FormControl>
                                    <DocumentFileInput
                                        name="document"
                                        className="text-sm w-full md:w-1/2 lg:w-1/3"
                                        error={addCustomerForm.formState.errors.document?.message}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        maxSize={20 * 1024 * 1024}
                                        onFilesSelect={handleAddFiles}
                                        onFileRemove={handleRemoveFile}
                                        files={documentFiles}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="w-full items-center justify-end flex">
                        <Button
                            type="submit"
                            className="w-fit mt-4 px-8"
                            disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                        >
                            {createCustomerMutation.isPending || updateCustomerMutation.isPending
                                ? "Submitting..."
                                : "Submit"}
                        </Button>
                    </div>

                </form>
            </Form>

            {/* Image Viewer Dialog */}
            <div className="flex-1 overflow-auto">
                {selectedImage && (
                    <ImageViewer
                        imageUrl={selectedImage.buffer.startsWith("http") ? selectedImage.buffer : undefined}
                        imageBuffer={selectedImage.buffer.startsWith("http") ? undefined : selectedImage.buffer}
                        alt={selectedImage.name}
                        downloadFileName={selectedImage.name.split('.')[0]}
                        triggerOpen={viewerOpen}
                        setTriggerOpen={setViewerOpen}
                    />
                )}
            </div>

            <CustomerProductImg
                setOpen={setAddImageDialog}
                open={addImageDialog}
                onAddImage={handleAddGalleryImage}
            />
        </div>
    );
};

export default AddCustomer;