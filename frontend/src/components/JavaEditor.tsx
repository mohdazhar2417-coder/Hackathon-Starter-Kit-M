import React, { useEffect, useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { cn } from "@/lib/utils";

interface JavaEditorProps {
  code: string;
  highlightLine?: number;
  width?: number;
  height?: number;
}

export const JavaEditor: React.FC<JavaEditorProps> = ({ code, highlightLine, width, height }) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);

  function handleEditorDidMount(editor: any, monaco: Monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Apply decorations (highlighting)
    const newDecorations = highlightLine ? [
      {
        range: new monaco.Range(highlightLine, 1, highlightLine, 1),
        options: {
          isWholeLine: true,
          className: "bg-primary/20",
          glyphMarginClassName: "bg-primary/50",
          marginClassName: "bg-primary/10",
        },
      },
    ] : [];

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);

    if (highlightLine) {
      // Auto-scroll to active line
      editor.revealLineInCenter(highlightLine, monaco.editor.ScrollType.Smooth);
    }
  }, [highlightLine]);

  // Force layout recalculation when dimensions change
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [width, height]);

  return (
    <div className="h-full w-full border-r border-border bg-card">
      <Editor
        height="100%"
        defaultLanguage="java"
        value={code}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          readOnly: true,
          fontSize: 13,
          fontFamily: "JetBrains Mono, Menlo, Monaco, Consolas, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          renderLineHighlight: "all",
          scrollbar: {
            vertical: "hidden",
            horizontal: "hidden",
          },
          automaticLayout: true,
          padding: { top: 16 },
          glyphMargin: true,
          folding: false,
          lineDecorationsWidth: 5,
          lineNumbersMinChars: 3,
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: `
        .monaco-editor .bg-primary\\/20 {
          background-color: rgba(var(--primary), 0.15) !important;
        }
        .monaco-editor .bg-primary\\/50 {
          background-color: hsl(var(--primary)) !important;
          width: 4px !important;
        }
      `}} />
    </div>
  );
};
