import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import { listHouseMembers } from "@/api/houses";
import type { HouseMember } from "@housemate/shared";

export function useHouseMembers(houseId: string | undefined) {
  const [members, setMembers] = useState<HouseMember[]>([]);
  const [loading, setLoading] = useState(Boolean(houseId));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!houseId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listHouseMembers(houseId);
      setMembers(data.filter((m) => m.isActive));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Üyeler yüklenemedi"
      );
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [houseId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { members, loading, error, reload };
}
