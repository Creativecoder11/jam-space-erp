"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Edit, Paperclip, StickyNote, MapPin, Calendar,
  User, Phone, Mail, Plus, FileText, ExternalLink,
  MoreHorizontal, Trash2, Pencil, Loader2, CreditCard, Receipt,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatDate, formatRelativeTime, getStatusColor } from "@/lib/utils";

import { AddPaymentDialog, type PaymentRecord } from "@/components/payments/add-payment-dialog";
import { EditPaymentDialog } from "@/components/payments/edit-payment-dialog";
import { AddExpenseDialog, type ExpenseRecord } from "@/components/costs/add-expense-dialog";
import { EditExpenseDialog } from "@/components/costs/edit-expense-dialog";
import { AddNoteDialog, type NoteRecord } from "@/components/projects/add-note-dialog";
import { AddDocumentDialog, type DocumentRecord } from "@/components/projects/add-document-dialog";
import { EditProjectDialog, type ProjectData } from "@/components/projects/edit-project-dialog";

type ProjectDetail = ProjectData & {
  startDate: Date;
  totalCost: number;
  totalPaid: number;
  totalDue: number;
  expectedProfit: number;
  client: { name: string; phone: string; email: string; address: string };
  manager: { name: string } | null;
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer", CASH: "Cash", MOBILE_BANKING: "Mobile Banking", CHEQUE: "Cheque",
};

type ActivityEntry = {
  id: string;
  action: string;
  entity: string;
  description: string;
  createdAt: Date;
  user?: { name: string } | null;
};

type ActivityIconConfig = { icon: LucideIcon; color: string; bg: string };

function getActivityConfig(action: string, entity: string): ActivityIconConfig {
  const key = `${action}:${entity}`;
  const map: Record<string, ActivityIconConfig> = {
    "CREATE:Payment":  { icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/40" },
    "UPDATE:Payment":  { icon: Pencil,     color: "text-blue-600",    bg: "bg-blue-100 dark:bg-blue-900/40" },
    "DELETE:Payment":  { icon: Trash2,     color: "text-red-500",     bg: "bg-red-100 dark:bg-red-900/40" },
    "CREATE:Cost":     { icon: Receipt,    color: "text-orange-600",  bg: "bg-orange-100 dark:bg-orange-900/40" },
    "UPDATE:Cost":     { icon: Pencil,     color: "text-blue-600",    bg: "bg-blue-100 dark:bg-blue-900/40" },
    "DELETE:Cost":     { icon: Trash2,     color: "text-red-500",     bg: "bg-red-100 dark:bg-red-900/40" },
    "CREATE:Note":     { icon: StickyNote, color: "text-yellow-600",  bg: "bg-yellow-100 dark:bg-yellow-900/40" },
    "UPDATE:Note":     { icon: Pencil,     color: "text-blue-600",    bg: "bg-blue-100 dark:bg-blue-900/40" },
    "DELETE:Note":     { icon: Trash2,     color: "text-red-500",     bg: "bg-red-100 dark:bg-red-900/40" },
    "CREATE:Document": { icon: FileText,   color: "text-indigo-600",  bg: "bg-indigo-100 dark:bg-indigo-900/40" },
    "UPDATE:Document": { icon: Pencil,     color: "text-blue-600",    bg: "bg-blue-100 dark:bg-blue-900/40" },
    "DELETE:Document": { icon: Trash2,     color: "text-red-500",     bg: "bg-red-100 dark:bg-red-900/40" },
  };
  return map[key] ?? { icon: Edit, color: "text-muted-foreground", bg: "bg-muted" };
}

/* ─── inline note editor ─── */
function NoteCard({ note, onSave, onDelete }: {
  note: NoteRecord;
  onSave: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.content);

  const save = async () => {
    if (!draft.trim()) return;
    onSave(note.id, draft.trim());
    setEditing(false);
    toast.success("Note updated!");
  };

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4 group">
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="w-full text-sm leading-relaxed bg-background border border-border rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => { setDraft(note.content); setEditing(false); }}>Cancel</Button>
            <Button size="sm" onClick={save}>Save</Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap flex-1">{note.content}</p>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(note.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-2">{formatDate(note.createdAt)}</p>
    </div>
  );
}

/* ─── page ─── */
export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [costs, setCosts] = useState<ExpenseRecord[]>([]);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityEntry[]>([]);

  // dialog visibility
  const [showEdit, setShowEdit] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showDoc, setShowDoc] = useState(false);

  // edit targets
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) { toast.error("Project not found"); return; }
      const data = await res.json();

      setProject({
        id: data.id,
        name: data.name,
        type: data.type,
        status: data.status,
        location: data.location ?? "",
        description: data.description ?? "",
        startDate: new Date(data.startDate),
        estimatedEndDate: data.estimatedEndDate ? new Date(data.estimatedEndDate) : undefined,
        estimatedBudget: Number(data.estimatedBudget),
        totalCost: Number(data.totalCost),
        totalPaid: Number(data.totalPaid),
        totalDue: Number(data.totalDue),
        expectedProfit: Number(data.expectedProfit ?? 0),
        progress: data.progress ?? 0,
        client: {
          name: data.client?.name ?? "",
          phone: data.client?.phone ?? "",
          email: data.client?.email ?? "",
          address: data.client?.address ?? "",
        },
        manager: data.manager ? { name: data.manager.name } : null,
      });

      setPayments((data.payments ?? []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        amount: Number(p.amount),
        paymentType: p.paymentType as string,
        paymentDate: new Date(p.paymentDate as string),
        description: p.description as string ?? "",
        referenceNo: p.referenceNo as string ?? "",
        stage: p.stage as string ?? "",
      })));

      setCosts((data.costs ?? []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        date: new Date(c.date as string),
        invoiceNo: c.invoiceNo as string ?? "",
        description: c.description as string ?? "",
        category: c.categoryId as string ?? "",
        vendor: c.vendorName as string ?? "",
        qty: Number(c.quantity),
        unit: c.unit as string ?? "",
        unitPrice: Number(c.unitPrice),
        total: Number(c.totalCost),
        status: c.paymentStatus as string ?? "UNPAID",
      })));

      setNotes((data.notes ?? []).map((n: Record<string, unknown>) => ({
        id: n.id as string,
        content: n.content as string,
        createdAt: new Date(n.createdAt as string),
      })));

      setDocuments((data.documents ?? []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        name: d.name as string,
        description: d.description as string ?? "",
        fileUrl: d.fileUrl as string,
        uploadedAt: new Date(d.uploadedAt as string),
      })));

      setActivityLogs((data.activityLogs ?? []).map((a: Record<string, unknown>) => {
        const u = a.user as Record<string, unknown> | null | undefined;
        return {
          id: a.id as string,
          action: a.action as string,
          entity: a.entity as string,
          description: a.description as string,
          createdAt: new Date(a.createdAt as string),
          user: u ? { name: u.name as string } : null,
        };
      }));
    } catch {
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  /* ── helpers ── */
  const pushActivity = (action: string, entity: string, description: string) => {
    setActivityLogs(prev => [{
      id: crypto.randomUUID(),
      action, entity, description,
      createdAt: new Date(),
      user: null,
    }, ...prev]);
  };

  const deletePayment = async (id: string) => {
    const p = payments.find(x => x.id === id);
    setPayments(prev => prev.filter(x => x.id !== id));
    toast.success("Payment deleted");
    await fetch(`/api/payments/${id}`, { method: "DELETE" }).catch(() => {});
    if (p) pushActivity("DELETE", "Payment", `Payment of ৳${p.amount.toLocaleString("en-IN")} deleted`);
  };

  const deleteExpense = async (id: string) => {
    const c = costs.find(x => x.id === id);
    setCosts(prev => prev.filter(x => x.id !== id));
    toast.success("Expense deleted");
    await fetch(`/api/costs/${id}`, { method: "DELETE" }).catch(() => {});
    if (c) pushActivity("DELETE", "Cost", `Expense deleted — ${c.description} (৳${c.total.toLocaleString("en-IN")})`);
  };

  const deleteNote = async (id: string) => {
    setNotes(n => n.filter(x => x.id !== id));
    toast.success("Note deleted");
    await fetch(`/api/projects/${projectId}/notes/${id}`, { method: "DELETE" }).catch(() => {});
    pushActivity("DELETE", "Note", "Note deleted");
  };

  const deleteDocument = async (id: string) => {
    const d = documents.find(x => x.id === id);
    setDocuments(prev => prev.filter(x => x.id !== id));
    toast.success("Document deleted");
    await fetch(`/api/projects/${projectId}/documents/${id}`, { method: "DELETE" }).catch(() => {});
    if (d) pushActivity("DELETE", "Document", `Document deleted — "${d.name}"`);
  };

  const updateNote = (id: string, content: string) => {
    setNotes(n => n.map(x => x.id === id ? { ...x, content } : x));
    fetch(`/api/projects/${projectId}/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }).catch(() => {});
    pushActivity("UPDATE", "Note", `Note updated — "${content.slice(0, 60)}${content.length > 60 ? "…" : ""}"`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-muted-foreground">Project not found.</p>
        <Button asChild variant="outline"><Link href="/projects">Back to Projects</Link></Button>
      </div>
    );
  }

  // Always compute from live arrays — never trust stale DB fields
  const totalPaid = payments.reduce((a, p) => a + p.amount, 0);
  const totalCostSum = costs.reduce((a, c) => a + c.total, 0);
  const totalDue = Math.max(0, project.estimatedBudget - totalPaid);
  const expectedProfit = project.estimatedBudget - totalCostSum;
  const progress = project.estimatedBudget > 0
    ? Math.min(100, Math.round((totalPaid / project.estimatedBudget) * 100))
    : 0;
  const isProfit = expectedProfit > 0;
  const profitMargin = project.estimatedBudget > 0
    ? ((expectedProfit / project.estimatedBudget) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      {/* ── Dialogs ── */}
      <EditProjectDialog open={showEdit} onOpenChange={setShowEdit} project={project}
        onSaved={(u) => setProject(p => p ? { ...p, ...u } : p)} />

      <AddPaymentDialog open={showPayment} onOpenChange={setShowPayment}
        projectId={projectId} projectName={project.name}
        onAdded={(p) => {
          setPayments(prev => [p, ...prev]);
          pushActivity("CREATE", "Payment", `Payment of ৳${p.amount.toLocaleString("en-IN")} recorded${p.description ? ` — ${p.description}` : ""}`);
        }} />

      {editingPayment && (
        <EditPaymentDialog open={!!editingPayment} onOpenChange={(v) => !v && setEditingPayment(null)}
          payment={editingPayment}
          onSaved={(u) => {
            setPayments(prev => prev.map(x => x.id === u.id ? u : x));
            setEditingPayment(null);
            pushActivity("UPDATE", "Payment", `Payment updated — ৳${u.amount.toLocaleString("en-IN")}`);
          }} />
      )}

      <AddExpenseDialog open={showExpense} onOpenChange={setShowExpense}
        projectId={projectId} projectName={project.name}
        onAdded={(e) => {
          setCosts(prev => [e, ...prev]);
          pushActivity("CREATE", "Cost", `Expense added — ${e.description} (৳${e.total.toLocaleString("en-IN")})`);
        }} />

      {editingExpense && (
        <EditExpenseDialog open={!!editingExpense} onOpenChange={(v) => !v && setEditingExpense(null)}
          expense={editingExpense}
          onSaved={(u) => {
            setCosts(prev => prev.map(x => x.id === u.id ? u : x));
            setEditingExpense(null);
            pushActivity("UPDATE", "Cost", `Expense updated — ${u.description} (৳${u.total.toLocaleString("en-IN")})`);
          }} />
      )}

      <AddNoteDialog open={showNote} onOpenChange={setShowNote}
        projectId={projectId} onAdded={(n) => {
          setNotes(prev => [n, ...prev]);
          pushActivity("CREATE", "Note", `Note added — "${n.content.slice(0, 60)}${n.content.length > 60 ? "…" : ""}"`);
        }} />

      <AddDocumentDialog open={showDoc} onOpenChange={setShowDoc}
        projectId={projectId} onAdded={(d) => {
          setDocuments(prev => [d, ...prev]);
          pushActivity("CREATE", "Document", `Document uploaded — "${d.name}"`);
        }} />

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/projects"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {project.location && <><MapPin className="w-3 h-3 text-muted-foreground" /><span className="text-sm text-muted-foreground">{project.location}</span></>}
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", getStatusColor(project.status))}>
                  {project.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowEdit(true)}>
              <Edit className="w-4 h-4" /> Edit Project
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Budget", value: `৳${project.estimatedBudget.toLocaleString("en-IN")}`, color: "text-blue-600" },
          { label: "Total Cost", value: `৳${totalCostSum.toLocaleString("en-IN")}`, color: "text-orange-600" },
          { label: "Total Paid", value: `৳${totalPaid.toLocaleString("en-IN")}`, color: "text-emerald-600" },
          { label: "Total Due", value: totalDue > 0 ? `৳${totalDue.toLocaleString("en-IN")}` : "Clear", color: totalDue > 0 ? "text-red-500" : "text-muted-foreground" },
          { label: "Exp. Profit", value: `৳${expectedProfit.toLocaleString("en-IN")}`, color: expectedProfit >= 0 ? "text-purple-600" : "text-red-500" },
          { label: "Progress", value: `${progress}%`, color: "text-primary" },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={cn("text-lg font-bold mt-1", item.color)}>{item.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left info */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Project Information</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div><p className="text-xs text-muted-foreground">Start Date</p><p className="font-medium">{formatDate(project.startDate)}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div><p className="text-xs text-muted-foreground">Estimated End</p><p className="font-medium">{project.estimatedEndDate ? formatDate(project.estimatedEndDate) : "—"}</p></div>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Payment Progress</p>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">৳{totalPaid.toLocaleString("en-IN")} of ৳{project.estimatedBudget.toLocaleString("en-IN")}</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
              {project.description && <><Separator /><div><p className="text-xs text-muted-foreground mb-1">Description</p><p className="text-xs leading-relaxed">{project.description}</p></div></>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Client Information</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /><span className="font-medium">{project.client.name}</span></div>
              {project.client.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><span>{project.client.phone}</span></div>}
              {project.client.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /><span>{project.client.email}</span></div>}
              {project.client.address && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /><span>{project.client.address}</span></div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Financial Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {[
                { label: "Estimated Budget", value: `৳${project.estimatedBudget.toLocaleString("en-IN")}`, color: "" },
                { label: "Total Cost", value: `৳${totalCostSum.toLocaleString("en-IN")}`, color: "text-orange-600" },
                { label: "Total Paid", value: `৳${totalPaid.toLocaleString("en-IN")}`, color: "text-emerald-600" },
                { label: "Total Due", value: totalDue > 0 ? `৳${totalDue.toLocaleString("en-IN")}` : "Clear", color: totalDue > 0 ? "text-red-500" : "text-muted-foreground" },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={cn("font-semibold", item.color)}>{item.value}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span>Expected Profit</span>
                <span className={cn(isProfit ? "text-emerald-600" : "text-red-500")}>
                  {isProfit ? "+" : ""}৳{expectedProfit.toLocaleString("en-IN")} ({profitMargin}%)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="payments">
            <TabsList className="grid w-full grid-cols-5">
              {[
                { value: "payments", label: "Payments", count: payments.length },
                { value: "expenses", label: "Expenses", count: costs.length },
                { value: "documents", label: "Docs", count: documents.length },
                { value: "notes", label: "Notes", count: notes.length },
                { value: "activity", label: "Activity", count: activityLogs.length },
              ].map(t => (
                <TabsTrigger key={t.value} value={t.value} className="text-xs gap-1">
                  {t.label}
                  {t.count > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{t.count}</Badge>}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── PAYMENTS ── */}
            <TabsContent value="payments" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Payment History</CardTitle>
                    <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => setShowPayment(true)}>
                      <Plus className="w-3 h-3" /> Add Payment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {payments.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <p className="text-sm">No payments recorded yet</p>
                      <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={() => setShowPayment(true)}>
                        <Plus className="w-3 h-3" /> Record First Payment
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-border/50">
                        {payments.map(payment => (
                          <div key={payment.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 group">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{payment.description || "Payment"}</p>
                              <p className="text-xs text-muted-foreground">
                                {PAYMENT_TYPE_LABELS[payment.paymentType] ?? payment.paymentType}
                                {payment.referenceNo && ` · ${payment.referenceNo}`}
                              </p>
                              <p className="text-xs text-muted-foreground">{formatDate(payment.paymentDate)}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-bold text-emerald-600">৳{payment.amount.toLocaleString("en-IN")}</p>
                                {payment.stage && <Badge variant="outline" className="text-xs">{payment.stage}</Badge>}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 h-7 w-7">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingPayment(payment)}>
                                    <Pencil className="w-4 h-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => deletePayment(payment.id)}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 py-3 border-t bg-muted/20 flex justify-between text-sm">
                        <span className="font-medium">Total Paid</span>
                        <span className="font-bold text-emerald-600">৳{totalPaid.toLocaleString("en-IN")}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── EXPENSES ── */}
            <TabsContent value="expenses" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Cost Breakdown</CardTitle>
                    <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => setShowExpense(true)}>
                      <Plus className="w-3 h-3" /> Add Expense
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  {costs.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <p className="text-sm">No expenses recorded yet</p>
                      <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={() => setShowExpense(true)}>
                        <Plus className="w-3 h-3" /> Add First Expense
                      </Button>
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                          <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Vendor</th>
                          <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                          <th className="text-center px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {costs.map(cost => (
                          <tr key={cost.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 group">
                            <td className="px-4 py-3">
                              <p className="font-medium">{cost.description}</p>
                              <p className="text-muted-foreground">{cost.category} · {formatDate(cost.date)}</p>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{cost.vendor ?? "—"}</td>
                            <td className="px-4 py-3 text-right font-semibold">৳{cost.total.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                                cost.status === "PAID" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                cost.status === "PARTIAL" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              )}>
                                {cost.status}
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
                                  <DropdownMenuItem onClick={() => setEditingExpense(cost)}>
                                    <Pencil className="w-4 h-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => deleteExpense(cost.id)}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t bg-muted/20">
                          <td colSpan={2} className="px-4 py-3 font-semibold text-sm">Total</td>
                          <td className="px-4 py-3 text-right font-bold text-sm">৳{totalCostSum.toLocaleString("en-IN")}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── DOCUMENTS ── */}
            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Documents</CardTitle>
                    <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => setShowDoc(true)}>
                      <Plus className="w-3 h-3" /> Upload
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Paperclip className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No documents uploaded yet</p>
                      <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={() => setShowDoc(true)}>
                        <Plus className="w-3 h-3" /> Upload Document
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {documents.map(doc => (
                        <div key={doc.id} className="flex items-center gap-3 py-3 group">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            {doc.description && <p className="text-xs text-muted-foreground">{doc.description}</p>}
                            <p className="text-xs text-muted-foreground">{formatDate(doc.uploadedAt)}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button onClick={() => deleteDocument(doc.id)}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── NOTES ── */}
            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Notes</CardTitle>
                    <Button size="sm" className="gap-1 h-7 text-xs" onClick={() => setShowNote(true)}>
                      <Plus className="w-3 h-3" /> Add Note
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {notes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <StickyNote className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No notes added yet</p>
                      <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={() => setShowNote(true)}>
                        <Plus className="w-3 h-3" /> Add First Note
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map(note => (
                        <NoteCard key={note.id} note={note} onSave={updateNote} onDelete={deleteNote} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── ACTIVITY ── */}
            <TabsContent value="activity" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                  {activityLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No activity yet — start by adding a payment or expense.</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* vertical line */}
                      <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
                      <div className="space-y-1">
                        {activityLogs.map((entry) => {
                          const cfg = getActivityConfig(entry.action, entry.entity);
                          const Icon = cfg.icon;
                          return (
                            <div key={entry.id} className="flex gap-4 pl-1 py-2.5 group">
                              {/* icon */}
                              <div className={cn("relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", cfg.bg)}>
                                <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                              </div>
                              {/* text */}
                              <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-sm leading-snug">{entry.description}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {entry.user?.name && <span className="font-medium">{entry.user.name} · </span>}
                                  {formatRelativeTime(entry.createdAt)}
                                  <span className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    ({formatDate(entry.createdAt)})
                                  </span>
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
