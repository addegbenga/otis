import { Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SearchPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-9" />
          </div>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Replace" className="pl-9" />
          </div>
          <Button className="w-full" size="sm">
            Search All Files
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 text-center text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No search results</p>
          <p className="text-xs mt-1">Enter a search term to find files</p>
        </div>
      </ScrollArea>
    </div>
  );
}
