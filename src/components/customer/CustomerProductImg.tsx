"use client";

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
import { AddImageField, addImageSchema, CustomerOrder } from "@/types/customer";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus } from "lucide-react";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";

interface AddCustomerOrderProps {
    data?: CustomerOrder;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onAddImage: (data: { file: File; buffer: string; note?: string }) => void;
    note?: boolean;
}

const AddOrder: React.FC<AddCustomerOrderProps> = ({
    data,
    open,
    setOpen,
    onAddImage,
    note = true,
}) => {

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageFileBuffer, setImageFileBuffer] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addImageForm = useForm<AddImageField>({
        defaultValues: {
            note: "",
        },
        resolver: zodResolver(addImageSchema),
    });

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setImageFileBuffer(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        setImageFile(file)
    };

    const onSubmit = async (data: AddImageField) => {
        if (imageFile && imageFileBuffer) {
            onAddImage({
                file: imageFile,
                buffer: imageFileBuffer,
                note: data.note,
            });
        }
        setOpen(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={setOpen}
        >
            <DialogContent className="sm:max-w-xl min-w-[300px] p-6">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-medium">
                        {data ? "Edit" : "Add"} Image
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[calc(100vh-220px)] overflow-y-scroll px-1 py-1">
                    <Form {...addImageForm}>
                        <form className="flex flex-col gap-4" onSubmit={addImageForm.handleSubmit(onSubmit)}>
                            <div className="flex flex-col justify-center gap-2">
                                <p className="text-primary">Image</p>
                                <label
                                    htmlFor="image-upload"
                                    className="h-45 w-full rounded-lg bg-gray-100 border-gray-300 cursor-pointer group relative flex items-center justify-center"
                                >
                                    {imageFile || data?.avatar ? (
                                        <>
                                            <div
                                                className="bg-cover bg-center bg-no-repeat h-full w-full rounded-lg"
                                                style={{
                                                    backgroundImage: `url(${imageFileBuffer || data?.avatar})`,
                                                }}
                                            />
                                            <div className="flex bg-black/50 justify-center rounded-lg absolute duration-200 group-hover:opacity-80 inset-0 items-center opacity-0 transition-opacity">
                                                <ImagePlus className="h-5 text-white w-5" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex bg-gray-100 flex-col h-full justify-center rounded-full w-full items-center">
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
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>

                            <div className="flex flex-col md:flex-row w-full gap-4">
                                <div className="w-full">
                                    {note && (
                                        <FormField
                                            control={addImageForm.control}
                                            name="note"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Note</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter here"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                </div>
                            </div>
                            <DialogFooter className="">
                                <div className="w-full flex items-center justify-end">
                                    <Button
                                        type="submit"
                                        className="bg-primary text-sm"
                                        disabled={addImageForm.formState.isSubmitting}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddOrder;
