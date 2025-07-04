"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bug,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Download,
} from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { DeploymentError, DeploymentLog } from "../../types/deployment";

interface DeploymentErrorLoggerProps {
  errors: DeploymentError[];
  logs: DeploymentLog[];
  onRetry?: (errorId: string) => void;
  onExportLogs?: () => void;
}

export function DeploymentErrorLogger({
  errors,
  logs,
  onRetry,
  onExportLogs,
}: DeploymentErrorLoggerProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [showAllLogs, setShowAllLogs] = useState(false);

  const toggleErrorExpansion = (errorId: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId);
    } else {
      newExpanded.add(errorId);
    }
    setExpandedErrors(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getSeverityColor = (severity: DeploymentError["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getTypeIcon = (type: DeploymentError["type"]) => {
    switch (type) {
      case "network":
        return "🌐";
      case "compilation":
        return "⚙️";
      case "account":
        return "👤";
      case "contract":
        return "📄";
      case "system":
        return "💻";
      case "user":
        return "👨‍💻";
    }
  };

  const getLogLevelColor = (level: DeploymentLog["level"]) => {
    switch (level) {
      case "error":
        return "text-red-600 dark:text-red-400";
      case "warn":
        return "text-yellow-600 dark:text-yellow-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      case "debug":
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const exportErrorReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      errors: errors,
      logs: logs,
      environment: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cairo-ide-deployment-error-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (errors.length === 0 && logs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Error Summary */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <CardTitle>Deployment Errors ({errors.length})</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportErrorReport}
                  className="gap-2 bg-transparent"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </Button>
                {onExportLogs && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onExportLogs}
                    className="gap-2 bg-transparent"
                  >
                    <Bug className="w-4 h-4" />
                    Debug Info
                  </Button>
                )}
              </div>
            </div>
            <CardDescription>
              Detailed error information and suggested fixes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {errors.map((error) => (
                  <div key={error.id} className="border rounded-lg">
                    <Collapsible
                      open={expandedErrors.has(error.id)}
                      onOpenChange={() => toggleErrorExpansion(error.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="text-lg">
                              {getTypeIcon(error.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {error.message}
                                </span>
                                <Badge
                                  className={getSeverityColor(error.severity)}
                                >
                                  {error.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {error.step} •{" "}
                                {error.timestamp.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {error.retryable && onRetry && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRetry(error.id);
                                }}
                              >
                                Retry
                              </Button>
                            )}
                            {expandedErrors.has(error.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-4">
                          <Separator />

                          {/* Error Details */}
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium mb-2">
                                Error Details
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {error.details}
                              </p>
                            </div>

                            {/* Technical Details */}
                            {error.technicalDetails && (
                              <div>
                                <h4 className="font-medium mb-2">
                                  Technical Information
                                </h4>
                                <div className="bg-muted p-3 rounded-md">
                                  <code className="text-sm">
                                    {error.technicalDetails}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2"
                                    onClick={() =>
                                      copyToClipboard(error.technicalDetails!)
                                    }
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Stack Trace */}
                            {error.stackTrace && (
                              <div>
                                <h4 className="font-medium mb-2">
                                  Stack Trace
                                </h4>
                                <div className="bg-muted p-3 rounded-md max-h-32 overflow-auto">
                                  <pre className="text-xs">
                                    {error.stackTrace}
                                  </pre>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() =>
                                      copyToClipboard(error.stackTrace!)
                                    }
                                  >
                                    <Copy className="w-3 h-3" />
                                    Copy Stack Trace
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Suggested Fix */}
                            {error.suggestedFix && (
                              <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>Suggested Fix:</strong>{" "}
                                  {error.suggestedFix}
                                </AlertDescription>
                              </Alert>
                            )}

                            {/* Context Information */}
                            {error.context &&
                              Object.keys(error.context).length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Context</h4>
                                  <div className="bg-muted p-3 rounded-md">
                                    <pre className="text-xs">
                                      {JSON.stringify(error.context, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}

                            {/* Related Links */}
                            {error.relatedLinks &&
                              error.relatedLinks.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">
                                    Helpful Resources
                                  </h4>
                                  <div className="space-y-2">
                                    {error.relatedLinks.map((link, index) => (
                                      <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 bg-transparent"
                                        asChild
                                      >
                                        <a
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          {link.title}
                                        </a>
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Deployment Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Deployment Logs ({logs.length})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllLogs(!showAllLogs)}
              >
                {showAllLogs ? "Show Less" : "Show All"}
              </Button>
            </div>
            <CardDescription>
              Detailed execution logs for debugging
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 font-mono text-sm">
                {(showAllLogs ? logs : logs.slice(-20)).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded"
                  >
                    <span className="text-xs text-muted-foreground min-w-[80px]">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs min-w-[60px] justify-center",
                        getLogLevelColor(log.level)
                      )}
                    >
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground min-w-[100px]">
                      [{log.step}]
                    </span>
                    <span className="flex-1">{log.message}</span>
                    {log.data && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(log.data, null, 2))
                        }
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
