import { useState, useEffect } from "react";
import {
  Play,
  Square,
  Bot,
  TerminalIcon,
  X,
  Save,
  Zap,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ActivityBar, type ActivityBarItem } from "./activity-bar";
import { MainSidebar } from "./main-sidebar";
import { MonacoEditor } from "./monaco-editor";
import { AIChat } from "./ai-chat";
import type {
  FileNode,
  EditorTab,
  CompileError,
  TerminalMessage,
} from "../types/ide";
import { initialFiles, STORAGE_KEY } from "@/lib/data";
import { DeploymentModal } from "./deployments/deployment-modal";
import { SmartDeployModal } from "./deployments/smart-deployment-modal";
import { ProjectImportModal } from "./projects/project-import-modal";
import { InteractiveTerminal } from "./terminal/interactive-terminal";

export function CairoIDE() {
  const [files, setFiles] = useState<FileNode[]>(initialFiles);
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [terminalMessages, setTerminalMessages] = useState<TerminalMessage[]>(
    []
  );
  const [compileErrors, setCompileErrors] = useState<CompileError[]>([]);
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);
  const [isAIChatVisible, setIsAIChatVisible] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivityBarItem>("explorer");
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false);
  const [isSmartDeployModalOpen, setIsSmartDeployModalOpen] = useState(false);
  const [isProjectImportModalOpen, setIsProjectImportModalOpen] =
    useState(false);

  // Load state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.files) setFiles(state.files);
        if (state.tabs) setTabs(state.tabs);
        if (state.activeTab) setActiveTab(state.activeTab);
        if (state.activePanel) setActivePanel(state.activePanel);
        if (state.sidebarWidth) setSidebarWidth(state.sidebarWidth);
      } catch (error) {
        console.error("Failed to load saved state:", error);
      }
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    const state = { files, tabs, activeTab, activePanel, sidebarWidth };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [files, tabs, activeTab, activePanel, sidebarWidth]);

  const findFileByPath = (
    path: string,
    nodes: FileNode[] = files
  ): FileNode | null => {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.children) {
        const found = findFileByPath(path, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const updateFileContent = (
    path: string,
    content: string,
    nodes: FileNode[] = files
  ): FileNode[] => {
    return nodes.map((node) => {
      if (node.path === path) {
        return { ...node, content };
      }
      if (node.children) {
        return {
          ...node,
          children: updateFileContent(path, content, node.children),
        };
      }
      return node;
    });
  };

  const handleFileSelect = (file: FileNode) => {
    if (file.type === "file") {
      setSelectedFile(file.path);

      // Check if tab already exists
      const existingTab = tabs.find((tab) => tab.path === file.path);
      if (existingTab) {
        setActiveTab(existingTab.id);
      } else {
        // Create new tab
        const newTab: EditorTab = {
          id: Date.now().toString(),
          name: file.name,
          path: file.path,
          content: file.content || "",
          isDirty: false,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTab(newTab.id);
      }
    }
  };

  const handleTabClose = (tabId: string) => {
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    if (activeTab === tabId) {
      const newActiveTab =
        newTabs.length > 0 ? newTabs[newTabs.length - 1].id : "";
      setActiveTab(newActiveTab);
    }
  };

  const handleEditorChange = (value: string) => {
    if (activeTab) {
      // Update tab content
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTab ? { ...tab, content: value, isDirty: true } : tab
        )
      );

      // Update file content
      const currentTab = tabs.find((tab) => tab.id === activeTab);
      if (currentTab) {
        setFiles((prev) => updateFileContent(currentTab.path, value, prev));
      }
    }
  };

  const handleSave = () => {
    if (activeTab) {
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTab ? { ...tab, isDirty: false } : tab
        )
      );
      addTerminalMessage("File saved successfully", "success");
    }
  };

  const handleFileCreate = (
    parentPath: string,
    name: string,
    type: "file" | "folder"
  ) => {
    const newPath = parentPath === "/" ? `/${name}` : `${parentPath}/${name}`;
    const newFile: FileNode = {
      id: Date.now().toString(),
      name,
      type,
      path: newPath,
      content: type === "file" ? "" : undefined,
      children: type === "folder" ? [] : undefined,
    };

    const addToParent = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.path === parentPath && node.type === "folder") {
          return { ...node, children: [...(node.children || []), newFile] };
        }
        if (node.children) {
          return { ...node, children: addToParent(node.children) };
        }
        return node;
      });
    };

    if (parentPath === "/") {
      setFiles((prev) => [...prev, newFile]);
    } else {
      setFiles((prev) => addToParent(prev));
    }
  };

  const handleFileDelete = (path: string) => {
    const removeFromNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter((node) => node.path !== path)
        .map((node) => ({
          ...node,
          children: node.children ? removeFromNodes(node.children) : undefined,
        }));
    };

    setFiles((prev) => removeFromNodes(prev));

    // Close tab if file is open
    const tabToClose = tabs.find((tab) => tab.path === path);
    if (tabToClose) {
      handleTabClose(tabToClose.id);
    }
  };

  const handleProjectImport = (importedFiles: FileNode[]) => {
    // Close all current tabs
    setTabs([]);
    setActiveTab("");
    setSelectedFile("");

    // Replace current files with imported files
    setFiles(importedFiles);

    // Add terminal message
    addTerminalMessage("✅ Project imported successfully!", "success");
    addTerminalMessage(
      `📁 Imported ${countFiles(importedFiles)} files`,
      "info"
    );

    // Auto-open the first Cairo file if available
    const firstCairoFile = findFirstCairoFile(importedFiles);
    if (firstCairoFile) {
      handleFileSelect(firstCairoFile);
      addTerminalMessage(`📝 Opened ${firstCairoFile.name}`, "info");
    }
  };

  const countFiles = (nodes: FileNode[]): number => {
    let count = 0;
    const countRecursive = (fileList: FileNode[]) => {
      fileList.forEach((node) => {
        if (node.type === "file") {
          count++;
        }
        if (node.children) {
          countRecursive(node.children);
        }
      });
    };
    countRecursive(nodes);
    return count;
  };

  const findFirstCairoFile = (nodes: FileNode[]): FileNode | null => {
    for (const node of nodes) {
      if (node.type === "file" && node.name.endsWith(".cairo")) {
        return node;
      }
      if (node.children) {
        const found = findFirstCairoFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const addTerminalMessage = (
    message: string,
    type: TerminalMessage["type"] = "info"
  ) => {
    const newMessage: TerminalMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    };
    setTerminalMessages((prev) => [...prev, newMessage]);
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setIsTerminalVisible(true);
    addTerminalMessage("Starting compilation...", "info");

    // Simulate compilation process
    setTimeout(() => {
      addTerminalMessage("Compiling Cairo contracts...", "info");
      setTimeout(() => {
        addTerminalMessage("✓ Compilation completed successfully!", "success");
        addTerminalMessage("📦 Generated artifacts in target/dev/", "info");
        setCompileErrors([]);
        setIsCompiling(false);
      }, 2000);
    }, 1000);
  };

  const handleDeploymentModalDeploy = (config: any) => {
    addTerminalMessage(
      `🚀 Deploying ${config.contractName} to ${config.network}...`,
      "info"
    );
    addTerminalMessage(
      `📍 Contract deployed to: ${config.contractAddress || "0x1234..."}`,
      "success"
    );
    setIsDeploymentModalOpen(false);
  };

  const handleSmartDeploymentComplete = (result: any) => {
    addTerminalMessage(
      `🚀 Smart Deploy: ${result.contractName} deployed successfully!`,
      "success"
    );
    addTerminalMessage(
      `📍 Contract Address: ${result.contractAddress}`,
      "info"
    );
    addTerminalMessage(
      `🔗 View on Starkscan: https://${result.network === "sepolia" ? "sepolia." : ""}starkscan.co/contract/${result.contractAddress}`,
      "info"
    );
    setIsSmartDeployModalOpen(false);
  };

  // const handleDeploy = async () => {
  //   setIsTerminalVisible(true);
  //   addTerminalMessage("Starting deployment...", "info");

  //   // Simulate deployment process
  //   setTimeout(() => {
  //     addTerminalMessage("🚀 Deploying to Starknet testnet...", "info");
  //     setTimeout(() => {
  //       addTerminalMessage("✅ Contract deployed successfully!", "success");
  //       addTerminalMessage(
  //         "📍 Contract address: 0x1234567890abcdef1234567890abcdef12345678",
  //         "info"
  //       );
  //       addTerminalMessage(
  //         "🔗 View on Starkscan: https://testnet.starkscan.co/contract/0x1234...",
  //         "info"
  //       );
  //     }, 3000);
  //   }, 1000);
  // };

  // const currentTab = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="h-screen flex bg-background">
      {/* Activity Bar */}
      <ActivityBar activeItem={activePanel} onItemChange={setActivePanel} />

      {/* Main Sidebar */}
      <MainSidebar
        activePanel={activePanel}
        files={files}
        onFileSelect={handleFileSelect}
        onFileCreate={handleFileCreate}
        onFileDelete={handleFileDelete}
        selectedFile={selectedFile}
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
      />

      {/* Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Editor Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
          <div className="flex items-center gap-4">
            {/* <h1 className="text-lg font-semibold">Cairo IDE</h1> */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsProjectImportModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <FolderOpen className="h-4 w-4" />
                Import Project
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                onClick={handleCompile}
                disabled={isCompiling}
                size="sm"
                className="gap-2"
              >
                {isCompiling ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isCompiling ? "Compiling..." : "Compile"}
              </Button>
              <Button
                onClick={() => setIsSmartDeployModalOpen(true)}
                size="sm"
                className="gap-2"
              >
                <Zap className="h-4 w-4" />
                Smart Deploy
              </Button>
              <Button
                onClick={() => setIsDeploymentModalOpen(true)}
                variant="outline"
                size="sm"
              >
                Manual Deploy
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                onClick={handleSave}
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTerminalVisible(!isTerminalVisible)}
              className="gap-2"
            >
              <TerminalIcon className="h-4 w-4" />
              Terminal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAIChatVisible(!isAIChatVisible)}
              className="gap-2"
            >
              <Bot className="h-4 w-4" />
              AI Assistant
            </Button>
          </div>
        </div>
        {/* Editor */}
        <div
          className={`flex flex-col overflow-hidden ${isTerminalVisible ? "flex-1" : "h-full"}`}
        >
          {tabs.length > 0 ? (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto flex-shrink-0">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className="relative flex items-center border-r"
                  >
                    <TabsTrigger
                      value={tab.id}
                      className="rounded-none data-[state=active]:bg-background px-4 py-2"
                    >
                      <span className={tab.isDirty ? "text-orange-500" : ""}>
                        {tab.name}
                        {tab.isDirty && "*"}
                      </span>
                    </TabsTrigger>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 mr-2 h-4 w-4 p-0 hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTabClose(tab.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent
                  key={tab.id}
                  value={tab.id}
                  className="flex-1 m-0 overflow-hidden"
                >
                  <MonacoEditor
                    value={tab.content}
                    onChange={handleEditorChange}
                    language="cairo"
                    errors={compileErrors}
                  />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">
                  Welcome to Cairo IDE
                </h3>
                <p className="mb-4">
                  Select a file from the explorer to start editing
                </p>
                <Button
                  onClick={() => setIsProjectImportModalOpen(true)}
                  className="gap-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  Import Existing Project
                </Button>
              </div>
            </div>
          )}
        </div>
        {/* Draggable Terminal
        {isTerminalVisible && (
          <DraggableTerminal
            messages={terminalMessages}
            onClear={() => setTerminalMessages([])}
            isVisible={isTerminalVisible}
            onToggle={() => setIsTerminalVisible(!isTerminalVisible)}
          />
        )} */}
        {/* Interactive Terminal */}
        {isTerminalVisible && (
          <InteractiveTerminal
            messages={terminalMessages}
            onClear={() => setTerminalMessages([])}
            isVisible={isTerminalVisible}
            onToggle={() => setIsTerminalVisible(!isTerminalVisible)}
            onAddMessage={addTerminalMessage}
          />
        )}
      </div>

      {/* Floating AI Chat */}
      <AIChat
        isVisible={isAIChatVisible}
        onToggle={() => setIsAIChatVisible(!isAIChatVisible)}
        // availableFiles={files}
        // currentFile={selectedFile}
        // currentSelection={undefined}
        // errors={compileErrors}
      />

      {/* Deployment Modal */}
      <DeploymentModal
        isOpen={isDeploymentModalOpen}
        onClose={() => setIsDeploymentModalOpen(false)}
        onDeploy={handleDeploymentModalDeploy}
      />

      {/* Smart Deployment Modal */}
      <SmartDeployModal
        isOpen={isSmartDeployModalOpen}
        onClose={() => setIsSmartDeployModalOpen(false)}
        files={files}
        onDeploymentComplete={handleSmartDeploymentComplete}
      />

      {/* Project Import Modal */}
      <ProjectImportModal
        isOpen={isProjectImportModalOpen}
        onClose={() => setIsProjectImportModalOpen(false)}
        onImport={handleProjectImport}
      />
    </div>
  );
}
