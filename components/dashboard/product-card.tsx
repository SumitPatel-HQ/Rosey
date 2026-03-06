"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Users, Megaphone } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  leadCount: number;
  campaignCount: number;
  createdAt: string;
}

export function ProductCard({
  id,
  name,
  description,
  leadCount,
  campaignCount,
  createdAt,
}: ProductCardProps) {
  return (
    <Link href={`/${id}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{name}</CardTitle>
                {description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{leadCount} leads</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5" />
              <span>{campaignCount} campaigns</span>
            </div>
          </div>
          <div className="mt-3">
            <Badge variant="secondary" className="text-xs font-normal">
              Created {new Date(createdAt).toLocaleDateString()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
