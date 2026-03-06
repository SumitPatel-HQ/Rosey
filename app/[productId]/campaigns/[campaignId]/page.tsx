"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useWorkflowStore } from "@/stores/workflow-store";
import { nodeTypes } from "@/components/workflow/nodes";
import { NodePalette } from "@/components/workflow/node-palette";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Save, Play, Loader2, ArrowLeft, BarChart3, Users } from "lucide-react";
import { toast } from "sonner";
import type { Campaign } from "@/types";
import Link from "next/link";

function BuilderInner() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  const campaignId = params.campaignId as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
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

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${productId}/campaigns`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold">{campaign.name}</h2>
          <Badge
            className={`text-xs ${statusColors[campaign.status] || ""}`}
            variant="secondary"
          >
            {campaign.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/${productId}/campaigns/${campaignId}/leads`}>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Leads
            </Button>
          </Link>
          <Link href={`/${productId}/campaigns/${campaignId}/analytics`}>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
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
                    This will start processing the workflow for all assigned
                    leads. Make sure you have assigned leads before activating.
                    The workflow will be auto-saved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleActivate}
                    disabled={activating}
                  >
                    {activating && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Yes, Activate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <NodePalette />
        <div className="flex-1">
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
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          </ReactFlow>
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
