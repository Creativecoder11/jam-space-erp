import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncProjectTotals } from "@/lib/sync-project";
import { logActivity } from "@/lib/log-activity";
import { z } from "zod";

const schema = z.object({
  projectId: z.string().min(1),
  categoryId: z.string().min(1),
  date: z.string().transform(s => new Date(s)),
  invoiceNo: z.string().optional(),
  description: z.string().min(2),
  vendorName: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().optional(),
  unitPrice: z.number().positive(),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]).optional(),
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

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;

    const [costs, total] = await Promise.all([
      prisma.projectCost.findMany({
        where,
        include: { project: { select: { id: true, name: true } } },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.projectCost.count({ where }),
    ]);
    return NextResponse.json({ data: costs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
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
    const totalCost = data.quantity * data.unitPrice;

    const cost = await prisma.projectCost.create({ data: { ...data, totalCost } });

    await Promise.all([
      syncProjectTotals(data.projectId),
      logActivity({
        userId: session.user.id,
        projectId: data.projectId,
        action: "CREATE",
        entity: "Cost",
        entityId: cost.id,
        description: `Expense added — ${data.description} (৳${totalCost.toLocaleString("en-IN")})${data.vendorName ? ` from ${data.vendorName}` : ""}`,
      }),
    ]);

    return NextResponse.json(cost, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
