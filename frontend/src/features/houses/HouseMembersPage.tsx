import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import { listHouseMembers, removeHouseMember } from "@/api/houses";
import { HouseMemberRole, type HouseMember } from "@housemate/shared";
import { useCurrentUser } from "./useCurrentUser";
import "./houses.css";

function memberDisplayName(member: HouseMember): string {
  return member.user?.name ?? member.user?.email ?? "Üye";
}

export function HouseMembersPage() {
  const { houseId } = useParams<{ houseId: string }>();
  const { user, loading: userLoading } = useCurrentUser();
  const [members, setMembers] = useState<HouseMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!houseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listHouseMembers(houseId);
      setMembers(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Üye listesi alınamadı"
      );
    } finally {
      setLoading(false);
    }
  }, [houseId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const myMembership = members.find((m) => m.userId === user?.id);
  const isAdmin = myMembership?.role === HouseMemberRole.ADMIN;

  async function handleRemove(memberId: string, memberName: string) {
    if (!houseId) return;
    const confirmed = window.confirm(
      `${memberName} evden çıkarılsın mı? Bu işlem geri alınamaz.`
    );
    if (!confirmed) return;

    setRemovingId(memberId);
    setError(null);
    try {
      await removeHouseMember(houseId, memberId);
      await loadMembers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Üye çıkarılamadı");
    } finally {
      setRemovingId(null);
    }
  }

  if (!houseId) {
    return (
      <p className="houses-error" role="alert">
        Geçersiz ev adresi
      </p>
    );
  }

  if (loading || userLoading) {
    return <p className="houses-loading">Üyeler yükleniyor…</p>;
  }

  return (
    <div className="houses-card">
      <h3>Üyeler</h3>
      <p className="houses-muted">
        Evdeki aktif üyeler. Yöneticiler üye çıkarabilir.
      </p>

      {error && (
        <p className="houses-error" role="alert">
          {error}
        </p>
      )}

      {members.length === 0 ? (
        <p className="houses-muted">Henüz üye yok.</p>
      ) : (
        <div>
          {members.map((member) => {
            const name = memberDisplayName(member);
            const isSelf = member.userId === user?.id;
            const canRemove = isAdmin && !isSelf;

            return (
              <div key={member.id} className="houses-member-row">
                <div className="houses-member-info">
                  <span className="houses-member-name">
                    {name}
                    {isSelf && " (siz)"}
                  </span>
                  {member.user?.email && (
                    <span className="houses-member-email">
                      {member.user.email}
                    </span>
                  )}
                </div>
                <div className="houses-toolbar">
                  <span
                    className={
                      member.role === HouseMemberRole.ADMIN
                        ? "houses-badge houses-badge-admin"
                        : "houses-badge"
                    }
                  >
                    {member.role === HouseMemberRole.ADMIN
                      ? "Yönetici"
                      : "Üye"}
                  </span>
                  {canRemove && (
                    <button
                      type="button"
                      className="houses-btn houses-btn-danger"
                      disabled={removingId === member.id}
                      onClick={() => void handleRemove(member.id, name)}
                    >
                      {removingId === member.id ? "Çıkarılıyor…" : "Çıkar"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
