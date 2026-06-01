import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

async function main() {
  console.log("🧹 Cleaning all business data...");

  // Delete in dependency order
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.projectNote.deleteMany({});
  await prisma.projectCost.deleteMany({});
  await prisma.projectPayment.deleteMany({});
  await prisma.companyExpense.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.client.deleteMany({});

  console.log("✅ All projects, clients, payments, costs, and related records deleted.");
  console.log("ℹ️  Users and company settings were kept.");
}

main()
  .catch((e) => {
    console.error("❌ Clean error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
