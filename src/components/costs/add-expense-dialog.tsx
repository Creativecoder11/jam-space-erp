"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategorySelect } from "./category-select";

export const PROJECT_COST_CATEGORY_KEY = "jam_project_cost_categories";

export const CATEGORIES = [
  { id: "board", name: "Board Cost" },
  { id: "hpl", name: "HPL Cost" },
  { id: "electrical", name: "Electrical Cost" },
  { id: "accessories", name: "Accessories" },
  { id: "paint", name: "Paint" },
  { id: "labour", name: "Labour" },
  { id: "worker", name: "Worker Payment" },
  { id: "delivery", name: "Delivery Cost" },
  { id: "other", name: "Other Expenses" },
];

const schema = z.object({
  projectId: z.string().min(1, "Project is required"),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  invoiceNo: z.string().optional(),
  description: z.string().min(2, "Description is required"),
  vendorName: z.string().optional(),
  quantity: z.string().min(1, "Quantity is required"),
  unit: z.string().optional(),
  unitPrice: z.string().min(1, "Unit price is required"),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export interface ExpenseRecord {
  id: string;
  date: Date;
  invoiceNo?: string;
  description: string;
  category: string;
  vendor?: string;
  qty: number;
  unit?: string;
  unitPrice: number;
  total: number;
  status: string;
}

type ProjectOption = { id: string; name: string; clientName: string };

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  projectName?: string;
  onAdded?: (expense: ExpenseRecord) => void;
}

export function AddExpenseDialog({ open, onOpenChange, projectId, projectName, onAdded }: AddExpenseDialogProps) {
  const isStandalone = !projectId;

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId: projectId ?? "",
      paymentStatus: "UNPAID",
      date: new Date().toISOString().split("T")[0],
    },
  });

  // Load all projects when opened in standalone mode
  const loadProjects = useCallback(async () => {
    if (!isStandalone) return;
    setProjectsLoading(true);
    try {
      const res = await fetch("/api/projects?pageSize=200");
      if (res.ok) {
        const json = await res.json();
        setProjects((json.data ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.name as string,
          clientName: (p.client as Record<string, unknown>)?.name as string ?? "",
        })));
      }
    } catch { /* silent */ }
    finally { setProjectsLoading(false); }
  }, [isStandalone]);

  useEffect(() => {
    if (open) loadProjects();
  }, [open, loadProjects]);

  useEffect(() => {
    if (projectId) setValue("projectId", projectId);
  }, [projectId, setValue]);

  const qty = watch("quantity");
  const price = watch("unitPrice");
  const total = (parseFloat(qty) || 0) * (parseFloat(price) || 0);

  const close = () => {
    reset({ projectId: projectId ?? "", paymentStatus: "UNPAID", date: new Date().toISOString().split("T")[0] });
    onOpenChange(false);
  };

  const onSubmit = async (data: FormData) => {
    // Resolve category name from defaults + any custom categories saved in localStorage
    const customCats: { id: string; name: string }[] = JSON.parse(localStorage.getItem(PROJECT_COST_CATEGORY_KEY) ?? "[]");
    const allCats = [...CATEGORIES, ...customCats];
    const catName = allCats.find(c => c.id === data.categoryId)?.name ?? data.categoryId;

    const qty = parseFloat(data.quantity);
    const unitPrice = parseFloat(data.unitPrice);

    try {
      const res = await fetch("/api/costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          quantity: qty,
          unitPrice,
          totalCost: total,
          date: new Date(data.date).toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to add expense");
        return;
      }

      const saved = await res.json();
      const record: ExpenseRecord = {
        id: saved.id,
        date: new Date(saved.date),
        invoiceNo: saved.invoiceNo ?? "",
        description: saved.description,
        category: catName,
        vendor: saved.vendorName ?? "",
        qty: Number(saved.quantity),
        unit: saved.unit ?? "",
        unitPrice: Number(saved.unitPrice),
        total: Number(saved.totalCost),
        status: saved.paymentStatus,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isStandalone ? "Add Project Expense" : `Add Expense — ${projectName}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">

            {/* Project selector — only in standalone mode */}
            {isStandalone && (
              <div className="col-span-2 space-y-1.5">
                <Label>Project *</Label>
                {projectsLoading ? (
                  <div className="flex items-center gap-2 h-9 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading projects…
                  </div>
                ) : projects.length === 0 ? (
                  <p className="text-xs text-muted-foreground h-9 flex items-center">No projects found. Create a project first.</p>
                ) : (
                  <Select onValueChange={(v) => setValue("projectId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="font-medium">{p.name}</span>
                          {p.clientName && <span className="text-muted-foreground ml-2 text-xs">— {p.clientName}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.projectId && <p className="text-red-500 text-xs">{errors.projectId.message}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Category *</Label>
              <CategorySelect
                storageKey={PROJECT_COST_CATEGORY_KEY}
                defaults={CATEGORIES}
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
              <Input {...register("description")} placeholder="e.g. Plywood 18mm - Grade A" autoFocus />
              {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Invoice No</Label>
              <Input {...register("invoiceNo")} placeholder="INV-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Vendor Name</Label>
              <Input {...register("vendorName")} placeholder="e.g. Ahmed Traders" />
            </div>
            <div className="space-y-1.5">
              <Label>Quantity *</Label>
              <Input {...register("quantity")} type="number" step="0.001" placeholder="0" />
              {errors.quantity && <p className="text-red-500 text-xs">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input {...register("unit")} placeholder="pcs, sqft, kg, lot..." />
            </div>
            <div className="space-y-1.5">
              <Label>Unit Price (BDT) *</Label>
              <Input {...register("unitPrice")} type="number" step="0.01" placeholder="0.00" />
              {errors.unitPrice && <p className="text-red-500 text-xs">{errors.unitPrice.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Total Cost</Label>
              <div className="h-9 px-3 rounded-lg bg-muted flex items-center font-semibold text-sm">
                ৳{total.toLocaleString("en-IN")}
              </div>
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
