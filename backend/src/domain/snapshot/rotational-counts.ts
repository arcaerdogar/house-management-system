import type { RotationalCounts } from "@housemate/shared";

export function emptyRotationalCounts(): RotationalCounts {
  return {};
}

export function parseRotationalCounts(value: unknown): RotationalCounts {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const parsed: RotationalCounts = {};
  for (const [typeId, memberCounts] of Object.entries(value)) {
    if (!memberCounts || typeof memberCounts !== "object" || Array.isArray(memberCounts)) {
      continue;
    }
    parsed[typeId] = {};
    for (const [memberId, count] of Object.entries(memberCounts)) {
      if (typeof count === "number" && Number.isFinite(count)) {
        parsed[typeId][memberId] = count;
      }
    }
  }
  return parsed;
}

export function incrementRotationalCount(
  counts: RotationalCounts,
  rotationalTypeId: string,
  memberId: string
): void {
  counts[rotationalTypeId] ??= {};
  counts[rotationalTypeId][memberId] =
    (counts[rotationalTypeId][memberId] ?? 0) + 1;
}
