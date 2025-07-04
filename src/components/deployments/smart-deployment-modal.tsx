"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  ArrowRight,
  Settings,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { FileNode } from "../../types/ide";
import { DeploymentErrorLogger } from "./deployment-error-logger";
import type { DeploymentError, DeploymentLog } from "../../types/deployment";

interface SmartDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileNode[];
  onDeploymentComplete: (result: DeploymentResult) => void;
}

interface DeploymentResult {
  contractAddress: string;
  transactionHash: string;
  network: string;
  contractName: string;
  classHash: string;
}

interface DeploymentStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "loading" | "success" | "error" | "warning";
  details?: string;
  txHash?: string;
  canRetry?: boolean;
  autoRetryCount?: number;
}

interface DetectedContract {
  name: string;
  path: string;
  hasConstructor: boolean;
  constructorArgs: string[];
  dependencies: string[];
}

export function SmartDeployModal({
  isOpen,
  onClose,
  files,
  onDeploymentComplete,
}: SmartDeployModalProps) {
  const [currentStep, setCurrentStep] = useState<
    "detect" | "confirm" | "deploy" | "success" | "error"
  >("detect");
  const [detectedContracts, setDetectedContracts] = useState<
    DetectedContract[]
  >([]);
  const [selectedContract, setSelectedContract] =
    useState<DetectedContract | null>(null);
  const [network, setNetwork] = useState<"sepolia" | "mainnet">("sepolia");
  const [accountMethod, setAccountMethod] = useState<"auto" | "manual">("auto");
  const [manualPrivateKey, setManualPrivateKey] = useState("");
  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentResult, setDeploymentResult] =
    useState<DeploymentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [deploymentErrors, setDeploymentErrors] = useState<DeploymentError[]>(
    []
  );
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLog[]>([]);

  // Auto-detect contracts when modal opens
  useEffect(() => {
    if (isOpen) {
      detectContracts();
    }
  }, [isOpen, files]);

  const detectContracts = () => {
    // Simulate contract detection from files
    const contracts: DetectedContract[] = [];

    const findCairoFiles = (nodes: FileNode[]) => {
      nodes.forEach((node) => {
        if (
          node.type === "file" &&
          node.name.endsWith(".cairo") &&
          node.content
        ) {
          // Simple contract detection logic
          if (
            node.content.includes("#[starknet::contract]") ||
            node.content.includes("@contract")
          ) {
            const contractName =
              extractContractName(node.content) ||
              node.name.replace(".cairo", "");
            const hasConstructor =
              node.content.includes("constructor") ||
              node.content.includes("#[constructor]");

            contracts.push({
              name: contractName,
              path: node.path,
              hasConstructor,
              constructorArgs: hasConstructor
                ? extractConstructorArgs(node.content)
                : [],
              dependencies: extractDependencies(node.content),
            });
          }
        }
        if (node.children) {
          findCairoFiles(node.children);
        }
      });
    };

    findCairoFiles(files);
    setDetectedContracts(contracts);

    if (contracts.length === 1) {
      setSelectedContract(contracts[0]);
      setCurrentStep("confirm");
    } else if (contracts.length > 1) {
      setCurrentStep("confirm");
    } else {
      setCurrentStep("error");
      setErrorMessage(
        "No deployable Cairo contracts found. Make sure your contract includes #[starknet::contract]."
      );
    }
  };

  const extractContractName = (content: string): string | null => {
    const match = content.match(/mod\s+(\w+)\s*{/);
    return match ? match[1] : null;
  };

  const extractConstructorArgs = (content: string): string[] => {
    // Simple extraction - in real implementation, this would parse the AST
    const constructorMatch = content.match(
      /#\[constructor\]\s*fn\s+constructor\s*$$[^)]*$$/
    );
    if (constructorMatch) {
      // Extract parameter names (simplified)
      return ["owner", "initial_value"]; // Mock data
    }
    return [];
  };

  const extractDependencies = (content: string): string[] => {
    const deps = [];
    if (content.includes("starknet")) deps.push("starknet");
    if (content.includes("openzeppelin")) deps.push("openzeppelin");
    return deps;
  };

  const startSmartDeployment = async () => {
    if (!selectedContract) return;

    setCurrentStep("deploy");
    setCurrentStepIndex(0);
    setDeploymentProgress(0);

    const steps: DeploymentStep[] = [
      {
        id: "setup",
        title: "Environment Setup",
        description: "Preparing deployment environment",
        status: "pending",
      },
      {
        id: "account",
        title: "Account Management",
        description:
          accountMethod === "auto"
            ? "Auto-configuring account"
            : "Verifying provided account",
        status: "pending",
      },
      {
        id: "compile",
        title: "Smart Compilation",
        description: "Compiling and optimizing contract",
        status: "pending",
      },
      {
        id: "declare",
        title: "Contract Declaration",
        description: "Declaring contract class on network",
        status: "pending",
      },
      {
        id: "deploy",
        title: "Contract Deployment",
        description: "Deploying contract instance",
        status: "pending",
      },
      {
        id: "verify",
        title: "Verification",
        description: "Verifying deployment and generating links",
        status: "pending",
      },
    ];

    setDeploymentSteps(steps);
    await executeDeploymentSteps(steps);
  };

  const addLog = (
    level: DeploymentLog["level"],
    step: string,
    message: string,
    data?: any
  ) => {
    const log: DeploymentLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level,
      step,
      message,
      data,
    };
    setDeploymentLogs((prev) => [...prev, log]);
  };

  const addError = (
    step: string,
    type: DeploymentError["type"],
    message: string,
    details: string,
    options?: Partial<DeploymentError>
  ) => {
    const error: DeploymentError = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      step,
      type,
      severity: options?.severity || "high",
      message,
      details,
      technicalDetails: options?.technicalDetails,
      stackTrace: options?.stackTrace,
      timestamp: new Date(),
      retryable: options?.retryable ?? true,
      suggestedFix: options?.suggestedFix,
      relatedLinks: options?.relatedLinks,
      context: options?.context,
    };
    setDeploymentErrors((prev) => [...prev, error]);
    addLog("error", step, message, { error });
  };

  const executeDeploymentSteps = async (steps: DeploymentStep[]) => {
    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      const step = steps[i];

      // Update step to loading
      const updatedSteps = [...steps];
      updatedSteps[i] = { ...step, status: "loading" };
      setDeploymentSteps(updatedSteps);
      setDeploymentProgress((i / steps.length) * 100);

      try {
        await executeStep(step, i);

        // Update step to success
        updatedSteps[i] = {
          ...step,
          status: "success",
          details: getSuccessMessage(step.id),
        };
        setDeploymentSteps(updatedSteps);
      } catch (error) {
        // Handle error with retry option
        updatedSteps[i] = {
          ...step,
          status: "error",
          details:
            error instanceof Error ? error.message : "Unknown error occurred",
          canRetry: true,
          autoRetryCount: 0,
        };
        setDeploymentSteps(updatedSteps);

        // Auto-retry logic for certain errors
        if (shouldAutoRetry(step.id, error)) {
          await handleAutoRetry(i, updatedSteps);
        } else {
          // Stop deployment and show error options
          setCurrentStep("error");
          setErrorMessage(`Deployment failed at step: ${step.title}`);
          return;
        }
      }
    }

    // All steps completed successfully
    setDeploymentProgress(100);
    setCurrentStep("success");

    // Generate mock deployment result
    const result: DeploymentResult = {
      contractAddress: "0x" + Math.random().toString(16).substr(2, 40),
      transactionHash: "0x" + Math.random().toString(16).substr(2, 64),
      network,
      contractName: selectedContract?.name || "Contract",
      classHash: "0x" + Math.random().toString(16).substr(2, 64),
    };

    setDeploymentResult(result);
    onDeploymentComplete(result);
  };

  const executeStep = async (
    step: DeploymentStep,
    index: number
  ): Promise<void> => {
    addLog("info", step.id, `Starting ${step.title}`);

    try {
      // Simulate different types of errors with detailed logging
      const delays = [1000, 1500, 2500, 2000, 3000, 1000];

      // Add step-specific logging
      switch (step.id) {
        case "setup":
          addLog("debug", step.id, "Initializing deployment environment");
          addLog("debug", step.id, "Checking system requirements");
          break;
        case "account":
          addLog(
            "debug",
            step.id,
            `Configuring account for ${network} network`
          );
          if (accountMethod === "auto") {
            addLog(
              "info",
              step.id,
              "Auto-configuring account with smart defaults"
            );
          } else {
            addLog("info", step.id, "Validating provided account credentials");
          }
          break;
        case "compile":
          addLog(
            "debug",
            step.id,
            `Compiling contract: ${selectedContract?.name}`
          );
          addLog(
            "debug",
            step.id,
            "Running Cairo compiler with optimization flags"
          );
          break;
        case "declare":
          addLog(
            "debug",
            step.id,
            "Preparing contract declaration transaction"
          );
          addLog("debug", step.id, "Estimating gas costs for declaration");
          break;
        case "deploy":
          addLog("debug", step.id, "Creating contract deployment transaction");
          if (selectedContract?.constructorArgs.length) {
            addLog(
              "debug",
              step.id,
              `Constructor args: ${selectedContract.constructorArgs.join(", ")}`
            );
          }
          break;
        case "verify":
          addLog("debug", step.id, "Verifying deployment on blockchain");
          addLog("debug", step.id, "Indexing contract for explorer");
          break;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, delays[index] || 1000)
      );

      // Simulate specific error scenarios with detailed error information
      if (Math.random() < 0.15) {
        // Increased error rate for demo
        const errorScenarios = [
          {
            step: "account",
            type: "account" as const,
            message: "Insufficient account balance",
            details:
              "Account does not have enough STRK tokens to pay for transaction fees",
            technicalDetails: `Account balance: 0.001 STRK\nRequired: 0.005 STRK\nNetwork: ${network}`,
            suggestedFix: `Add STRK tokens to your account using the ${network === "sepolia" ? "Sepolia faucet" : "bridge from Ethereum"}`,
            relatedLinks: [
              {
                title: "Starknet Sepolia Faucet",
                url: "https://faucet.goerli.starknet.io/",
              },
              {
                title: "How to Fund Your Account",
                url: "https://docs.starknet.io/documentation/getting_started/account_setup/",
              },
            ],
            context: { network, accountMethod, balance: "0.001" },
          },
          {
            step: "compile",
            type: "compilation" as const,
            message: "Contract compilation failed",
            details:
              "Cairo compiler encountered syntax errors in the contract code",
            technicalDetails: `Error: Identifier 'storage' not found in scope\nFile: ${selectedContract?.path}\nLine: 15, Column: 8`,
            stackTrace: `cairo-compile error:\n  --> ${selectedContract?.path}:15:8\n   |\n15 |     storage: Storage,\n   |     ^^^^^^^ not found in this scope`,
            suggestedFix:
              "Check your contract syntax and ensure all imports are correct",
            relatedLinks: [
              {
                title: "Cairo Language Reference",
                url: "https://docs.cairo-lang.org/",
              },
              {
                title: "Common Cairo Errors",
                url: "https://docs.starknet.io/documentation/develop/cairo_cheatsheet/",
              },
            ],
            context: {
              contractName: selectedContract?.name,
              contractPath: selectedContract?.path,
            },
          },
          {
            step: "declare",
            type: "network" as const,
            message: "Network connection timeout",
            details:
              "Failed to connect to Starknet RPC endpoint after multiple attempts",
            technicalDetails: `RPC Endpoint: https://${network}.starknet.io/rpc\nTimeout: 30s\nAttempts: 3\nLast Error: ECONNRESET`,
            suggestedFix:
              "Check your internet connection and try again. The network might be experiencing high traffic.",
            relatedLinks: [
              { title: "Starknet Status", url: "https://status.starknet.io/" },
              {
                title: "Alternative RPC Endpoints",
                url: "https://docs.starknet.io/documentation/tools/api_services/",
              },
            ],
            context: {
              network,
              endpoint: `https://${network}.starknet.io/rpc`,
            },
          },
          {
            step: "deploy",
            type: "contract" as const,
            message: "Contract deployment reverted",
            details:
              "The contract constructor execution failed during deployment",
            technicalDetails: `Revert reason: "Ownable: caller is not the owner"\nGas used: 45,231 / 50,000\nTransaction hash: 0x1234...abcd`,
            suggestedFix:
              "Check your constructor logic and ensure all required parameters are provided correctly",
            relatedLinks: [
              {
                title: "Debugging Contract Failures",
                url: "https://docs.starknet.io/documentation/develop/debugging/",
              },
            ],
            context: {
              constructorArgs: selectedContract?.constructorArgs,
              gasUsed: 45231,
            },
          },
        ];

        const randomError =
          errorScenarios[Math.floor(Math.random() * errorScenarios.length)];
        if (randomError.step === step.id) {
          addError(
            randomError.step,
            randomError.type,
            randomError.message,
            randomError.details,
            {
              technicalDetails: randomError.technicalDetails,
              stackTrace: randomError.stackTrace,
              suggestedFix: randomError.suggestedFix,
              relatedLinks: randomError.relatedLinks,
              context: randomError.context,
              severity:
                randomError.type === "compilation" ? "critical" : "high",
            }
          );
          throw new Error(randomError.message);
        }
      }

      addLog("info", step.id, `${step.title} completed successfully`);
    } catch (error) {
      addLog(
        "error",
        step.id,
        `${step.title} failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    }
  };

  const getSuccessMessage = (stepId: string): string => {
    const messages = {
      setup: "Environment configured successfully",
      account: "Account ready and funded",
      compile: "Contract compiled and optimized",
      declare: "Contract class declared successfully",
      deploy: "Contract instance deployed",
      verify: "Deployment verified and indexed",
    };
    return messages[stepId as keyof typeof messages] || "Step completed";
  };

  const shouldAutoRetry = (stepId: string, error: any): boolean => {
    // Auto-retry for network-related errors
    const retryableSteps = ["account", "declare", "deploy"];
    console.log(error, "error");
    return retryableSteps.includes(stepId);
  };

  const handleAutoRetry = async (
    stepIndex: number,
    steps: DeploymentStep[]
  ) => {
    const step = steps[stepIndex];
    const maxRetries = 3;

    for (let retry = 1; retry <= maxRetries; retry++) {
      await new Promise((resolve) => setTimeout(resolve, 2000 * retry)); // Exponential backoff

      const updatedSteps = [...steps];
      updatedSteps[stepIndex] = {
        ...step,
        status: "loading",
        details: `Retrying... (${retry}/${maxRetries})`,
        autoRetryCount: retry,
      };
      setDeploymentSteps(updatedSteps);

      try {
        await executeStep(step, stepIndex);

        updatedSteps[stepIndex] = {
          ...step,
          status: "success",
          details: `${getSuccessMessage(step.id)} (succeeded after ${retry} retries)`,
        };
        setDeploymentSteps(updatedSteps);
        return; // Success, continue with next step
      } catch (error) {
        if (retry === maxRetries) {
          // Final retry failed
          updatedSteps[stepIndex] = {
            ...step,
            status: "error",
            details: `Failed after ${maxRetries} retries: ${error instanceof Error ? error.message : "Unknown error"}`,
            canRetry: true,
          };
          setDeploymentSteps(updatedSteps);
          throw error;
        }
      }
    }
  };

  const handleManualRetry = async (stepIndex: number) => {
    const steps = [...deploymentSteps];
    const step = steps[stepIndex];

    steps[stepIndex] = { ...step, status: "loading", details: "Retrying..." };
    setDeploymentSteps(steps);

    try {
      await executeStep(step, stepIndex);
      steps[stepIndex] = {
        ...step,
        status: "success",
        details: getSuccessMessage(step.id),
      };
      setDeploymentSteps(steps);

      // Continue with remaining steps if this was the failing step
      if (stepIndex === currentStepIndex) {
        setCurrentStep("deploy");
        const remainingSteps = steps.slice(stepIndex + 1);
        console.log(remainingSteps);
        await executeDeploymentSteps(steps);
      }
    } catch (error) {
      steps[stepIndex] = {
        ...step,
        status: "error",
        details: error instanceof Error ? error.message : "Retry failed",
        canRetry: true,
      };
      setDeploymentSteps(steps);
    }
  };

  const resetModal = () => {
    setCurrentStep("detect");
    setDetectedContracts([]);
    setSelectedContract(null);
    setDeploymentSteps([]);
    setCurrentStepIndex(0);
    setDeploymentProgress(0);
    setDeploymentResult(null);
    setErrorMessage("");
    setDeploymentErrors([]);
    setDeploymentLogs([]);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStepIcon = (status: DeploymentStep["status"]) => {
    switch (status) {
      case "loading":
        return (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        );
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <div className="w-4 h-4 border-2 border-muted rounded-full" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Smart Deploy
            <Badge variant="secondary" className="ml-2">
              AI-Powered
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Detection Step */}
          {currentStep === "detect" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">
                  Analyzing Your Project
                </h3>
                <p className="text-muted-foreground">
                  Detecting contracts and dependencies...
                </p>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === "confirm" && (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {/* Contract Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Detected Contracts
                    </CardTitle>
                    <CardDescription>
                      {detectedContracts.length} deployable contract
                      {detectedContracts.length !== 1 ? "s" : ""} found
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {detectedContracts.map((contract, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 border rounded-lg cursor-pointer transition-colors",
                          selectedContract?.name === contract.name
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => setSelectedContract(contract)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{contract.name}</h4>
                              {contract.hasConstructor && (
                                <Badge variant="outline" className="text-xs">
                                  Constructor
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {contract.path}
                            </p>
                            {contract.dependencies.length > 0 && (
                              <div className="flex gap-1">
                                {contract.dependencies.map((dep) => (
                                  <Badge
                                    key={dep}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {dep}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {selectedContract?.name === contract.name && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Deployment Configuration */}
                {selectedContract && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Deployment Configuration</CardTitle>
                      <CardDescription>
                        Smart defaults with manual override options
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Network</Label>
                          <Select
                            value={network}
                            onValueChange={(value: "sepolia" | "mainnet") =>
                              setNetwork(value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sepolia">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">Testnet</Badge>
                                  Starknet Sepolia
                                </div>
                              </SelectItem>
                              <SelectItem value="mainnet">
                                <div className="flex items-center gap-2">
                                  <Badge variant="destructive">Mainnet</Badge>
                                  Starknet Mainnet
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Account Method</Label>
                          <Select
                            value={accountMethod}
                            onValueChange={(value: "auto" | "manual") =>
                              setAccountMethod(value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4" />
                                  Auto-Configure
                                </div>
                              </SelectItem>
                              <SelectItem value="manual">
                                <div className="flex items-center gap-2">
                                  <Settings className="w-4 h-4" />
                                  Manual Setup
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {accountMethod === "manual" && (
                        <div className="space-y-2">
                          <Label>Private Key</Label>
                          <Input
                            type="password"
                            placeholder="0x..."
                            value={manualPrivateKey}
                            onChange={(e) =>
                              setManualPrivateKey(e.target.value)
                            }
                          />
                        </div>
                      )}

                      {selectedContract.hasConstructor && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This contract has a constructor. Default values will
                            be used, or you can specify them during deployment.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Deploy Button */}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={startSmartDeployment}
                    disabled={
                      !selectedContract ||
                      (accountMethod === "manual" && !manualPrivateKey)
                    }
                    className="gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Smart Deploy
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Deployment Progress */}
          {currentStep === "deploy" && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">
                  Deploying {selectedContract?.name}
                </h3>
                <p className="text-muted-foreground">
                  AI-powered deployment in progress...
                </p>
                <Progress value={deploymentProgress} className="w-full" />
              </div>

              <div className="space-y-3">
                {deploymentSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border transition-colors",
                      index === currentStepIndex &&
                        step.status === "loading" &&
                        "border-primary bg-primary/5",
                      step.status === "success" &&
                        "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
                      step.status === "error" &&
                        "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                    )}
                  >
                    <div className="mt-0.5">{getStepIcon(step.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{step.title}</span>
                        {step.status === "error" && step.canRetry && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManualRetry(index)}
                            className="gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Retry
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                      {step.details && (
                        <p
                          className={cn(
                            "text-xs mt-1",
                            step.status === "success" &&
                              "text-green-600 dark:text-green-400",
                            step.status === "error" &&
                              "text-red-600 dark:text-red-400"
                          )}
                        >
                          {step.details}
                        </p>
                      )}
                      {step.txHash && (
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {step.txHash.slice(0, 20)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(step.txHash!)}
                            className="h-6 px-2"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Result */}
          {currentStep === "success" && deploymentResult && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold">
                    Deployment Successful! 🎉
                  </h3>
                  <p className="text-muted-foreground">
                    {deploymentResult.contractName} deployed to{" "}
                    {deploymentResult.network}
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Deployment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Contract Address</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={deploymentResult.contractAddress}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(deploymentResult.contractAddress)
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Transaction Hash</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={deploymentResult.transactionHash}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(deploymentResult.transactionHash)
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Class Hash</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={deploymentResult.classHash}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(deploymentResult.classHash)
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="gap-2 bg-transparent"
                      asChild
                    >
                      <a
                        href={`https://${network === "sepolia" ? "sepolia." : ""}starkscan.co/contract/${deploymentResult.contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Contract
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 bg-transparent"
                      asChild
                    >
                      <a
                        href={`https://${network === "sepolia" ? "sepolia." : ""}starkscan.co/tx/${deploymentResult.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Transaction
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={resetModal} className="gap-2">
                  <Zap className="w-4 h-4" />
                  Deploy Another
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {currentStep === "error" && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold">Deployment Failed</h3>
                  <p className="text-muted-foreground">{errorMessage}</p>
                </div>
              </div>

              {/* Error Logger Component */}
              <DeploymentErrorLogger
                errors={deploymentErrors}
                logs={deploymentLogs}
                onRetry={(errorId) => {
                  const error = deploymentErrors.find((e) => e.id === errorId);
                  if (error) {
                    const stepIndex = deploymentSteps.findIndex(
                      (s) => s.id === error.step
                    );
                    if (stepIndex !== -1) {
                      handleManualRetry(stepIndex);
                    }
                  }
                }}
                onExportLogs={() => {
                  const report = {
                    timestamp: new Date().toISOString(),
                    errors: deploymentErrors,
                    logs: deploymentLogs,
                    deploymentConfig: {
                      network,
                      contractName: selectedContract?.name,
                      accountMethod,
                    },
                  };
                  const blob = new Blob([JSON.stringify(report, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `deployment-debug-${Date.now()}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              />

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={resetModal} className="gap-2">
                  <ArrowRight className="w-4 w-4" />
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
