import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncProjectTotals } from "@/lib/sync-project";
import { logActivity } from "@/lib/log-activity";
import { z } from "zod";

const updateSchema = z.object({
  categoryId: z.string().optional(),
  date: z.string().optional(),
  invoiceNo: z.string().optional(),
  description: z.string().optional(),
  vendorName: z.string().optional(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  unitPrice: z.number().optional(),
  totalCost: z.number().optional(),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]).optional(),
  notes: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const cost = await prisma.projectCost.update({
      where: { id },
      data: { ...data, date: data.date ? new Date(data.date) : undefined },
    });

    await Promise.all([
      syncProjectTotals(cost.projectId),
      logActivity({
        userId: session.user.id,
        projectId: cost.projectId,
        action: "UPDATE",
        entity: "Cost",
        entityId: cost.id,
        description: `Expense updated — ${cost.description} (৳${Number(cost.totalCost).toLocaleString("en-IN")})`,
      }),
    ]);

    return NextResponse.json(cost);
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validation error" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const cost = await prisma.projectCost.findUnique({
      where: { id },
      select: { projectId: true, description: true, totalCost: true },
    });
    await prisma.projectCost.delete({ where: { id } });

    if (cost) {
      await Promise.all([
        syncProjectTotals(cost.projectId),
        logActivity({
          userId: session.user.id,
          projectId: cost.projectId,
          action: "DELETE",
          entity: "Cost",
          entityId: id,
          description: `Expense deleted — ${cost.description} (৳${Number(cost.totalCost).toLocaleString("en-IN")})`,
        }),
      ]);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
