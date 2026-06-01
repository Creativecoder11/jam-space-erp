import { prisma } from "./prisma";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const toObjectId = (id?: string) => (id && OBJECT_ID_RE.test(id) ? id : undefined);

export async function logActivity(opts: {
  userId?: string;
  projectId?: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        ...opts,
        userId: toObjectId(opts.userId),      // drop demo/invalid IDs silently
        projectId: toObjectId(opts.projectId),
      },
    });
  } catch {
    // Never let logging break the main request
  }
}
