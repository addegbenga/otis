"use client";

import { useEffect, useRef } from "react";
import { TerminalIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TerminalMessage } from "../types/ide";

interface TerminalProps {
  messages: TerminalMessage[];
  onClear: () => void;
  isVisible: boolean;
  onToggle: () => void;
}

export function Terminal({
  messages,
  onClear,
  isVisible,
  onToggle,
}: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getMessageColor = (type: TerminalMessage["type"]) => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "success":
        return "text-green-400";
      default:
        return "text-gray-300";
    }
  };

  if (!isVisible) return null;

  return (
    <div className="border-t bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="h-48">
        <div ref={scrollRef} className="p-4 font-mono text-sm space-y-1">
          {messages.length === 0 ? (
            <div className="text-muted-foreground">No output yet...</div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex gap-2">
                <span className="text-muted-foreground text-xs">
                  {message.timestamp.toLocaleTimeString()}
                </span>
                <span className={getMessageColor(message.type)}>
                  {message.message}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
