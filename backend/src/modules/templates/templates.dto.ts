import type { RegularExpenseTemplate } from "@housemate/shared";
import type { Prisma } from "@prisma/client";

type TemplateRecord = Prisma.RegularExpenseTemplateGetPayload<object>;

export function toTemplateDto(template: TemplateRecord): RegularExpenseTemplate {
  return {
    id: template.id,
    houseId: template.houseId,
    title: template.title,
    responsibleMemberId: template.responsibleMemberId,
    period: template.period,
    respectsAbsence: template.respectsAbsence,
    isActive: template.isActive,
    createdAt: template.createdAt.toISOString(),
  };
}
