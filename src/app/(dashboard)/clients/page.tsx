"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, MoreHorizontal, Eye, Trash2, Users,
  Phone, Mail, MapPin, Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateClientDialog } from "@/components/clients/create-client-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Client = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  company?: string;
  isActive: boolean;
  totalProjects: number;
  totalPaid: number;
  totalDue: number;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients?pageSize=200");
      if (res.ok) {
        const json = await res.json();
        setClients(json.data ?? []);
      }
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    toast.success("Client deleted");
    fetch(`/api/clients/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const totalDue = clients.reduce((a, c) => a + c.totalDue, 0);
  const totalPaid = clients.reduce((a, c) => a + c.totalPaid, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your client relationships</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Client
        </Button>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: clients.length, color: "text-blue-600" },
          { label: "Active", value: clients.filter(c => c.isActive).length, color: "text-emerald-600" },
          { label: "Total Paid", value: `৳${totalPaid.toLocaleString("en-IN")}`, color: "text-emerald-600" },
          { label: "Total Due", value: `৳${totalDue.toLocaleString("en-IN")}`, color: "text-red-500" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Client Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((client, i) => {
            const initials = client.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
            return (
              <motion.div key={client.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:shadow-md transition-all duration-200 group border-border/60">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="w-11 h-11 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link href={`/clients/${client.id}`}>
                            <h3 className="font-semibold text-sm hover:text-primary transition-colors cursor-pointer truncate">{client.name}</h3>
                          </Link>
                          {client.company && (
                            <p className="text-xs text-muted-foreground truncate">{client.company}</p>
                          )}
                          <Badge variant={client.isActive ? "success" : "secondary"} className="text-xs mt-1">
                            {client.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 shrink-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/clients/${client.id}`} className="gap-2">
                              <Eye className="w-4 h-4" /> View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={() => deleteClient(client.id)}>
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                      {client.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{client.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Projects</p>
                        <p className="font-bold text-sm">{client.totalProjects}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="font-bold text-sm text-emerald-600">৳{client.totalPaid.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Due</p>
                        <p className={cn("font-bold text-sm", client.totalDue > 0 ? "text-red-500" : "text-muted-foreground")}>
                          {client.totalDue > 0 ? `৳${client.totalDue.toLocaleString("en-IN")}` : "Clear"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {!loading && filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">{clients.length === 0 ? "No clients yet" : "No clients match your search"}</p>
              {clients.length === 0 && (
                <Button className="mt-4 gap-2" onClick={() => setCreateOpen(true)}>
                  <Plus className="w-4 h-4" /> Add First Client
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <CreateClientDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(c) => {
          const saved = c as Record<string, unknown>;
          setClients(prev => [{
            id: saved.id as string,
            name: saved.name as string,
            email: saved.email as string | undefined,
            phone: saved.phone as string,
            address: saved.address as string | undefined,
            company: saved.company as string | undefined,
            isActive: (saved.isActive as boolean) ?? true,
            totalProjects: 0,
            totalPaid: 0,
            totalDue: 0,
          }, ...prev]);
        }}
      />
    </div>
  );
}
