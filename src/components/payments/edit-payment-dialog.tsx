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
import type { PaymentRecord } from "./add-payment-dialog";

const schema = z.object({
  amount: z.string().min(1).refine(v => parseFloat(v) > 0, "Must be positive"),
  paymentType: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_BANKING", "CHEQUE"]),
  paymentDate: z.string().min(1, "Date is required"),
  stage: z.string().optional(),
  referenceNo: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PAYMENT_TYPES = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_BANKING", label: "Mobile Banking" },
  { value: "CHEQUE", label: "Cheque" },
];

interface EditPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentRecord;
  onSaved: (updated: PaymentRecord) => void;
}

export function EditPaymentDialog({ open, onOpenChange, payment, onSaved }: EditPaymentDialogProps) {
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset({
        amount: String(payment.amount),
        paymentType: payment.paymentType as FormData["paymentType"],
        paymentDate: payment.paymentDate instanceof Date
          ? payment.paymentDate.toISOString().split("T")[0]
          : String(payment.paymentDate).split("T")[0],
        stage: payment.stage ?? "",
        referenceNo: payment.referenceNo ?? "",
        description: payment.description ?? "",
        notes: payment.notes ?? "",
      });
    }
  }, [open, payment, reset]);

  const close = () => onOpenChange(false);

  const onSubmit = async (data: FormData) => {
    const updated: PaymentRecord = {
      ...payment,
      amount: parseFloat(data.amount),
      paymentType: data.paymentType,
      paymentDate: new Date(data.paymentDate),
      description: data.description,
      referenceNo: data.referenceNo,
      stage: data.stage,
      notes: data.notes,
    };

    onSaved(updated);
    toast.success("Payment updated!");
    close();

    try {
      await fetch(`/api/payments/${payment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, amount: updated.amount, paymentDate: updated.paymentDate.toISOString() }),
      });
    } catch { /* optimistic */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Amount (BDT) *</Label>
              <Input {...register("amount")} type="number" step="0.01" />
              {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Payment Date *</Label>
              <Input {...register("paymentDate")} type="date" />
              {errors.paymentDate && <p className="text-red-500 text-xs">{errors.paymentDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Payment Type *</Label>
              <Select
                defaultValue={payment.paymentType}
                onValueChange={(v) => setValue("paymentType", v as FormData["paymentType"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Input {...register("stage")} placeholder="e.g. Advance, Installment 1" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Reference Number</Label>
              <Input {...register("referenceNo")} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Input {...register("description")} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea {...register("notes")} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
