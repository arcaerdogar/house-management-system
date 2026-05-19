import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import { listHouseMembers } from "@/api/houses";
import { HouseMemberRole, type HouseMember } from "@housemate/shared";
import { useCurrentUser } from "@/features/houses/useCurrentUser";

export function useHouseMembers(houseId: string | undefined) {
  const { user, loading: userLoading } = useCurrentUser();
  const [members, setMembers] = useState<HouseMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!houseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listHouseMembers(houseId);
      setMembers(data.filter((m) => m.isActive));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Üye listesi alınamadı"
      );
    } finally {
      setLoading(false);
    }
  }, [houseId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const myMembership = members.find((m) => m.userId === user?.id);
  const isAdmin = myMembership?.role === HouseMemberRole.ADMIN;
  const myMemberId = myMembership?.id ?? null;

  return {
    members,
    user,
    myMemberId,
    isAdmin,
    loading: loading || userLoading,
    error,
    reload,
  };
}
