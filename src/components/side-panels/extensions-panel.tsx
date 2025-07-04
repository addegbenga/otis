"use client";

import { Package, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

const mockExtensions = [
  {
    id: "1",
    name: "Cairo Language Support",
    description: "Syntax highlighting and IntelliSense for Cairo",
    author: "Starknet",
    downloads: "10K",
    rating: 4.8,
    installed: true,
  },
  {
    id: "2",
    name: "Starknet Tools",
    description: "Development tools for Starknet smart contracts",
    author: "StarkWare",
    downloads: "5K",
    rating: 4.6,
    installed: false,
  },
];

export function ExtensionsPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="relative">
          <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search Extensions" className="pl-9" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {mockExtensions.map((ext) => (
            <Card key={ext.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{ext.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ext.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{ext.author}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {ext.downloads}
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {ext.rating}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={ext.installed ? "outline" : "default"}
                >
                  {ext.installed ? "Installed" : "Install"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
