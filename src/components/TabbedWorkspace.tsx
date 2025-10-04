import React, { useState, useRef, useEffect, memo } from "react";
import { FileText, X, Bold, Italic, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ExplorerFile } from "./Explorer";

export interface WorkspaceTab {
  id: string;
  file: ExplorerFile;
  isActive: boolean;
  isDirty: boolean;
}

interface TabbedWorkspaceProps {
  tabs: WorkspaceTab[];
  onTabClose: (tabId: string) => void;
  onTabSelect: (tabId: string) => void;
  onContentChange: (tabId: string, content: string) => void;
  className?: string;
}

/* ---------------- Tab Button ---------------- */
const SimpleTab: React.FC<{
  tab: WorkspaceTab;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}> = ({ tab, onTabSelect, onTabClose }) => (
  <div
    onClick={() => onTabSelect(tab.id)}
    className={`flex items-center gap-2 px-3 py-2 border-r border-app-sand/50 cursor-pointer transition-all ${
      tab.isActive
        ? "bg-app-navy text-white"
        : "bg-app-sand hover:bg-app-sand/70 text-app-navy"
    }`}
  >
    <FileText className="w-3 h-3" />
    <span className="text-sm truncate max-w-32">
      {tab.file.name}
      {tab.isDirty && "*"}
    </span>
    <Button
      variant="ghost"
      size="sm"
      className="w-4 h-4 p-0 hover:bg-white/20"
      onClick={(e) => {
        e.stopPropagation();
        onTabClose(tab.id);
      }}
    >
      <X className="w-3 h-3" />
    </Button>
  </div>
);

/* ---------------- Editor ---------------- */
const DocumentEditor = memo(
  ({
    tab,
    onContentChange,
  }: {
    tab: WorkspaceTab;
    onContentChange: (tabId: string, html: string) => void;
  }) => {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const [html, setHtml] = useState(tab.file.content || "<p>Start typing...</p>");
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);

    useEffect(() => {
      const el = editorRef.current;
      if (el) el.innerHTML = html;
      recomputeCounts();
    }, []);

    const recomputeCounts = () => {
      const text = editorRef.current?.innerText ?? "";
      const words = text.trim().split(/\s+/).filter(Boolean);
      setWordCount(words.length);
      setCharCount(text.length);
    };

    const handleInput = () => {
      const newHtml = editorRef.current?.innerHTML ?? "";
      setHtml(newHtml);
      recomputeCounts();
      onContentChange(tab.id, newHtml);
    };

    const exec = (command: string) => {
      document.execCommand(command, false, "");
      handleInput();
    };

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-app-sand/30 border-b border-app-sand">
          <h3 className="font-medium text-app-navy">{tab.file.name}</h3>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 bg-app-sand/40 border-b border-app-sand/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exec("undo")}
            className="flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" /> Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exec("redo")}
            className="flex items-center gap-1"
          >
            <RotateCw className="w-4 h-4" /> Redo
          </Button>
          <Separator orientation="vertical" className="mx-2" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => exec("bold")}
            className="flex items-center gap-1"
          >
            <Bold className="w-4 h-4" /> Bold
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exec("italic")}
            className="flex items-center gap-1"
          >
            <Italic className="w-4 h-4" /> Italic
          </Button>
        </div>

        {/* Editor */}
        <div className="flex-1 p-4">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck
            onInput={handleInput}
            className="h-full min-h-[300px] bg-white border border-app-sand rounded-lg p-6 outline-none focus:ring-2 focus:ring-app-gold/40"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-4 text-sm text-app-navy/60 px-4 py-2 border-t bg-app-sand/20">
          <span>Words: {wordCount}</span>
          <span className="opacity-40">•</span>
          <span>Characters: {charCount}</span>
        </div>
      </div>
    );
  }
);

/* ---------------- Main Workspace ---------------- */
const TabbedWorkspace: React.FC<TabbedWorkspaceProps> = ({
  tabs,
  onTabClose,
  onTabSelect,
  onContentChange,
  className = "",
}) => {
  const activeTab = tabs.find((t) => t.isActive);

  return (
    <div className={`bg-app-white h-full flex flex-col ${className}`}>
      {/* Tab Bar */}
      <div className="bg-app-sand border-b border-app-sand/50 flex items-center">
        {tabs.length === 0 ? (
          <div className="flex-1 p-4 text-center text-app-navy/50">
            Open a file from the Explorer to start working
          </div>
        ) : (
          <div className="flex items-center overflow-x-auto">
            {tabs.map((tab) => (
              <SimpleTab
                key={tab.id}
                tab={tab}
                onTabSelect={onTabSelect}
                onTabClose={onTabClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <DocumentEditor
            key={activeTab.id}
            tab={activeTab}
            onContentChange={onContentChange}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-app-navy/50">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Select a tab to view its content</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(TabbedWorkspace);
