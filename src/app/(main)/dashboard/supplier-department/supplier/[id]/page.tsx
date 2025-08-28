"use client"

import { createSupplier, getoneSupplier, updateSupplier } from '@/api/suppiler';
import CustomerProductImg from '@/components/customer/CustomerProductImg';
import DocumentFileInput from "@/components/customer/FileInput";
import ImageViewer from '@/components/customer/ImageViewer';
import MultipleSelect from '@/components/supplier/MultipleSelect';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { STATES } from '@/lib/constants';
import { SUPPLIER_WORK_TYPE, TYPE } from '@/lib/customerConstant';
import { JARI_BASE } from '@/lib/productConstant';
import { CreateSupplierRequestType, SupplierUpdateData } from '@/lib/supplier/type';
import { CORDING_BASE, MAIN_CATEGORY, PRODUCTION_CAPACITY, PRODUCTS_PATTERN, STOCK, SUPPLIER_MACHINE_TYPE } from '@/lib/supplierConstant';
import { DocumentType } from '@/types';
import { AddSupplierField, addSupplierSchema } from '@/types/supplier';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

// Type for gallery images
type GalleryImage = {
    file?: File;
    buffer?: string;
    note?: string;
    id?: string;
    signedUrl?: string;
    name?: string;
}


const AddSupplier: React.FC = () => {
    const { id } = useParams();
    const isEditing = id !== "new";
    const router = useRouter();
    const queryClient = useQueryClient();

    const addSupplierForm = useForm<AddSupplierField>({
        defaultValues: {
            companyName: "",
            supplierName: "",
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
            workType: "",
            productPattern: [],
            supplierMachineType: [],
            mainCategory: [],
            jariBase: [],
            cordingBase: [],
            type: [],
            stock: [],
            productionCapacity: [],
            document: [],
            notes: "",
        },
        resolver: zodResolver(addSupplierSchema),
        mode: 'onSubmit',
    });

    const [documentFiles, setDocumentFiles] = useState<(File | DocumentType)[]>([]);
    const [existingFileIds, setExistingFileIds] = useState<string[]>([]);
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [existingImageIds, setExistingImageIds] = useState<string[]>([]);
    const [addImageDialog, setAddImageDialog] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ buffer?: string, name: string; signedUrl?: string } | null>(null);

    const handleAddFiles = (files: File[]) => {
        setDocumentFiles((prev) => [...prev, ...files]);
    };

    const handleRemoveFile = (index: number) => {
        const updated = [...documentFiles];
        const removedFile = updated[index];
        updated.splice(index, 1);
        setDocumentFiles(updated);
        addSupplierForm.setValue("document", updated.length > 0 ? updated : undefined);

        // If the removed file was an existing one, remove its ID from existingFileIds
        if ('id' in removedFile && removedFile.id) {
            setExistingFileIds(prev => prev.filter(id => id !== removedFile.id));
        }
    };

    const handleAddGalleryImage = (image: { file: File; buffer: string; note?: string }) => {
        setGalleryImages((prev) => [...prev, image]);
    };

    const handleRemoveGallery = (index: number) => {
        const updated = [...galleryImages];
        const removedImage = updated[index];
        updated.splice(index, 1);
        setGalleryImages(updated);

        // If the removed image was an existing one, remove its ID from existingImageIds
        if (removedImage.id) {
            setExistingImageIds(prev => prev.filter(id => id !== removedImage.id));
        }
    };

    // Fetch supplier data when editing
    useEffect(() => {
        if (isEditing) {
            const fetchSupplier = async () => {
                try {
                    const supplier = await getoneSupplier(id as string);
                    addSupplierForm.reset({
                        companyName: supplier.companyName || "",
                        supplierName: supplier.supplierName || "",
                        mobileNo: supplier.mobileNo || "",
                        gstNo: supplier.gstNo || "",
                        floor: supplier.address?.floor || "",
                        plotNo: supplier.address?.plotNo || "",
                        societyName: supplier.address?.societyName || "",
                        lane: supplier.address?.lane || "",
                        address: supplier.address?.address || "",
                        area: supplier.address?.area || "",
                        city: supplier.address?.city || "",
                        state: supplier.address?.state || "",
                        pincode: supplier.address?.pincode || "",
                        locationLink: supplier.address?.locationLink || "",
                        workType: supplier.workType?.[0] || "",
                        productPattern: supplier.productPattern || [],
                        supplierMachineType: supplier.supplierMachineType || [],
                        mainCategory: supplier.mainCategory || [],
                        jariBase: supplier.jariBase || [],
                        cordingBase: supplier.cordingBase || [],
                        type: supplier.type || [],
                        stock: supplier.stock || [],
                        productionCapacity: supplier.productionCapacity || [],
                        notes: supplier.notes || "",
                    });

                    // Set existing files
                    if (supplier.files) {
                        setDocumentFiles(supplier.files.map(file => ({ ...file, singedUrl: file.signedUrl, note: file.note ?? undefined })));
                        setExistingFileIds(supplier.files.map(file => file.id));
                    }

                    // Set existing images
                    if (supplier.images) {
                        setGalleryImages(supplier.images.map(img => ({
                            id: img.id,
                            signedUrl: img.signedUrl,
                            note: img.note ?? "",
                            name: img.name
                        })));
                        setExistingImageIds(supplier.images.map(img => img.id));
                    }
                } catch (error) {
                    toast.error('Failed to fetch supplier data');
                    console.error('Fetch supplier error:', error);
                }
            };
            fetchSupplier();
        }
    }, [id, addSupplierForm, isEditing]);

    // Mutations
    const createSupplierMutation = useMutation({
        mutationFn: (data: CreateSupplierRequestType) => createSupplier(data),
        onSuccess: () => {
            toast.success('Supplier created successfully!');
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            router.push('/dashboard/supplier-department/supplier');
        },
        onError: (error) => {
            toast.error(error?.message || 'Failed to create supplier');
            console.error('Create supplier error:', error);
        },
    });

    const updateSupplierMutation = useMutation({
        mutationFn: (data: SupplierUpdateData) => updateSupplier(id as string, data),
        onSuccess: () => {
            toast.success('Supplier updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            router.push('/dashboard/supplier-department/supplier');
        },
        onError: (error) => {
            toast.error(error?.message || 'Failed to update supplier');
            console.error('Update supplier error:', error);
        },
    });

    // get-supplier

    const onSubmit = (data: AddSupplierField) => {        // Prepare file related data for both scenarios
        const fileData = {
            'images[]': galleryImages.filter(img => img.file).map(img => img.file as File),
            imageNotes: galleryImages.map(img => img.note || ""),
            'files[]': documentFiles.filter(file => file instanceof File) as File[],
            fileNotes: documentFiles.map(file => 'note' in file ? file.note || '' : '')
        };        // Execute appropriate mutation
        if (isEditing) {
            // For update, workType needs to be a string
            const updateData: SupplierUpdateData = {
                ...data,
                ...fileData,
                workType: data.workType,
                existingImages: existingImageIds,
                existingFiles: existingFileIds,
            };
            updateSupplierMutation.mutate(updateData);
        } else {
            // For create, the Zod schema will transform workType to string[]
            const createData = {
                ...data,
                ...fileData,
                // The form has string, API expects a comma-separated string that will be transformed to string[]
                workType: data.workType
            };
            createSupplierMutation.mutate(createData as unknown as CreateSupplierRequestType);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full h-full">
            <div className="flex items-center gap-4">
                <ArrowLeft
                    size={16}
                    className="w-6 h-6 hover:bg-gray-100 cursor-pointer rounded-sm"
                    onClick={() => router.push('/dashboard/supplier-department/supplier')}
                />
                <h1 className="text-2xl font-semibold">{isEditing ? "Edit" : "Add"} Supplier</h1>
            </div>

            <Form {...addSupplierForm}>
                <form className="flex flex-col gap-6" onSubmit={addSupplierForm.handleSubmit(onSubmit)}>
                    <div className="flex flex-col md:flex-row w-full gap-6">
                        <div className="w-full">
                            <FormField
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                className='bg-warning'
                                                placeholder="Enter Company Name"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="w-full">
                            <FormField
                                name="supplierName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Supplier Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter Supplier Name"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row w-full gap-4">
                        <div className="w-full">
                            <FormField
                                name="mobileNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mobile No</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter Mobile Number"
                                                {...field}
                                            />
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
                                            <Input
                                                placeholder="Enter GST Number"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row w-full gap-4">
                        <div className="w-full">
                            <FormField
                                name="floor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Floor</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g, 3rd floor"
                                                {...field}
                                            />
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
                                            <Input
                                                placeholder="e.g, 23-B"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row w-full gap-4">
                        <div className="w-full">
                            <FormField
                                name="societyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Society Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter Society Name"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="w-full">
                            <FormField
                                name="lane"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Lane</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter lane"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col w-full gap-4">
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

                        <FormField
                            name="area"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Area</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter area"
                                            {...field}
                                            className="border-none ring-0 focus:ring-0 focus:ring-offset-0"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex flex-col md:flex-row w-full gap-4">
                        <div className="w-full">
                            <FormField
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter city name"
                                                {...field}
                                            />
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
                                                        <SelectItem
                                                            key={state.id}
                                                            value={state.name}
                                                        >
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

                    <div className="flex flex-col md:flex-row w-full gap-4">
                        <div className="w-full">
                            <FormField
                                name="pincode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pincode</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter pincode"
                                                {...field}
                                            />
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
                                            <Input
                                                placeholder="https://maps.google.com/..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row w-full gap-4">
                        <div className="w-full">
                            <FormField
                                name="workType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base">Work Type</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className="w-full ring-0">
                                                    <SelectValue placeholder="Select work type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {SUPPLIER_WORK_TYPE.map((item) => (
                                                        <SelectItem
                                                            className="cursor-pointer"
                                                            key={item.id}
                                                            value={item.label}
                                                        >
                                                            {item.label}
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
                                name="productPattern"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base">Product Pattern</FormLabel>
                                        <FormControl>
                                            <MultipleSelect
                                                list={PRODUCTS_PATTERN}
                                                value={field.value}
                                                onChange={field.onChange}
                                                className='w-70 lg:w-140 p-1'
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <hr className='w-full bg-secondary' />
                    <div className='flex flex-wrap w-full'>
                        <FormField
                            name="supplierMachineType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base">Supplier Machine Type</FormLabel>
                                    <FormControl>
                                        <Checkbox
                                            multiple
                                            containerClassName='flex flex-wrap gap-5'
                                            items={SUPPLIER_MACHINE_TYPE}
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <hr className='w-full bg-secondary' />
                    <FormField
                        name="mainCategory"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Main Category</FormLabel>
                                <FormControl>
                                    <Checkbox
                                        multiple
                                        containerClassName='flex flex-wrap gap-5'
                                        items={MAIN_CATEGORY}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className='w-full bg-secondary' />
                    <FormField
                        name="jariBase"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Jari Base</FormLabel>
                                <FormControl>
                                    <Checkbox
                                        multiple
                                        containerClassName='flex flex-wrap gap-5'
                                        items={JARI_BASE}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className='w-full bg-secondary' />
                    <FormField
                        name="cordingBase"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Cording Base</FormLabel>
                                <FormControl>
                                    <Checkbox
                                        multiple
                                        containerClassName='flex flex-wrap gap-5'
                                        items={CORDING_BASE}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className='w-full bg-secondary' />
                    <FormField
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Type</FormLabel>
                                <FormControl>
                                    <Checkbox
                                        multiple
                                        containerClassName='flex flex-wrap gap-5'
                                        items={TYPE}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className='w-full bg-secondary' />
                    <FormField
                        name="stock"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Stock</FormLabel>
                                <FormControl>
                                    <Checkbox
                                        multiple
                                        containerClassName='flex flex-wrap gap-5'
                                        items={STOCK}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className='w-full bg-secondary' />
                    <FormField
                        name="productionCapacity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Production Capacity</FormLabel>
                                <FormControl>
                                    <Checkbox
                                        multiple
                                        containerClassName='flex flex-wrap gap-5'
                                        items={PRODUCTION_CAPACITY}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className='w-full bg-secondary' />
                    <FormField
                        name="customerProductGallery"
                        render={() => (
                            <FormItem>
                                <FormLabel className="text-base">Customer Product Gallery</FormLabel>
                                <FormControl>
                                    <div className='flex flex-wrap gap-3'>
                                        <div
                                            className="flex h-40 w-40 cursor-pointer bg-gray-100 flex-col justify-center rounded-sm items-center"
                                            onClick={() => setAddImageDialog(true)}
                                        >
                                            <ImagePlus className="h-8 text-gray-400 w-8" />
                                            <span className="text-xs mt-1 text-gray-400">
                                                Add Image
                                            </span>
                                        </div>

                                        {galleryImages.map((img, idx) => (
                                            <div key={idx} className="relative flex flex-col justify-between items-center w-fit gap-2">
                                                <div className='absolute top-0 right-0 bg-black/30 rounded-sm z-10'>
                                                    <X
                                                        className="h-5 w-5 text-white cursor-pointer"
                                                        onClick={() => handleRemoveGallery(idx)}
                                                    />
                                                </div>
                                                {img.buffer && (
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
                                                        <p className="text-xs text-gray-600">{img.note || "No note"}</p>
                                                    </div>
                                                )}
                                                {img.signedUrl && (
                                                    <div
                                                        className="cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedImage({
                                                                signedUrl: img.signedUrl,
                                                                name: img.file?.name || `new-image-${idx}`
                                                            });
                                                            setViewerOpen(true);
                                                        }}
                                                    >
                                                        <Image
                                                            height={200}
                                                            width={200}
                                                            src={img.signedUrl}
                                                            alt={img.note || `upload-${idx}`}
                                                            className="w-32 h-32 object-cover rounded"
                                                        />
                                                        <p className="text-xs text-gray-600">{img.note || "No note"}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <hr className='w-full bg-secondary' />
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

                    <hr className='w-full bg-secondary' />
                    <FormField
                        name="document"
                        render={() => (
                            <FormItem>
                                <FormLabel>Choose Files</FormLabel>
                                <FormControl>
                                    <DocumentFileInput
                                        name="document"
                                        className="text-sm w-full md:w-1/2 lg:w-1/3"
                                        error={addSupplierForm.formState.errors.document?.message}
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
                    <div className='w-full items-center justify-end flex'>
                        <Button
                            type="submit"
                            className="w-fit mt-4 px-8"
                            disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                        >
                            {createSupplierMutation.isPending && !isEditing && 'Submitting...'}
                            {updateSupplierMutation.isPending && isEditing && 'Updating...'}
                            {!createSupplierMutation.isPending && !updateSupplierMutation.isPending && (isEditing ? 'Update' : 'Submit')}
                        </Button>

                    </div>
                </form>
            </Form>

            {/* Image Viewer Dialog */}
            <div className="flex-1 overflow-auto">
                {selectedImage && (
                    <ImageViewer
                        imageUrl={selectedImage.signedUrl}
                        imageBuffer={selectedImage.buffer}
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
}

export default AddSupplier;