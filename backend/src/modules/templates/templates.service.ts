import { prisma } from "../../config/db.js";
import { HttpError } from "../common/errors.js";
import { houseMembershipService } from "../houses/membership.service.js";
import { toTemplateDto } from "./templates.dto.js";

async function assertResponsibleMemberActive(
  houseId: string,
  responsibleMemberId: string
) {
  const members = await houseMembershipService.listActiveMembers(houseId);
  if (!members.some((m) => m.memberId === responsibleMemberId)) {
    throw HttpError.badRequest(
      "responsibleMemberId must be an active house member",
      "INVALID_RESPONSIBLE_MEMBER"
    );
  }
}

export async function createTemplate(
  houseId: string,
  userId: string,
  input: {
    title: string;
    responsibleMemberId: string;
    period: "WEEKLY" | "MONTHLY";
    respectsAbsence?: boolean;
  }
) {
  await houseMembershipService.assertActiveMember(houseId, userId);
  await assertResponsibleMemberActive(houseId, input.responsibleMemberId);

  const template = await prisma.regularExpenseTemplate.create({
    data: {
      houseId,
      title: input.title,
      responsibleMemberId: input.responsibleMemberId,
      period: input.period,
      respectsAbsence: input.respectsAbsence ?? false,
    },
  });

  return toTemplateDto(template);
}

export async function listTemplates(houseId: string, userId: string) {
  await houseMembershipService.assertActiveMember(houseId, userId);

  const templates = await prisma.regularExpenseTemplate.findMany({
    where: { houseId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return templates.map(toTemplateDto);
}

export async function updateTemplate(
  houseId: string,
  templateId: string,
  userId: string,
  input: {
    title?: string;
    responsibleMemberId?: string;
    period?: "WEEKLY" | "MONTHLY";
    respectsAbsence?: boolean;
    isActive?: boolean;
  }
) {
  await houseMembershipService.assertActiveMember(houseId, userId);

  const existing = await prisma.regularExpenseTemplate.findFirst({
    where: { id: templateId, houseId },
  });
  if (!existing) {
    throw HttpError.notFound("Regular expense template not found");
  }

  if (input.responsibleMemberId) {
    await assertResponsibleMemberActive(houseId, input.responsibleMemberId);
  }

  const template = await prisma.regularExpenseTemplate.update({
    where: { id: templateId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.responsibleMemberId !== undefined
        ? { responsibleMemberId: input.responsibleMemberId }
        : {}),
      ...(input.period !== undefined ? { period: input.period } : {}),
      ...(input.respectsAbsence !== undefined
        ? { respectsAbsence: input.respectsAbsence }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  return toTemplateDto(template);
}

export async function deleteTemplate(
  houseId: string,
  templateId: string,
  userId: string
) {
  await houseMembershipService.assertActiveMember(houseId, userId);

  const existing = await prisma.regularExpenseTemplate.findFirst({
    where: { id: templateId, houseId },
  });
  if (!existing) {
    throw HttpError.notFound("Regular expense template not found");
  }

  await prisma.regularExpenseTemplate.update({
    where: { id: templateId },
    data: { isActive: false },
  });
}
