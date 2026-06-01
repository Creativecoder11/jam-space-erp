"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Phone, Mail, MapPin, Building2, Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatDate, getStatusColor } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type Payment = {
  id: string;
  amount: number;
  paymentType: string;
  paymentDate: string;
  description?: string;
};

type Project = {
  id: string;
  name: string;
  status: string;
  estimatedBudget: number;
  totalPaid: number;
  totalDue: number;
  progress: number;
  payments: Payment[];
};

type Client = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  company?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  projects: Project[];
};

const paymentTypeLabel: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  CASH: "Cash",
  MOBILE_BANKING: "Mobile Banking",
  CHEQUE: "Cheque",
};

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${clientId}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(d => { if (d) setClient(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="text-center py-32 text-muted-foreground">
        <p className="text-lg font-medium">Client not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/clients">Back to Clients</Link>
        </Button>
      </div>
    );
  }

  const initials = client.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const totalPaid = client.projects.reduce((a, p) => a + Number(p.totalPaid), 0);
  const totalDue = client.projects.reduce((a, p) => a + Number(p.totalDue), 0);
  const allPayments = client.projects.flatMap(p => p.payments ?? []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/clients"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="w-14 h-14">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{client.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {client.company && <span className="text-sm text-muted-foreground">{client.company}</span>}
                  <Badge variant={client.isActive ? "success" : "secondary"}>
                    {client.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Projects", value: client.projects.length, color: "text-blue-600" },
          { label: "Active Projects", value: client.projects.filter(p => p.status === "IN_PROGRESS").length, color: "text-orange-600" },
          { label: "Total Paid", value: `৳${totalPaid.toLocaleString("en-IN")}`, color: "text-emerald-600" },
          { label: "Total Due", value: totalDue > 0 ? `৳${totalDue.toLocaleString("en-IN")}` : "Clear", color: totalDue > 0 ? "text-red-500" : "text-muted-foreground" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={cn("text-xl font-bold mt-1", stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{client.phone}</span>
            </div>
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{client.email}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{client.address}</span>
              </div>
            )}
            {client.company && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{client.company}</span>
              </div>
            )}
            {client.notes && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-xs">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects & Payments */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="projects">
            <TabsList>
              <TabsTrigger value="projects">Projects ({client.projects.length})</TabsTrigger>
              <TabsTrigger value="payments">Payments ({allPayments.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-4">
              {client.projects.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-sm text-muted-foreground">No projects yet</CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {client.projects.map((project) => (
                    <Card key={project.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <Link href={`/projects/${project.id}`}>
                              <p className="font-medium hover:text-primary transition-colors">{project.name}</p>
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", getStatusColor(project.status))}>
                                {project.status.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold">৳{Number(project.estimatedBudget).toLocaleString("en-IN")}</p>
                            <p className="text-xs text-muted-foreground">Budget</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span>{project.progress ?? 0}%</span>
                          </div>
                          <Progress value={project.progress ?? 0} className="h-1.5" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Paid</p>
                            <p className="font-medium text-emerald-600">৳{Number(project.totalPaid).toLocaleString("en-IN")}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Due</p>
                            <p className={cn("font-medium", Number(project.totalDue) > 0 ? "text-red-500" : "text-muted-foreground")}>
                              {Number(project.totalDue) > 0 ? `৳${Number(project.totalDue).toLocaleString("en-IN")}` : "Clear"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {allPayments.length === 0 ? (
                    <p className="text-center py-8 text-sm text-muted-foreground">No payments recorded</p>
                  ) : (
                    <>
                      <div className="divide-y divide-border/50">
                        {allPayments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20">
                            <div>
                              <p className="text-sm font-medium">{payment.description || "Payment"}</p>
                              <p className="text-xs text-muted-foreground">
                                {paymentTypeLabel[payment.paymentType] ?? payment.paymentType} · {formatDate(new Date(payment.paymentDate))}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-emerald-600">৳{Number(payment.amount).toLocaleString("en-IN")}</p>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 py-3 border-t bg-muted/20 flex justify-between text-sm">
                        <span className="font-medium">Total</span>
                        <span className="font-bold text-emerald-600">
                          ৳{allPayments.reduce((a, p) => a + Number(p.amount), 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </>
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
