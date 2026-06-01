import "dotenv/config";
import { PrismaClient, Role, ProjectType, ProjectStatus, PaymentType, CostPaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ log: ["error"] });

async function main() {
  console.log("🌱 Starting database seed...");

  const hashedPassword = await bcrypt.hash("password123", 12);

  // Users — upsert by email
  const admin = await prisma.user.upsert({
    where: { email: "admin@jamspace.com" },
    update: {},
    create: {
      email: "admin@jamspace.com",
      name: "Admin User",
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      phone: "017-0000-0000",
    },
  });

  await prisma.user.upsert({
    where: { email: "accountant@jamspace.com" },
    update: {},
    create: {
      email: "accountant@jamspace.com",
      name: "Sadia Islam",
      password: hashedPassword,
      role: Role.ACCOUNTANT,
      phone: "018-0000-0001",
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: "pm@jamspace.com" },
    update: {},
    create: {
      email: "pm@jamspace.com",
      name: "Rafiq Ahmed",
      password: hashedPassword,
      role: Role.PROJECT_MANAGER,
      phone: "019-0000-0002",
    },
  });

  console.log("✅ Users created");

  // Clients — upsert by email
  let client1 = await prisma.client.findFirst({ where: { email: "rahman@gmail.com" } });
  if (!client1) {
    client1 = await prisma.client.create({
      data: {
        name: "Mr. Abdur Rahman",
        email: "rahman@gmail.com",
        phone: "017-1234-5678",
        address: "House 42, Road 11, Gulshan-2, Dhaka",
        company: "Rahman Group",
      },
    });
  }

  let client2 = await prisma.client.findFirst({ where: { email: "info@abccorp.com" } });
  if (!client2) {
    client2 = await prisma.client.create({
      data: {
        name: "ABC Corporation",
        email: "info@abccorp.com",
        phone: "019-8765-4321",
        address: "Motijheel C/A, Dhaka",
        company: "ABC Corp Ltd",
      },
    });
  }

  console.log("✅ Clients created");

  // Project
  let project = await prisma.project.findFirst({ where: { name: "Villa Renovation - Gulshan" } });
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "Villa Renovation - Gulshan",
        type: ProjectType.INTERIOR_DESIGN,
        status: ProjectStatus.IN_PROGRESS,
        location: "Gulshan, Dhaka",
        description: "Complete interior renovation of a luxury villa",
        startDate: new Date("2024-01-15"),
        estimatedEndDate: new Date("2024-06-30"),
        progress: 72,
        clientId: client1.id,
        managerId: pm.id,
        estimatedBudget: 2500000,
        totalCost: 1200000,
        totalPaid: 1500000,
        totalDue: 1000000,
        expectedProfit: 1300000,
      },
    });

    await prisma.projectPayment.create({
      data: {
        projectId: project.id,
        amount: 1000000,
        paymentType: PaymentType.BANK_TRANSFER,
        paymentDate: new Date("2024-01-20"),
        description: "Initial advance payment",
        referenceNo: "TXN-2024-001",
        stage: "Advance",
      },
    });

    await prisma.projectPayment.create({
      data: {
        projectId: project.id,
        amount: 500000,
        paymentType: PaymentType.CHEQUE,
        paymentDate: new Date("2024-03-15"),
        description: "2nd installment",
        referenceNo: "CHQ-2024-002",
        stage: "Installment 1",
      },
    });

    await prisma.projectCost.create({
      data: {
        projectId: project.id,
        categoryId: "board",
        date: new Date("2024-01-25"),
        invoiceNo: "INV-001",
        description: "Plywood 18mm Grade A",
        vendorName: "Ahmed Traders",
        quantity: 120,
        unit: "pcs",
        unitPrice: 2500,
        totalCost: 300000,
        paymentStatus: CostPaymentStatus.PAID,
      },
    });

    await prisma.projectCost.create({
      data: {
        projectId: project.id,
        categoryId: "electrical",
        date: new Date("2024-02-10"),
        invoiceNo: "INV-002",
        description: "Electrical wiring",
        vendorName: "Power Solutions",
        quantity: 1,
        unit: "lot",
        unitPrice: 180000,
        totalCost: 180000,
        paymentStatus: CostPaymentStatus.PARTIAL,
      },
    });

    await prisma.projectNote.create({
      data: {
        projectId: project.id,
        content: "Client requested premium finishes for all bedrooms. Budget approved.",
      },
    });
  }

  console.log("✅ Sample project with payments, costs, and note created");

  // Company settings
  const existing = await prisma.companySettings.findFirst();
  if (!existing) {
    await prisma.companySettings.create({
      data: {
        name: "Jam Space Interior & Realty",
        email: "info@jamspace.com.bd",
        phone: "+880-2-XXXX-XXXX",
        address: "123, Gulshan Avenue, Gulshan-2, Dhaka-1212",
        website: "www.jamspace.com.bd",
        currency: "BDT",
        taxRate: 15,
        invoicePrefix: "INV",
      },
    });
  }

  console.log("✅ Company settings created");
  console.log("🎉 Seed completed!");
  console.log("\n📋 Login credentials:");
  console.log("   Admin:   admin@jamspace.com / password123");
  console.log("   Accountant: accountant@jamspace.com / password123");
  console.log("   PM:      pm@jamspace.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
