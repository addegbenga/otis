"use client";

import { useRef, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import type { CompileError } from "../types/ide";
import {
  cairoLanguageDefinition,
  cairoTokensProvider,
  cairoTheme,
} from "../lib/cairo-language";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  errors?: CompileError[];
  readOnly?: boolean;
}

export function MonacoEditor({
  value,
  onChange,
  language = "cairo",
  errors = [],
  readOnly = false,
}: MonacoEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register Cairo language with improved definition
    monaco.languages.register(cairoLanguageDefinition);
    monaco.languages.setMonarchTokensProvider("cairo", cairoTokensProvider);

    // Define and set the Cairo theme
    monaco.editor.defineTheme("cairo-dark", cairoTheme);
    monaco.editor.setTheme("cairo-dark");

    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: "on",
      renderWhitespace: "selection",
      automaticLayout: true,
      readOnly,
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || "");
  };

  // Update error markers when errors change
  useEffect(() => {
    if (editorRef.current && errors.length > 0) {
      const model = editorRef.current.getModel();
      if (model) {
        const markers = errors.map((error) => ({
          startLineNumber: error.line,
          startColumn: error.column,
          endLineNumber: error.line,
          endColumn: error.column + 10,
          message: error.message,
          severity:
            error.severity === "error"
              ? monaco.MarkerSeverity.Error
              : monaco.MarkerSeverity.Warning,
        }));
        monaco.editor.setModelMarkers(model, "cairo", markers);
      }
    }
  }, [errors]);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="cairo-dark"
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: "on",
          renderWhitespace: "selection",
          automaticLayout: true,
          readOnly,
          wordWrap: "on",
          folding: true,
          lineNumbersMinChars: 3,
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
          },
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
}
