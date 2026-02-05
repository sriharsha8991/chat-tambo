"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  Calendar, 
  ClipboardCheck,
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemMetrics {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingApprovals: number;
  complianceScore: number;
  escalations: number;
}

interface SystemDashboardProps {
  metrics: SystemMetrics;
  previousMetrics?: SystemMetrics;
}

export function SystemDashboard({ metrics, previousMetrics }: SystemDashboardProps) {
  // Handle missing metrics
  if (!metrics) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            HR System Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No metrics data available</p>
        </CardContent>
      </Card>
    );
  }

  const getTrend = (current: number, previous?: number) => {
    if (!previous) return null;
    const diff = current - previous;
    if (diff === 0) return null;
    return {
      direction: diff > 0 ? "up" : "down",
      value: Math.abs(diff),
    };
  };

  const attendanceRate = metrics.totalEmployees > 0 
    ? Math.round((metrics.presentToday / metrics.totalEmployees) * 100)
    : 0;

  const statCards = [
    {
      title: "Total Employees",
      value: metrics.totalEmployees,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
      trend: getTrend(metrics.totalEmployees, previousMetrics?.totalEmployees),
    },
    {
      title: "Present Today",
      value: metrics.presentToday,
      subtitle: `${attendanceRate}% attendance`,
      icon: UserCheck,
      color: "text-green-500",
      bgColor: "bg-green-100",
      trend: getTrend(metrics.presentToday, previousMetrics?.presentToday),
    },
    {
      title: "On Leave",
      value: metrics.onLeave,
      icon: Calendar,
      color: "text-amber-500",
      bgColor: "bg-amber-100",
      trend: getTrend(metrics.onLeave, previousMetrics?.onLeave),
    },
    {
      title: "Pending Approvals",
      value: metrics.pendingApprovals,
      icon: ClipboardCheck,
      color: "text-purple-500",
      bgColor: "bg-purple-100",
      trend: getTrend(metrics.pendingApprovals, previousMetrics?.pendingApprovals),
      isNegativeTrend: true,
    },
    {
      title: "Compliance Score",
      value: `${metrics.complianceScore}%`,
      icon: Shield,
      color: metrics.complianceScore >= 90 ? "text-green-500" : metrics.complianceScore >= 70 ? "text-amber-500" : "text-red-500",
      bgColor: metrics.complianceScore >= 90 ? "bg-green-100" : metrics.complianceScore >= 70 ? "bg-amber-100" : "bg-red-100",
    },
    {
      title: "Escalations",
      value: metrics.escalations,
      icon: AlertTriangle,
      color: metrics.escalations > 0 ? "text-red-500" : "text-green-500",
      bgColor: metrics.escalations > 0 ? "bg-red-100" : "bg-green-100",
      isNegativeTrend: true,
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5" />
          HR System Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend?.direction === "up" ? TrendingUp : TrendingDown;
            const trendIsPositive = stat.isNegativeTrend
              ? stat.trend?.direction === "down"
              : stat.trend?.direction === "up";

            return (
              <div
                key={stat.title}
                className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className={cn("rounded-lg p-2", stat.bgColor)}>
                    <Icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  {stat.trend && (
                    <Badge
                      variant={trendIsPositive ? "default" : "destructive"}
                      className="flex items-center gap-1 text-xs"
                    >
                      <TrendIcon className="h-3 w-3" />
                      {stat.trend.value}
                    </Badge>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
