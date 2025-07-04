"use client";

import { Files, Search, GitBranch, Bug, Package, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ActivityBarItem =
  | "explorer"
  | "search"
  | "source-control"
  | "debug"
  | "extensions"
  | "settings";

interface ActivityBarProps {
  activeItem: ActivityBarItem;
  onItemChange: (item: ActivityBarItem) => void;
}

const activityItems = [
  { id: "explorer" as const, icon: Files, label: "Explorer" },
  { id: "search" as const, icon: Search, label: "Search" },
  { id: "source-control" as const, icon: GitBranch, label: "Source Control" },
  { id: "debug" as const, icon: Bug, label: "Run and Debug" },
  { id: "extensions" as const, icon: Package, label: "Extensions" },
];

const bottomItems = [
  { id: "settings" as const, icon: Settings, label: "Settings" },
];

export function ActivityBar({ activeItem, onItemChange }: ActivityBarProps) {
  return (
    <div className="w-12 bg-muted/50 border-r flex flex-col items-center py-2">
      {/* Main Activity Items */}
      <div className="flex flex-col gap-1">
        {activityItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            className={cn(
              "w-10 h-10 p-0 rounded-md relative",
              activeItem === item.id && "bg-accent text-accent-foreground"
            )}
            onClick={() => onItemChange(item.id)}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
            {activeItem === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r" />
            )}
          </Button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom Items */}
      <div className="flex flex-col gap-1">
        {bottomItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            className={cn(
              "w-10 h-10 p-0 rounded-md relative",
              activeItem === item.id && "bg-accent text-accent-foreground"
            )}
            onClick={() => onItemChange(item.id)}
            title={item.label}
          >
            <item.icon className="h-5 w-5" />
            {activeItem === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r" />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
