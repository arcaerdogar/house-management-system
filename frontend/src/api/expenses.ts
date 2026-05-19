import type {
  Expense,
  ExpenseType,
  RegularExpenseTemplate,
  RegularExpensePeriod,
  RotationalExpenseType,
} from "@housemate/shared";
import { apiFetch } from "./client";

export interface ListExpensesQuery {
  type?: ExpenseType;
  from?: string;
  to?: string;
  memberId?: string;
}

export interface CreateExpenseInput {
  expenseType: ExpenseType;
  amount: string;
  description: string;
  expenseDate: string;
  respectsAbsence?: boolean;
  excludedMemberIds?: string[];
  templateId?: string;
  rotationalTypeId?: string;
  allowOverride?: boolean;
}

export interface CreateTemplateInput {
  title: string;
  responsibleMemberId: string;
  period: RegularExpensePeriod;
  respectsAbsence?: boolean;
}

export interface UpdateTemplateInput {
  title?: string;
  responsibleMemberId?: string;
  period?: RegularExpensePeriod;
  respectsAbsence?: boolean;
  isActive?: boolean;
}

export interface CreateRotationalTypeInput {
  title: string;
  respectsAbsence?: boolean;
}

export interface UpdateRotationalTypeInput {
  title?: string;
  respectsAbsence?: boolean;
  isActive?: boolean;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listExpenses(
  houseId: string,
  query?: ListExpensesQuery
) {
  const qs = buildQuery({
    type: query?.type,
    from: query?.from,
    to: query?.to,
    memberId: query?.memberId,
  });
  return apiFetch<Expense[]>(`/houses/${houseId}/expenses${qs}`);
}

export async function getExpense(houseId: string, expenseId: string) {
  return apiFetch<Expense>(`/houses/${houseId}/expenses/${expenseId}`);
}

export async function createExpense(
  houseId: string,
  input: CreateExpenseInput
) {
  return apiFetch<Expense>(`/houses/${houseId}/expenses`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listTemplates(houseId: string) {
  return apiFetch<RegularExpenseTemplate[]>(
    `/houses/${houseId}/templates`
  );
}

export async function createTemplate(
  houseId: string,
  input: CreateTemplateInput
) {
  return apiFetch<RegularExpenseTemplate>(`/houses/${houseId}/templates`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateTemplate(
  houseId: string,
  templateId: string,
  input: UpdateTemplateInput
) {
  return apiFetch<RegularExpenseTemplate>(
    `/houses/${houseId}/templates/${templateId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    }
  );
}

export async function deleteTemplate(houseId: string, templateId: string) {
  return apiFetch<void>(`/houses/${houseId}/templates/${templateId}`, {
    method: "DELETE",
  });
}

export async function listRotationalTypes(houseId: string) {
  return apiFetch<RotationalExpenseType[]>(
    `/houses/${houseId}/rotational-types`
  );
}

export async function createRotationalType(
  houseId: string,
  input: CreateRotationalTypeInput
) {
  return apiFetch<RotationalExpenseType>(
    `/houses/${houseId}/rotational-types`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function updateRotationalType(
  houseId: string,
  typeId: string,
  input: UpdateRotationalTypeInput
) {
  return apiFetch<RotationalExpenseType>(
    `/houses/${houseId}/rotational-types/${typeId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    }
  );
}
