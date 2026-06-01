import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/log-activity";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, noteId } = await params;
    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

    const note = await prisma.projectNote.update({ where: { id: noteId }, data: { content } });

    await logActivity({
      userId: session.user.id,
      projectId: id,
      action: "UPDATE",
      entity: "Note",
      entityId: noteId,
      description: `Note updated — "${content.slice(0, 60)}${content.length > 60 ? "…" : ""}"`,
    });

    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; noteId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, noteId } = await params;
    await prisma.projectNote.delete({ where: { id: noteId } });

    await logActivity({
      userId: session.user.id,
      projectId: id,
      action: "DELETE",
      entity: "Note",
      entityId: noteId,
      description: "Note deleted",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
