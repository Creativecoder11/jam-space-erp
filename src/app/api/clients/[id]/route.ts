import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional().or(z.literal("")),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            payments: { orderBy: { paymentDate: "desc" } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json(client);
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

    const client = await prisma.client.update({ where: { id }, data });
    return NextResponse.json(client);
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

    // Find all projects belonging to this client so we can cascade-delete their children
    const projects = await prisma.project.findMany({
      where: { clientId: id },
      select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length > 0) {
      await prisma.activityLog.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.invoice.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.document.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.projectNote.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.projectCost.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.projectPayment.deleteMany({ where: { projectId: { in: projectIds } } });
      await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
    }

    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
