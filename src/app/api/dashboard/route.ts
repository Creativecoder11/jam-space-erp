import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalProjects,
      runningProjects,
      completedProjects,
      totalClients,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: "IN_PROGRESS" } }),
      prisma.project.count({ where: { status: "COMPLETED" } }),
      prisma.client.count(),
    ]);

    const financials = await prisma.project.aggregate({
      _sum: {
        estimatedBudget: true,
        totalCost: true,
        totalPaid: true,
        totalDue: true,
      },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyPayments = await prisma.projectPayment.aggregate({
      where: { paymentDate: { gte: startOfMonth } },
      _sum: { amount: true },
    });

    const monthlyCosts = await prisma.projectCost.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { totalCost: true },
    });

    const totalRevenue = Number(financials._sum.estimatedBudget ?? 0);
    const totalCost = Number(financials._sum.totalCost ?? 0);

    return NextResponse.json({
      totalProjects,
      runningProjects,
      completedProjects,
      totalClients,
      totalRevenue,
      totalExpenses: totalCost,
      totalProfit: totalRevenue - totalCost,
      totalClientDue: Number(financials._sum.totalDue ?? 0),
      totalClientPaid: Number(financials._sum.totalPaid ?? 0),
      monthlyRevenue: Number(monthlyPayments._sum.amount ?? 0),
      monthlyExpenses: Number(monthlyCosts._sum.totalCost ?? 0),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
