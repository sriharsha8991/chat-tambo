"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LoadingCardProps {
  className?: string;
  lines?: number;
  showHeader?: boolean;
}

export function LoadingCard({ className, lines = 3, showHeader = true }: LoadingCardProps) {
  return (
    <Card className={cn("animate-pulse", className)}>
      {showHeader && (
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gray-200" />
            <div className="h-5 w-32 bg-gray-200 rounded" />
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className="h-4 bg-gray-200 rounded" 
            style={{ width: `${85 - i * 15}%` }}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// Skeleton variations
export function LoadingStatCard({ className }: { className?: string }) {
  return (
    <Card className={cn("animate-pulse", className)}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-7 w-16 bg-gray-200 rounded" />
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export function LoadingListItem() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-3 w-1/2 bg-gray-200 rounded" />
      </div>
      <div className="h-6 w-16 bg-gray-200 rounded" />
    </div>
  );
}

export function LoadingChart({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
      <div className="h-48 bg-gray-100 rounded-lg flex items-end justify-around p-4 gap-2">
        {[60, 80, 45, 90, 70, 55, 85].map((height, i) => (
          <div 
            key={i} 
            className="w-8 bg-gray-200 rounded-t" 
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}
