const KNOWN_HOUSES_KEY = "housemate_known_houses";

export function getKnownHouseIds(): string[] {
  try {
    const raw = localStorage.getItem(KNOWN_HOUSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function addKnownHouseId(houseId: string) {
  const ids = getKnownHouseIds();
  if (ids.includes(houseId)) return;
  localStorage.setItem(KNOWN_HOUSES_KEY, JSON.stringify([...ids, houseId]));
}

export function removeKnownHouseId(houseId: string) {
  const ids = getKnownHouseIds().filter((id) => id !== houseId);
  localStorage.setItem(KNOWN_HOUSES_KEY, JSON.stringify(ids));
}
