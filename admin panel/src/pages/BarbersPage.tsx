import { useEffect, useMemo, useState } from "react";
import { rawApiGet } from "../api";
import { useAuth } from "../auth";
import { getResourceConfigByKey, withSalonOptions } from "../config/resources";
import { ResourcePage } from "./ResourcePage";

type SalonOption = { id: number; name: string };

export function BarbersPage() {
  const baseConfig = getResourceConfigByKey("barbers");
  const { token } = useAuth();
  const [salons, setSalons] = useState<SalonOption[]>([]);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const loadSalons = async () => {
      try {
        const payload = await rawApiGet<Array<{ id: number; name: string }>>(
          "/api/admin/salons?includeInactive=true",
          token,
        );
        if (!cancelled) {
          setSalons(
            payload
              .filter((item) => Number.isFinite(item.id) && typeof item.name === "string")
              .map((item) => ({ id: Number(item.id), name: item.name })),
          );
          setLookupError("");
        }
      } catch (error) {
        if (!cancelled) {
          setLookupError(error instanceof Error ? error.message : "Не удалось загрузить список салонов");
        }
      }
    };

    void loadSalons();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const config = useMemo(() => {
    if (!baseConfig) return null;
    return withSalonOptions(baseConfig, salons);
  }, [baseConfig, salons]);

  if (!config) {
    return <div className="panel-error">Конфиг ресурса barbers не найден.</div>;
  }

  return (
    <>
      {lookupError ? <div className="panel-error">Lookup error: {lookupError}</div> : null}
      <ResourcePage config={config} />
    </>
  );
}
