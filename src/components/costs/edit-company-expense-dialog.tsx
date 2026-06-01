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
import { COMPANY_EXPENSE_CATEGORIES, COMPANY_EXPENSE_CATEGORY_KEY, type CompanyExpenseRecord } from "./add-company-expense-dialog";
import { CategorySelect } from "./category-select";

const schema = z.object({
  date: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(2),
  amount: z.string().min(1),
  vendorName: z.string().optional(),
  invoiceNo: z.string().optional(),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: CompanyExpenseRecord;
  onSaved?: (updated: CompanyExpenseRecord) => void;
}

export function EditCompanyExpenseDialog({ open, onOpenChange, expense, onSaved }: Props) {
  const catId = COMPANY_EXPENSE_CATEGORIES.find(c => c.name === expense.category)?.id ?? expense.category;

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: expense.date instanceof Date
        ? expense.date.toISOString().split("T")[0]
        : new Date(expense.date).toISOString().split("T")[0],
      category: catId,
      description: expense.description,
      amount: String(expense.amount),
      vendorName: expense.vendorName ?? "",
      invoiceNo: expense.invoiceNo ?? "",
      paymentStatus: expense.paymentStatus as "PAID" | "UNPAID" | "PARTIAL",
      notes: expense.notes ?? "",
    },
  });

  useEffect(() => {
    reset({
      date: expense.date instanceof Date
        ? expense.date.toISOString().split("T")[0]
        : new Date(expense.date).toISOString().split("T")[0],
      category: catId,
      description: expense.description,
      amount: String(expense.amount),
      vendorName: expense.vendorName ?? "",
      invoiceNo: expense.invoiceNo ?? "",
      paymentStatus: expense.paymentStatus as "PAID" | "UNPAID" | "PARTIAL",
      notes: expense.notes ?? "",
    });
  }, [expense, catId, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch(`/api/company-expenses/${expense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount),
          date: new Date(data.date).toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to update expense");
        return;
      }

      const saved = await res.json();
      const customCats = JSON.parse(localStorage.getItem(COMPANY_EXPENSE_CATEGORY_KEY) ?? "[]");
      const allCats = [...COMPANY_EXPENSE_CATEGORIES, ...customCats];
      const catName = allCats.find((c: { id: string; name: string }) => c.id === saved.category)?.name ?? saved.category;
      onSaved?.({
        id: saved.id,
        date: new Date(saved.date),
        category: catName,
        description: saved.description,
        amount: Number(saved.amount),
        vendorName: saved.vendorName ?? "",
        invoiceNo: saved.invoiceNo ?? "",
        paymentStatus: saved.paymentStatus,
        notes: saved.notes ?? "",
      });
      toast.success("Expense updated!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update expense");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Company Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <CategorySelect
                storageKey={COMPANY_EXPENSE_CATEGORY_KEY}
                defaults={COMPANY_EXPENSE_CATEGORIES}
                value={catId}
                onValueChange={(v) => setValue("category", v)}
              />
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
              <Label>Amount (BDT) *</Label>
              <Input {...register("amount")} type="number" step="0.01" />
              {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Payment Status</Label>
              <Select defaultValue={expense.paymentStatus} onValueChange={(v) => setValue("paymentStatus", v as "PAID" | "UNPAID" | "PARTIAL")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vendor / Payee</Label>
              <Input {...register("vendorName")} />
            </div>
            <div className="space-y-1.5">
              <Label>Invoice No</Label>
              <Input {...register("invoiceNo")} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea {...register("notes")} rows={2} />
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
