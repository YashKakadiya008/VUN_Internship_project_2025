"use client";

import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

const ZOOM_STEP = 0.5;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

interface ImageViewerProps {
    imageUrl?: string;
    imageBuffer?: string | Blob;
    alt?: string;
    triggerOpen: boolean;
    setTriggerOpen: (val: boolean) => void;
    downloadFileName?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
    imageUrl,
    imageBuffer,
    alt = "Preview",
    triggerOpen,
    setTriggerOpen,
    downloadFileName = "downloaded-image",
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setError(null);
        setIsLoading(true);
    }, [imageUrl, imageBuffer]);

    useEffect(() => {
        if (imageBuffer) {
            if (typeof imageBuffer === "string") {
                setBlobUrl(imageBuffer);
            } else {
                const tempUrl = URL.createObjectURL(imageBuffer);
                setBlobUrl(tempUrl);
                return () => {
                    URL.revokeObjectURL(tempUrl);
                };
            }
        } else {
            setBlobUrl(null);
        }
    }, [imageBuffer]);

    const handleDownload = async () => {
        try {
            if (blobUrl) {
                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = `${downloadFileName}.jpg`;
                document.body.appendChild(link);
                link.click();
                toast.success("Image downloaded successfully");
                setTimeout(() => {
                    document.body.removeChild(link);
                }, 100);
            } else if (imageUrl) {
                const response = await fetch(imageUrl);
                if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");

                let extension = "jpg";
                const contentType = response.headers.get("content-type");
                if (contentType) extension = contentType.split("/").pop() || "jpg";

                link.href = url;
                link.download = `${downloadFileName}.${extension}`;
                document.body.appendChild(link);
                link.click();
                toast.success("Image downloaded successfully");
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
            } else {
                throw new Error("No image available to download");
            }
        } catch (err) {
            setError(`Download failed : ${err}`);
        }
    };

    const zoomIn = () => setScale((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    const zoomOut = () => setScale((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
    const resetZoom = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newScale = Math.min(Math.max(scale + delta, MIN_ZOOM), MAX_ZOOM);
        if (newScale !== scale) setScale(newScale);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale <= 1) return;
        setIsDragging(true);
        setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
        document.body.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || scale <= 1) return;
        setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        document.body.style.cursor = "";
    };

    const handleImageLoad = () => {
        setIsLoading(false);
        setError(null);
    };

    const handleImageError = () => {
        setError("Failed to load image");
        setIsLoading(false);
    };

    const srcToUse = blobUrl || imageUrl || "";

    return (
        <Dialog open={triggerOpen} onOpenChange={setTriggerOpen}>
            <DialogContent className="sm:max-w-[80%] max-h-[90vh] flex flex-col">
                <DialogTitle>{downloadFileName}</DialogTitle>

                {imageBuffer && (
                    <div className="text-sm text-yellow-800 bg-yellow-100 border border-yellow-400 px-3 py-1 rounded-md mb-2">
                        This image is not saved in the system.
                    </div>
                )}

                <div className="flex-1 overflow-auto">
                    <div className="w-full h-[70vh] relative flex flex-col items-center gap-4">
                        <div
                            ref={containerRef}
                            className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden"
                            onWheel={handleWheel}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
                        >
                            {isLoading && !error && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-pulse text-gray-400">Loading image...</div>
                                </div>
                            )}
                            {error ? (
                                <div className="h-full flex items-center justify-center text-red-500">
                                    {error}
                                </div>
                            ) : (
                                srcToUse && (
                                    <div
                                        className="w-full h-full transform transition-transform duration-200"
                                        style={{
                                            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                                            transformOrigin: "center center",
                                        }}
                                    >
                                        <Image
                                            src={srcToUse}
                                            alt={alt}
                                            fill
                                            className="object-contain select-none pointer-events-none"
                                            onLoad={handleImageLoad}
                                            onError={handleImageError}
                                        />
                                    </div>
                                )
                            )}
                        </div>

                        <div className="flex gap-2 mt-4 h-8">
                            <Button
                                onClick={handleDownload}
                                disabled={!!error || isLoading}
                                variant="outline"
                                size="sm"
                                className="h-8 flex items-center gap-1"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </Button>

                            <div className="flex items-center gap-1 border rounded-md px-1 h-8">
                                <Button
                                    onClick={zoomOut}
                                    disabled={scale <= MIN_ZOOM}
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                >
                                    <ZoomOut className="h-4 w-4" />
                                </Button>

                                <Button
                                    onClick={resetZoom}
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>

                                <Button
                                    onClick={zoomIn}
                                    disabled={scale >= MAX_ZOOM}
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImageViewer;
