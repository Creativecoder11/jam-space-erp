"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export type EditableClient = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
};

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: EditableClient | null;
  onUpdated?: (client: EditableClient) => void;
}

export function EditClientDialog({ open, onOpenChange, client, onUpdated }: EditClientDialogProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        phone: client.phone,
        email: client.email ?? "",
        company: client.company ?? "",
        address: client.address ?? "",
        notes: client.notes ?? "",
      });
    }
  }, [client, reset]);

  const onSubmit = async (data: FormData) => {
    if (!client) return;
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to update client");
        return;
      }
      const saved = await res.json();
      toast.success("Client updated successfully!");
      onUpdated?.(saved);
      onOpenChange(false);
    } catch {
      toast.error("Failed to update client");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Full Name / Company Name *</Label>
              <Input {...register("name")} placeholder="Mr. John Doe" />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input {...register("phone")} placeholder="017-XXXX-XXXX" />
              {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input {...register("email")} type="email" placeholder="client@email.com" />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Company</Label>
              <Input {...register("company")} placeholder="Company name (optional)" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input {...register("address")} placeholder="Full address" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea {...register("notes")} placeholder="Additional notes..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
