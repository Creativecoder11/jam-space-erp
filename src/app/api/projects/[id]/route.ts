import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.enum(["INTERIOR_DESIGN", "REAL_ESTATE", "BOTH"]).optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  estimatedEndDate: z.string().transform(s => new Date(s)).optional(),
  estimatedBudget: z.number().min(0).optional(),
  progress: z.number().min(0).max(100).optional(),
  totalCost: z.number().min(0).optional(),
  totalPaid: z.number().min(0).optional(),
  totalDue: z.number().min(0).optional(),
  expectedProfit: z.number().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        manager: true,
        payments: { orderBy: { paymentDate: "desc" } },
        costs: { orderBy: { date: "desc" } },
        documents: { orderBy: { uploadedAt: "desc" } },
        notes: { orderBy: { createdAt: "desc" } },
        activityLogs: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        invoices: { orderBy: { issueDate: "desc" } },
      },
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const project = await prisma.project.update({
      where: { id },
      data,
      include: { client: true, manager: true },
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Delete all child records before deleting the project
    // (no onDelete: Cascade in schema — Prisma enforces this client-side)
    await prisma.activityLog.deleteMany({ where: { projectId: id } });
    await prisma.invoice.deleteMany({ where: { projectId: id } });
    await prisma.document.deleteMany({ where: { projectId: id } });
    await prisma.projectNote.deleteMany({ where: { projectId: id } });
    await prisma.projectCost.deleteMany({ where: { projectId: id } });
    await prisma.projectPayment.deleteMany({ where: { projectId: id } });
    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
