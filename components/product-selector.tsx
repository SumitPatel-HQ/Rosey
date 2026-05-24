"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, LayoutDashboard } from "lucide-react";
import type { Product } from "@/types";

export function ProductSelector() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.productId as string | undefined;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Deduplicate by ID as a safety net against duplicate DB entries
          const seen = new Set<string>();
          const unique = data.filter((p) => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });
          setProducts(unique);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Select
      value={productId || ""}
      onValueChange={(value) => {
        if (value === "__dashboard__") {
          router.push("/dashboard");
        } else {
          router.push(`/${value}`);
        }
      }}
    >
 
      <SelectTrigger className="w-full sm:w-[220px] h-9 bg-muted dark:bg-white/[0.02] border-border dark:border-white/[0.05] hover:bg-accent dark:hover:bg-white/[0.04] transition-colors">
        <SelectValue placeholder="Select a product" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__dashboard__">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className="truncate">All Products</span>
          </div>
        </SelectItem>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel className="text-xs text-muted-foreground/60 px-2">Your Products</SelectLabel>
          {loading && productId && (
            <SelectItem value={productId}>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4 shrink-0" />
                <span className="truncate">Loading...</span>
              </div>
            </SelectItem>
          )}
          {products.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{p.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
