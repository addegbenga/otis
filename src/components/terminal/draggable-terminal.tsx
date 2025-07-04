"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { TerminalIcon, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TerminalMessage } from "../../types/ide";

interface DraggableTerminalProps {
  messages: TerminalMessage[];
  onClear: () => void;
  isVisible: boolean;
  onToggle: () => void;
}

const MIN_HEIGHT = 100;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 200;

export function DraggableTerminal({
  messages,
  onClear,
  isVisible,
  onToggle,
}: DraggableTerminalProps) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const startY = e.clientY;
      const startHeight = height;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaY = startY - e.clientY;
        const newHeight = Math.min(
          MAX_HEIGHT,
          Math.max(MIN_HEIGHT, startHeight + deltaY)
        );
        setHeight(newHeight);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [height]
  );

  const toggleMaximize = () => {
    if (isMaximized) {
      setHeight(DEFAULT_HEIGHT);
      setIsMaximized(false);
    } else {
      setHeight(MAX_HEIGHT);
      setIsMaximized(true);
    }
  };

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

  return (
    <div
      ref={terminalRef}
      className="border-t bg-background flex flex-col flex-shrink-0"
      style={{ height: `${height}px` }}
    >
      {/* Resize Handle */}
      <div
        ref={resizeRef}
        className={cn(
          "h-1 bg-border hover:bg-primary/50 cursor-row-resize transition-colors relative group",
          isResizing && "bg-primary"
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-x-0 -top-1 -bottom-1 group-hover:bg-primary/20 transition-colors" />
      </div>

      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Terminal</span>
          <span className="text-xs text-muted-foreground">
            ({messages.length} message{messages.length !== 1 ? "s" : ""})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 px-2 text-xs"
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMaximize}
            className="h-7 w-7 p-0"
          >
            {isMaximized ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div
            ref={scrollRef}
            className="p-4 font-mono text-sm space-y-1 min-h-full"
          >
            {messages.length === 0 ? (
              <div className="text-muted-foreground flex items-center justify-center h-full min-h-[120px]">
                <div className="text-center">
                  <TerminalIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No output yet...</p>
                  <p className="text-xs mt-1">
                    Run compile or deploy to see output
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className="flex gap-3 hover:bg-muted/30 px-2 py-1 rounded"
                >
                  <span className="text-muted-foreground text-xs min-w-[60px] font-normal">
                    {message.timestamp.toLocaleTimeString([], {
                      hour12: false,
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span className={cn("flex-1", getMessageColor(message.type))}>
                    {message.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Status Bar */}
      <div className="border-t px-4 py-1 bg-muted/20 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Terminal ready</span>
          <span>Height: {height}px</span>
        </div>
      </div>
    </div>
  );
}
