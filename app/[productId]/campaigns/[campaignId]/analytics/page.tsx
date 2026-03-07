"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MessageSquare, Users, CheckCircle, XCircle, Clock, Reply, TrendingUp } from "lucide-react";
import Link from "next/link";

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

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const productId = params.productId as string;
  const campaignId = params.campaignId as string;
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/analytics`)
      .then((r) => r.json())
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [campaignId]);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-[40vh] text-muted-foreground">
        Loading analytics...
      </div>
    );
  }

  const stats = [
    {
      label: "Total Leads",
      value: analytics.totalLeads,
      icon: Users,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Emails Sent",
      value: analytics.emailsSent,
      icon: Mail,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "Follow-ups",
      value: analytics.totalFollowups,
      icon: MessageSquare,
      color: "text-amber-600 bg-amber-100",
    },
    {
      label: "Replies",
      value: analytics.replies,
      icon: Reply,
      color: "text-purple-600 bg-purple-100",
    },
    {
      label: "Reply Rate",
      value: `${analytics.replyRate}%`,
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Completed",
      value: analytics.completed,
      icon: CheckCircle,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "In Progress",
      value: analytics.inProgress,
      icon: Clock,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Failed",
      value: analytics.failed,
      icon: XCircle,
      color: "text-red-600 bg-red-100",
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/${productId}/campaigns/${campaignId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Campaign Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Performance metrics for this campaign
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.color}`}
              >
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
          <CardHeader>
            <CardTitle className="text-sm font-medium">Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {analytics.emailsSkipped} email{analytics.emailsSkipped !== 1 ? "s" : ""}{" "}
              were skipped because Gmail/OpenAI credentials are not configured.
              Set up the environment variables to enable actual email sending.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
