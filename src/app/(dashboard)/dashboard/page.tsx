"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FolderKanban, TrendingUp, TrendingDown, DollarSign,
  Users, Clock, CheckCircle, AlertCircle, Activity,
  ArrowUpRight, Receipt, CreditCard, Loader2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, getStatusColor, cn } from "@/lib/utils";
import Link from "next/link";

type Summary = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
};

type MonthlyEntry = { month: string; revenue: number; expenses: number; profit: number };

type Project = {
  id: string;
  name: string;
  client: string;
  status: string;
  estimatedBudget: number;
  totalPaid: number;
  totalDue: number;
  progress: number;
};

type ExpenseCategory = { name: string; value: number; color: string };

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#6b7280", "#ec4899", "#14b8a6"];

const colorMap = {
  blue: { bg: "bg-blue-50 dark:bg-blue-950/30", icon: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400", value: "text-blue-700 dark:text-blue-300" },
  green: { bg: "bg-emerald-50 dark:bg-emerald-950/30", icon: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400", value: "text-emerald-700 dark:text-emerald-300" },
  red: { bg: "bg-red-50 dark:bg-red-950/30", icon: "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400", value: "text-red-700 dark:text-red-300" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/30", icon: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400", value: "text-purple-700 dark:text-purple-300" },
  orange: { bg: "bg-orange-50 dark:bg-orange-950/30", icon: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400", value: "text-orange-700 dark:text-orange-300" },
  teal: { bg: "bg-teal-50 dark:bg-teal-950/30", icon: "bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400", value: "text-teal-700 dark:text-teal-300" },
};

const fmt = (n: number) => `৳${n.toLocaleString("en-IN")}`;

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [projectCounts, setProjectCounts] = useState({ total: 0, running: 0, completed: 0, onHold: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [reportsRes, projectsRes] = await Promise.all([
          fetch("/api/reports"),
          fetch("/api/projects?pageSize=5"),
        ]);

        if (reportsRes.ok) {
          const r = await reportsRes.json();
          setSummary(r.summary);
          setMonthlyData(
            (r.monthlyData ?? []).sort((a: MonthlyEntry, b: MonthlyEntry) =>
              new Date(a.month).getTime() - new Date(b.month).getTime()
            )
          );
          const catObj: Record<string, number> = r.expenseByCategory ?? {};
          const cats = Object.entries(catObj).map(([name, value], i) => ({
            name,
            value: Math.round((value / (r.summary.totalExpenses || 1)) * 100),
            color: PIE_COLORS[i % PIE_COLORS.length],
          }));
          setExpenseCategories(cats);
        }

        if (projectsRes.ok) {
          const p = await projectsRes.json();
          const all: Project[] = (p.data ?? []).map((proj: Record<string, unknown>) => ({
            id: proj.id as string,
            name: proj.name as string,
            client: (proj.client as { name: string })?.name ?? "—",
            status: proj.status as string,
            estimatedBudget: Number(proj.estimatedBudget),
            totalPaid: Number(proj.totalPaid),
            totalDue: Number(proj.totalDue),
            progress: Number(proj.progress ?? 0),
          }));
          setProjects(all);
          setProjectCounts({
            total: p.total ?? all.length,
            running: all.filter(x => x.status === "IN_PROGRESS").length,
            completed: all.filter(x => x.status === "COMPLETED").length,
            onHold: all.filter(x => x.status === "ON_HOLD").length,
          });
        }
      } catch {
        // silently fall through — UI shows zeros
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const stats = summary ? [
    { title: "Total Projects", value: String(projectCounts.total), icon: FolderKanban, color: "blue" as const },
    { title: "Running", value: String(projectCounts.running), icon: Activity, color: "orange" as const },
    { title: "Completed", value: String(projectCounts.completed), icon: CheckCircle, color: "green" as const },
    { title: "On Hold", value: String(projectCounts.onHold), icon: Clock, color: "red" as const },
    { title: "Total Revenue", value: fmt(summary.totalRevenue), icon: DollarSign, color: "green" as const },
    { title: "Total Expenses", value: fmt(summary.totalExpenses), icon: TrendingDown, color: "red" as const },
    { title: "Net Profit", value: fmt(summary.netProfit), icon: TrendingUp, color: "purple" as const },
    { title: "Profit Margin", value: `${summary.profitMargin.toFixed(1)}%`, icon: Receipt, color: "teal" as const },
    { title: "Total Paid", value: fmt(projects.reduce((a, p) => a + p.totalPaid, 0)), icon: CreditCard, color: "blue" as const },
    { title: "Total Due", value: fmt(projects.reduce((a, p) => a + p.totalDue, 0)), icon: AlertCircle, color: "red" as const },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back! Here&apos;s an overview of your business performance.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          const colors = colorMap[stat.color];
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className={cn("border-0 shadow-sm", colors.bg)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground truncate">{stat.title}</p>
                      <p className={cn("text-lg font-bold mt-1 truncate", colors.value)}>{stat.value}</p>
                    </div>
                    <div className={cn("p-2 rounded-lg shrink-0", colors.icon)}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expenses Chart */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
                  <CardDescription>Monthly financial performance</CardDescription>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Revenue</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Expenses</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Profit</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                  No financial data for this period yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `৳${Number(v).toLocaleString("en-IN")}`} />
                    <RechartTooltip
                      formatter={(value: unknown) => [`৳${Number(value).toLocaleString("en-IN")}`, ""]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revenue)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenses)" strokeWidth={2} />
                    <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profit)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Expense Category Pie */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Expense Breakdown</CardTitle>
              <CardDescription>By category</CardDescription>
            </CardHeader>
            <CardContent>
              {expenseCategories.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  No expense data yet
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={expenseCategories} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartTooltip formatter={(value: unknown) => [`${Number(value)}%`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-1.5 mt-3">
                    {expenseCategories.map((cat) => (
                      <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                        <span className="text-muted-foreground truncate">{cat.name}</span>
                        <span className="font-medium ml-auto">{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Projects</CardTitle>
                  <CardDescription>Financial overview by project</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/projects" className="text-xs gap-1">
                    View all <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {projects.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No projects yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Paid</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Due</th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => (
                        <tr key={project.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <Link href={`/projects/${project.id}`} className="hover:underline">
                              <p className="font-medium text-sm truncate max-w-[200px]">{project.name}</p>
                            </Link>
                            <p className="text-xs text-muted-foreground">{project.client}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-sm">
                            {fmt(project.estimatedBudget)}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-600 text-sm hidden md:table-cell">
                            {fmt(project.totalPaid)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm hidden md:table-cell">
                            {project.totalDue > 0 ? (
                              <span className="text-red-500">{fmt(project.totalDue)}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", getStatusColor(project.status))}>
                              {project.status.replace(/_/g, " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Project Progress</CardTitle>
              <CardDescription>Completion by project</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No projects yet</div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium truncate max-w-[150px]">{project.name}</span>
                        <span className="text-muted-foreground shrink-0">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-1.5" />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-2 gap-1" asChild>
                    <Link href="/projects">
                      <Users className="w-3.5 h-3.5" /> View All Projects
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
