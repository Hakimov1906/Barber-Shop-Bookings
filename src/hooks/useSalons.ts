import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { mapApiSalonsToSalons } from "@/lib/salons";
import { salons as fallbackSalons } from "@/data/salons";
import { USE_MOCK_API } from "@/lib/config";

export function useSalons() {
  const query = useQuery({
    queryKey: ["salons"],
    queryFn: api.getSalons,
    retry: 1,
  });

  const hasApiData = Boolean(query.data?.length);
  const shouldUseFallback = USE_MOCK_API || query.isError || (query.isSuccess && !hasApiData);

  const salons = useMemo(() => {
    if (shouldUseFallback) {
      return fallbackSalons;
    }
    return mapApiSalonsToSalons(query.data || []);
  }, [query.data, shouldUseFallback]);

  return {
    ...query,
    salons,
    isFallback: shouldUseFallback,
  };
}
