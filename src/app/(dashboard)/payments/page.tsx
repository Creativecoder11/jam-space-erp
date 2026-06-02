"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Receipt, CreditCard, TrendingUp,
  CheckCircle, MoreHorizontal, Pencil, Trash2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn, formatDate } from "@/lib/utils";
import { AddPaymentDialog, type PaymentRecord } from "@/components/payments/add-payment-dialog";
import { EditPaymentDialog } from "@/components/payments/edit-payment-dialog";

type GlobalPayment = PaymentRecord & { project: string; client: string };

const paymentTypeColors: Record<string, string> = {
  BANK_TRANSFER: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CASH: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  MOBILE_BANKING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  CHEQUE: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

const paymentTypeLabels: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  CASH: "Cash",
  MOBILE_BANKING: "Mobile Banking",
  CHEQUE: "Cheque",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<GlobalPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<GlobalPayment | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch("/api/payments?pageSize=200");
      if (res.ok) {
        const json = await res.json();
        setPayments((json.data ?? []).map((p: Record<string, unknown>) => {
          const proj = p.project as Record<string, unknown> | undefined;
          const client = proj?.client as Record<string, unknown> | undefined;
          return {
            id: p.id as string,
            amount: Number(p.amount),
            paymentType: p.paymentType as string,
            paymentDate: new Date(p.paymentDate as string),
            description: (p.description as string) ?? "",
            referenceNo: (p.referenceNo as string) ?? "",
            stage: (p.stage as string) ?? "",
            notes: (p.notes as string) ?? "",
            project: (proj?.name as string) ?? "—",
            client: (client?.name as string) ?? "—",
          } as GlobalPayment;
        }));
      }
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    toast.success("Payment deleted");
    fetch(`/api/payments/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const filtered = payments.filter((p) => {
    const matchSearch = p.project.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      (p.referenceNo ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.paymentType === typeFilter;
    return matchSearch && matchType;
  });

  const totalReceived = filtered.reduce((a, p) => a + p.amount, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Track all client payments and installments</p>
        </div>
        {/* <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Record Payment
        </Button> */}
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Received", value: `৳${totalReceived.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Cash Payments", value: `৳${filtered.filter(p => p.paymentType === "CASH").reduce((a, p) => a + p.amount, 0).toLocaleString("en-IN")}`, icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Bank Transfers", value: `৳${filtered.filter(p => p.paymentType === "BANK_TRANSFER").reduce((a, p) => a + p.amount, 0).toLocaleString("en-IN")}`, icon: Receipt, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Mobile Banking", value: `৳${filtered.filter(p => p.paymentType === "MOBILE_BANKING").reduce((a, p) => a + p.amount, 0).toLocaleString("en-IN")}`, icon: CheckCircle, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={cn("border-0 shadow-sm", stat.bg)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className={cn("w-8 h-8 shrink-0", stat.color)} />
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
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
            placeholder="Search by project, client, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Payment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="CASH">Cash</SelectItem>
            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
            <SelectItem value="MOBILE_BANKING">Mobile Banking</SelectItem>
            <SelectItem value="CHEQUE">Cheque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Payment Table */}
      {!loading && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Payment History
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filtered.length} records · ৳{totalReceived.toLocaleString("en-IN")})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{payments.length === 0 ? "No payments recorded yet" : "No payments match your filters"}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    {["Date", "Project", "Client", "Type", "Reference", "Stage", "Amount", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((payment) => (
                    <tr key={payment.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDate(payment.paymentDate)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm truncate max-w-[180px]">{payment.project}</p>
                        <p className="text-xs text-muted-foreground">{payment.description}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{payment.client}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", paymentTypeColors[payment.paymentType])}>
                          {paymentTypeLabels[payment.paymentType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{payment.referenceNo}</td>
                      <td className="px-4 py-3">
                        {payment.stage && <Badge variant="outline" className="text-xs">{payment.stage}</Badge>}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600">৳{payment.amount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => setEditingPayment(payment)}>
                              <Pencil className="w-4 h-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={() => deletePayment(payment.id)}>
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
                    <td colSpan={6} className="px-4 py-3 text-sm font-semibold">Total</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">৳{totalReceived.toLocaleString("en-IN")}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      <AddPaymentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={(p) => {
          setPayments(prev => [{ ...p, project: "—", client: "—" }, ...prev]);
          fetchPayments();
        }}
      />

      {editingPayment && (
        <EditPaymentDialog
          open={!!editingPayment}
          onOpenChange={(v) => !v && setEditingPayment(null)}
          payment={editingPayment}
          onSaved={(u) => {
            setPayments(prev => prev.map(p => p.id === u.id ? { ...p, ...u } : p));
            setEditingPayment(null);
          }}
        />
      )}
    </div>
  );
}
