import React, { useState, useRef, useEffect, memo } from "react";
import { FileText, X, Bold, Italic, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ExplorerFile } from "./Explorer";
import { saveToBackend } from "../utils/saveToBackend";
import { rephraseText } from "../utils/rephrase";

export interface WorkspaceTab {
  id: string;
  file: ExplorerFile;
  isActive: boolean;
  isDirty: boolean;
}

declare global {
  interface Window {
    lastSaveTime?: number;
  }
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
    const wrapperRef = useRef<HTMLDivElement | null>(null); // positioned ancestor
    const lastRangeRef = useRef<Range | null>(null); // preserve selection across button click

    const [html, setHtml] = useState(tab.file.content || "<p>Start typing...</p>");
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
    const [rephrasePrompt, setRephrasePrompt] = useState<{
      x: number;
      y: number;
      text: string;
    } | null>(null);

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

    const handleInput = async () => {
      const newHtml = editorRef.current?.innerHTML ?? "";
      setHtml(newHtml);
      recomputeCounts();
      onContentChange(tab.id, newHtml);

      if (!window.lastSaveTime || Date.now() - window.lastSaveTime > 8000) {
        window.lastSaveTime = Date.now();
        await handleSave(newHtml);
      }
    };

    const handleSave = async (content: string) => {
      setSaveStatus("saving");
      await saveToBackend(tab.id, content);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    };

    const exec = (command: string) => {
      document.execCommand(command, false, "");
      handleInput();
    };

    /* ---------------- Highlight → Show Popup Button (top-right of selection) ---------------- */
    const handleTextSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setRephrasePrompt(null);
        lastRangeRef.current = null;
        return;
      }

      const selectedText = selection.toString().trim();
      if (!selectedText) {
        setRephrasePrompt(null);
        lastRangeRef.current = null;
        return;
      }

      const range = selection.getRangeAt(0);
      lastRangeRef.current = range.cloneRange();

      const rectList = range.getClientRects();
      const anchorRect =
        rectList && rectList.length > 0
          ? rectList[rectList.length - 1] // right-most line of selection
          : range.getBoundingClientRect();

      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const parentRect = wrapper.getBoundingClientRect();

      const offsetRight = 10;
      const offsetUp = 50;

      // viewport -> wrapper-relative
      let x = anchorRect.right - parentRect.left + offsetRight;
      let y = anchorRect.top - parentRect.top - offsetUp;

      // clamp within wrapper
      const approxWidth = 96;  // ~ button width
      const approxHeight = 34; // ~ button height
      const maxX = parentRect.width - approxWidth - 8;
      const maxY = parentRect.height - approxHeight - 8;
      x = Math.max(8, Math.min(x, maxX));
      y = Math.max(8, Math.min(y, maxY));

      setRephrasePrompt({ x, y, text: selectedText });
    };

    const handleConfirmRephrase = async () => {
      if (!rephrasePrompt) return;

      const rephrased = await rephraseText(rephrasePrompt.text);
      if (!rephrased) {
        setRephrasePrompt(null);
        return;
      }

      // Use the preserved range if current selection is gone
      const selection = window.getSelection();
      let range: Range | null = null;
      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
      } else if (lastRangeRef.current) {
        range = lastRangeRef.current;
      }

      if (range) {
        range.deleteContents();
        range.insertNode(document.createTextNode(rephrased));
      }

      setRephrasePrompt(null);
      lastRangeRef.current = null;
      handleInput();
    };

    // Hide popup if user clicks elsewhere and collapses selection
    const handleMouseDown = () => {
      if (window.getSelection()?.isCollapsed) {
        setRephrasePrompt(null);
        lastRangeRef.current = null;
      }
    };

    return (
      <div className="h-full flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-app-sand/30 border-b border-app-sand">
          <h3 className="font-medium text-app-navy">{tab.file.name}</h3>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 bg-app-sand/40 border-b border-app-sand/50">
          <Button variant="outline" size="sm" onClick={() => exec("undo")} className="flex items-center gap-1">
            <RotateCcw className="w-4 h-4" /> Undo
          </Button>
          <Button variant="outline" size="sm" onClick={() => exec("redo")} className="flex items-center gap-1">
            <RotateCw className="w-4 h-4" /> Redo
          </Button>
          <Separator orientation="vertical" className="mx-2" />
          <Button variant="outline" size="sm" onClick={() => exec("bold")} className="flex items-center gap-1">
            <Bold className="w-4 h-4" /> Bold
          </Button>
          <Button variant="outline" size="sm" onClick={() => exec("italic")} className="flex items-center gap-1">
            <Italic className="w-4 h-4" /> Italic
          </Button>
        </div>

        {/* Editor wrapper (positioned ancestor) */}
        <div className="flex-1 p-4 relative" ref={wrapperRef}>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck
            onInput={handleInput}
            onMouseDown={handleMouseDown}
            onMouseUp={handleTextSelection}
            className="h-full min-h-[300px] bg-white border border-app-sand rounded-lg p-6 outline-none focus:ring-2 focus:ring-app-gold/40"
          />

          {/* Translucent single-button popup */}
          {rephrasePrompt && (
            <button
              onClick={handleConfirmRephrase}
              style={{
                position: "absolute",
                top: rephrasePrompt.y,
                left: rephrasePrompt.x,
                background: "rgba(8, 36, 52, 0.65)", // translucent navy
                color: "white",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "9999px",
                padding: "6px 10px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                zIndex: 1000,
                cursor: "pointer",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                userSelect: "none",
              }}
            >
              Rephrase
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-sm text-app-navy/60 px-4 py-2 border-t bg-app-sand/20">
          <div className="flex gap-4">
            <span>Words: {wordCount}</span>
            <span className="opacity-40">•</span>
            <span>Characters: {charCount}</span>
          </div>
          <div>
            {saveStatus === "saving" && <span> Saving...</span>}
            {saveStatus === "saved" && <span className="text-green-600">Saved</span>}
          </div>
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
              <SimpleTab key={tab.id} tab={tab} onTabSelect={onTabSelect} onTabClose={onTabClose} />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <DocumentEditor key={activeTab.id} tab={activeTab} onContentChange={onContentChange} />
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
