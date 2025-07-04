"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FileNode } from "../types/ide";

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileCreate: (
    parentPath: string,
    name: string,
    type: "file" | "folder"
  ) => void;
  onFileDelete: (path: string) => void;
  selectedFile?: string;
}

export function FileTree({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  selectedFile,
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["/"])
  );
  const [creatingFile, setCreatingFile] = useState<{
    parentPath: string;
    type: "file" | "folder";
  } | null>(null);
  const [newFileName, setNewFileName] = useState("");

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFile = (parentPath: string, type: "file" | "folder") => {
    setCreatingFile({ parentPath, type });
    setNewFileName("");
  };

  const handleConfirmCreate = () => {
    if (creatingFile && newFileName.trim()) {
      onFileCreate(
        creatingFile.parentPath,
        newFileName.trim(),
        creatingFile.type
      );
      setCreatingFile(null);
      setNewFileName("");
    }
  };

  const handleCancelCreate = () => {
    setCreatingFile(null);
    setNewFileName("");
  };

  const renderFileNode = (node: FileNode, depth = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 px-2 py-1 hover:bg-accent cursor-pointer group ${
            isSelected ? "bg-accent" : ""
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {node.type === "folder" ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => toggleFolder(node.path)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
              <div
                className="flex items-center gap-1 flex-1"
                onClick={() => toggleFolder(node.path)}
              >
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4" />
                ) : (
                  <Folder className="h-4 w-4" />
                )}
                <span className="text-sm">{node.name}</span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateFile(node.path, "file");
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateFile(node.path, "folder");
                  }}
                >
                  <Folder className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileDelete(node.path);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-4" />
              <div
                className="flex items-center gap-1 flex-1"
                onClick={() => onFileSelect(node)}
              >
                <File className="h-4 w-4" />
                <span className="text-sm">{node.name}</span>
              </div>
              <div className="opacity-0 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileDelete(node.path);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </>
          )}
        </div>

        {creatingFile?.parentPath === node.path && (
          <div
            className="flex items-center gap-1 px-2 py-1"
            style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
          >
            <div className="w-4" />
            {creatingFile.type === "folder" ? (
              <Folder className="h-4 w-4" />
            ) : (
              <File className="h-4 w-4" />
            )}
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmCreate();
                if (e.key === "Escape") handleCancelCreate();
              }}
              onBlur={handleCancelCreate}
              className="h-6 text-sm"
              placeholder={`New ${creatingFile.type}...`}
              autoFocus
            />
          </div>
        )}

        {node.type === "folder" && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-2 border-b">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Explorer</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => handleCreateFile("/", "file")}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => handleCreateFile("/", "folder")}
            >
              <Folder className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      <div className="py-2">{files.map((file) => renderFileNode(file))}</div>
    </div>
  );
}
