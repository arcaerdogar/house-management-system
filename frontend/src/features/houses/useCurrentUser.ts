import { useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import { getCurrentUser, type CurrentUser } from "@/api/houses";

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getCurrentUser();
        if (!cancelled) setUser(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Kullanıcı bilgisi alınamadı"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, error };
}
