"use client";

import { Play, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DebugPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-2">
              <Play className="h-4 w-4" />
              Start Debugging
            </Button>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm">
              <Square className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Variables</h3>
              <div className="text-xs text-muted-foreground">
                No variables to display
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Watch</h3>
              <div className="text-xs text-muted-foreground">
                No watch expressions
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Call Stack</h3>
              <div className="text-xs text-muted-foreground">Not debugging</div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Breakpoints</h3>
              <div className="text-xs text-muted-foreground">
                No breakpoints set
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
