import type {
  ActivityItem,
  DashboardSummary,
  ExpenseType,
  MemberDebtDetail,
} from "@housemate/shared";
import { apiFetch } from "./client";

export interface ListActivityQuery {
  type?: ExpenseType;
  from?: string;
  to?: string;
  memberId?: string;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function getDashboardSummary(houseId: string) {
  return apiFetch<DashboardSummary>(`/houses/${houseId}/dashboard`);
}

export async function getMemberDebtDetail(houseId: string, memberId: string) {
  return apiFetch<MemberDebtDetail>(
    `/houses/${houseId}/dashboard/${memberId}`
  );
}

export async function listActivity(
  houseId: string,
  query?: ListActivityQuery
) {
  const qs = buildQuery({
    type: query?.type,
    from: query?.from,
    to: query?.to,
    memberId: query?.memberId,
  });
  return apiFetch<ActivityItem[]>(`/houses/${houseId}/activity${qs}`);
}
