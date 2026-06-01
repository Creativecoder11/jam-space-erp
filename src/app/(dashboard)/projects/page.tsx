"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, MoreHorizontal, Eye, Trash2,
  FolderKanban, TrendingUp, CheckCircle, Clock, Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, getStatusColor } from "@/lib/utils";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";

type Project = {
  id: string;
  name: string;
  type: string;
  status: string;
  location?: string;
  startDate: string;
  estimatedEndDate?: string;
  estimatedBudget: number;
  totalCost: number;
  totalPaid: number;
  totalDue: number;
  expectedProfit: number;
  progress: number;
  client: { name: string; phone?: string };
  manager?: { name: string } | null;
};

const projectTypeLabels: Record<string, string> = {
  INTERIOR_DESIGN: "Interior Design",
  REAL_ESTATE: "Real Estate",
  BOTH: "Both",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects?pageSize=100");
      if (res.ok) {
        const json = await res.json();
        setProjects(json.data ?? []);
      }
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success("Project deleted");
    fetch(`/api/projects/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchType = typeFilter === "all" || p.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const summaryStats = [
    { label: "Total", value: projects.length, icon: FolderKanban, color: "text-blue-600" },
    { label: "Running", value: projects.filter(p => p.status === "IN_PROGRESS").length, icon: Clock, color: "text-orange-600" },
    { label: "Completed", value: projects.filter(p => p.status === "COMPLETED").length, icon: CheckCircle, color: "text-emerald-600" },
    { label: "On Hold", value: projects.filter(p => p.status === "ON_HOLD").length, icon: TrendingUp, color: "text-red-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all real estate and interior design projects
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className={cn("w-8 h-8", stat.color)} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects or clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PLANNING">Planning</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="INTERIOR_DESIGN">Interior Design</SelectItem>
            <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
            <SelectItem value="BOTH">Interior Design + Real Estate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Project Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((project, i) => {
            // Use DB-synced values (kept current by syncProjectTotals)
            const totalPaid = Number(project.totalPaid);
            const totalCost = Number(project.totalCost);
            const budget = Number(project.estimatedBudget);
            const totalDue = Math.max(0, budget - totalPaid);
            const expectedProfit = budget - totalCost;
            const progress = budget > 0 ? Math.min(100, Math.round((totalPaid / budget) * 100)) : Number(project.progress);
            const profitMargin = budget > 0 ? ((expectedProfit / budget) * 100).toFixed(1) : "0.0";
            const isPositive = expectedProfit > 0;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-all duration-200 group border-border/60">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link href={`/projects/${project.id}`}>
                          <h3 className="font-semibold text-sm leading-tight hover:text-primary transition-colors cursor-pointer truncate">
                            {project.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">{project.client.name}{project.location ? ` · ${project.location}` : ""}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 shrink-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.id}`} className="gap-2">
                              <Eye className="w-4 h-4" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={() => deleteProject(project.id)}>
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", getStatusColor(project.status))}>
                        {project.status.replace("_", " ")}
                      </span>
                      {project.type === "BOTH" ? (
                        <>
                          <Badge variant="outline" className="text-xs">Interior Design</Badge>
                          <Badge variant="outline" className="text-xs">Real Estate</Badge>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {projectTypeLabels[project.type] ?? project.type}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Payment Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="text-sm font-semibold">৳{budget.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cost</p>
                        <p className="text-sm font-semibold">৳{totalCost.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="text-sm font-semibold text-emerald-600">৳{totalPaid.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Due</p>
                        <p className={cn("text-sm font-semibold", totalDue > 0 ? "text-red-500" : "text-muted-foreground")}>
                          {totalDue > 0 ? `৳${totalDue.toLocaleString("en-IN")}` : "Clear"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">Profit Margin</span>
                      <span className={cn("text-sm font-bold", isPositive ? "text-emerald-600" : "text-red-500")}>
                        {isPositive ? "+" : ""}{profitMargin}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Start: {formatDate(new Date(project.startDate))}</span>
                      {project.estimatedEndDate && <span>End: {formatDate(new Date(project.estimatedEndDate))}</span>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderKanban className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">{projects.length === 0 ? "No projects yet" : "No projects match your filters"}</p>
              <p className="text-sm mt-1">{projects.length === 0 ? "Create your first project to get started" : "Try adjusting your search or filters"}</p>
              {projects.length === 0 && (
                <Button className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
                  <Plus className="w-4 h-4" /> Create First Project
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(p) => setProjects(prev => [p as Project, ...prev])}
      />
    </div>
  );
}
