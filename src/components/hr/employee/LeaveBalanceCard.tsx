"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Palmtree, Stethoscope, Award, Home, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaveBalance {
  leaveType: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  label: string;
}

interface LeaveBalanceCardProps {
  balances: LeaveBalance[];
  onRequestLeave?: (leaveType: string) => void;
}

const leaveTypeConfig: Record<string, { icon: typeof CalendarDays; color: string; bgColor: string }> = {
  casual: { icon: Palmtree, color: "text-green-600", bgColor: "bg-green-100" },
  sick: { icon: Stethoscope, color: "text-red-600", bgColor: "bg-red-100" },
  earned: { icon: Award, color: "text-blue-600", bgColor: "bg-blue-100" },
  wfh: { icon: Home, color: "text-purple-600", bgColor: "bg-purple-100" },
  comp_off: { icon: Gift, color: "text-amber-600", bgColor: "bg-amber-100" },
};

export function LeaveBalanceCard({ balances = [], onRequestLeave }: LeaveBalanceCardProps) {
  if (!balances || balances.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5" />
            Leave Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">No leave balance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5" />
          Leave Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {balances.map((balance, index) => {
          const config = leaveTypeConfig[balance.leaveType] || {
            icon: CalendarDays,
            color: "text-gray-600",
            bgColor: "bg-gray-100",
          };
          const Icon = config.icon;
          const percentage = balance.totalDays > 0 
            ? (balance.remainingDays / balance.totalDays) * 100 
            : 0;

          return (
            <div
              key={balance.leaveType || `leave-${index}`}
              className="group cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
              onClick={() => onRequestLeave?.(balance.leaveType)}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("rounded-lg p-1.5", config.bgColor)}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <span className="font-medium">{balance.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {balance.remainingDays}/{balance.totalDays} days
                </span>
              </div>
              <Progress
                value={percentage}
                className="h-2"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>Used: {balance.usedDays} days</span>
                <span>Remaining: {balance.remainingDays} days</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
