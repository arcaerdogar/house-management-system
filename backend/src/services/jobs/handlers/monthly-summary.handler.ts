import { prisma } from "../../../config/db.js";
import { todayUtcDateOnly } from "../../../domain/snapshot/date-utils.js";
import { addBulkEmailJob } from "../../mail-service/bulkmailService.js";
import { computeMemberBalanceSummary } from "../utils/balance-summary.js";
import { getActiveHouseMemberEmails } from "../utils/member-lookup.js";

function directionLabel(
  direction: "CREDITOR" | "DEBTOR" | "SETTLED"
): string {
  switch (direction) {
    case "CREDITOR":
      return "Alacaklı";
    case "DEBTOR":
      return "Borçlu";
    default:
      return "Dengede";
  }
}

/**
 * FR-9.3 — monthly balance summary on houses.monthly_summary_day (1–28).
 */
export async function processMonthlySummaryCron(): Promise<void> {
  const today = todayUtcDateOnly();
  const dayOfMonth = today.getUTCDate();

  const houses = await prisma.house.findMany({
    where: { monthlySummaryDay: dayOfMonth },
    select: { id: true, name: true },
  });

  for (const house of houses) {
    const members = await getActiveHouseMemberEmails(house.id);

    for (const member of members) {
      const summary = await computeMemberBalanceSummary(house.id, member.memberId);

      const pairwiseLines = summary.pairwise.map((row) => {
        const name = row.counterpartyName ?? "Ev arkadaşın";
        if (row.direction === "OWED_TO_YOU") {
          return `${name} — sana ${row.netAmount} TL borçlu`;
        }
        return `${name} — sen ${row.netAmount} TL borçlusun`;
      });

      await addBulkEmailJob(
        "housemate-monthly-summary",
        `HouseMate — ${house.name} aylık özet`,
        [
          {
            destination: member.email,
            templateData: {
              memberName: member.memberName ?? member.email,
              houseName: house.name,
              monthLabel: today.toLocaleString("tr-TR", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }),
              consolidatedBalance: summary.consolidatedBalance,
              consolidatedDirection: directionLabel(summary.consolidatedDirection),
              pairwiseLines,
              hasPairwise: pairwiseLines.length > 0,
            },
          },
        ]
      );
    }

    console.log(
      `[jobs] Monthly summary queued for house ${house.id} (${members.length} members)`
    );
  }
}
