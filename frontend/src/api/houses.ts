import type { Absence, House, HouseMember } from "@housemate/shared";
import { apiFetch } from "./client";

export interface CurrentUser {
  id: string;
  email: string;
  emailVerified: boolean;
  lastLoginAt: string | null;
}

export async function getCurrentUser() {
  const data = await apiFetch<{ user: CurrentUser }>("/me");
  return data.user;
}

export async function createHouse(name: string) {
  return apiFetch<House>("/houses", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function joinHouse(inviteCode: string) {
  return apiFetch<HouseMember>("/houses/join", {
    method: "POST",
    body: JSON.stringify({ inviteCode }),
  });
}

export async function getHouse(houseId: string) {
  return apiFetch<House>(`/houses/${houseId}`);
}

export async function listHouseMembers(houseId: string) {
  return apiFetch<HouseMember[]>(`/houses/${houseId}/members`);
}

export async function removeHouseMember(houseId: string, memberId: string) {
  return apiFetch<void>(`/houses/${houseId}/members/${memberId}`, {
    method: "DELETE",
  });
}

export async function listAbsences(houseId: string) {
  return apiFetch<Absence[]>(`/houses/${houseId}/absences`);
}

export async function createAbsence(
  houseId: string,
  input: { startDate: string; endDate: string }
) {
  return apiFetch<Absence>(`/houses/${houseId}/absences`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAbsence(
  absenceId: string,
  input: { startDate?: string; endDate?: string }
) {
  return apiFetch<Absence>(`/absences/${absenceId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteAbsence(absenceId: string) {
  return apiFetch<void>(`/absences/${absenceId}`, {
    method: "DELETE",
  });
}
