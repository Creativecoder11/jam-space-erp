import {
  Role,
  ProjectType,
  ProjectStatus,
  PaymentType,
  PaymentStatus,
  CostPaymentStatus,
} from "@prisma/client";

export type { Role, ProjectType, ProjectStatus, PaymentType, PaymentStatus, CostPaymentStatus };

export interface DashboardStats {
  totalProjects: number;
  runningProjects: number;
  completedProjects: number;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  totalClientDue: number;
  totalClientPaid: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
}

export interface ChartDataPoint {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface ProjectWithRelations {
  id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  location: string | null;
  description: string | null;
  startDate: Date;
  estimatedEndDate: Date | null;
  estimatedBudget: number;
  totalCost: number;
  totalPaid: number;
  totalDue: number;
  expectedProfit: number;
  client: { id: string; name: string; phone: string; email: string | null };
  manager: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientWithStats {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  company: string | null;
  isActive: boolean;
  totalProjects: number;
  totalPaid: number;
  totalDue: number;
  createdAt: Date;
}

export interface PaymentWithProject {
  id: string;
  projectId: string;
  amount: number;
  paymentType: PaymentType;
  paymentDate: Date;
  description: string | null;
  referenceNo: string | null;
  stage: string | null;
  project: { id: string; name: string; client: { name: string } };
  createdAt: Date;
}

export interface CostWithCategory {
  id: string;
  projectId: string;
  categoryId: string;
  date: Date;
  invoiceNo: string | null;
  description: string;
  vendorName: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  totalCost: number;
  paymentStatus: CostPaymentStatus;
  notes: string | null;
  category: { id: string; name: string; color: string | null };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavItem[];
  roles?: Role[];
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: string;
    };
  }
  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}
