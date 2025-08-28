"use client"

import { getAllSuppliersIdAndName } from '@/api/order';
import { createProduct, getProductById, updateProduct } from '@/api/product';
import CustomerProductImg from '@/components/customer/CustomerProductImg';
import ImageViewer from '@/components/customer/ImageViewer';
import DropdownSelect from '@/components/supplier/DropdownSelect';
import MultipleSelect from '@/components/supplier/MultipleSelect';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Loader from '@/components/ui/loader';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { COLOR, SIZE, SUB_METALIC_COLOR, SUB_TONE_TO_TONE_COLOR, TYPE } from '@/lib/customerConstant';
import { CreateProductRequestType, UpdateProductRequestType } from '@/lib/product/type';
import { JARI_BASE } from '@/lib/productConstant';
import { MAIN_CATEGORY, PRODUCTS_PATTERN } from '@/lib/supplierConstant';
import { AddProductField, addProductSchema, ProductData, ProductImage } from '@/types/product';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

const LoadingState = () => (
    <div className="flex justify-center items-center h-64">
        <Loader />
    </div>
);

const ProductForm = () => {
    return (
        <Suspense fallback={<LoadingState />}>
            <ProductFormContent />
        </Suspense>
    );
};

const ProductFormContent: React.FC = () => {
    const { id } = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const isEditing = id !== "new";
    const addProductForm = useForm<AddProductField>({
        defaultValues: {
            supplierId: "",
            product: "",
            vnuProductName: "",
            moq: "",
            purchaseRate: "",
            salesRate: "",
            productPattern: [],
            mainCategory: [],
            type: "",
            color: "",
            subMetalicColor: "",
            subToneColor: "",
            size: "",
            jariBase: [],
        },
        resolver: zodResolver(addProductSchema),
        mode: 'onSubmit',
    });

    const [galleryImages, setGalleryImages] = useState<
        { file: File; buffer: string; note?: string }[]
    >([]);
    const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
    const [addImageDialog, setAddImageDialog] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{ url?: string; name: string; buffer?: string } | null>(null);

    const { data: productData, isLoading, isError } = useQuery<ProductData>({
        queryKey: ['product', id],
        queryFn: () => getProductById(id as string),
        enabled: isEditing && !!id,
        retry: 1,
    });

    const createProductMutation = useMutation({
        mutationFn: (data: CreateProductRequestType) => createProduct(data),
        onSuccess: () => {
            toast.success('Product created successfully!');
            queryClient.invalidateQueries({ queryKey: ['products'] });
            router.push('/dashboard/product-department');
        },
        onError: (error: Error) => {
            toast.error(error?.message || 'Failed to create product');
            console.error('Create product error:', error);
        },
    });

    const updateProductMutation = useMutation({
        mutationFn: (data: UpdateProductRequestType) => updateProduct(id as string, data),
        onSuccess: () => {
            toast.success('Product updated successfully!');
            queryClient.invalidateQueries({ queryKey: ['product', id] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            router.push('/dashboard/product-department');
        },
        onError: (error: Error) => {
            toast.error(error?.message || 'Failed to update product');
            console.error('Update product error:', error);
        },
    });

    const { data: suppliers = [] } = useQuery({
        queryKey: ["suppliers"],
        queryFn: getAllSuppliersIdAndName

    });

    const supplierOptions = suppliers.map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
    }));

    const handleAddGalleryImage = (image: { file: File; buffer: string; note?: string }) => {
        setGalleryImages((prev) => [...prev, image]);
    };

    const handleRemoveGalleryImage = (index: number) => {
        const updated = [...galleryImages];
        updated.splice(index, 1);
        setGalleryImages(updated);
    };

    const handleRemoveExistingImage = (index: number) => {
        const updated = [...existingImages];
        updated.splice(index, 1);
        setExistingImages(updated);
    };

    useEffect(() => {
        if (isEditing && productData) {
            addProductForm.reset({
                supplierId: productData.supplierId,
                product: productData.productName || "",
                vnuProductName: productData.vnuProductName || "",
                moq: productData.moq || "",
                purchaseRate: productData.purchaseRate || "",
                salesRate: productData.salesRate || "",
                productPattern: productData.productPattern || [],
                mainCategory: productData.mainCategory || [],
                type: productData.type || "",
                color: productData.color || "",
                subMetalicColor: productData.subMetallicColor || "",
                subToneColor: productData.subToneColor || "",
                size: productData.size || "",
                jariBase: productData.jariBase || [],
            });


            if (productData.images) {
                setExistingImages(productData.images.map(img => ({
                    public_id: img.public_id,
                    name: img.name,
                    signedUrl: img.signedUrl
                })));
            }
        }
    }, [productData, isEditing, addProductForm]);

    const onSubmit = async (formData: AddProductField) => {
        if (isEditing) {
            const updateData: UpdateProductRequestType = {
                productId: id as string,
                productName: formData.product,
                supplierId: formData.supplierId,
                vnuProductName: formData.vnuProductName || "",
                moq: formData.moq,
                purchaseRate: formData.purchaseRate || "",
                salesRate: formData.salesRate || "",
                productPattern: formData.productPattern || [],
                mainCategory: formData.mainCategory || [],
                type: formData.type || "",
                color: formData.color || "",
                subToneColor: formData.subToneColor || "",
                subMetallicColor: formData.subMetalicColor || "",
                size: formData.size || "",
                jariBase: formData.jariBase || [],
                existingImages: existingImages.map(img => img.public_id),
                'newImages[]': galleryImages.map(img => img.file)
            }
            await updateProductMutation.mutateAsync(updateData);
        } else {
            const createData: CreateProductRequestType = {
                productName: formData.product,
                supplierId: formData.supplierId,
                vnuProductName: formData.vnuProductName || "",
                moq: formData.moq,
                purchaseRate: formData.purchaseRate || "",
                salesRate: formData.salesRate || "",
                productPattern: formData.productPattern || [],
                mainCategory: formData.mainCategory || [],
                type: formData.type || "",
                color: formData.color || "",
                subToneColor: formData.subToneColor || "",
                subMetallicColor: formData.subMetalicColor || "",
                size: formData.size || "",
                jariBase: formData.jariBase || [],
                'images[]': galleryImages.map(img => img.file)
            };
            try {
                await createProductMutation.mutateAsync(createData);
            } catch (error) {
                console.error("Create product API error:", error);
                toast.error('Failed to create product');
                throw error;
            }
        }
    };

    if (isEditing && isLoading) {
        return (
            <div className="flex justify-center items-center h-[70vh] w-full">
                <Loader />
            </div>
        );
    }

    if (isError) {
        return <div>Please try again</div>
    }

    const isSubmitting = createProductMutation.isPending || updateProductMutation.isPending;

    return (
        <div className="flex flex-col gap-6 w-full h-full">
            <div className="flex items-center gap-4">
                <ArrowLeft
                    size={16}
                    className="w-6 h-6 hover:bg-gray-100 cursor-pointer rounded-sm"
                    onClick={() => router.back()}
                />
                <h1 className="text-2xl font-semibold">{isEditing ? "Edit" : "Add"} Product</h1>
            </div>

            <Form {...addProductForm}>
                <form className="flex flex-col gap-6" onSubmit={addProductForm.handleSubmit(onSubmit)}>
                    <div className="flex flex-col md:flex-row w-full gap-6">
                        {/* VNU Product Name */}
                        <div className="w-full md:w-1/3">
                            <FormField
                                name="vnuProductName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>VUN Product Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder="Enter VUN Product Name"
                                                disabled={isSubmitting}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="w-full md:w-1/3">
                            <FormField
                                name="product"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                className='bg-warning'
                                                placeholder="Enter Product Name"
                                                disabled={isSubmitting}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="w-full md:w-1/3">
                            <FormField
                                name="moq"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>MOQ</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                placeholder="e.g, 30 pieces"
                                                disabled={isSubmitting}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <hr className='w-full bg-secondary' />

                    {/* Second Row: MOQ and Product Pattern */}
                    <div className="flex flex-col md:flex-row w-full gap-6">
                        {/* Supplier */}
                        <div className="w-full md:w-1/4">
                            <FormField
                                control={addProductForm.control}
                                name="supplierId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Supplier</FormLabel>
                                        <FormControl className='mt-2'>
                                            <DropdownSelect
                                                list={supplierOptions}
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Product Pattern */}
                        <div className="w-full md:w-1/4">
                            <FormField
                                name="productPattern"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="items-start">Product Pattern</FormLabel>
                                        <div></div>
                                        <FormControl>
                                            <MultipleSelect
                                                list={PRODUCTS_PATTERN}
                                                value={field.value}
                                                onChange={field.onChange}
                                                className='w-full p-1'
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Purchase Rate */}
                        <div className="w-full md:w-1/4">
                            <FormField
                                name="purchaseRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Purchase Rate</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Enter purchase rate"
                                                disabled={isSubmitting}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Sales Rate */}
                        <div className="w-full md:w-1/4">
                            <FormField
                                name="salesRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sales Rate</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Enter sales rate"
                                                disabled={isSubmitting}
                                                {...field}
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
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <hr className='w-full bg-secondary' />
                    <FormField
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Type</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex flex-wrap gap-6 cursor-pointer"
                                        disabled={isSubmitting}
                                    >
                                        {TYPE.map((item) => (
                                            <FormItem key={item.id} className="flex items-center gap-3">
                                                <FormControl>
                                                    <RadioGroupItem value={item.label} disabled={isSubmitting} />
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

                    <hr className='w-full bg-secondary' />
                    <FormField
                        name="color"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Color</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex flex-wrap gap-6 cursor-pointer"
                                        disabled={isSubmitting}
                                    >
                                        {COLOR.map((item) => (
                                            <FormItem key={item.id} className="flex items-center gap-3">
                                                <FormControl>
                                                    <RadioGroupItem value={item.label} disabled={isSubmitting} />
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

                    <hr className='w-full bg-secondary' />
                    <FormField
                        name="subMetalicColor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Sub Metalic Color</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex flex-wrap gap-6 cursor-pointer"
                                        disabled={isSubmitting}
                                    >
                                        {SUB_METALIC_COLOR.map((item) => (
                                            <FormItem key={item.id} className="flex items-center gap-3">
                                                <FormControl>
                                                    <RadioGroupItem value={item.label} disabled={isSubmitting} />
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

                    <hr className='w-full bg-secondary' />
                    <FormField
                        name="subToneColor"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Sub Tone Color</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex flex-wrap gap-6 cursor-pointer"
                                        disabled={isSubmitting}
                                    >
                                        {SUB_TONE_TO_TONE_COLOR.map((item) => (
                                            <FormItem key={item.id} className="flex items-center gap-3">
                                                <FormControl>
                                                    <RadioGroupItem value={item.label} disabled={isSubmitting} />
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

                    <hr className='w-full bg-secondary' />
                    <FormField
                        name="size"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Size</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex flex-wrap gap-6 cursor-pointer"
                                        disabled={isSubmitting}
                                    >
                                        {SIZE.map((item) => (
                                            <FormItem key={item.id} className="flex items-center gap-3">
                                                <FormControl>
                                                    <RadioGroupItem value={item.label} disabled={isSubmitting} />
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
                                        disabled={isSubmitting}
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
                                            onClick={() => !isSubmitting && setAddImageDialog(true)}
                                        >
                                            <ImagePlus className="h-8 text-gray-400 w-8" />
                                            <span className="text-xs mt-1 text-gray-400">
                                                Add Image
                                            </span>
                                        </div>

                                        {/* Existing images */}
                                        {existingImages.map((img, idx) => (
                                            <div key={`existing-${idx}`} className="relative flex flex-col justify-between items-center w-fit gap-2">
                                                <div className='absolute top-0 right-0 bg-black/30 rounded-sm z-10'>
                                                    <X
                                                        className="h-5 w-5 text-white cursor-pointer"
                                                        onClick={() => !isSubmitting && handleRemoveExistingImage(idx)}
                                                    />
                                                </div>
                                                <div
                                                    className="cursor-pointer w-32 h-32 relative"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImage({ url: img.signedUrl, name: img.name });
                                                        setViewerOpen(true);
                                                    }}
                                                >
                                                    <Image
                                                        fill
                                                        src={img.signedUrl}
                                                        alt={img.name}
                                                        className="object-cover rounded"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-600">{img.name}</p>
                                            </div>
                                        ))}

                                        {/* New gallery images */}
                                        {galleryImages.map((img, idx) => (
                                            <div
                                                key={`new-${idx}`}
                                                className="relative flex flex-col justify-between items-center w-fit gap-2 group"
                                            >
                                                <div className='absolute top-0 right-0 bg-black/30 rounded-sm z-10'>
                                                    <X
                                                        className="h-5 w-5 text-white cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!isSubmitting) {
                                                                handleRemoveGalleryImage(idx);
                                                            }
                                                        }}

                                                    />
                                                </div>
                                                <div
                                                    className="cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedImage({
                                                            buffer: img.buffer,
                                                            name: img.note || `new-image-${idx}`
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
                                            </div>
                                        ))}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className='w-full items-center justify-end flex'>
                        <Button
                            type="submit"
                            className="w-fit mt-4 px-8"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    </div>
                </form>
            </Form>

            {/* Image Viewer Dialog */}
            <div className="flex-1 overflow-auto">
                {selectedImage && (
                    <ImageViewer
                        imageUrl={selectedImage.url}
                        imageBuffer={selectedImage.buffer}
                        alt={selectedImage.name}
                        downloadFileName={selectedImage.name.split('.')[0]}
                        triggerOpen={viewerOpen}
                        setTriggerOpen={setViewerOpen}
                    />
                )}
            </div>

            <CustomerProductImg
                note={false}
                setOpen={setAddImageDialog}
                open={addImageDialog}
                onAddImage={handleAddGalleryImage} />
        </div>
    );
};

export default ProductForm;