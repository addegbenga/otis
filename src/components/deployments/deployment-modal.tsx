"use client";

import { useState } from "react";
import {
  Upload,
  Globe,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (config: DeploymentConfig) => void;
}

interface DeploymentConfig {
  network: "sepolia" | "mainnet";
  accountName: string;
  privateKey: string;
  contractName: string;
  classHash?: string;
  constructorArgs: string[];
}

interface DeploymentStep {
  id: string;
  title: string;
  status: "pending" | "loading" | "success" | "error";
  description?: string;
  txHash?: string;
  contractAddress?: string;
}

export function DeploymentModal({
  isOpen,
  onClose,
  onDeploy,
}: DeploymentModalProps) {
  const [currentTab, setCurrentTab] = useState("setup");
  const [network, setNetwork] = useState<"sepolia" | "mainnet">("sepolia");
  const [accountName, setAccountName] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [contractName, setContractName] = useState("");
  const [classHash, setClassHash] = useState("");
  const [constructorArgs, setConstructorArgs] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);

  const [deploymentSteps, setDeploymentSteps] = useState<DeploymentStep[]>([
    { id: "account", title: "Verify Account", status: "pending" },
    { id: "compile", title: "Compile Contract", status: "pending" },
    { id: "declare", title: "Declare Contract", status: "pending" },
    { id: "deploy", title: "Deploy Contract", status: "pending" },
  ]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setCurrentTab("progress");
    setDeploymentProgress(0);

    const config: DeploymentConfig = {
      network,
      accountName,
      privateKey,
      contractName,
      classHash: classHash || undefined,
      constructorArgs: constructorArgs
        .split(",")
        .map((arg) => arg.trim())
        .filter(Boolean),
    };

    // Simulate deployment process
    const steps = [...deploymentSteps];

    // Step 1: Verify Account
    steps[0].status = "loading";
    setDeploymentSteps([...steps]);
    setDeploymentProgress(25);

    await new Promise((resolve) => setTimeout(resolve, 2000));
    steps[0].status = "success";
    steps[0].description = "Account verified and funded";

    // Step 2: Compile Contract
    steps[1].status = "loading";
    setDeploymentSteps([...steps]);
    setDeploymentProgress(50);

    await new Promise((resolve) => setTimeout(resolve, 1500));
    steps[1].status = "success";
    steps[1].description = "Contract compiled successfully";

    // Step 3: Declare Contract
    steps[2].status = "loading";
    setDeploymentSteps([...steps]);
    setDeploymentProgress(75);

    await new Promise((resolve) => setTimeout(resolve, 2000));
    steps[2].status = "success";
    steps[2].description = "Contract declared on network";
    steps[2].txHash =
      "0x051e0d3b26fb79035afdc64d2214eb18291629b4f2ef132e79c3f3fbe1ba57c4";

    // Step 4: Deploy Contract
    steps[3].status = "loading";
    setDeploymentSteps([...steps]);
    setDeploymentProgress(90);

    await new Promise((resolve) => setTimeout(resolve, 2500));
    steps[3].status = "success";
    steps[3].description = "Contract deployed successfully";
    steps[3].txHash =
      "0x0723a63261d2df60f571df8a2b8c8c64694278aae66481a0584445c03234d83f";
    steps[3].contractAddress =
      "0x05fe561f0907f61b1099ba64ee18a5250606d43d00d4f296ba622d287ceb2538";

    setDeploymentSteps([...steps]);
    setDeploymentProgress(100);
    setIsDeploying(false);

    onDeploy(config);
  };

  const resetModal = () => {
    setCurrentTab("setup");
    setIsDeploying(false);
    setDeploymentProgress(0);
    setDeploymentSteps([
      { id: "account", title: "Verify Account", status: "pending" },
      { id: "compile", title: "Compile Contract", status: "pending" },
      { id: "declare", title: "Declare Contract", status: "pending" },
      { id: "deploy", title: "Deploy Contract", status: "pending" },
    ]);
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
      default:
        return <div className="w-4 h-4 border-2 border-muted rounded-full" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Deploy to Starknet
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger
              value="progress"
              disabled={!isDeploying && deploymentProgress === 0}
            >
              Progress
            </TabsTrigger>
            <TabsTrigger value="result" disabled={deploymentProgress < 100}>
              Result
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            <ScrollArea className="h-[500px] pr-4">
              {/* Network Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Network Configuration
                  </CardTitle>
                  <CardDescription>
                    Choose your deployment target
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="network">Network</Label>
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

                  {network === "mainnet" && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        You're deploying to Mainnet. Make sure you have
                        sufficient STRK tokens for gas fees.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Account Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Account Configuration
                  </CardTitle>
                  <CardDescription>
                    Your Starknet account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      placeholder="e.g., my-sepolia-account"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="privateKey">Private Key</Label>
                    <Input
                      id="privateKey"
                      type="password"
                      placeholder="0x..."
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your private key is used locally and never sent to our
                      servers
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contract Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Contract Configuration
                  </CardTitle>
                  <CardDescription>
                    Details about your Cairo contract
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractName">Contract Name</Label>
                    <Input
                      id="contractName"
                      placeholder="e.g., HelloStarknet"
                      value={contractName}
                      onChange={(e) => setContractName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="classHash">Class Hash (Optional)</Label>
                    <Input
                      id="classHash"
                      placeholder="0x... (leave empty to auto-declare)"
                      value={classHash}
                      onChange={(e) => setClassHash(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      If empty, we'll compile and declare your contract
                      automatically
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="constructorArgs">
                      Constructor Arguments
                    </Label>
                    <Textarea
                      id="constructorArgs"
                      placeholder="arg1, arg2, arg3 (comma-separated)"
                      value={constructorArgs}
                      onChange={(e) => setConstructorArgs(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Deployment Button */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDeploy}
                  disabled={!accountName || !privateKey || !contractName}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Deploy Contract
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  Deploying to {network === "sepolia" ? "Sepolia" : "Mainnet"}
                </h3>
                <p className="text-muted-foreground">
                  Please wait while we deploy your contract...
                </p>
              </div>

              <Progress value={deploymentProgress} className="w-full" />

              <div className="space-y-3">
                {deploymentSteps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    <div className="mt-0.5">{getStepIcon(step.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{step.title}</span>
                        {step.status === "success" && step.txHash && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={() => copyToClipboard(step.txHash!)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      {step.description && (
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      )}
                      {step.txHash && (
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          TX: {step.txHash.slice(0, 20)}...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="result" className="space-y-6">
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold">
                  Deployment Successful! 🎉
                </h3>
                <p className="text-muted-foreground">
                  Your contract has been deployed to Starknet {network}
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Deployment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Contract Address</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={deploymentSteps[3]?.contractAddress || ""}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          deploymentSteps[3]?.contractAddress || ""
                        )
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
                      value={deploymentSteps[3]?.txHash || ""}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(deploymentSteps[3]?.txHash || "")
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 bg-transparent"
                    asChild
                  >
                    <a
                      href={`https://${network === "sepolia" ? "sepolia." : ""}starkscan.co/contract/${deploymentSteps[3]?.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Starkscan
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 bg-transparent"
                    asChild
                  >
                    <a
                      href={`https://${network === "sepolia" ? "sepolia." : ""}starkscan.co/tx/${deploymentSteps[3]?.txHash}`}
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
              <Button onClick={resetModal}>Deploy Another</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
