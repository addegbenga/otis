// "use client";

// import type React from "react";

// import { useState, useRef } from "react";
// import {
//   Upload,
//   FolderOpen,
//   FileText,
//   AlertCircle,
//   CheckCircle,
//   Download,
// } from "lucide-react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Progress } from "@/components/ui/progress";
// import { cn } from "@/lib/utils";
// import type { FileNode } from "../../types/ide";

// interface ProjectImportModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onImport: (files: FileNode[]) => void;
// }

// interface ImportedFile {
//   name: string;
//   path: string;
//   type: "file" | "folder";
//   size?: number;
//   content?: string;
//   children?: ImportedFile[];
// }

// interface ProjectAnalysis {
//   totalFiles: number;
//   cairoFiles: number;
//   contracts: number;
//   dependencies: string[];
//   projectType: "cairo" | "scarb" | "mixed" | "unknown";
//   hasScarbToml: boolean;
//   hasCairoProject: boolean;
//   estimatedSize: string;
// }

// export function ProjectImportModal({
//   isOpen,
//   onClose,
//   onImport,
// }: ProjectImportModalProps) {
//   const [currentStep, setCurrentStep] = useState<
//     "upload" | "analyze" | "confirm" | "import"
//   >("upload");
//   const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
//   const [projectAnalysis, setProjectAnalysis] =
//     useState<ProjectAnalysis | null>(null);
//   const [importProgress, setImportProgress] = useState(0);
//   const [isDragOver, setIsDragOver] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const folderInputRef = useRef<HTMLInputElement>(null);

//   const handleFileUpload = async (files: FileList | null) => {
//     if (!files || files.length === 0) return;

//     setCurrentStep("analyze");
//     setImportProgress(0);

//     const fileArray = Array.from(files);
//     const importedFileStructure = await processFiles(fileArray);

//     setImportedFiles(importedFileStructure);

//     // Analyze the project
//     const analysis = analyzeProject(importedFileStructure);
//     setProjectAnalysis(analysis);

//     setCurrentStep("confirm");
//   };

//   const processFiles = async (files: File[]): Promise<ImportedFile[]> => {
//     const fileMap = new Map<string, ImportedFile>();
//     const rootFiles: ImportedFile[] = [];

//     // Sort files to process folders first
//     const sortedFiles = files.sort((a, b) => {
//       const aDepth = a.webkitRelativePath.split("/").length;
//       const bDepth = b.webkitRelativePath.split("/").length;
//       return aDepth - bDepth;
//     });

//     for (let i = 0; i < sortedFiles.length; i++) {
//       const file = sortedFiles[i];
//       setImportProgress((i / sortedFiles.length) * 100);

//       const relativePath = file.webkitRelativePath || file.name;
//       const pathParts = relativePath.split("/");
//       const fileName = pathParts[pathParts.length - 1];

//       // Skip hidden files and common ignore patterns
//       if (shouldIgnoreFile(fileName, relativePath)) {
//         continue;
//       }

//       const content = await readFileContent(file);

//       const importedFile: ImportedFile = {
//         name: fileName,
//         path: `/${relativePath}`,
//         type: "file",
//         size: file.size,
//         content: content,
//       };

//       // Build folder structure
//       let currentLevel = rootFiles;
//       let currentPath = "";

//       for (let j = 0; j < pathParts.length - 1; j++) {
//         const folderName = pathParts[j];
//         currentPath += `/${folderName}`;

//         let folder = currentLevel.find(
//           (f) => f.name === folderName && f.type === "folder"
//         );
//         if (!folder) {
//           folder = {
//             name: folderName,
//             path: currentPath,
//             type: "folder",
//             children: [],
//           };
//           currentLevel.push(folder);
//         }
//         currentLevel = folder.children!;
//       }

//       currentLevel.push(importedFile);
//     }

//     return rootFiles;
//   };

//   const readFileContent = async (file: File): Promise<string> => {
//     return new Promise((resolve) => {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const content = e.target?.result as string;
//         resolve(content || "");
//       };
//       reader.onerror = () => resolve("");

//       // Only read text files
//       if (isTextFile(file.name)) {
//         reader.readAsText(file);
//       } else {
//         resolve("");
//       }
//     });
//   };

//   const isTextFile = (fileName: string): boolean => {
//     const textExtensions = [
//       ".cairo",
//       ".toml",
//       ".md",
//       ".txt",
//       ".json",
//       ".yaml",
//       ".yml",
//       ".rs",
//       ".py",
//       ".js",
//       ".ts",
//     ];
//     return textExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
//   };

//   const shouldIgnoreFile = (
//     fileName: string,
//     relativePath: string
//   ): boolean => {
//     const ignorePatterns = [
//       // Hidden files
//       /^\./,
//       // Build artifacts
//       /target\//,
//       /build\//,
//       /dist\//,
//       /out\//,
//       // Dependencies
//       /node_modules\//,
//       /\.git\//,
//       // IDE files
//       /\.vscode\//,
//       /\.idea\//,
//       // OS files
//       /\.DS_Store$/,
//       /Thumbs\.db$/,
//       // Lock files
//       /package-lock\.json$/,
//       /yarn\.lock$/,
//       /Cargo\.lock$/,
//     ];

//     return ignorePatterns.some(
//       (pattern) => pattern.test(fileName) || pattern.test(relativePath)
//     );
//   };

//   const analyzeProject = (files: ImportedFile[]): ProjectAnalysis => {
//     let totalFiles = 0;
//     let cairoFiles = 0;
//     let contracts = 0;
//     let hasScarbToml = false;
//     let hasCairoProject = false;
//     const dependencies = new Set<string>();

//     const analyzeRecursive = (fileList: ImportedFile[]) => {
//       fileList.forEach((file) => {
//         if (file.type === "file") {
//           totalFiles++;

//           if (file.name.endsWith(".cairo")) {
//             cairoFiles++;

//             // Check if it's a contract
//             if (
//               file.content?.includes("#[starknet::contract]") ||
//               file.content?.includes("@contract")
//             ) {
//               contracts++;
//             }

//             // Extract dependencies
//             if (file.content?.includes("starknet"))
//               dependencies.add("starknet");
//             if (file.content?.includes("openzeppelin"))
//               dependencies.add("openzeppelin");
//           }

//           if (file.name === "Scarb.toml") {
//             hasScarbToml = true;
//             // Parse dependencies from Scarb.toml
//             if (file.content) {
//               const lines = file.content.split("\n");
//               lines.forEach((line) => {
//                 if (line.includes("starknet")) dependencies.add("starknet");
//                 if (line.includes("openzeppelin"))
//                   dependencies.add("openzeppelin");
//               });
//             }
//           }

//           if (file.name === "cairo_project.toml") {
//             hasCairoProject = true;
//           }
//         } else if (file.children) {
//           analyzeRecursive(file.children);
//         }
//       });
//     };

//     analyzeRecursive(files);

//     // Determine project type
//     let projectType: ProjectAnalysis["projectType"] = "unknown";
//     if (hasScarbToml && cairoFiles > 0) {
//       projectType = "scarb";
//     } else if (hasCairoProject && cairoFiles > 0) {
//       projectType = "cairo";
//     } else if (cairoFiles > 0) {
//       projectType = "mixed";
//     }

//     // Calculate estimated size
//     const totalSize = calculateTotalSize(files);
//     const estimatedSize = formatFileSize(totalSize);

//     return {
//       totalFiles,
//       cairoFiles,
//       contracts,
//       dependencies: Array.from(dependencies),
//       projectType,
//       hasScarbToml,
//       hasCairoProject,
//       estimatedSize,
//     };
//   };

//   const calculateTotalSize = (files: ImportedFile[]): number => {
//     let total = 0;
//     const calculateRecursive = (fileList: ImportedFile[]) => {
//       fileList.forEach((file) => {
//         if (file.type === "file" && file.size) {
//           total += file.size;
//         } else if (file.children) {
//           calculateRecursive(file.children);
//         }
//       });
//     };
//     calculateRecursive(files);
//     return total;
//   };

//   const formatFileSize = (bytes: number): string => {
//     if (bytes === 0) return "0 Bytes";
//     const k = 1024;
//     const sizes = ["Bytes", "KB", "MB", "GB"];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return (
//       Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
//     );
//   };

//   const convertToFileNodes = (importedFiles: ImportedFile[]): FileNode[] => {
//     const convertRecursive = (files: ImportedFile[]): FileNode[] => {
//       return files.map((file) => ({
//         id: Math.random().toString(36).substr(2, 9),
//         name: file.name,
//         type: file.type,
//         path: file.path,
//         content: file.content,
//         children: file.children ? convertRecursive(file.children) : undefined,
//       }));
//     };
//     return convertRecursive(importedFiles);
//   };

//   const handleImport = async () => {
//     setCurrentStep("import");
//     setImportProgress(0);

//     // Simulate import process
//     for (let i = 0; i <= 100; i += 10) {
//       setImportProgress(i);
//       await new Promise((resolve) => setTimeout(resolve, 100));
//     }

//     const fileNodes = convertToFileNodes(importedFiles);
//     onImport(fileNodes);
//     handleClose();
//   };

//   const handleClose = () => {
//     setCurrentStep("upload");
//     setImportedFiles([]);
//     setProjectAnalysis(null);
//     setImportProgress(0);
//     onClose();
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(true);
//   };

//   const handleDragLeave = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(false);
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragOver(false);

//     const files = e.dataTransfer.files;
//     handleFileUpload(files);
//   };

//   const renderFileTree = (files: ImportedFile[], depth = 0) => {
//     return files.map((file, index) => (
//       <div
//         key={index}
//         style={{ paddingLeft: `${depth * 16}px` }}
//         className="py-1"
//       >
//         <div className="flex items-center gap-2 text-sm">
//           {file.type === "folder" ? (
//             <FolderOpen className="w-4 h-4 text-blue-500" />
//           ) : (
//             <FileText className="w-4 h-4 text-gray-500" />
//           )}
//           <span>{file.name}</span>
//           {file.type === "file" && file.size && (
//             <span className="text-xs text-muted-foreground">
//               ({formatFileSize(file.size)})
//             </span>
//           )}
//           {file.name.endsWith(".cairo") && (
//             <Badge variant="secondary" className="text-xs">
//               Cairo
//             </Badge>
//           )}
//           {file.content?.includes("#[starknet::contract]") && (
//             <Badge variant="outline" className="text-xs">
//               Contract
//             </Badge>
//           )}
//         </div>
//         {file.children && renderFileTree(file.children, depth + 1)}
//       </div>
//     ));
//   };

//   const getProjectTypeColor = (type: ProjectAnalysis["projectType"]) => {
//     switch (type) {
//       case "scarb":
//         return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
//       case "cairo":
//         return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
//       case "mixed":
//         return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
//       default:
//         return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={handleClose}>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <Upload className="w-5 h-5" />
//             Import Cairo Project
//           </DialogTitle>
//         </DialogHeader>

//         <div className="space-y-6">
//           {/* Upload Step */}
//           {currentStep === "upload" && (
//             <div className="space-y-6">
//               <div className="text-center">
//                 <h3 className="text-lg font-semibold mb-2">
//                   Import Your Cairo Project
//                 </h3>
//                 <p className="text-muted-foreground">
//                   Upload a folder containing your Cairo smart contracts and
//                   project files
//                 </p>
//               </div>

//               {/* Drag & Drop Area */}
//               <div
//                 className={cn(
//                   "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
//                   isDragOver
//                     ? "border-primary bg-primary/5"
//                     : "border-muted-foreground/25 hover:border-primary/50"
//                 )}
//                 onDragOver={handleDragOver}
//                 onDragLeave={handleDragLeave}
//                 onDrop={handleDrop}
//               >
//                 <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
//                 <h4 className="text-lg font-medium mb-2">
//                   {isDragOver
//                     ? "Drop your project folder here"
//                     : "Drag & drop your project folder"}
//                 </h4>
//                 <p className="text-muted-foreground mb-4">
//                   Or click below to browse and select your project folder
//                 </p>

//                 <div className="flex gap-3 justify-center">
//                   <Button
//                     onClick={() => folderInputRef.current?.click()}
//                     className="gap-2"
//                   >
//                     <FolderOpen className="w-4 h-4" />
//                     Select Folder
//                   </Button>
//                   <Button
//                     variant="outline"
//                     onClick={() => fileInputRef.current?.click()}
//                     className="gap-2 bg-transparent"
//                   >
//                     <FileText className="w-4 h-4" />
//                     Select Files
//                   </Button>
//                 </div>

//                 <input
//                   ref={folderInputRef}
//                   type="file"
//                   //   webkitdirectory=""
//                   multiple
//                   className="hidden"
//                   onChange={(e) => handleFileUpload(e.target.files)}
//                 />
//                 <input
//                   ref={fileInputRef}
//                   type="file"
//                   multiple
//                   accept=".cairo,.toml,.md,.txt,.json"
//                   className="hidden"
//                   onChange={(e) => handleFileUpload(e.target.files)}
//                 />
//               </div>

//               {/* Supported File Types */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="text-base">
//                     Supported Project Types
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                       <h4 className="font-medium">Scarb Projects</h4>
//                       <ul className="text-sm text-muted-foreground space-y-1">
//                         <li>• Scarb.toml configuration</li>
//                         <li>• src/ directory with .cairo files</li>
//                         <li>• Automatic dependency detection</li>
//                       </ul>
//                     </div>
//                     <div className="space-y-2">
//                       <h4 className="font-medium">Cairo Projects</h4>
//                       <ul className="text-sm text-muted-foreground space-y-1">
//                         <li>• .cairo contract files</li>
//                         <li>• cairo_project.toml (optional)</li>
//                         <li>• Manual or auto-configuration</li>
//                       </ul>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           )}

//           {/* Analyze Step */}
//           {currentStep === "analyze" && (
//             <div className="text-center space-y-4">
//               <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
//               <div>
//                 <h3 className="text-lg font-semibold">Analyzing Project</h3>
//                 <p className="text-muted-foreground">
//                   Processing files and detecting project structure...
//                 </p>
//                 <Progress value={importProgress} className="w-full mt-4" />
//               </div>
//             </div>
//           )}

//           {/* Confirm Step */}
//           {currentStep === "confirm" && projectAnalysis && (
//             <ScrollArea className="h-[500px] pr-4">
//               <div className="space-y-6">
//                 {/* Project Analysis */}
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                       <CheckCircle className="w-5 h-5 text-green-500" />
//                       Project Analysis
//                     </CardTitle>
//                     <CardDescription>
//                       Your project has been analyzed and is ready for import
//                     </CardDescription>
//                   </CardHeader>
//                   <CardContent className="space-y-4">
//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="space-y-2">
//                         <div className="flex items-center justify-between">
//                           <span className="text-sm font-medium">
//                             Project Type
//                           </span>
//                           <Badge
//                             className={getProjectTypeColor(
//                               projectAnalysis.projectType
//                             )}
//                           >
//                             {projectAnalysis.projectType.toUpperCase()}
//                           </Badge>
//                         </div>
//                         <div className="flex items-center justify-between">
//                           <span className="text-sm font-medium">
//                             Total Files
//                           </span>
//                           <span className="text-sm">
//                             {projectAnalysis.totalFiles}
//                           </span>
//                         </div>
//                         <div className="flex items-center justify-between">
//                           <span className="text-sm font-medium">
//                             Cairo Files
//                           </span>
//                           <span className="text-sm">
//                             {projectAnalysis.cairoFiles}
//                           </span>
//                         </div>
//                       </div>
//                       <div className="space-y-2">
//                         <div className="flex items-center justify-between">
//                           <span className="text-sm font-medium">
//                             Smart Contracts
//                           </span>
//                           <span className="text-sm">
//                             {projectAnalysis.contracts}
//                           </span>
//                         </div>
//                         <div className="flex items-center justify-between">
//                           <span className="text-sm font-medium">
//                             Project Size
//                           </span>
//                           <span className="text-sm">
//                             {projectAnalysis.estimatedSize}
//                           </span>
//                         </div>
//                         <div className="flex items-center justify-between">
//                           <span className="text-sm font-medium">
//                             Has Scarb.toml
//                           </span>
//                           <span className="text-sm">
//                             {projectAnalysis.hasScarbToml ? "✅" : "❌"}
//                           </span>
//                         </div>
//                       </div>
//                     </div>

//                     {projectAnalysis.dependencies.length > 0 && (
//                       <div>
//                         <h4 className="text-sm font-medium mb-2">
//                           Dependencies
//                         </h4>
//                         <div className="flex gap-2">
//                           {projectAnalysis.dependencies.map((dep) => (
//                             <Badge
//                               key={dep}
//                               variant="secondary"
//                               className="text-xs"
//                             >
//                               {dep}
//                             </Badge>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {projectAnalysis.contracts === 0 && (
//                       <Alert>
//                         <AlertCircle className="h-4 w-4" />
//                         <AlertDescription>
//                           No smart contracts detected. Make sure your .cairo
//                           files include #[starknet::contract].
//                         </AlertDescription>
//                       </Alert>
//                     )}
//                   </CardContent>
//                 </Card>

//                 {/* File Structure Preview */}
//                 <Card>
//                   <CardHeader>
//                     <CardTitle>File Structure</CardTitle>
//                     <CardDescription>
//                       Preview of files that will be imported (
//                       {importedFiles.length} items)
//                     </CardDescription>
//                   </CardHeader>
//                   <CardContent>
//                     <ScrollArea className="h-[300px]">
//                       <div className="font-mono text-sm">
//                         {renderFileTree(importedFiles)}
//                       </div>
//                     </ScrollArea>
//                   </CardContent>
//                 </Card>

//                 {/* Import Actions */}
//                 <div className="flex justify-end gap-3">
//                   <Button variant="outline" onClick={handleClose}>
//                     Cancel
//                   </Button>
//                   <Button onClick={handleImport} className="gap-2">
//                     <Download className="w-4 h-4" />
//                     Import Project
//                   </Button>
//                 </div>
//               </div>
//             </ScrollArea>
//           )}

//           {/* Import Step */}
//           {currentStep === "import" && (
//             <div className="text-center space-y-4">
//               <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
//               <div>
//                 <h3 className="text-lg font-semibold">Importing Project</h3>
//                 <p className="text-muted-foreground">
//                   Setting up your project in the IDE...
//                 </p>
//                 <Progress value={importProgress} className="w-full mt-4" />
//               </div>
//             </div>
//           )}
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

"use client";

import type React from "react";

import { useState, useRef } from "react";
import {
  Upload,
  FolderOpen,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { FileNode } from "../../types/ide";

interface ProjectImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (files: FileNode[]) => void;
}

interface ImportedFile {
  name: string;
  path: string;
  type: "file" | "folder";
  size?: number;
  content?: string;
  children?: ImportedFile[];
}

interface ProjectAnalysis {
  totalFiles: number;
  cairoFiles: number;
  contracts: number;
  dependencies: string[];
  projectType: "cairo" | "scarb" | "mixed" | "unknown";
  hasScarbToml: boolean;
  hasCairoProject: boolean;
  hasSnfoundryToml?: boolean;
  hasTestsFolder?: boolean;
  hasGitignore?: boolean;
  estimatedSize: string;
}

export function ProjectImportModal({
  isOpen,
  onClose,
  onImport,
}: ProjectImportModalProps) {
  const [currentStep, setCurrentStep] = useState<
    "upload" | "analyze" | "confirm" | "import"
  >("upload");
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [projectAnalysis, setProjectAnalysis] =
    useState<ProjectAnalysis | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setCurrentStep("analyze");
    setImportProgress(0);

    const fileArray = Array.from(files);
    const importedFileStructure = await processFiles(fileArray);

    setImportedFiles(importedFileStructure);

    // Analyze the project
    const analysis = analyzeProject(importedFileStructure);
    setProjectAnalysis(analysis);

    setCurrentStep("confirm");
  };

  const processFiles = async (files: File[]): Promise<ImportedFile[]> => {
    const fileMap = new Map<string, ImportedFile>();
    const rootFiles: ImportedFile[] = [];

    // Sort files to process folders first
    const sortedFiles = files.sort((a, b) => {
      const aDepth = a.webkitRelativePath.split("/").length;
      const bDepth = b.webkitRelativePath.split("/").length;
      return aDepth - bDepth;
    });

    for (let i = 0; i < sortedFiles.length; i++) {
      const file = sortedFiles[i];
      setImportProgress((i / sortedFiles.length) * 100);

      const relativePath = file.webkitRelativePath || file.name;
      const pathParts = relativePath.split("/");
      const fileName = pathParts[pathParts.length - 1];

      // Skip hidden files and common ignore patterns
      if (shouldIgnoreFile(fileName, relativePath)) {
        continue;
      }

      const content = await readFileContent(file);

      const importedFile: ImportedFile = {
        name: fileName,
        path: `/${relativePath}`,
        type: "file",
        size: file.size,
        content: content,
      };

      // Build folder structure
      let currentLevel = rootFiles;
      let currentPath = "";

      for (let j = 0; j < pathParts.length - 1; j++) {
        const folderName = pathParts[j];
        currentPath += `/${folderName}`;

        let folder = currentLevel.find(
          (f) => f.name === folderName && f.type === "folder"
        );
        if (!folder) {
          folder = {
            name: folderName,
            path: currentPath,
            type: "folder",
            children: [],
          };
          currentLevel.push(folder);
        }
        currentLevel = folder.children!;
      }

      currentLevel.push(importedFile);
    }

    return rootFiles;
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content || "");
      };
      reader.onerror = () => resolve("");

      // Only read text files
      if (isTextFile(file.name)) {
        reader.readAsText(file);
      } else {
        resolve("");
      }
    });
  };

  const isTextFile = (fileName: string): boolean => {
    const textExtensions = [
      ".cairo",
      ".toml",
      ".md",
      ".txt",
      ".json",
      ".yaml",
      ".yml",
      ".rs",
      ".py",
      ".js",
      ".ts",
      ".lock",
      ".gitignore",
      ".env",
      ".sh",
      ".bash",
      ".zsh",
      ".fish",
      ".dockerfile",
      ".dockerignore",
      ".sol",
      ".vy",
      ".move", // Other smart contract languages
    ];

    // Also check for files without extensions that are typically text
    const textFileNames = [
      "README",
      "LICENSE",
      "CHANGELOG",
      "CONTRIBUTING",
      "Dockerfile",
      "Makefile",
      ".gitignore",
      ".env",
    ];

    return (
      textExtensions.some((ext) => fileName.toLowerCase().endsWith(ext)) ||
      textFileNames.some((name) => fileName === name)
    );
  };

  const shouldIgnoreFile = (
    fileName: string,
    relativePath: string
  ): boolean => {
    const ignorePatterns = [
      // Only ignore these specific patterns, be more permissive
      /node_modules\//,
      /\.git\/objects\//,
      /\.git\/refs\//,
      /\.git\/hooks\//,
      // Keep .gitignore and other important dot files
      // /^\./,  // Remove this line to allow .gitignore, .env, etc.
      // OS files
      /\.DS_Store$/,
      /Thumbs\.db$/,
      // Temporary files
      /~$/,
      /\.tmp$/,
      /\.temp$/,
    ];

    return ignorePatterns.some(
      (pattern) => pattern.test(fileName) || pattern.test(relativePath)
    );
  };

  const analyzeProject = (files: ImportedFile[]): ProjectAnalysis => {
    let totalFiles = 0;
    let cairoFiles = 0;
    let contracts = 0;
    let hasScarbToml = false;
    let hasCairoProject = false;
    let hasSnfoundryToml = false;
    let hasTestsFolder = false;
    let hasGitignore = false;
    const dependencies = new Set<string>();

    const analyzeRecursive = (fileList: ImportedFile[]) => {
      fileList.forEach((file) => {
        if (file.type === "file") {
          totalFiles++;

          if (file.name.endsWith(".cairo")) {
            cairoFiles++;

            // Check if it's a contract
            if (
              file.content?.includes("#[starknet::contract]") ||
              file.content?.includes("@contract") ||
              file.content?.includes("#[contract]")
            ) {
              contracts++;
            }

            // Extract dependencies from Cairo files
            if (file.content?.includes("starknet"))
              dependencies.add("starknet");
            if (file.content?.includes("openzeppelin"))
              dependencies.add("openzeppelin");
            if (file.content?.includes("alexandria"))
              dependencies.add("alexandria");
          }

          // Check for configuration files
          if (file.name === "Scarb.toml") {
            hasScarbToml = true;
            // Parse dependencies from Scarb.toml
            if (file.content) {
              const lines = file.content.split("\n");
              lines.forEach((line) => {
                if (line.includes("starknet")) dependencies.add("starknet");
                if (line.includes("openzeppelin"))
                  dependencies.add("openzeppelin");
                if (line.includes("alexandria")) dependencies.add("alexandria");
                if (line.includes("snforge_std"))
                  dependencies.add("snforge_std");
              });
            }
          }

          if (file.name === "cairo_project.toml") {
            hasCairoProject = true;
          }

          if (file.name === "snfoundry.toml") {
            hasSnfoundryToml = true;
            dependencies.add("snforge");
          }

          if (file.name === ".gitignore") {
            hasGitignore = true;
          }
        } else if (file.type === "folder") {
          if (file.name === "tests" || file.name === "test") {
            hasTestsFolder = true;
          }
          if (file.children) {
            analyzeRecursive(file.children);
          }
        }
      });
    };

    analyzeRecursive(files);

    // Determine project type with better detection
    let projectType: ProjectAnalysis["projectType"] = "unknown";
    if (hasScarbToml && cairoFiles > 0) {
      projectType = "scarb";
    } else if (hasCairoProject && cairoFiles > 0) {
      projectType = "cairo";
    } else if (cairoFiles > 0) {
      projectType = "mixed";
    }

    // Calculate estimated size
    const totalSize = calculateTotalSize(files);
    const estimatedSize = formatFileSize(totalSize);

    return {
      totalFiles,
      cairoFiles,
      contracts,
      dependencies: Array.from(dependencies),
      projectType,
      hasScarbToml,
      hasCairoProject,
      estimatedSize,
      // Add new properties for better analysis
      hasSnfoundryToml,
      hasTestsFolder,
      hasGitignore,
    };
  };

  const calculateTotalSize = (files: ImportedFile[]): number => {
    let total = 0;
    const calculateRecursive = (fileList: ImportedFile[]) => {
      fileList.forEach((file) => {
        if (file.type === "file" && file.size) {
          total += file.size;
        } else if (file.children) {
          calculateRecursive(file.children);
        }
      });
    };
    calculateRecursive(files);
    return total;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const convertToFileNodes = (importedFiles: ImportedFile[]): FileNode[] => {
    const convertRecursive = (files: ImportedFile[]): FileNode[] => {
      return files.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        path: file.path,
        content: file.content,
        children: file.children ? convertRecursive(file.children) : undefined,
      }));
    };
    return convertRecursive(importedFiles);
  };

  const handleImport = async () => {
    setCurrentStep("import");
    setImportProgress(0);

    // Simulate import process
    for (let i = 0; i <= 100; i += 10) {
      setImportProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const fileNodes = convertToFileNodes(importedFiles);
    onImport(fileNodes);
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep("upload");
    setImportedFiles([]);
    setProjectAnalysis(null);
    setImportProgress(0);
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const renderFileTree = (files: ImportedFile[], depth = 0) => {
    return files.map((file, index) => (
      <div
        key={index}
        style={{ paddingLeft: `${depth * 16}px` }}
        className="py-1"
      >
        <div className="flex items-center gap-2 text-sm">
          {file.type === "folder" ? (
            <FolderOpen className="w-4 h-4 text-blue-500" />
          ) : (
            <FileText className="w-4 h-4 text-gray-500" />
          )}
          <span className={file.name.startsWith(".") ? "text-gray-400" : ""}>
            {file.name}
          </span>
          {file.type === "file" && file.size && (
            <span className="text-xs text-muted-foreground">
              ({formatFileSize(file.size)})
            </span>
          )}

          {/* File type badges */}
          {file.name.endsWith(".cairo") && (
            <Badge variant="secondary" className="text-xs">
              Cairo
            </Badge>
          )}
          {file.name === "Scarb.toml" && (
            <Badge variant="outline" className="text-xs text-blue-600">
              Scarb
            </Badge>
          )}
          {file.name === "snfoundry.toml" && (
            <Badge variant="outline" className="text-xs text-purple-600">
              Foundry
            </Badge>
          )}
          {file.name === ".gitignore" && (
            <Badge variant="outline" className="text-xs text-orange-600">
              Git
            </Badge>
          )}
          {file.name.includes("test") && file.name.endsWith(".cairo") && (
            <Badge variant="outline" className="text-xs text-green-600">
              Test
            </Badge>
          )}
          {file.content?.includes("#[starknet::contract]") && (
            <Badge variant="outline" className="text-xs text-red-600">
              Contract
            </Badge>
          )}
        </div>
        {file.children && renderFileTree(file.children, depth + 1)}
      </div>
    ));
  };

  const getProjectTypeColor = (type: ProjectAnalysis["projectType"]) => {
    switch (type) {
      case "scarb":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cairo":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "mixed":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Cairo Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Step */}
          {currentStep === "upload" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Import Your Cairo Project
                </h3>
                <p className="text-muted-foreground">
                  Upload a folder containing your Cairo smart contracts and
                  project files
                </p>
              </div>

              {/* Drag & Drop Area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h4 className="text-lg font-medium mb-2">
                  {isDragOver
                    ? "Drop your project folder here"
                    : "Drag & drop your project folder"}
                </h4>
                <p className="text-muted-foreground mb-4">
                  Or click below to browse and select your project folder
                </p>

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => folderInputRef.current?.click()}
                    className="gap-2"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Select Folder
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 bg-transparent"
                  >
                    <FileText className="w-4 h-4" />
                    Select Files
                  </Button>
                </div>

                <input
                  ref={folderInputRef}
                  type="file"
                  //   @ts-ignore
                  webkitdirectory=""
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".cairo,.toml,.md,.txt,.json"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </div>

              {/* Supported File Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Supported Project Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          🏗️ Scarb Projects
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                          <li>• Scarb.toml configuration</li>
                          <li>• src/ directory with .cairo files</li>
                          <li>• Automatic dependency detection</li>
                          <li>• Built-in test support</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          🔧 Starknet Foundry Projects
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                          <li>• snfoundry.toml configuration</li>
                          <li>• Advanced testing with snforge</li>
                          <li>• Deployment scripts support</li>
                          <li>• Gas profiling and optimization</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          📁 Standard Cairo Projects
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                          <li>• .cairo contract files</li>
                          <li>• cairo_project.toml (optional)</li>
                          <li>• Manual or auto-configuration</li>
                          <li>• Legacy project support</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        📋 Common Project Structure:
                      </h5>
                      <div className="text-xs font-mono text-muted-foreground">
                        hello_starknet/
                        <br />
                        ├── src/
                        <br />
                        ├── tests/
                        <br />
                        ├── target/
                        <br />
                        ├── Scarb.toml
                        <br />
                        ├── snfoundry.toml
                        <br />
                        └── .gitignore
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analyze Step */}
          {currentStep === "analyze" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Analyzing Project</h3>
                <p className="text-muted-foreground">
                  Processing files and detecting project structure...
                </p>
                <Progress value={importProgress} className="w-full mt-4" />
              </div>
            </div>
          )}

          {/* Confirm Step */}
          {currentStep === "confirm" && projectAnalysis && (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {/* Project Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Project Analysis
                    </CardTitle>
                    <CardDescription>
                      Your Starknet project has been analyzed and is ready for
                      import
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Project Type
                          </span>
                          <Badge
                            className={getProjectTypeColor(
                              projectAnalysis.projectType
                            )}
                          >
                            {projectAnalysis.projectType.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Total Files
                          </span>
                          <span className="text-sm">
                            {projectAnalysis.totalFiles}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Cairo Files
                          </span>
                          <span className="text-sm">
                            {projectAnalysis.cairoFiles}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Smart Contracts
                          </span>
                          <span className="text-sm">
                            {projectAnalysis.contracts}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Project Size
                          </span>
                          <span className="text-sm">
                            {projectAnalysis.estimatedSize}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Has Scarb.toml
                          </span>
                          <span className="text-sm">
                            {projectAnalysis.hasScarbToml ? "✅" : "❌"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Has Tests</span>
                          <span className="text-sm">
                            {projectAnalysis.hasTestsFolder ? "✅" : "❌"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Has .gitignore
                          </span>
                          <span className="text-sm">
                            {projectAnalysis.hasGitignore ? "✅" : "❌"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Starknet Foundry Detection */}
                    {projectAnalysis.hasSnfoundryToml && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          🔧 Starknet Foundry project detected! This project
                          uses snforge for testing and deployment.
                        </AlertDescription>
                      </Alert>
                    )}

                    {projectAnalysis.dependencies.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Dependencies
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                          {projectAnalysis.dependencies.map((dep) => (
                            <Badge
                              key={dep}
                              variant="secondary"
                              className="text-xs"
                            >
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Project Health Indicators */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Project Health</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {projectAnalysis.hasScarbToml && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Scarb configuration found
                          </div>
                        )}
                        {projectAnalysis.hasTestsFolder && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Test suite available
                          </div>
                        )}
                        {projectAnalysis.hasGitignore && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Git configuration present
                          </div>
                        )}
                        {projectAnalysis.contracts > 0 && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Smart contracts detected
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Warnings */}
                    {projectAnalysis.contracts === 0 &&
                      projectAnalysis.cairoFiles > 0 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No smart contracts detected. Make sure your .cairo
                            files include #[starknet::contract].
                          </AlertDescription>
                        </Alert>
                      )}

                    {!projectAnalysis.hasScarbToml &&
                      !projectAnalysis.hasCairoProject && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No build configuration found. Consider adding a
                            Scarb.toml file for better project management.
                          </AlertDescription>
                        </Alert>
                      )}
                  </CardContent>
                </Card>

                {/* File Structure Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>File Structure</CardTitle>
                    <CardDescription>
                      Preview of files that will be imported (
                      {importedFiles.length} items)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="font-mono text-sm">
                        {renderFileTree(importedFiles)}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Import Actions */}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleImport} className="gap-2">
                    <Download className="w-4 h-4" />
                    Import Project
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Import Step */}
          {currentStep === "import" && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Importing Project</h3>
                <p className="text-muted-foreground">
                  Setting up your project in the IDE...
                </p>
                <Progress value={importProgress} className="w-full mt-4" />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
