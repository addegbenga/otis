"use client";

import { FileTree } from "../file-tree";
import type { FileNode } from "../../types/ide";

interface ExplorerPanelProps {
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

export function ExplorerPanel({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  selectedFile,
}: ExplorerPanelProps) {
  return (
    <div className="h-full">
      <FileTree
        files={files}
        onFileSelect={onFileSelect}
        onFileCreate={onFileCreate}
        onFileDelete={onFileDelete}
        selectedFile={selectedFile}
      />
    </div>
  );
}
