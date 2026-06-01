import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncProjectTotals } from "@/lib/sync-project";
import { logActivity } from "@/lib/log-activity";
import { z } from "zod";

const updateSchema = z.object({
  amount: z.number().positive().optional(),
  paymentType: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_BANKING", "CHEQUE"]).optional(),
  paymentDate: z.string().optional(),
  description: z.string().optional(),
  referenceNo: z.string().optional(),
  stage: z.string().optional(),
  notes: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const payment = await prisma.projectPayment.update({
      where: { id },
      data: { ...data, paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined },
    });

    await Promise.all([
      syncProjectTotals(payment.projectId),
      logActivity({
        userId: session.user.id,
        projectId: payment.projectId,
        action: "UPDATE",
        entity: "Payment",
        entityId: payment.id,
        description: `Payment updated — ৳${Number(payment.amount).toLocaleString("en-IN")}${payment.description ? ` (${payment.description})` : ""}`,
      }),
    ]);

    return NextResponse.json(payment);
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
    const payment = await prisma.projectPayment.findUnique({
      where: { id },
      select: { projectId: true, amount: true, description: true },
    });
    await prisma.projectPayment.delete({ where: { id } });

    if (payment) {
      await Promise.all([
        syncProjectTotals(payment.projectId),
        logActivity({
          userId: session.user.id,
          projectId: payment.projectId,
          action: "DELETE",
          entity: "Payment",
          entityId: id,
          description: `Payment of ৳${Number(payment.amount).toLocaleString("en-IN")} deleted${payment.description ? ` — ${payment.description}` : ""}`,
        }),
      ]);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
