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
import { CATEGORIES, PROJECT_COST_CATEGORY_KEY, type ExpenseRecord } from "./add-expense-dialog";
import { CategorySelect } from "./category-select";

const schema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  invoiceNo: z.string().optional(),
  description: z.string().min(2, "Description is required"),
  vendorName: z.string().optional(),
  quantity: z.string().min(1),
  unit: z.string().optional(),
  unitPrice: z.string().min(1),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: ExpenseRecord;
  onSaved: (updated: ExpenseRecord) => void;
}

export function EditExpenseDialog({ open, onOpenChange, expense, onSaved }: EditExpenseDialogProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      const catId = CATEGORIES.find(c => c.name === expense.category)?.id ?? expense.category.toLowerCase().replace(/\s+/g, "_");
      reset({
        categoryId: catId,
        date: expense.date instanceof Date
          ? expense.date.toISOString().split("T")[0]
          : String(expense.date).split("T")[0],
        invoiceNo: expense.invoiceNo ?? "",
        description: expense.description,
        vendorName: expense.vendor ?? "",
        quantity: String(expense.qty),
        unit: expense.unit ?? "",
        unitPrice: String(expense.unitPrice),
        paymentStatus: expense.status as FormData["paymentStatus"],
        notes: "",
      });
    }
  }, [open, expense, reset]);

  const qty = watch("quantity");
  const price = watch("unitPrice");
  const total = (parseFloat(qty) || 0) * (parseFloat(price) || 0);

  const close = () => onOpenChange(false);

  const onSubmit = async (data: FormData) => {
    const allCats = [...CATEGORIES, ...JSON.parse(localStorage.getItem(PROJECT_COST_CATEGORY_KEY) ?? "[]")];
    const catName = allCats.find((c: { id: string; name: string }) => c.id === data.categoryId)?.name ?? data.categoryId;
    const updated: ExpenseRecord = {
      ...expense,
      date: new Date(data.date),
      invoiceNo: data.invoiceNo,
      description: data.description,
      category: catName,
      vendor: data.vendorName,
      qty: parseFloat(data.quantity),
      unit: data.unit,
      unitPrice: parseFloat(data.unitPrice),
      total,
      status: data.paymentStatus,
    };

    onSaved(updated);
    toast.success("Expense updated!");
    close();

    try {
      await fetch(`/api/costs/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: data.categoryId,
          date: updated.date.toISOString(),
          invoiceNo: data.invoiceNo,
          description: data.description,
          vendorName: data.vendorName,
          quantity: updated.qty,
          unit: data.unit,
          unitPrice: updated.unitPrice,
          totalCost: total,
          paymentStatus: data.paymentStatus,
        }),
      });
    } catch { /* optimistic */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <CategorySelect
                storageKey={PROJECT_COST_CATEGORY_KEY}
                defaults={CATEGORIES}
                value={CATEGORIES.find(c => c.name === expense.category)?.id ?? expense.category.toLowerCase().replace(/\s+/g, "_")}
                onValueChange={(v) => setValue("categoryId", v)}
              />
              {errors.categoryId && <p className="text-red-500 text-xs">{errors.categoryId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input {...register("date")} type="date" />
              {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description *</Label>
              <Input {...register("description")} />
              {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Invoice No</Label>
              <Input {...register("invoiceNo")} />
            </div>
            <div className="space-y-1.5">
              <Label>Vendor</Label>
              <Input {...register("vendorName")} />
            </div>
            <div className="space-y-1.5">
              <Label>Quantity *</Label>
              <Input {...register("quantity")} type="number" step="0.001" />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input {...register("unit")} placeholder="pcs, sqft, kg..." />
            </div>
            <div className="space-y-1.5">
              <Label>Unit Price (BDT) *</Label>
              <Input {...register("unitPrice")} type="number" step="0.01" />
            </div>
            <div className="space-y-1.5">
              <Label>Total</Label>
              <div className="h-9 px-3 rounded-lg bg-muted flex items-center font-semibold text-sm">
                ৳{total.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Status</Label>
              <Select
                defaultValue={expense.status}
                onValueChange={(v) => setValue("paymentStatus", v as "PAID" | "UNPAID" | "PARTIAL")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                </SelectContent>
              </Select>
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
