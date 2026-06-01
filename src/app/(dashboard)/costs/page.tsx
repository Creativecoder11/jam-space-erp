"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Trash2, Pencil, MoreHorizontal, Loader2,
  Building2, FolderKanban, TrendingUp, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDate } from "@/lib/utils";
import { AddExpenseDialog, type ExpenseRecord, CATEGORIES } from "@/components/costs/add-expense-dialog";
import { EditExpenseDialog } from "@/components/costs/edit-expense-dialog";
import {
  AddCompanyExpenseDialog, type CompanyExpenseRecord, COMPANY_EXPENSE_CATEGORIES,
} from "@/components/costs/add-company-expense-dialog";
import { EditCompanyExpenseDialog } from "@/components/costs/edit-company-expense-dialog";

type ProjectCostRecord = ExpenseRecord & { project: string };

const PAGE_SIZE = 20;

const statusColors: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  UNPAID: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  PARTIAL: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function CostsPage() {
  // ── Data ──
  const [projectCosts, setProjectCosts] = useState<ProjectCostRecord[]>([]);
  const [projectLoading, setProjectLoading] = useState(true);
  const [companyExpenses, setCompanyExpenses] = useState<CompanyExpenseRecord[]>([]);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [totalClientPayments, setTotalClientPayments] = useState(0);
  const [allProjects, setAllProjects] = useState<{ id: string; name: string }[]>([]);

  // ── Company expense UI ──
  const [companySearch, setCompanySearch] = useState("");
  const [companyCategoryFilter, setCompanyCategoryFilter] = useState("all");
  const [companyStatusFilter, setCompanyStatusFilter] = useState("all");
  const [addCompanyExpenseOpen, setAddCompanyExpenseOpen] = useState(false);
  const [editingCompanyExpense, setEditingCompanyExpense] = useState<CompanyExpenseRecord | null>(null);

  // ── Project costs UI ──
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [projectPage, setProjectPage] = useState(1);
  const [addProjectExpenseOpen, setAddProjectExpenseOpen] = useState(false);
  const [editingProjectCost, setEditingProjectCost] = useState<ProjectCostRecord | null>(null);

  // ── Fetches ──
  const fetchProjectCosts = useCallback(async () => {
    try {
      const res = await fetch("/api/costs?pageSize=500");
      if (res.ok) {
        const json = await res.json();
        setProjectCosts((json.data ?? []).map((c: Record<string, unknown>) => {
          const proj = c.project as Record<string, unknown> | undefined;
          const catId = c.categoryId as string;
          const catName = CATEGORIES.find(x => x.id === catId)?.name ?? catId;
          return {
            id: c.id as string,
            date: new Date(c.date as string),
            invoiceNo: (c.invoiceNo as string) ?? "",
            description: c.description as string,
            category: catName,
            vendor: (c.vendorName as string) ?? "",
            qty: Number(c.quantity),
            unit: (c.unit as string) ?? "",
            unitPrice: Number(c.unitPrice),
            total: Number(c.totalCost),
            status: c.paymentStatus as string,
            project: (proj?.name as string) ?? "—",
          } as ProjectCostRecord;
        }));
      }
    } catch {
      toast.error("Failed to load project costs");
    } finally {
      setProjectLoading(false);
    }
  }, []);

  const fetchCompanyExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/company-expenses?pageSize=500");
      if (res.ok) {
        const json = await res.json();
        setCompanyExpenses((json.data ?? []).map((e: Record<string, unknown>) => {
          const catName = COMPANY_EXPENSE_CATEGORIES.find(c => c.id === e.category)?.name ?? (e.category as string);
          return {
            id: e.id as string,
            date: new Date(e.date as string),
            category: catName,
            description: e.description as string,
            amount: Number(e.amount),
            vendorName: (e.vendorName as string) ?? "",
            invoiceNo: (e.invoiceNo as string) ?? "",
            paymentStatus: e.paymentStatus as string,
            notes: (e.notes as string) ?? "",
          } as CompanyExpenseRecord;
        }));
      }
    } catch {
      toast.error("Failed to load company expenses");
    } finally {
      setCompanyLoading(false);
    }
  }, []);

  const fetchPaymentTotal = useCallback(async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const json = await res.json();
        setTotalClientPayments(json.summary?.totalRevenue ?? 0);
      }
    } catch { /* silent */ }
  }, []);

  const fetchAllProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects?pageSize=200");
      if (res.ok) {
        const json = await res.json();
        setAllProjects((json.data ?? []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: p.name as string,
        })));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchProjectCosts();
    fetchCompanyExpenses();
    fetchPaymentTotal();
    fetchAllProjects();
  }, [fetchProjectCosts, fetchCompanyExpenses, fetchPaymentTotal, fetchAllProjects]);

  // ── Derived values ──
  const totalCompanyExpenses = companyExpenses.reduce((a, e) => a + e.amount, 0);
  const totalProjectCosts = projectCosts.reduce((a, e) => a + e.total, 0);
  const grandTotalCost = totalCompanyExpenses + totalProjectCosts;

  // ── Project filter: all projects from DB, sorted by name ──
  const projectNames = useMemo(() => {
    return allProjects.map(p => p.name).sort();
  }, [allProjects]);

  // ── Category chips: based on selected project ──
  const availableCategories = useMemo(() => {
    const base = selectedProject === "all" ? projectCosts : projectCosts.filter(c => c.project === selectedProject);
    const names = [...new Set(base.map(c => c.category))].sort();
    return names;
  }, [projectCosts, selectedProject]);

  // ── Filtered + paginated project costs ──
  const filteredProjectCosts = useMemo(() => {
    return projectCosts.filter(e => {
      const matchProject = selectedProject === "all" || e.project === selectedProject;
      const matchCategory = selectedCategory === "all" || e.category === selectedCategory;
      const matchSearch = !projectSearch || e.description.toLowerCase().includes(projectSearch.toLowerCase()) ||
        (e.vendor ?? "").toLowerCase().includes(projectSearch.toLowerCase());
      const matchStatus = projectStatusFilter === "all" || e.status === projectStatusFilter;
      return matchProject && matchCategory && matchSearch && matchStatus;
    });
  }, [projectCosts, selectedProject, selectedCategory, projectSearch, projectStatusFilter]);

  const totalProjectPages = Math.ceil(filteredProjectCosts.length / PAGE_SIZE);
  const pagedProjectCosts = filteredProjectCosts.slice((projectPage - 1) * PAGE_SIZE, projectPage * PAGE_SIZE);

  // reset page when filters change
  useEffect(() => { setProjectPage(1); }, [selectedProject, selectedCategory, projectSearch, projectStatusFilter]);

  // ── Company expense filtered ──
  const filteredCompanyExpenses = companyExpenses.filter(e => {
    const matchSearch = e.description.toLowerCase().includes(companySearch.toLowerCase()) ||
      (e.vendorName ?? "").toLowerCase().includes(companySearch.toLowerCase()) ||
      e.category.toLowerCase().includes(companySearch.toLowerCase());
    const matchCat = companyCategoryFilter === "all" || e.category === companyCategoryFilter;
    const matchStatus = companyStatusFilter === "all" || e.paymentStatus === companyStatusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const companyCatTotals = COMPANY_EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: companyExpenses.filter(e => e.category === cat.name).reduce((a, e) => a + e.amount, 0),
  })).filter(c => c.total > 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cost Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Track all company & project expenses</p>
        </div>
      </motion.div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Received (Clients)",
            value: totalClientPayments,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            icon: TrendingUp,
          },
          {
            label: "Company Expenses",
            value: totalCompanyExpenses,
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-950/30",
            icon: Building2,
          },
          {
            label: "Project Costs",
            value: totalProjectCosts,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/30",
            icon: FolderKanban,
          },
          {
            label: "Grand Total Cost",
            value: grandTotalCost,
            color: "text-red-600",
            bg: "bg-red-50 dark:bg-red-950/30",
            icon: null,
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={cn("border-0 shadow-sm", stat.bg)}>
                <CardContent className="p-4 flex items-center gap-3">
                  {Icon && <Icon className={cn("w-8 h-8 shrink-0", stat.color)} />}
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={cn("text-lg font-bold", stat.color)}>৳{stat.value.toLocaleString("en-IN")}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="company">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" /> Company Expenses
          </TabsTrigger>
          <TabsTrigger value="project" className="gap-2">
            <FolderKanban className="w-4 h-4" /> Project Costs
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════ COMPANY EXPENSES ════════════════════ */}
        <TabsContent value="company" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Company Expenses</h2>
            <Button onClick={() => setAddCompanyExpenseOpen(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add Expense
            </Button>
          </div>

          {/* category chips */}
          {/* {companyCatTotals.length > 0 && (
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max">
                {companyCatTotals.map((cat, i) => (
                  <motion.div key={cat.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card
                      className={cn("min-w-36 cursor-pointer transition-all border-2",
                        companyCategoryFilter === cat.name ? "border-primary" : "border-transparent hover:border-border"
                      )}
                      onClick={() => setCompanyCategoryFilter(companyCategoryFilter === cat.name ? "all" : cat.name)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                          <span className="text-xs font-medium truncate">{cat.name}</span>
                        </div>
                        <p className="text-sm font-bold">৳{cat.total.toLocaleString("en-IN")}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )} */}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search expenses..." value={companySearch} onChange={e => setCompanySearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={companyStatusFilter} onValueChange={setCompanyStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {companyLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Expense Records
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({filteredCompanyExpenses.length} · ৳{filteredCompanyExpenses.reduce((a, e) => a + e.amount, 0).toLocaleString("en-IN")})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {filteredCompanyExpenses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">{companyExpenses.length === 0 ? "No company expenses yet" : "No results match your filters"}</p>
                    {companyExpenses.length === 0 && (
                      <Button className="mt-4 gap-2" size="sm" onClick={() => setAddCompanyExpenseOpen(true)}>
                        <Plus className="w-4 h-4" /> Add First Expense
                      </Button>
                    )}
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        {["Date", "Category", "Description", "Vendor", "Amount", "Status", ""].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCompanyExpenses.map(expense => (
                        <tr key={expense.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 group">
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(expense.date)}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COMPANY_EXPENSE_CATEGORIES.find(c => c.name === expense.category)?.color ?? "#6b7280" }} />
                              <span className="font-medium">{expense.category}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[200px] truncate">{expense.description}</td>
                          <td className="px-4 py-3 text-muted-foreground">{expense.vendorName || "—"}</td>
                          <td className="px-4 py-3 font-semibold">৳{expense.amount.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium", statusColors[expense.paymentStatus])}>
                              {expense.paymentStatus}
                            </span>
                          </td>
                          <td className="px-2 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 h-7 w-7">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="gap-2" onClick={() => setEditingCompanyExpense(expense)}>
                                  <Pencil className="w-4 h-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={() => {
                                  setCompanyExpenses(prev => prev.filter(e => e.id !== expense.id));
                                  toast.success("Expense deleted");
                                  fetch(`/api/company-expenses/${expense.id}`, { method: "DELETE" }).catch(() => {});
                                }}>
                                  <Trash2 className="w-4 h-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-muted/20">
                        <td colSpan={4} className="px-4 py-3 font-semibold text-sm">Total</td>
                        <td className="px-4 py-3 font-bold text-sm">৳{filteredCompanyExpenses.reduce((a, e) => a + e.amount, 0).toLocaleString("en-IN")}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ════════════════════ PROJECT COSTS ════════════════════ */}
        <TabsContent value="project" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Project Costs</h2>
            <Button onClick={() => setAddProjectExpenseOpen(true)} size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add Cost
            </Button>
          </div>

          {/* ── Project name chips ── */}
          {projectNames.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Filter by Project</p>
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-max flex-wrap">
                  <button
                    onClick={() => { setSelectedProject("all"); setSelectedCategory("all"); }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      selectedProject === "all"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary hover:text-primary"
                    )}
                  >
                    All Projects
                  </button>
                  {projectNames.map(name => {
                    const projTotal = projectCosts.filter(c => c.project === name).reduce((a, c) => a + c.total, 0);
                    return (
                      <button
                        key={name}
                        onClick={() => { setSelectedProject(selectedProject === name ? "all" : name); setSelectedCategory("all"); }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                          selectedProject === name
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary hover:text-primary"
                        )}
                      >
                        <span className="max-w-[140px] truncate">{name}</span>
                        {projTotal > 0 ? (
                          <span className={cn("opacity-70", selectedProject === name ? "text-primary-foreground" : "")}>
                            ৳{projTotal.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="opacity-40 italic">no costs</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Category chips (contextual to selected project) ── */}
          {availableCategories.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Filter by Category</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                    selectedCategory === "all"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-background border-border hover:border-blue-500 hover:text-blue-600"
                  )}
                >
                  All Categories
                </button>
                {availableCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? "all" : cat)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                      selectedCategory === cat
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-background border-border hover:border-blue-500 hover:text-blue-600"
                    )}
                  >
                    {cat}
                    <span className="ml-1.5 opacity-70">
                      ({projectCosts.filter(c =>
                        (selectedProject === "all" || c.project === selectedProject) && c.category === cat
                      ).length})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Search + status filter ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by description or vendor..." value={projectSearch} onChange={e => setProjectSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={projectStatusFilter} onValueChange={setProjectStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {projectLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base">
                    Cost Records
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({filteredProjectCosts.length} · ৳{filteredProjectCosts.reduce((a, e) => a + e.total, 0).toLocaleString("en-IN")})
                    </span>
                  </CardTitle>
                  {selectedProject !== "all" && (
                    <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                      {selectedProject}{selectedCategory !== "all" ? ` · ${selectedCategory}` : ""}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {filteredProjectCosts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">{projectCosts.length === 0 ? "No project costs recorded yet" : "No costs match your filters"}</p>
                  </div>
                ) : (
                  <>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          {["Date", "Description", "Project", "Vendor", "Qty", "Unit Price", "Total", "Status", ""].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pagedProjectCosts.map(expense => (
                          <tr key={expense.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 group">
                            <td className="px-4 py-3 whitespace-nowrap">{formatDate(expense.date)}</td>
                            <td className="px-4 py-3">
                              <p className="font-medium">{expense.description}</p>
                              <p className="text-muted-foreground">{expense.category}</p>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground max-w-[120px] truncate">{expense.project}</td>
                            <td className="px-4 py-3 text-muted-foreground">{expense.vendor || "—"}</td>
                            <td className="px-4 py-3">{expense.qty} {expense.unit}</td>
                            <td className="px-4 py-3">৳{expense.unitPrice.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 font-semibold">৳{expense.total.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3">
                              <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium", statusColors[expense.status])}>
                                {expense.status}
                              </span>
                            </td>
                            <td className="px-2 py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 h-7 w-7">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="gap-2" onClick={() => setEditingProjectCost(expense)}>
                                    <Pencil className="w-4 h-4" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={() => {
                                    setProjectCosts(prev => prev.filter(e => e.id !== expense.id));
                                    toast.success("Cost deleted");
                                    fetch(`/api/costs/${expense.id}`, { method: "DELETE" }).catch(() => {});
                                  }}>
                                    <Trash2 className="w-4 h-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t bg-muted/20">
                          <td colSpan={6} className="px-4 py-3 font-semibold text-sm">
                            {selectedProject !== "all" ? `Total — ${selectedProject}` : "Total"}
                          </td>
                          <td className="px-4 py-3 font-bold text-sm">
                            ৳{filteredProjectCosts.reduce((a, e) => a + e.total, 0).toLocaleString("en-IN")}
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>

                    {/* ── Pagination ── */}
                    {totalProjectPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          Showing {((projectPage - 1) * PAGE_SIZE) + 1}–{Math.min(projectPage * PAGE_SIZE, filteredProjectCosts.length)} of {filteredProjectCosts.length}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7" disabled={projectPage === 1} onClick={() => setProjectPage(p => p - 1)}>
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          {Array.from({ length: totalProjectPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalProjectPages || Math.abs(p - projectPage) <= 1)
                            .reduce<(number | "…")[]>((acc, p, i, arr) => {
                              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                              acc.push(p);
                              return acc;
                            }, [])
                            .map((p, i) => p === "…" ? (
                              <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                            ) : (
                              <Button key={p} variant={projectPage === p ? "default" : "ghost"} size="icon-sm"
                                className="h-7 w-7 text-xs" onClick={() => setProjectPage(p as number)}>
                                {p}
                              </Button>
                            ))}
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7" disabled={projectPage === totalProjectPages} onClick={() => setProjectPage(p => p + 1)}>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ── */}
      <AddCompanyExpenseDialog
        open={addCompanyExpenseOpen}
        onOpenChange={setAddCompanyExpenseOpen}
        onAdded={(e) => { setCompanyExpenses(prev => [e, ...prev]); fetchCompanyExpenses(); }}
      />
      {editingCompanyExpense && (
        <EditCompanyExpenseDialog
          open={!!editingCompanyExpense}
          onOpenChange={(v) => !v && setEditingCompanyExpense(null)}
          expense={editingCompanyExpense}
          onSaved={(u) => { setCompanyExpenses(prev => prev.map(e => e.id === u.id ? u : e)); setEditingCompanyExpense(null); }}
        />
      )}

      <AddExpenseDialog
        open={addProjectExpenseOpen}
        onOpenChange={setAddProjectExpenseOpen}
        onAdded={(e) => { setProjectCosts(prev => [{ ...e, project: "—" } as ProjectCostRecord, ...prev]); fetchProjectCosts(); }}
      />
      {editingProjectCost && (
        <EditExpenseDialog
          open={!!editingProjectCost}
          onOpenChange={(v) => !v && setEditingProjectCost(null)}
          expense={editingProjectCost}
          onSaved={(u) => { setProjectCosts(prev => prev.map(e => e.id === u.id ? { ...e, ...u } : e)); setEditingProjectCost(null); }}
        />
      )}
    </div>
  );
}
