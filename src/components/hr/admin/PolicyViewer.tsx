"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Search, 
  Calendar,
  Clock,
  Palmtree,
  Shield,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PolicyDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  lastUpdated: string;
}

interface PolicyViewerProps {
  policies: PolicyDocument[];
  searchQuery?: string;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  maxItems?: number;
  density?: "compact" | "comfortable";
  showSearch?: boolean;
  emptyState?: {
    title?: string;
    description?: string;
  };
}

const categoryConfig: Record<string, { icon: typeof FileText; color: string; bgColor: string }> = {
  leave: { icon: Palmtree, color: "text-green-600", bgColor: "bg-green-100" },
  attendance: { icon: Clock, color: "text-blue-600", bgColor: "bg-blue-100" },
  compliance: { icon: Shield, color: "text-purple-600", bgColor: "bg-purple-100" },
  general: { icon: FileText, color: "text-gray-600", bgColor: "bg-gray-100" },
};

export function PolicyViewer({ 
  policies = [], 
  searchQuery = "",
  onSearch,
  isLoading = false,
  maxItems,
  density = "comfortable",
  showSearch = true,
  emptyState,
}: PolicyViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    onSearch?.(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const filteredPolicies = localSearch && policies
    ? policies.filter(
        (p) =>
          p.title?.toLowerCase().includes(localSearch.toLowerCase()) ||
          p.content?.toLowerCase().includes(localSearch.toLowerCase()) ||
          p.category?.toLowerCase().includes(localSearch.toLowerCase())
      )
    : (policies || []);

  const items = maxItems ? filteredPolicies.slice(0, maxItems) : filteredPolicies;
  const paddingClass = density === "compact" ? "p-3" : "p-4";
  const iconPaddingClass = density === "compact" ? "p-1.5" : "p-2";

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Company Policies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search policies (e.g., 'leave', 'regularization', 'WFH')..."
              value={localSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Results Count */}
        {showSearch && localSearch && (
          <p className="text-sm text-muted-foreground">
            Found {filteredPolicies.length} {filteredPolicies.length === 1 ? "policy" : "policies"}
          </p>
        )}

        {/* Policy List */}
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={`loading-${index}`} className="rounded-lg border p-4">
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 w-1/3 rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-2/3 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="mb-2 h-12 w-12 text-muted-foreground/30" />
                <p className="font-medium">
                  {emptyState?.title || "No policies found"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {emptyState?.description || "Try a different search term"}
                </p>
              </div>
            ) : (
              items.map((policy) => {
                const category = categoryConfig[policy.category] || categoryConfig.general;
                const CategoryIcon = category.icon;
                const isExpanded = expandedId === policy.id;

                return (
                  <div
                    key={policy.id}
                    className="rounded-lg border transition-colors"
                  >
                    <button
                      className={cn("flex w-full items-start gap-3 text-left hover:bg-muted/50", paddingClass)}
                      onClick={() => setExpandedId(isExpanded ? null : policy.id)}
                    >
                      <div className={cn("rounded-lg mt-0.5", iconPaddingClass, category.bgColor)}>
                        <CategoryIcon className={cn("h-4 w-4", category.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {highlightText(policy.title, localSearch)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {policy.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Updated: {formatDate(policy.lastUpdated)}</span>
                        </div>
                        {!isExpanded && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {highlightText(policy.content, localSearch)}
                          </p>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <>
                        <Separator />
                        <div className={cn("bg-muted/30", paddingClass)}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {highlightText(policy.content, localSearch)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
