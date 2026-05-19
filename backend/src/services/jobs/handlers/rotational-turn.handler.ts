import { prisma } from "../../../config/db.js";
import { addBulkEmailJob } from "../../mail-service/bulkmailService.js";
import { getMemberEmail } from "../utils/member-lookup.js";
import type { RotationalTurnNotifyJobData } from "../types.js";

/**
 * FR-9.4 — notify the member who is next in a rotational queue.
 * Enqueued by the rotational module when the queue changes.
 */
export async function processRotationalTurnNotify(
  payload: RotationalTurnNotifyJobData
): Promise<void> {
  const type = await prisma.rotationalExpenseType.findFirst({
    where: {
      id: payload.rotationalTypeId,
      houseId: payload.houseId,
      isActive: true,
    },
    include: { house: { select: { name: true } } },
  });

  if (!type) {
    console.warn(
      `[jobs] Rotational turn notify: type ${payload.rotationalTypeId} not found`
    );
    return;
  }

  const nextMember = await getMemberEmail(payload.nextMemberId);
  if (!nextMember) {
    return;
  }

  await addBulkEmailJob(
    "housemate-rotational-turn",
    `HouseMate — Sıra sende: ${type.title}`,
    [
      {
        destination: nextMember.email,
        templateData: {
          memberName: nextMember.memberName ?? nextMember.email,
          houseName: type.house.name,
          rotationalTitle: type.title,
        },
      },
    ]
  );

  console.log(
    `[jobs] Rotational turn notify queued for ${nextMember.email} (${type.title})`
  );
}
