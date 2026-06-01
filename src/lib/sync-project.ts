import { prisma } from "./prisma";

/**
 * Recalculates and writes all derived financial fields on a project.
 *
 * Definitions:
 *  totalPaid     = sum of all project payments
 *  totalCost     = sum of all project costs (expenses)
 *  totalDue      = max(0, estimatedBudget − totalPaid)
 *  expectedProfit= estimatedBudget − totalCost
 *  progress      = min(100, round((totalPaid / estimatedBudget) × 100))
 */
export async function syncProjectTotals(projectId: string) {
  const [paymentAgg, costAgg, project] = await Promise.all([
    prisma.projectPayment.aggregate({ where: { projectId }, _sum: { amount: true } }),
    prisma.projectCost.aggregate({ where: { projectId }, _sum: { totalCost: true } }),
    prisma.project.findUnique({ where: { id: projectId }, select: { estimatedBudget: true } }),
  ]);

  const totalPaid = paymentAgg._sum.amount ?? 0;
  const totalCost = costAgg._sum.totalCost ?? 0;
  const budget = project?.estimatedBudget ?? 0;

  const totalDue = Math.max(0, budget - totalPaid);
  const expectedProfit = budget - totalCost;
  const progress = budget > 0 ? Math.min(100, Math.round((totalPaid / budget) * 100)) : 0;

  await prisma.project.update({
    where: { id: projectId },
    data: { totalPaid, totalCost, totalDue, expectedProfit, progress },
  });
}
