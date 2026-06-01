"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  content: z.string().min(2, "Note must be at least 2 characters"),
});

type FormData = z.infer<typeof schema>;

export interface NoteRecord {
  id: string;
  content: string;
  createdAt: Date;
}

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onAdded?: (note: NoteRecord) => void;
}

export function AddNoteDialog({ open, onOpenChange, projectId, onAdded }: AddNoteDialogProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const close = () => { reset(); onOpenChange(false); };

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data.content }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to add note");
        return;
      }

      const saved = await res.json();
      const record: NoteRecord = {
        id: saved.id,
        content: saved.content,
        createdAt: new Date(saved.createdAt),
      };

      onAdded?.(record);
      toast.success("Note added!");
      close();
    } catch {
      toast.error("Failed to add note");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Note *</Label>
            <Textarea
              {...register("content")}
              placeholder="Write an internal note about this project..."
              rows={5}
              autoFocus
            />
            {errors.content && <p className="text-red-500 text-xs">{errors.content.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Add Note</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
