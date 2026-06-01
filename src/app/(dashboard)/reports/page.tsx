"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Download, TrendingUp, TrendingDown,
  DollarSign, BarChart3, Filter, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/components/costs/add-expense-dialog";

const CATEGORY_COLORS = ["#3b82f6", "#8b5cf6", "#6366f1", "#f59e0b", "#ef4444", "#10b981", "#6b7280", "#ec4899"];

type MonthlyRow = { month: string; revenue: number; expenses: number; profit: number };
type ProjectRow = { id: string; name: string; client: string; totalPaid: number; totalCost: number };
type ReportData = {
  summary: { totalRevenue: number; totalExpenses: number; netProfit: number; profitMargin: number };
  monthlyData: MonthlyRow[];
  expenseByCategory: Record<string, number>;
  projects: ProjectRow[];
};

function thisYear() {
  const y = new Date().getFullYear();
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}

export default function ReportsPage() {
  const defaults = thisYear();
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(dateFrom, dateTo); }, [fetchReports, dateFrom, dateTo]);

  const summary = data?.summary ?? { totalRevenue: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0 };
  const monthlyData = data?.monthlyData ?? [];
  const projects = data?.projects ?? [];

  const expenseCategories = Object.entries(data?.expenseByCategory ?? {}).map(([id, value], i) => ({
    name: CATEGORIES.find(c => c.id === id)?.name ?? id,
    value,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const totalExpCat = expenseCategories.reduce((a, c) => a + c.value, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Comprehensive financial and project reports</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" /> Export
        </Button>
      </motion.div>

      {/* Date Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs">From Date</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To Date</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-40" />
            </div>
            <Button size="sm" className="gap-2" onClick={() => fetchReports(dateFrom, dateTo)}>
              <Filter className="w-4 h-4" /> Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Revenue", value: `৳${summary.totalRevenue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-emerald-600" },
              { label: "Total Expenses", value: `৳${summary.totalExpenses.toLocaleString("en-IN")}`, icon: TrendingDown, color: "text-red-500" },
              { label: "Net Profit", value: `৳${summary.netProfit.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-blue-600" },
              { label: "Profit Margin", value: `${summary.profitMargin.toFixed(1)}%`, icon: BarChart3, color: "text-purple-600" },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">{kpi.label}</p>
                          <p className={cn("text-xl font-bold mt-1", kpi.color)}>{kpi.value}</p>
                        </div>
                        <Icon className={cn("w-8 h-8", kpi.color)} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Report Tabs */}
          <Tabs defaultValue="profit-loss">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profit-loss">P&L Report</TabsTrigger>
              <TabsTrigger value="expenses">Expense Report</TabsTrigger>
              <TabsTrigger value="projects">Project Report</TabsTrigger>
            </TabsList>

            <TabsContent value="profit-loss" className="mt-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Monthly Profit & Loss</CardTitle>
                  <CardDescription>Revenue, expenses, and profit overview</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlyData.length === 0 ? (
                    <p className="text-center py-8 text-sm text-muted-foreground">No data for selected period</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `৳${Number(v).toLocaleString("en-IN")}`} />
                        <RechartTooltip formatter={(value: unknown) => [`৳${Number(value).toLocaleString("en-IN")}`, ""]} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                        <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                        <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Profit" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {monthlyData.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Summary Table</CardTitle></CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          {["Month", "Revenue", "Expenses", "Profit", "Margin"].map((h) => (
                            <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.map((row) => (
                          <tr key={row.month} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium">{row.month}</td>
                            <td className="px-4 py-3 text-blue-600">৳{row.revenue.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-red-500">৳{row.expenses.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-emerald-600 font-semibold">৳{row.profit.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3">
                              {row.revenue > 0 ? `${((row.profit / row.revenue) * 100).toFixed(1)}%` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="expenses" className="mt-4">
              {expenseCategories.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-sm text-muted-foreground">No expense data for selected period</CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Expense by Category</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <RPieChart>
                          <Pie
                            data={expenseCategories}
                            cx="50%" cy="50%"
                            outerRadius={90}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {expenseCategories.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartTooltip formatter={(value: unknown) => [`৳${Number(value).toLocaleString("en-IN")}`, ""]} />
                        </RPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Expense Details</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/50">
                        {expenseCategories.map((cat) => (
                          <div key={cat.name} className="flex items-center gap-3 px-5 py-3">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
                            <span className="flex-1 text-sm">{cat.name}</span>
                            <span className="font-semibold text-sm">৳{cat.value.toLocaleString("en-IN")}</span>
                            <span className="text-xs text-muted-foreground w-12 text-right">
                              {totalExpCat > 0 ? `${((cat.value / totalExpCat) * 100).toFixed(1)}%` : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="projects" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project Summary Report</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  {projects.length === 0 ? (
                    <p className="text-center py-8 text-sm text-muted-foreground">No projects found</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          {["Project", "Client", "Revenue", "Cost", "Profit", "Margin"].map((h) => (
                            <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((row) => {
                          const profit = row.totalPaid - row.totalCost;
                          const margin = row.totalPaid > 0 ? (profit / row.totalPaid) * 100 : 0;
                          return (
                            <tr key={row.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                              <td className="px-4 py-3 font-medium">{row.name}</td>
                              <td className="px-4 py-3 text-muted-foreground">{row.client}</td>
                              <td className="px-4 py-3 text-blue-600">৳{row.totalPaid.toLocaleString("en-IN")}</td>
                              <td className="px-4 py-3 text-orange-600">৳{row.totalCost.toLocaleString("en-IN")}</td>
                              <td className="px-4 py-3 text-emerald-600 font-semibold">৳{profit.toLocaleString("en-IN")}</td>
                              <td className="px-4 py-3">
                                <span className={cn("font-medium", margin > 30 ? "text-emerald-600" : margin > 15 ? "text-orange-600" : "text-red-500")}>
                                  {margin.toFixed(1)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
