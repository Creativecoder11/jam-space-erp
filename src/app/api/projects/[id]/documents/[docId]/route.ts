import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/log-activity";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, docId } = await params;
    const { name, description } = await req.json();

    const doc = await prisma.document.update({ where: { id: docId }, data: { name, description } });

    await logActivity({
      userId: session.user.id,
      projectId: id,
      action: "UPDATE",
      entity: "Document",
      entityId: docId,
      description: `Document updated — "${name}"`,
    });

    return NextResponse.json(doc);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, docId } = await params;
    const doc = await prisma.document.findUnique({ where: { id: docId }, select: { name: true } });
    await prisma.document.delete({ where: { id: docId } });

    await logActivity({
      userId: session.user.id,
      projectId: id,
      action: "DELETE",
      entity: "Document",
      entityId: docId,
      description: `Document deleted — "${doc?.name ?? "unknown"}"`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
