"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/types";

interface LeadsTableProps {
  leads: Lead[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function LeadsTable({
  leads,
  selectable = false,
  selectedIds,
  onToggleSelect,
}: LeadsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && <TableHead className="w-10" />}
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Contacted</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={selectable ? 8 : 7}
                className="h-24 text-center text-muted-foreground"
              >
                No leads yet. Upload a CSV to get started.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                {selectable && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(lead.id) ?? false}
                      onChange={() => onToggleSelect?.(lead.id)}
                      className="rounded border-input"
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {lead.email}
                </TableCell>
                <TableCell>{lead.company || "—"}</TableCell>
                <TableCell>{lead.industry || "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {lead.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {lead.contacted ? (
                    <Badge variant="default" className="text-xs">Yes</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">No</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(lead.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
