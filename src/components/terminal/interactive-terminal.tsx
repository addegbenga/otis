"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { TerminalIcon, X, Maximize2, Minimize2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TerminalMessage } from "../../types/ide";

interface InteractiveTerminalProps {
  messages: TerminalMessage[];
  onClear: () => void;
  isVisible: boolean;
  onToggle: () => void;
  onAddMessage: (message: string, type: TerminalMessage["type"]) => void;
}

interface TerminalSession {
  id: string;
  name: string;
  type: "shell" | "logs";
  history: TerminalEntry[];
  currentDirectory: string;
  isActive: boolean;
}

interface TerminalEntry {
  id: string;
  type: "command" | "output" | "error" | "system" | "log";
  content: string;
  timestamp: Date;
  exitCode?: number;
}

const MIN_HEIGHT = 100;
const MAX_HEIGHT = 600;
const DEFAULT_HEIGHT = 250;

// Mock file system for demonstration
const mockFileSystem = {
  "/": ["src", "target", "Scarb.toml", "README.md"],
  "/src": ["lib.cairo", "main.cairo", "utils.cairo"],
  "/target": ["dev", "release"],
  "/target/dev": ["contract.json", "contract.sierra.json"],
};

export function InteractiveTerminal({
  messages,
  onClear,
  isVisible,
  onToggle,
  onAddMessage,
}: InteractiveTerminalProps) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [sessions, setSessions] = useState<TerminalSession[]>([
    {
      id: "shell-1",
      name: "Shell",
      type: "shell",
      history: [
        {
          id: "welcome",
          type: "system",
          content:
            "Welcome to Cairo IDE Terminal! Type 'help' for available commands.",
          timestamp: new Date(),
        },
      ],
      currentDirectory: "/",
      isActive: true,
    },
    {
      id: "logs-1",
      name: "Logs",
      type: "logs",
      history: [],
      currentDirectory: "/",
      isActive: false,
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState("shell-1");
  const [commandInput, setCommandInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isCommandRunning, setIsCommandRunning] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions]);

  // Convert log messages to terminal entries for logs tab
  useEffect(() => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.type === "logs") {
          const logEntries: TerminalEntry[] = messages.map((msg) => ({
            id: msg.id,
            type: "log",
            content: msg.message,
            timestamp: msg.timestamp,
          }));
          return { ...session, history: logEntries };
        }
        return session;
      })
    );
  }, [messages]);

  // Focus input when terminal becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isVisible, activeSessionId]);

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

  const addTerminalEntry = (
    sessionId: string,
    entry: Omit<TerminalEntry, "id" | "timestamp">
  ) => {
    const newEntry: TerminalEntry = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, history: [...session.history, newEntry] }
          : session
      )
    );
  };

  const executeCommand = async (command: string) => {
    const activeSession = sessions.find((s) => s.id === activeSessionId);
    if (!activeSession || activeSession.type !== "shell") return;

    // Add command to history
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);

    // Add command entry
    addTerminalEntry(activeSessionId, {
      type: "command",
      content: `${activeSession.currentDirectory} $ ${command}`,
    });

    setIsCommandRunning(true);

    // Simulate command execution delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Parse and execute command
    const [cmd, ...args] = command.trim().split(" ");
    await handleCommand(cmd.toLowerCase(), args, activeSession);

    setIsCommandRunning(false);
  };

  const handleCommand = async (
    cmd: string,
    args: string[],
    session: TerminalSession
  ) => {
    switch (cmd) {
      case "help":
        addTerminalEntry(session.id, {
          type: "output",
          content: `Available commands:
  help              - Show this help message
  ls [path]         - List directory contents
  cd <path>         - Change directory
  pwd               - Print working directory
  cat <file>        - Display file contents
  clear             - Clear terminal history
  scarb build       - Build Cairo project with Scarb
  scarb test        - Run tests
  starknet deploy   - Deploy contract to Starknet
  cairo-compile     - Compile Cairo files
  tree              - Show directory tree
  whoami            - Display current user
  date              - Show current date and time
  echo <text>       - Display text`,
        });
        break;

      case "ls":
        const listPath = args[0] || session.currentDirectory;
        const contents =
          mockFileSystem[listPath as keyof typeof mockFileSystem];
        if (contents) {
          const output = contents
            .map((item) => {
              const isDir =
                mockFileSystem[
                  `${listPath}/${item}` as keyof typeof mockFileSystem
                ];
              return isDir ? `📁 ${item}` : `📄 ${item}`;
            })
            .join("  ");
          addTerminalEntry(session.id, {
            type: "output",
            content: output || "Directory is empty",
          });
        } else {
          addTerminalEntry(session.id, {
            type: "error",
            content: `ls: cannot access '${listPath}': No such file or directory`,
            exitCode: 1,
          });
        }
        break;

      case "cd":
        const targetPath = args[0];
        if (!targetPath) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === session.id ? { ...s, currentDirectory: "/" } : s
            )
          );
        } else if (targetPath === "..") {
          const parentPath =
            session.currentDirectory.split("/").slice(0, -1).join("/") || "/";
          setSessions((prev) =>
            prev.map((s) =>
              s.id === session.id ? { ...s, currentDirectory: parentPath } : s
            )
          );
        } else {
          const newPath = targetPath.startsWith("/")
            ? targetPath
            : `${session.currentDirectory}/${targetPath}`;
          if (mockFileSystem[newPath as keyof typeof mockFileSystem]) {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === session.id ? { ...s, currentDirectory: newPath } : s
              )
            );
          } else {
            addTerminalEntry(session.id, {
              type: "error",
              content: `cd: no such file or directory: ${targetPath}`,
              exitCode: 1,
            });
          }
        }
        break;

      case "pwd":
        addTerminalEntry(session.id, {
          type: "output",
          content: session.currentDirectory,
        });
        break;

      case "cat":
        const filename = args[0];
        if (!filename) {
          addTerminalEntry(session.id, {
            type: "error",
            content: "cat: missing file operand",
            exitCode: 1,
          });
        } else if (filename.endsWith(".cairo")) {
          addTerminalEntry(session.id, {
            type: "output",
            content: `// Sample Cairo contract content
#[starknet::contract]
mod SampleContract {
    #[storage]
    struct Storage {
        value: u256,
    }
    
    #[external(v0)]
    fn get_value(self: @ContractState) -> u256 {
        self.value.read()
    }
}`,
          });
        } else if (filename === "Scarb.toml") {
          addTerminalEntry(session.id, {
            type: "output",
            content: `[package]
name = "cairo_project"
version = "0.1.0"

[dependencies]
starknet = ">=2.3.0"

[[target.starknet-contract]]`,
          });
        } else {
          addTerminalEntry(session.id, {
            type: "error",
            content: `cat: ${filename}: No such file or directory`,
            exitCode: 1,
          });
        }
        break;

      case "clear":
        setSessions((prev) =>
          prev.map((s) =>
            s.id === session.id
              ? {
                  ...s,
                  history: [
                    {
                      id: "clear",
                      type: "system",
                      content: "Terminal cleared",
                      timestamp: new Date(),
                    },
                  ],
                }
              : s
          )
        );
        break;

      case "scarb":
        const scarbCmd = args[0];
        if (scarbCmd === "build") {
          addTerminalEntry(session.id, {
            type: "output",
            content: "🔨 Compiling Cairo project...",
          });
          await new Promise((resolve) => setTimeout(resolve, 2000));
          addTerminalEntry(session.id, {
            type: "output",
            content: "✅ Build completed successfully!",
          });
          addTerminalEntry(session.id, {
            type: "output",
            content: "📦 Artifacts saved to target/dev/",
          });
          onAddMessage("Scarb build completed via terminal", "success");
        } else if (scarbCmd === "test") {
          addTerminalEntry(session.id, {
            type: "output",
            content: "🧪 Running tests...",
          });
          await new Promise((resolve) => setTimeout(resolve, 1500));
          addTerminalEntry(session.id, {
            type: "output",
            content: "✅ All tests passed!",
          });
          addTerminalEntry(session.id, {
            type: "output",
            content: "📊 3 tests, 0 failures",
          });
        } else {
          addTerminalEntry(session.id, {
            type: "error",
            content: `scarb: unknown command '${scarbCmd}'. Try 'scarb build' or 'scarb test'`,
            exitCode: 1,
          });
        }
        break;

      case "starknet":
        if (args[0] === "deploy") {
          addTerminalEntry(session.id, {
            type: "output",
            content: "🚀 Deploying to Starknet...",
          });
          await new Promise((resolve) => setTimeout(resolve, 3000));
          addTerminalEntry(session.id, {
            type: "output",
            content: "✅ Contract deployed successfully!",
          });
          addTerminalEntry(session.id, {
            type: "output",
            content:
              "📍 Contract address: 0x1234567890abcdef1234567890abcdef12345678",
          });
          onAddMessage("Contract deployed via terminal", "success");
        } else {
          addTerminalEntry(session.id, {
            type: "error",
            content: "starknet: try 'starknet deploy'",
            exitCode: 1,
          });
        }
        break;

      case "cairo-compile":
        addTerminalEntry(session.id, {
          type: "output",
          content: "⚙️ Compiling Cairo files...",
        });
        await new Promise((resolve) => setTimeout(resolve, 1500));
        addTerminalEntry(session.id, {
          type: "output",
          content: "✅ Compilation successful!",
        });
        break;

      case "tree":
        addTerminalEntry(session.id, {
          type: "output",
          content: `📁 /
├── 📁 src/
│   ├── 📄 lib.cairo
│   ├── 📄 main.cairo
│   └── 📄 utils.cairo
├── 📁 target/
│   ├── 📁 dev/
│   │   ├── 📄 contract.json
│   │   └── 📄 contract.sierra.json
│   └── 📁 release/
├── 📄 Scarb.toml
└── 📄 README.md`,
        });
        break;

      case "whoami":
        addTerminalEntry(session.id, {
          type: "output",
          content: "cairo-developer",
        });
        break;

      case "date":
        addTerminalEntry(session.id, {
          type: "output",
          content: new Date().toString(),
        });
        break;

      case "echo":
        addTerminalEntry(session.id, {
          type: "output",
          content: args.join(" "),
        });
        break;

      case "":
        // Empty command, just show new prompt
        break;

      default:
        addTerminalEntry(session.id, {
          type: "error",
          content: `Command not found: ${cmd}. Type 'help' for available commands.`,
          exitCode: 127,
        });
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isCommandRunning) {
      if (commandInput.trim()) {
        executeCommand(commandInput.trim());
      } else {
        // Empty command, just add new prompt
        const activeSession = sessions.find((s) => s.id === activeSessionId);
        if (activeSession) {
          addTerminalEntry(activeSessionId, {
            type: "command",
            content: `${activeSession.currentDirectory} $ `,
          });
        }
      }
      setCommandInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommandInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommandInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Simple tab completion for common commands
      const commonCommands = [
        "help",
        "ls",
        "cd",
        "pwd",
        "cat",
        "clear",
        "scarb",
        "starknet",
        "tree",
      ];
      const matches = commonCommands.filter((cmd) =>
        cmd.startsWith(commandInput)
      );
      if (matches.length === 1) {
        setCommandInput(matches[0]);
      }
    }
  };

  const createNewSession = (type: "shell" | "logs") => {
    const newSession: TerminalSession = {
      id: `${type}-${Date.now()}`,
      name:
        type === "shell"
          ? `Shell ${sessions.filter((s) => s.type === "shell").length + 1}`
          : "Logs",
      type,
      history:
        type === "shell"
          ? [
              {
                id: "welcome",
                type: "system",
                content:
                  "New terminal session started. Type 'help' for available commands.",
                timestamp: new Date(),
              },
            ]
          : [],
      currentDirectory: "/",
      isActive: false,
    };

    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  };

  const closeSession = (sessionId: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      if (sessionId === activeSessionId && filtered.length > 0) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const getEntryColor = (type: TerminalEntry["type"]) => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "output":
        return "text-green-400";
      case "system":
        return "text-blue-400";
      case "log":
        return "text-yellow-400";
      case "command":
        return "text-gray-300";
      default:
        return "text-gray-300";
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div
      ref={terminalRef}
      className="border-t bg-black text-green-400 flex flex-col flex-shrink-0 font-mono"
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
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-medium text-white">Terminal</span>
          {isCommandRunning && (
            <Badge variant="secondary" className="text-xs">
              Running...
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createNewSession("shell")}
            className="h-7 px-2 text-xs text-white hover:bg-gray-700"
          >
            + Shell
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 px-2 text-xs text-white hover:bg-gray-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMaximize}
            className="h-7 w-7 p-0 text-white hover:bg-gray-700"
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
            className="h-7 w-7 p-0 text-white hover:bg-gray-700"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Terminal Tabs */}
      <Tabs
        value={activeSessionId}
        onValueChange={setActiveSessionId}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-full justify-start rounded-none bg-gray-800 border-b border-gray-700 p-0 h-auto">
          {sessions.map((session) => (
            <div key={session.id} className="relative flex items-center">
              <TabsTrigger
                value={session.id}
                className="rounded-none data-[state=active]:bg-black text-white px-4 py-2 text-xs"
              >
                {session.name}
                {session.type === "shell" && (
                  <span className="ml-1 text-green-400">
                    {session.currentDirectory}
                  </span>
                )}
              </TabsTrigger>
              {sessions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 mr-2 h-4 w-4 p-0 text-white hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSession(session.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </TabsList>

        {sessions.map((session) => (
          <TabsContent
            key={session.id}
            value={session.id}
            className="flex-1 m-0 flex flex-col"
          >
            {/* Terminal Content */}
            <ScrollArea className="flex-1">
              <div ref={scrollRef} className="p-4 space-y-1 min-h-full">
                {session.history.length === 0 && session.type === "logs" ? (
                  <div className="text-gray-500 text-center py-8">
                    <TerminalIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No logs yet...</p>
                    <p className="text-xs mt-1">
                      Deployment and build logs will appear here
                    </p>
                  </div>
                ) : (
                  session.history.map((entry) => (
                    <div key={entry.id} className="flex gap-2 text-sm">
                      {session.type === "shell" && entry.type !== "command" && (
                        <span className="text-gray-500 text-xs min-w-[60px] font-normal">
                          {entry.timestamp.toLocaleTimeString([], {
                            hour12: false,
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      )}
                      <div
                        className={cn(
                          "flex-1 whitespace-pre-wrap",
                          getEntryColor(entry.type)
                        )}
                      >
                        {entry.content}
                        {entry.exitCode !== undefined &&
                          entry.exitCode !== 0 && (
                            <span className="text-red-400 ml-2">
                              [Exit: {entry.exitCode}]
                            </span>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Command Input (only for shell sessions) */}
            {session.type === "shell" && session.id === activeSessionId && (
              <div className="border-t border-gray-700 p-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-sm">
                    {session.currentDirectory} $
                    {isCommandRunning && (
                      <span className="animate-pulse">⏳</span>
                    )}
                  </span>
                  <Input
                    ref={inputRef}
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isCommandRunning
                        ? "Command running..."
                        : "Type a command..."
                    }
                    disabled={isCommandRunning}
                    className="flex-1 bg-transparent border-none text-green-400 placeholder-gray-500 focus:ring-0 focus:border-none p-0"
                  />
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Status Bar */}
      <div className="border-t border-gray-700 px-4 py-1 bg-gray-900 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {activeSession?.type === "shell"
              ? "Interactive Shell"
              : "Log Viewer"}{" "}
            • {activeSession?.name}
          </span>
          <span>Height: {height}px</span>
        </div>
      </div>
    </div>
  );
}
