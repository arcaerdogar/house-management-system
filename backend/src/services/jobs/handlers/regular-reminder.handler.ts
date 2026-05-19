import { RegularExpensePeriod } from "@housemate/shared";
import { ExpenseType } from "@prisma/client";
import { prisma } from "../../../config/db.js";
import { todayUtcDateOnly } from "../../../domain/snapshot/date-utils.js";
import { addBulkEmailJob } from "../../mail-service/bulkmailService.js";
import { getMemberEmail } from "../utils/member-lookup.js";
import { isPeriodStartDay, periodBounds } from "../utils/period-bounds.js";

/**
 * FR-9.1 / FR-4.3 — remind responsible members when a template period starts.
 */
export async function processRegularExpenseReminderCron(): Promise<void> {
  const today = todayUtcDateOnly();

  const templates = await prisma.regularExpenseTemplate.findMany({
    where: { isActive: true },
    include: {
      house: { select: { id: true, name: true } },
    },
  });

  for (const template of templates) {
    if (!isPeriodStartDay(template.period, today)) {
      continue;
    }

    const { start, end } = periodBounds(template.period, today);
    const existingExpense = await prisma.expense.findFirst({
      where: {
        templateId: template.id,
        expenseType: ExpenseType.REGULAR,
        expenseDate: { gte: start, lte: end },
      },
      select: { id: true },
    });

    if (existingExpense) {
      continue;
    }

    const responsible = await getMemberEmail(template.responsibleMemberId);
    if (!responsible) {
      continue;
    }

    const periodLabel =
      template.period === RegularExpensePeriod.MONTHLY
        ? "Aylık dönem"
        : "Haftalık dönem";

    await addBulkEmailJob(
      "housemate-regular-reminder",
      `HouseMate — ${template.title} dönemi başladı`,
      [
        {
          destination: responsible.email,
          templateData: {
            memberName: responsible.memberName ?? responsible.email,
            houseName: template.house.name,
            templateTitle: template.title,
            periodLabel,
            periodStart: start.toISOString().slice(0, 10),
            periodEnd: end.toISOString().slice(0, 10),
          },
        },
      ]
    );

    console.log(
      `[jobs] Regular expense reminder queued for template ${template.id} → ${responsible.email}`
    );
  }
}
