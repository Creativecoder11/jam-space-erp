"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ProjectTypeToggle, type ProjectTypeValue } from "./project-type-toggle";

const createProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  type: z.enum(["INTERIOR_DESIGN", "REAL_ESTATE", "BOTH"] as const),
  clientId: z.string().min(1, "Please select a client"),
  managerId: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  estimatedEndDate: z.string().optional(),
  estimatedBudget: z.string().min(1, "Budget is required"),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

type Client = { id: string; name: string; phone?: string };

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (project: unknown) => void;
}

export function CreateProjectDialog({ open, onOpenChange, onCreated }: CreateProjectDialogProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState(false);
  const [selectedType, setSelectedType] = useState<ProjectTypeValue | undefined>();

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
  });

  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    setClientsError(false);
    try {
      const res = await fetch("/api/clients?pageSize=200");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setClients(json.data ?? []);
    } catch {
      setClientsError(true);
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setClients([]);
    loadClients();
  }, [open, loadClients]);

  const close = () => {
    reset();
    setSelectedType(undefined);
    onOpenChange(false);
  };

  const onSubmit = async (data: CreateProjectForm) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          estimatedBudget: parseFloat(data.estimatedBudget),
          startDate: new Date(data.startDate).toISOString(),
          estimatedEndDate: data.estimatedEndDate
            ? new Date(data.estimatedEndDate).toISOString()
            : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to create project");
        return;
      }

      const project = await res.json();
      toast.success("Project created successfully!");
      close();
      onCreated?.(project);
    } catch {
      toast.error("Network error — please check your connection and try again");
    }
  };

  const clientSelectContent = () => {
    if (clientsLoading) {
      return (
        <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading clients…
        </div>
      );
    }
    if (clientsError) {
      return (
        <div className="px-3 py-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            Failed to load clients
          </div>
          <button
            type="button"
            onClick={loadClients}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      );
    }
    if (clients.length === 0) {
      return (
        <div className="px-3 py-3 text-xs text-muted-foreground">
          No clients found. Add a client from the Clients page first.
        </div>
      );
    }
    return clients.map(c => (
      <SelectItem key={c.id} value={c.id}>
        {c.name}{c.phone ? ` — ${c.phone}` : ""}
      </SelectItem>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-4">

            {/* Project Name */}
            <div className="col-span-2 space-y-1.5">
              <Label>Project Name *</Label>
              <Input {...register("name")} placeholder="e.g. Villa Renovation - Gulshan" autoFocus />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Project Type *</Label>
              <ProjectTypeToggle
                value={selectedType}
                onChange={(v) => { setSelectedType(v); setValue("type", v); }}
                error={errors.type?.message}
              />
            </div>

            {/* Client */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Client *</Label>
                {clientsError && (
                  <button
                    type="button"
                    onClick={loadClients}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry loading clients
                  </button>
                )}
              </div>
              <Select
                onValueChange={(v) => setValue("clientId", v)}
                disabled={clientsLoading || clientsError || clients.length === 0}
              >
                <SelectTrigger>
                  {clientsLoading ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading clients…
                    </span>
                  ) : clientsError ? (
                    <span className="flex items-center gap-1.5 text-red-500 text-sm">
                      <AlertCircle className="w-3.5 h-3.5" /> Failed to load
                    </span>
                  ) : (
                    <SelectValue placeholder={clients.length === 0 ? "No clients found" : "Select client"} />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {clientSelectContent()}
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-red-500 text-xs">{errors.clientId.message}</p>}
              {clientsError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Could not load clients — check your database connection
                </p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input {...register("location")} placeholder="e.g. Gulshan, Dhaka" />
            </div>

            {/* Budget */}
            <div className="space-y-1.5">
              <Label>Estimated Budget (BDT) *</Label>
              <Input {...register("estimatedBudget")} type="number" placeholder="0.00" min="0" />
              {errors.estimatedBudget && <p className="text-red-500 text-xs">{errors.estimatedBudget.message}</p>}
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <Label>Start Date *</Label>
              <Input {...register("startDate")} type="date" />
              {errors.startDate && <p className="text-red-500 text-xs">{errors.startDate.message}</p>}
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <Label>Estimated End Date</Label>
              <Input {...register("estimatedEndDate")} type="date" />
            </div>

            {/* Description */}
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea {...register("description")} placeholder="Project description..." rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={clientsLoading || clientsError || clients.length === 0}>
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
