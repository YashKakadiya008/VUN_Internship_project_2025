"use client";

import { Button } from "@/components/ui/button";
import { DocumentType } from "@/types";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import React from "react";

interface FileInputProps {
  name: string;
  label?: string;
  error?: string;
  className?: string;
  accept?: string;
  maxSize?: number; // in bytes
  onFilesSelect: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  files: (File | DocumentType)[];
}

const FileInput: React.FC<FileInputProps> = ({
  name,
  label,
  error,
  className,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxSize = 5 * 1024 * 1024,
  onFilesSelect,
  onFileRemove,
  files
}) => {

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles = selectedFiles.filter((file) => file.size <= maxSize);

    if (validFiles.length !== selectedFiles.length) {
      alert(`Some files exceeded the size limit of ${maxSize / (1024 * 1024)}MB`);
    }

    if (validFiles.length > 0) {
      onFilesSelect(validFiles);
    }

    // Clear input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={cn("", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <div className="relative h-fit mb-2">
        <input
          type="file"
          ref={fileInputRef}
          accept={accept}
          onChange={handleFileChange}
          className="hidden py-3"
          id={name}
          multiple
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="h-11 w-full bg-gray-50 border-none hover:bg-gray-100 text-black rounded-lg justify-start text-[12px]"
        >
          Select Documents
        </Button>
      </div>

      <div className="flex flex-col gap-1 h-auto overflow-y-auto">
        {files.map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-2 bg-gray-100 px-3 py-3 rounded-md cursor-pointer"
            onClick={() => {
              if (typeof file === "object" && "signedUrl" in file) {
                window.open(file.signedUrl as string, "_blank");
              }
            }}
          >
            <span className="truncate text-sm max-w-[200px]">{file.name}</span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileRemove(index);
              }}
              className="p-1 hover:bg-accent rounded-lg text-red-600 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default FileInput;
