"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  projectId: z.string().min(1, "Project is required"),
  amount: z.string().min(1, "Amount is required").refine(v => parseFloat(v) > 0, "Amount must be positive"),
  paymentType: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_BANKING", "CHEQUE"]),
  paymentDate: z.string().min(1, "Date is required"),
  stage: z.string().optional(),
  referenceNo: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export interface PaymentRecord {
  id: string;
  amount: number;
  paymentType: string;
  paymentDate: Date;
  description?: string;
  referenceNo?: string;
  stage?: string;
  notes?: string;
}

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projectName?: string;
  onAdded?: (payment: PaymentRecord) => void;
}

const PAYMENT_TYPES = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_BANKING", label: "Mobile Banking" },
  { value: "CHEQUE", label: "Cheque" },
];

export function AddPaymentDialog({ open, onOpenChange, projectId, projectName, onAdded }: AddPaymentDialogProps) {
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { projectId: projectId ?? "" },
  });

  useEffect(() => {
    if (projectId) setValue("projectId", projectId);
  }, [projectId, setValue]);

  const close = () => { reset({ projectId: projectId ?? "" }); onOpenChange(false); };

  const onSubmit = async (data: FormData) => {
    const amount = parseFloat(data.amount);
    const paymentDate = new Date(data.paymentDate);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, amount, paymentDate: paymentDate.toISOString() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to record payment");
        return;
      }

      const saved = await res.json();
      const record: PaymentRecord = {
        id: saved.id,
        amount: Number(saved.amount),
        paymentType: saved.paymentType,
        paymentDate: new Date(saved.paymentDate),
        description: saved.description ?? "",
        referenceNo: saved.referenceNo ?? "",
        stage: saved.stage ?? "",
        notes: saved.notes ?? "",
      };

      onAdded?.(record);
      toast.success("Payment recorded!");
      close();
    } catch {
      toast.error("Failed to record payment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment{projectName ? ` — ${projectName}` : ""}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Amount (BDT) *</Label>
              <Input {...register("amount")} type="number" step="0.01" placeholder="0.00" autoFocus />
              {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Payment Date *</Label>
              <Input {...register("paymentDate")} type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              {errors.paymentDate && <p className="text-red-500 text-xs">{errors.paymentDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Payment Type *</Label>
              <Select onValueChange={(v) => setValue("paymentType", v as FormData["paymentType"])}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.paymentType && <p className="text-red-500 text-xs">{errors.paymentType.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Input {...register("stage")} placeholder="e.g. Advance, Installment 1" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Reference Number</Label>
              <Input {...register("referenceNo")} placeholder="TXN/CHQ/BKSH reference..." />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Input {...register("description")} placeholder="Payment description..." />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea {...register("notes")} placeholder="Additional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Record Payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
