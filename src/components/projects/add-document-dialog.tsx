"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Upload, FileText, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().min(1, "Document name is required"),
  fileUrl: z.string().min(1, "Please select a file"),
  fileType: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export interface DocumentRecord {
  id: string;
  name: string;
  fileUrl: string;
  fileType?: string;
  description?: string;
  uploadedAt: Date;
}

interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onAdded?: (doc: DocumentRecord) => void;
}

export function AddDocumentDialog({ open, onOpenChange, projectId, onAdded }: AddDocumentDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setValue("name", file.name.replace(/\.[^/.]+$/, ""));
    setValue("fileType", file.type || (file.name.split(".").pop() ?? ""));
    setValue("fileUrl", URL.createObjectURL(file));
  };

  const clearFile = () => {
    setFileName("");
    setValue("fileUrl", "");
    if (fileRef.current) fileRef.current.value = "";
  };

  const close = () => { reset(); setFileName(""); onOpenChange(false); };

  const onSubmit = async (data: FormData) => {
    const record: DocumentRecord = {
      id: crypto.randomUUID(),
      name: data.name,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      description: data.description,
      uploadedAt: new Date(),
    };

    // Optimistic update
    onAdded?.(record);
    toast.success("Document saved!");
    close();

    // Persist in background
    try {
      await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // UI already updated
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>File *</Label>
            {fileName ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/40 text-sm">
                <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="flex-1 truncate">{fileName}</span>
                <button type="button" onClick={clearFile} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm font-medium">Click to select a file</span>
                <span className="text-xs">PDF, Word, Excel, Images, ZIP</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
            />
            {errors.fileUrl && <p className="text-red-500 text-xs">{errors.fileUrl.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Document Name *</Label>
            <Input {...register("name")} placeholder="e.g. Floor Plan - Level 1" />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input {...register("description")} placeholder="Optional description..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Upload</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
