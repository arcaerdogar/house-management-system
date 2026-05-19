import { type FormEvent, useState } from "react";
import { ApiError } from "@/api/client";
import { createHouse } from "@/api/houses";
import type { House } from "@housemate/shared";

interface CreateHouseFormProps {
  onCreated: (house: House) => void;
}

export function CreateHouseForm({ onCreated }: CreateHouseFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const house = await createHouse(name.trim());
      setName("");
      onCreated(house);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ev oluşturulamadı");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="houses-form" onSubmit={onSubmit}>
      <h3>Yeni ev oluştur</h3>
      {error && (
        <p className="houses-error" role="alert">
          {error}
        </p>
      )}
      <label>
        Ev adı
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn. Moda Dairesi"
          required
          minLength={1}
          maxLength={100}
          disabled={submitting}
        />
      </label>
      <button
        type="submit"
        className="houses-btn houses-btn-primary"
        disabled={submitting || !name.trim()}
      >
        {submitting ? "Oluşturuluyor…" : "Ev oluştur"}
      </button>
    </form>
  );
}
