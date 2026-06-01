import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const projectId = searchParams.get("projectId");
    const clientId = searchParams.get("clientId");

    const dateFilter = {
      gte: from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1),
      lte: to ? new Date(to) : new Date(),
    };

    const projectFilter = projectId ? { projectId } : {};

    const [payments, costs, projects] = await Promise.all([
      prisma.projectPayment.findMany({
        where: {
          paymentDate: dateFilter,
          ...projectFilter,
        },
        include: {
          project: {
            select: { name: true, client: { select: { name: true } } },
          },
        },
        orderBy: { paymentDate: "desc" },
      }),
      prisma.projectCost.findMany({
        where: {
          date: dateFilter,
          ...projectFilter,
        },
        include: {
          project: { select: { name: true } },
        },
        orderBy: { date: "desc" },
      }),
      prisma.project.findMany({
        include: {
          client: { select: { name: true } },
          payments: { select: { amount: true } },
          costs: { select: { totalCost: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalRevenue = payments.reduce((a, p) => a + Number(p.amount), 0);
    const totalExpenses = costs.reduce((a, c) => a + Number(c.totalCost), 0);

    const expenseByCategory = costs.reduce((acc: Record<string, number>, cost) => {
      const catName = cost.categoryId;
      acc[catName] = (acc[catName] || 0) + Number(cost.totalCost);
      return acc;
    }, {});

    const monthlyData = payments.reduce((acc: Record<string, { revenue: number; expenses: number }>, payment) => {
      const month = new Date(payment.paymentDate).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!acc[month]) acc[month] = { revenue: 0, expenses: 0 };
      acc[month].revenue += Number(payment.amount);
      return acc;
    }, {});

    costs.forEach((cost) => {
      const month = new Date(cost.date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
      monthlyData[month].expenses += Number(cost.totalCost);
    });

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      },
      payments,
      costs,
      expenseByCategory,
      monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        profit: data.revenue - data.expenses,
      })),
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        client: p.client.name,
        totalPaid: p.payments.reduce((a, pay) => a + Number(pay.amount), 0),
        totalCost: p.costs.reduce((a, c) => a + Number(c.totalCost), 0),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
