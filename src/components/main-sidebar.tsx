"use client";

import type React from "react";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ExplorerPanel } from "./side-panels/explorer-panel";
import { SearchPanel } from "./side-panels/search-panel";
import { DebugPanel } from "./side-panels/debug-panel";
import { ExtensionsPanel } from "./side-panels/extensions-panel";
import type { ActivityBarItem } from "./activity-bar";
import type { FileNode } from "../types/ide";

interface MainSidebarProps {
  activePanel: ActivityBarItem;
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileCreate: (
    parentPath: string,
    name: string,
    type: "file" | "folder"
  ) => void;
  onFileDelete: (path: string) => void;
  selectedFile?: string;
  width?: number;
  onWidthChange?: (width: number) => void;
}

const panelTitles: Record<ActivityBarItem, string> = {
  explorer: "Explorer",
  search: "Search",
  "source-control": "Source Control",
  debug: "Run and Debug",
  extensions: "Extensions",
  settings: "Settings",
};

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;

export function MainSidebar({
  activePanel,
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  selectedFile,
  width: initialWidth = DEFAULT_WIDTH,
  onWidthChange,
}: MainSidebarProps) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = width;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const newWidth = Math.min(
          MAX_WIDTH,
          Math.max(MIN_WIDTH, startWidth + deltaX)
        );
        setWidth(newWidth);
        onWidthChange?.(newWidth);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [width, onWidthChange]
  );

  const renderPanel = () => {
    switch (activePanel) {
      case "explorer":
        return (
          <ExplorerPanel
            files={files}
            onFileSelect={onFileSelect}
            onFileCreate={onFileCreate}
            onFileDelete={onFileDelete}
            selectedFile={selectedFile}
          />
        );
      case "search":
        return <SearchPanel />;
      case "debug":
        return <DebugPanel />;
      case "extensions":
        return <ExtensionsPanel />;
      case "source-control":
        return (
          <div className="p-4 text-center text-muted-foreground">
            <div className="text-sm">Source Control</div>
            <div className="text-xs mt-1">Git integration coming soon</div>
          </div>
        );
      case "settings":
        return (
          <div className="p-4 text-center text-muted-foreground">
            <div className="text-sm">Settings</div>
            <div className="text-xs mt-1">IDE settings coming soon</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={sidebarRef}
      className="border-r bg-background flex flex-col relative"
      style={{ width: `${width}px` }}
    >
      {/* Panel Header */}
      <div className="px-4 py-3 border-b">
        <h2 className="text-sm font-medium">{panelTitles[activePanel]}</h2>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">{renderPanel()}</div>

      {/* Resize Handle */}
      <div
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors group",
          isResizing && "bg-primary"
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/20 transition-colors" />
      </div>

      {/* Width indicator during resize */}
      {isResizing && (
        <div className="absolute top-4 right-4 bg-popover border rounded px-2 py-1 text-xs font-mono pointer-events-none z-10">
          {width}px
        </div>
      )}

      {/* Resize indicator */}
      {isResizing && (
        <div className="absolute top-0 right-0 w-0.5 h-full bg-primary pointer-events-none" />
      )}
    </div>
  );
}
