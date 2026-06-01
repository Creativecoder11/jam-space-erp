"use client";

import { useEffect, useState } from "react";
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
import { ProjectTypeToggle, type ProjectTypeValue } from "./project-type-toggle";

const schema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]),
  type: z.enum(["INTERIOR_DESIGN", "REAL_ESTATE", "BOTH"]),
  location: z.string().optional(),
  description: z.string().optional(),
  estimatedEndDate: z.string().optional(),
  estimatedBudget: z.string().min(1, "Budget is required"),
  progress: z.string(),
});

type FormData = z.infer<typeof schema>;

export interface ProjectData {
  id: string;
  name: string;
  status: string;
  type: string;
  location?: string;
  description?: string;
  estimatedEndDate?: Date;
  estimatedBudget: number;
  progress: number;
}

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectData;
  onSaved?: (updated: ProjectData) => void;
}

const STATUS_OPTIONS = [
  { value: "PLANNING", label: "Planning" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const TYPE_OPTIONS = [
  { value: "INTERIOR_DESIGN", label: "Interior Design" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "BOTH", label: "Both" },
];

export function EditProjectDialog({ open, onOpenChange, project, onSaved }: EditProjectDialogProps) {
  const [selectedType, setSelectedType] = useState<ProjectTypeValue>(project.type as ProjectTypeValue);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project.name,
      status: project.status as FormData["status"],
      type: project.type as FormData["type"],
      location: project.location ?? "",
      description: project.description ?? "",
      estimatedEndDate: project.estimatedEndDate ? project.estimatedEndDate.toISOString().split("T")[0] : "",
      estimatedBudget: String(project.estimatedBudget),
      progress: String(project.progress),
    },
  });

  // Reset form when project changes or dialog reopens
  useEffect(() => {
    if (open) {
      setSelectedType(project.type as ProjectTypeValue);
      reset({
        name: project.name,
        status: project.status as FormData["status"],
        type: project.type as FormData["type"],
        location: project.location ?? "",
        description: project.description ?? "",
        estimatedEndDate: project.estimatedEndDate ? project.estimatedEndDate.toISOString().split("T")[0] : "",
        estimatedBudget: String(project.estimatedBudget),
        progress: String(project.progress),
      });
    }
  }, [open, project, reset]);

  const close = () => onOpenChange(false);

  const onSubmit = async (data: FormData) => {
    const updated: ProjectData = {
      ...project,
      name: data.name,
      status: data.status,
      type: data.type,
      location: data.location,
      description: data.description,
      estimatedEndDate: data.estimatedEndDate ? new Date(data.estimatedEndDate) : undefined,
      estimatedBudget: parseFloat(data.estimatedBudget),
      progress: Math.min(100, Math.max(0, parseInt(data.progress) || 0)),
    };

    // Optimistic update
    onSaved?.(updated);
    toast.success("Project updated!");
    close();

    // Persist in background
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updated.name,
          status: updated.status,
          type: updated.type,
          location: updated.location,
          description: updated.description,
          estimatedBudget: updated.estimatedBudget,
          estimatedEndDate: updated.estimatedEndDate?.toISOString(),
        }),
      });
    } catch {
      // UI already updated
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2 space-y-1.5">
              <Label>Project Name *</Label>
              <Input {...register("name")} placeholder="Project name" />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select
                defaultValue={project.status}
                onValueChange={(v) => setValue("status", v as FormData["status"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
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

            {/* Location */}
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input {...register("location")} placeholder="e.g. Gulshan, Dhaka" />
            </div>

            {/* Estimated End Date */}
            <div className="space-y-1.5">
              <Label>Estimated End Date</Label>
              <Input {...register("estimatedEndDate")} type="date" />
            </div>

            {/* Budget */}
            <div className="space-y-1.5">
              <Label>Estimated Budget (BDT) *</Label>
              <Input {...register("estimatedBudget")} type="number" step="1000" placeholder="0" />
              {errors.estimatedBudget && <p className="text-red-500 text-xs">{errors.estimatedBudget.message}</p>}
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
              <Label>Progress (%)</Label>
              <Input {...register("progress")} type="number" min="0" max="100" placeholder="0" />
            </div>

            {/* Description */}
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea {...register("description")} placeholder="Project description..." rows={3} />
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
