"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useWorkflowStore } from "@/stores/workflow-store";
import { nodeTypes } from "@/components/workflow/nodes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { LeadsTable } from "@/components/leads/leads-table";
import {
  Save, Play, Loader2, BarChart3, Users, Mail, Clock,
  GitBranch, Square, ChevronLeft, Workflow, UserPlus, Zap,
  MessageSquare, CheckCircle, XCircle, Reply, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Campaign, Lead, CampaignLead } from "@/types";

type View = "workflow" | "leads" | "analytics";

// ─── Analytics panel ─────────────────────────────────────────────────────────

interface AnalyticsData {
  totalLeads: number;
  emailsSent: number;
  emailsSkipped: number;
  replies: number;
  replyRate: number;
  completed: number;
  failed: number;
  inProgress: number;
  totalFollowups: number;
}

function AnalyticsPanel({ campaignId }: { campaignId: string }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/analytics`)
      .then((r) => r.json())
      .then((data) => { setAnalytics(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [campaignId]);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading analytics...
      </div>
    );
  }

  const stats = [
    { label: "Total Leads", value: analytics.totalLeads, icon: Users, color: "text-blue-600 bg-blue-100" },
    { label: "Emails Sent", value: analytics.emailsSent, icon: Mail, color: "text-green-600 bg-green-100" },
    { label: "Follow-ups", value: analytics.totalFollowups, icon: MessageSquare, color: "text-amber-600 bg-amber-100" },
    { label: "Replies", value: analytics.replies, icon: Reply, color: "text-purple-600 bg-purple-100" },
    { label: "Reply Rate", value: `${analytics.replyRate}%`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-100" },
    { label: "Completed", value: analytics.completed, icon: CheckCircle, color: "text-green-600 bg-green-100" },
    { label: "In Progress", value: analytics.inProgress, icon: Clock, color: "text-blue-600 bg-blue-100" },
    { label: "Failed", value: analytics.failed, icon: XCircle, color: "text-red-600 bg-red-100" },
  ];

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Campaign Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Performance metrics for this campaign</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {analytics.emailsSkipped > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-sm font-medium">Note</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {analytics.emailsSkipped} email{analytics.emailsSkipped !== 1 ? "s" : ""} were skipped because
              Gmail/OpenAI credentials are not configured.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Leads panel ─────────────────────────────────────────────────────────────

function LeadsPanel({ campaignId, productId }: { campaignId: string; productId: string }) {
  const [campaignLeads, setCampaignLeads] = useState<CampaignLead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCampaignLeads = useCallback(() => {
    fetch(`/api/campaigns/${campaignId}/leads`)
      .then((r) => r.json())
      .then(setCampaignLeads)
      .catch(console.error);
  }, [campaignId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/campaigns/${campaignId}/leads`).then((r) => r.json()),
      fetch(`/api/leads?productId=${productId}`).then((r) => r.json()),
    ])
      .then(([clData, leadsData]) => {
        setCampaignLeads(clData);
        setAllLeads(leadsData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [campaignId, productId]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAssign() {
    if (selectedIds.size === 0) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_ids: Array.from(selectedIds) }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const data = await res.json();
      toast.success(`Assigned ${data.assigned} leads to campaign`);
      setDialogOpen(false);
      setSelectedIds(new Set());
      fetchCampaignLeads();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign leads");
    } finally {
      setAssigning(false);
    }
  }

  async function handleProcessNow() {
    setProcessing(true);
    try {
      const res = await fetch("/api/engine/run", { method: "POST" });
      if (!res.ok) throw new Error("Engine run failed");
      const data = await res.json();
      toast.success(`Processed ${data.processed} leads (${data.errors} errors)`);
      fetchCampaignLeads();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process");
    } finally {
      setProcessing(false);
    }
  }

  const assignedLeadIds = new Set(campaignLeads.map((cl) => cl.lead_id));
  const unassignedLeads = allLeads.filter((l) => !assignedLeadIds.has(l.id));

  const statusColors: Record<string, string> = {
    queued: "bg-gray-100 text-gray-700",
    waiting: "bg-amber-100 text-amber-700",
    active: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaign Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {campaignLeads.length} lead{campaignLeads.length !== 1 ? "s" : ""} assigned
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleProcessNow} disabled={processing}>
            {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Process Now
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" />Assign Leads</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Assign Leads to Campaign</DialogTitle></DialogHeader>
              {unassignedLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  All leads are already assigned to this campaign.
                </p>
              ) : (
                <>
                  <LeadsTable leads={unassignedLeads} selectable selectedIds={selectedIds} onToggleSelect={toggleSelect} />
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">{selectedIds.size} selected</p>
                    <Button onClick={handleAssign} disabled={selectedIds.size === 0 || assigning}>
                      {assigning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Assign {selectedIds.size} Lead{selectedIds.size !== 1 ? "s" : ""}
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Node</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Follow-ups</TableHead>
              <TableHead>Replied</TableHead>
              <TableHead>Next Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaignLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No leads assigned yet. Click &quot;Assign Leads&quot; to add leads to this campaign.
                </TableCell>
              </TableRow>
            ) : (
              campaignLeads.map((cl) => (
                <TableRow key={cl.id}>
                  <TableCell className="font-medium">{cl.lead?.name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{cl.lead?.email || "—"}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{cl.current_node_id}</code>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${statusColors[cl.status] || ""}`} variant="secondary">
                      {cl.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{cl.followup_count}</TableCell>
                  <TableCell>
                    {cl.replied
                      ? <Badge variant="default" className="text-xs">Yes</Badge>
                      : <Badge variant="outline" className="text-xs">No</Badge>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cl.next_action_time ? new Date(cl.next_action_time).toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Node palette items & sidebar nav ────────────────────────────────────────

const nodeItems = [
  { type: "start", label: "Start", icon: Play, color: "text-green-600 bg-green-100" },
  { type: "send_email", label: "Send Email", icon: Mail, color: "text-blue-600 bg-blue-100" },
  { type: "wait", label: "Wait / Delay", icon: Clock, color: "text-amber-600 bg-amber-100" },
  { type: "condition", label: "If / Else", icon: GitBranch, color: "text-purple-600 bg-purple-100" },
  { type: "end", label: "End", icon: Square, color: "text-red-600 bg-red-100" },
];

const sidebarNav: { view: View; label: string; icon: React.ElementType }[] = [
  { view: "workflow", label: "Workflow Editor", icon: Workflow },
  { view: "leads", label: "Leads", icon: Users },
  { view: "analytics", label: "Analytics", icon: BarChart3 },
];

// ─── Main builder ─────────────────────────────────────────────────────────────

function BuilderInner() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  const campaignId = params.campaignId as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [view, setView] = useState<View>("workflow");
  const loadedRef = useRef(false);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    loadWorkflow,
  } = useWorkflowStore();

  const { screenToFlowPosition, toObject } = useReactFlow();

  useEffect(() => {
    if (loadedRef.current) return;
    fetch(`/api/campaigns/${campaignId}`)
      .then((r) => r.json())
      .then((data) => {
        setCampaign(data);
        if (data.workflow_json?.nodes?.length) {
          loadWorkflow(data.workflow_json.nodes, data.workflow_json.edges || []);
        }
        loadedRef.current = true;
      })
       .catch(() => toast.error("Failed to load campaign"));
  }, [campaignId, loadWorkflow]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const flow = toObject();
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow_json: {
            nodes: flow.nodes.map((n) => ({
              id: n.id,
              type: n.type,
              position: n.position,
              data: n.data,
            })),
            edges: flow.edges.map((e) => ({
              id: e.id,
              source: e.source,
              target: e.target,
              sourceHandle: e.sourceHandle || undefined,
            })),
            viewport: flow.viewport,
          },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Workflow saved");
    } catch {
      toast.error("Failed to save workflow");
    } finally {
      setSaving(false);
    }
  }, [campaignId, toObject]);

  async function handleActivate() {
    await handleSave();
    setActivating(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/run`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const data = await res.json();
      setCampaign(data);
      toast.success("Campaign is now active!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to activate campaign"
      );
    } finally {
      setActivating(false);
    }
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        Loading campaign...
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-700",
    paused: "bg-amber-100 text-amber-700",
    completed: "bg-blue-100 text-blue-700",
  };

  function onDragStart(e: React.DragEvent, nodeType: string) {
    e.dataTransfer.setData("application/reactflow", nodeType);
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold">{campaign.name}</h2>
          <Badge
            className={`text-xs ${statusColors[campaign.status] || ""}`}
            variant="secondary"
          >
            {campaign.status}
          </Badge>
        </div>
        {view === "workflow" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
            {campaign.status === "draft" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Run
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Activate Campaign?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will start processing the workflow for all assigned leads. Make sure
                      you have assigned leads before activating. The workflow will be auto-saved.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleActivate} disabled={activating}>
                      {activating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Yes, Activate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-52 border-r bg-muted/30 p-3 shrink-0 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 w-full text-muted-foreground"
            onClick={() => router.push(`/${productId}/campaigns`)}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <Separator className="my-1" />
          {sidebarNav.map(({ view: v, label, icon: Icon }) => (
            <Button
              key={v}
              variant="ghost"
              size="sm"
              className={cn(
                "justify-start gap-2 w-full",
                view === v && "bg-primary/10 text-primary"
              )}
              onClick={() => setView(v)}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}

          {/* Node palette — only when workflow editor is active */}
          {view === "workflow" && (
            <>
              <Separator className="my-1" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">
                Nodes
              </h3>
              <div className="space-y-1.5">
                {nodeItems.map(({ type, label, icon: Icon, color }) => (
                  <div
                    key={type}
                    draggable
                    onDragStart={(e) => onDragStart(e, type)}
                    className="flex items-center gap-2.5 rounded-md border bg-background px-3 py-2.5 text-sm cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
                  >
                    <div className={`flex h-6 w-6 items-center justify-center rounded ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Main content area */}
        <div className="flex-1 h-full overflow-hidden">
          {view === "workflow" && (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              deleteKeyCode={["Backspace", "Delete"]}
              className="bg-background"
            >
              <Controls />
              <MiniMap pannable zoomable />
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            </ReactFlow>
          )}
          {view === "leads" && (
            <LeadsPanel campaignId={campaignId} productId={productId} />
          )}
          {view === "analytics" && (
            <AnalyticsPanel campaignId={campaignId} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function CampaignBuilderPage() {
  return (
    <ReactFlowProvider>
      <BuilderInner />
    </ReactFlowProvider>
  );
}

