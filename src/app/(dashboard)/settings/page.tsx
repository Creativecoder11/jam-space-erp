"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Building2, Bell, Shield, Upload, Globe } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your company settings and preferences</p>
      </motion.div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company" className="gap-2"><Building2 className="w-4 h-4" />Company</TabsTrigger>
          <TabsTrigger value="invoice" className="gap-2"><Globe className="w-4 h-4" />Invoice</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" />Notifications</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="w-4 h-4" />Security</TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company Information</CardTitle>
              <CardDescription>Update your company profile and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Logo */}
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="w-4 h-4" /> Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB. Recommended 400x400px</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Company Name</Label>
                  <Input defaultValue="Jam Space Interior & Realty" />
                </div>
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input defaultValue="www.jamspace.com.bd" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" defaultValue="info@jamspace.com.bd" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input defaultValue="+880-2-XXXX-XXXX" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Address</Label>
                  <Input defaultValue="123, Gulshan Avenue, Gulshan-2, Dhaka-1212, Bangladesh" />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select defaultValue="BDT">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BDT">BDT (৳) - Bangladeshi Taka</SelectItem>
                      <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tax Rate (%)</Label>
                  <Input type="number" defaultValue="15" step="0.1" />
                </div>
              </div>

              <Button onClick={handleSave} loading={saving} className="gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Settings */}
        <TabsContent value="invoice" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Settings</CardTitle>
              <CardDescription>Configure invoice numbering and defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Invoice Prefix</Label>
                  <Input defaultValue="INV" />
                </div>
                <div className="space-y-1.5">
                  <Label>Starting Number</Label>
                  <Input type="number" defaultValue="1001" />
                </div>
                <div className="space-y-1.5">
                  <Label>Payment Terms (days)</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div className="space-y-1.5">
                  <Label>Default Tax Rate</Label>
                  <Input type="number" defaultValue="15" step="0.1" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Footer Note</Label>
                  <Input defaultValue="Thank you for your business. Payment due within 30 days." />
                </div>
              </div>
              <Button onClick={handleSave} loading={saving} className="gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Choose when and how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { title: "Payment Received", desc: "Get notified when a client payment is recorded", defaultChecked: true },
                { title: "Due Payment Alerts", desc: "Receive alerts for overdue client payments", defaultChecked: true },
                { title: "New Expense Added", desc: "Notification when a new project expense is logged", defaultChecked: false },
                { title: "Project Status Change", desc: "Get notified when project status changes", defaultChecked: true },
                { title: "New Client Added", desc: "Notification when a new client is registered", defaultChecked: false },
                { title: "Monthly Reports", desc: "Receive monthly financial summary reports", defaultChecked: true },
              ].map((notif) => (
                <div key={notif.title} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">{notif.desc}</p>
                  </div>
                  <Switch defaultChecked={notif.defaultChecked} />
                </div>
              ))}
              <Separator />
              <Button onClick={handleSave} loading={saving} className="gap-2">
                <Save className="w-4 h-4" /> Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security Settings</CardTitle>
              <CardDescription>Manage authentication and access control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Change Password</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Current Password</Label>
                    <Input type="password" placeholder="Enter current password" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>New Password</Label>
                    <Input type="password" placeholder="Enter new password" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm New Password</Label>
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                  <Button size="sm">Update Password</Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Session Management</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Auto logout after inactivity</p>
                    <p className="text-xs text-muted-foreground">Automatically log out after 30 minutes of inactivity</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
