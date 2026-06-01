import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/log-activity";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const documents = await prisma.document.findMany({
      where: { projectId: id },
      orderBy: { uploadedAt: "desc" },
    });
    return NextResponse.json(documents);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { name, fileUrl, fileType, description } = await req.json();
    if (!name || !fileUrl) return NextResponse.json({ error: "Name and fileUrl are required" }, { status: 400 });

    const document = await prisma.document.create({
      data: { projectId: id, name, fileUrl, fileType, description },
    });

    await logActivity({
      userId: session.user.id,
      projectId: id,
      action: "CREATE",
      entity: "Document",
      entityId: document.id,
      description: `Document uploaded — "${name}"${description ? `: ${description}` : ""}`,
    });

    return NextResponse.json(document, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
