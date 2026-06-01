"use client";

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
import { CategorySelect } from "./category-select";

export const COMPANY_EXPENSE_CATEGORY_KEY = "jam_company_expense_categories";

export const COMPANY_EXPENSE_CATEGORIES = [
  { id: "salary", name: "Salary & Payroll", color: "#3b82f6" },
  { id: "food", name: "Food & Dining", color: "#f59e0b" },
  { id: "transport", name: "Transport & Fuel", color: "#8b5cf6" },
  { id: "rent", name: "Office Rent", color: "#6366f1" },
  { id: "utilities", name: "Utilities (Electricity/Internet)", color: "#14b8a6" },
  { id: "equipment", name: "Equipment & Tools", color: "#f97316" },
  { id: "marketing", name: "Marketing & Advertising", color: "#ec4899" },
  { id: "maintenance", name: "Maintenance & Repair", color: "#84cc16" },
  { id: "miscellaneous", name: "Miscellaneous", color: "#6b7280" },
];

const schema = z.object({
  date: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(2, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  vendorName: z.string().optional(),
  invoiceNo: z.string().optional(),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export type CompanyExpenseRecord = {
  id: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
  vendorName?: string;
  invoiceNo?: string;
  paymentStatus: string;
  notes?: string;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded?: (expense: CompanyExpenseRecord) => void;
}

export function AddCompanyExpenseDialog({ open, onOpenChange, onAdded }: Props) {
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentStatus: "UNPAID", date: new Date().toISOString().split("T")[0] },
  });

  const close = () => { reset({ paymentStatus: "UNPAID", date: new Date().toISOString().split("T")[0] }); onOpenChange(false); };

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/company-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount),
          date: new Date(data.date).toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to add expense");
        return;
      }

      const saved = await res.json();
      const customCats = JSON.parse(localStorage.getItem(COMPANY_EXPENSE_CATEGORY_KEY) ?? "[]");
      const allCats = [...COMPANY_EXPENSE_CATEGORIES, ...customCats];
      const catName = allCats.find((c: { id: string; name: string }) => c.id === saved.category)?.name ?? saved.category;
      const record: CompanyExpenseRecord = {
        id: saved.id,
        date: new Date(saved.date),
        category: catName,
        description: saved.description,
        amount: Number(saved.amount),
        vendorName: saved.vendorName ?? "",
        invoiceNo: saved.invoiceNo ?? "",
        paymentStatus: saved.paymentStatus,
        notes: saved.notes ?? "",
      };

      onAdded?.(record);
      toast.success("Expense added!");
      close();
    } catch {
      toast.error("Failed to add expense");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Company Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <CategorySelect
                storageKey={COMPANY_EXPENSE_CATEGORY_KEY}
                defaults={COMPANY_EXPENSE_CATEGORIES}
                onValueChange={(v) => setValue("category", v)}
              />
              {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input {...register("date")} type="date" />
              {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description *</Label>
              <Input {...register("description")} placeholder="e.g. Monthly salary — March 2025" autoFocus />
              {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Amount (BDT) *</Label>
              <Input {...register("amount")} type="number" step="0.01" placeholder="0.00" />
              {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Payment Status</Label>
              <Select defaultValue="UNPAID" onValueChange={(v) => setValue("paymentStatus", v as "PAID" | "UNPAID" | "PARTIAL")}>
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
              <Input {...register("vendorName")} placeholder="e.g. Office staff, Shell petrol" />
            </div>
            <div className="space-y-1.5">
              <Label>Invoice / Receipt No</Label>
              <Input {...register("invoiceNo")} placeholder="INV-001" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea {...register("notes")} placeholder="Additional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Add Expense</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
