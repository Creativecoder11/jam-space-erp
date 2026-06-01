import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncProjectTotals } from "@/lib/sync-project";
import { logActivity } from "@/lib/log-activity";
import { z } from "zod";

const schema = z.object({
  projectId: z.string().min(1),
  amount: z.number().positive(),
  paymentType: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_BANKING", "CHEQUE"]),
  paymentDate: z.string().transform(s => new Date(s)),
  description: z.string().optional(),
  referenceNo: z.string().optional(),
  stage: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20");

    const where = projectId ? { projectId } : {};
    const [payments, total] = await Promise.all([
      prisma.projectPayment.findMany({
        where,
        include: { project: { select: { id: true, name: true, client: { select: { name: true } } } } },
        orderBy: { paymentDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.projectPayment.count({ where }),
    ]);
    return NextResponse.json({ data: payments, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = schema.parse(body);
    const payment = await prisma.projectPayment.create({ data });

    await Promise.all([
      syncProjectTotals(data.projectId),
      logActivity({
        userId: session.user.id,
        projectId: data.projectId,
        action: "CREATE",
        entity: "Payment",
        entityId: payment.id,
        description: `Payment of ৳${Number(data.amount).toLocaleString("en-IN")} recorded${data.description ? ` — ${data.description}` : ""}`,
      }),
    ]);

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
