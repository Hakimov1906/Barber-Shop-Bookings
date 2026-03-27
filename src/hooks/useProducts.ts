import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { products as fallbackProducts } from "@/data/products";
import { api } from "@/lib/api";
import { mapApiProductsToProducts } from "@/lib/products";
import { USE_MOCK_API } from "@/lib/config";

export function useProducts() {
  const query = useQuery({
    queryKey: ["products"],
    queryFn: api.getProducts,
    retry: 1,
  });

  const hasApiData = Boolean(query.data?.length);
  const shouldUseFallback = USE_MOCK_API || query.isError || (query.isSuccess && !hasApiData);

  const products = useMemo(() => {
    if (shouldUseFallback) {
      return fallbackProducts;
    }
    return mapApiProductsToProducts(query.data || []);
  }, [query.data, shouldUseFallback]);

  return {
    ...query,
    products,
    isFallback: shouldUseFallback,
  };
}
