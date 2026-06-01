"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  LayoutDashboard,
  FolderKanban,
  Users,
  Calculator,
  CreditCard,
  BarChart3,
  Settings,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", href: "/projects", icon: FolderKanban },
  { title: "Clients", href: "/clients", icon: Users },
  { title: "Cost Management", href: "/costs", icon: Calculator },
  { title: "Payments", href: "/payments", icon: CreditCard },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Users", href: "/users", icon: UserCog },
  { title: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 z-30 h-screen bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl  flex items-center justify-center shrink-0 shadow-lg">
              <img
                src="/assets/Jam%20-%20Logo.png"
                alt="Jam Space logo"
                width={30}
                height={30}
                className="h-5 w-5 object-contain"
              />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="min-w-0"
                >
                  <p className="text-sidebar-foreground font-bold text-sm truncate">Jam Space</p>
                  <p className="text-sidebar-foreground/40 text-xs truncate">ERP Platform</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return collapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center w-full h-10 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-white/10 text-sidebar-foreground"
                        : "text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 h-10 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-white/10 text-sidebar-foreground"
                    : "text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-blue-400")} />
                <span className="text-sm font-medium truncate">{item.title}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-8 bg-blue-400 rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="border-t border-sidebar-border p-3 shrink-0">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center justify-center w-full h-10 rounded-lg text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={session?.user?.image ?? ""} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{session?.user?.name}</TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarImage src={session?.user?.image ?? ""} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sidebar-foreground text-sm font-medium truncate">
                  {session?.user?.name}
                </p>
                <p className="text-sidebar-foreground/40 text-xs truncate">
                  {session?.user?.role?.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-sidebar-foreground/40 hover:text-red-400 transition-colors p-1 rounded"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar-border border border-sidebar-border text-sidebar-foreground flex items-center justify-center hover:bg-white/10 transition-colors z-10"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </motion.aside>
    </TooltipProvider>
  );
}
