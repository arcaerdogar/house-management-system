import { type FormEvent, useState } from "react";
import { ApiError } from "@/api/client";
import { joinHouse } from "@/api/houses";
import type { HouseMember } from "@housemate/shared";

interface JoinHouseFormProps {
  onJoined: (membership: HouseMember) => void;
}

export function JoinHouseForm({ onJoined }: JoinHouseFormProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const membership = await joinHouse(inviteCode.trim().toUpperCase());
      setInviteCode("");
      onJoined(membership);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Eve katılınamadı");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="houses-form" onSubmit={onSubmit}>
      <h3>Davet kodu ile katıl</h3>
      {error && (
        <p className="houses-error" role="alert">
          {error}
        </p>
      )}
      <label>
        Davet kodu
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          required
          minLength={4}
          disabled={submitting}
          autoComplete="off"
        />
      </label>
      <button
        type="submit"
        className="houses-btn houses-btn-primary"
        disabled={submitting || !inviteCode.trim()}
      >
        {submitting ? "Katılınıyor…" : "Eve katıl"}
      </button>
    </form>
  );
}
