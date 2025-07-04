export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  content?: string;
  children?: FileNode[];
  path: string;
}

export interface EditorTab {
  id: string;
  name: string;
  path: string;
  content: string;
  isDirty: boolean;
}

export interface CompileError {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
}

export interface TerminalMessage {
  id: string;
  type: "info" | "error" | "success" | "warning";
  message: string;
  timestamp: Date;
}
