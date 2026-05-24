"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Package, Users, Megaphone, Trash2 } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  leadCount: number;
  campaignCount: number;
  createdAt: string;
  onDelete?: (id: string) => void;
}

export function ProductCard({
  id,
  name,
  description,
  leadCount,
  campaignCount,
  createdAt,
  onDelete,
}: ProductCardProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      onDelete?.(id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative group h-full">
      <Link href={`/${id}`} className="block h-full">
        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 flex flex-col h-full py-5">
          <CardHeader>
            <div className="flex items-start justify-between w-full min-w-0">
              <div className="flex flex-col w-full min-w-0 pr-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base truncate">{name}</CardTitle>
                </div>
                {description && (
                  <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="mt-auto pt-4">
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
            <div className="mt-4">
              <Badge variant="secondary" className="text-xs font-normal">
                Created {new Date(createdAt).toLocaleDateString()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </Link>

      <div className="absolute top-3 right-3 z-10">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &ldquo;{name}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the product along with all its
                leads, campaigns, and associated data. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
