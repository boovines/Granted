import React, { useState, useRef, useEffect, memo } from "react";
import { FileText, X, Bold, Italic, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ExplorerFile } from "./Explorer";
import { saveToBackend } from "../utils/saveToBackend";
import { rephraseText } from "../utils/rephrase";
import { supabase } from "../config/supabaseClient";

export interface WorkspaceTab {
  id: string;
  file: ExplorerFile;
  isActive: boolean;
  isDirty: boolean;
  isEditable?: boolean;
}

interface TabbedWorkspaceProps {
  tabs: WorkspaceTab[];
  onTabClose: (tabId: string) => void;
  onTabSelect: (tabId: string) => void;
  onContentChange: (tabId: string, content: string) => void;
  className?: string;
}

/* ---------------- Helpers ---------------- */

function buildPublicUrl(path: string) {
  return supabase.storage.from("documents").getPublicUrl(path).data.publicUrl;
}

function getExt(file?: ExplorerFile) {
  return (file?.extension || file?.name.split(".").pop() || "").toLowerCase();
}

/* ---------------- Simple Tab Button ---------------- */
const SimpleTab: React.FC<{
  tab: WorkspaceTab;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}> = ({ tab, onTabSelect, onTabClose }) => (
  <div
    onClick={() => onTabSelect(tab.id)}
    className={`flex items-center gap-2 px-3 py-2 border-r border-app-sand/50 cursor-pointer transition-all ${
      tab.isActive ? "bg-app-navy text-white" : "bg-app-sand hover:bg-app-sand/70 text-app-navy"
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

/* ---------------- PDF Viewer ---------------- */
const PdfView = ({ url, title }: { url: string; title?: string }) => {
  const src = `${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`;
  return (
    <div className="w-full h-full bg-white">
      <iframe title={title || "PDF"} src={src} className="w-full h-full" style={{ border: 0 }} />
    </div>
  );
};

/* ---------------- HTML Viewer ---------------- */
const HtmlView = ({ url, title }: { url: string; title?: string }) => {
  return (
    <div className="w-full h-full bg-white">
      <iframe
        title={title || "HTML"}
        src={url}
        className="w-full h-full"
        style={{ border: 0 }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
};

/* ---------------- Readonly Fallback ---------------- */
const ReadonlyView = ({ file }: { file: ExplorerFile }) => {
  const url = file.publicUrl || buildPublicUrl(file.path);
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-app-navy/70 gap-3">
      <p>Preview not available for this type</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="underline text-app-navy hover:text-app-gold"
      >
        Open or download {file.name}
      </a>
    </div>
  );
};

/* ---------------- Rich Text Editor ---------------- */
const DocumentEditor = memo(
  ({
    tab,
    onContentChange,
  }: {
    tab: WorkspaceTab;
    onContentChange: (tabId: string, html: string) => void;
  }) => {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const lastRangeRef = useRef<Range | null>(null);
    const saveTimerRef = useRef<number | null>(null);

    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [saveStatus, setSaveStatus] =
      useState<"idle" | "saving" | "saved" | "error">("idle");
    const [rephrasePrompt, setRephrasePrompt] = useState<{
      x: number;
      y: number;
      text: string;
    } | null>(null);

    // mark local edits so prop echoes do not stomp caret
    const isLocalEditRef = useRef(false);

    const setHTML = (html: string) => {
      if (!editorRef.current) return;
      editorRef.current.innerHTML = html;
      recomputeCounts();
    };

    const saveSelection = () => {
      const s = window.getSelection();
      if (s && s.rangeCount > 0) lastRangeRef.current = s.getRangeAt(0);
    };

    const restoreSelection = () => {
      const s = window.getSelection();
      if (s && lastRangeRef.current) {
        s.removeAllRanges();
        s.addRange(lastRangeRef.current);
      }
    };

    const placeCaretAtEnd = () => {
      const el = editorRef.current;
      if (!el) return;
      const r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
      const s = window.getSelection();
      if (!s) return;
      s.removeAllRanges();
      s.addRange(r);
      lastRangeRef.current = r;
    };

    const recomputeCounts = () => {
      const text = editorRef.current?.innerText ?? "";
      const words = text.trim().split(/\s+/).filter(Boolean);
      setWordCount(words.length);
      setCharCount(text.length);
    };

    // only reset on file switch
    useEffect(() => {
      const next = tab.file.content || "<p>Start typing...</p>";
      setHTML(next);
      requestAnimationFrame(placeCaretAtEnd);
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    }, [tab.file.id]);

    // accept external updates for same file but do not clobber local typing
    useEffect(() => {
      if (!editorRef.current) return;
      if (isLocalEditRef.current) {
        isLocalEditRef.current = false;
        return;
      }
      const incoming = tab.file.content;
      if (
        typeof incoming === "string" &&
        incoming !== editorRef.current.innerHTML
      ) {
        saveSelection();
        setHTML(incoming);
        restoreSelection();
      }
    }, [tab.file.content]);

    useEffect(() => {
      return () => {
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      };
    }, []);

    const scheduleSave = (content: string) => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        handleSave(content);
      }, 1000);
    };

    const handleSave = async (content: string) => {
      try {
        setSaveStatus("saving");
        await saveToBackend(tab.id, content);
        setSaveStatus("saved");
        window.setTimeout(() => setSaveStatus("idle"), 1500);
      } catch (err) {
        console.error("Save failed:", err);
        setSaveStatus("error");
      }
    };

    const handleInput = () => {
      if (!editorRef.current) return;
      isLocalEditRef.current = true;
      const html = editorRef.current.innerHTML;
      onContentChange(tab.id, html);
      recomputeCounts();
      setSaveStatus("saving");
      scheduleSave(html);
    };

    const exec = (command: string) => {
      document.execCommand(command, false, "");
      handleInput();
    };

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

      const rects = range.getClientRects();
      const anchorRect =
        rects && rects.length > 0 ? rects[rects.length - 1] : range.getBoundingClientRect();

      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const parentRect = wrapper.getBoundingClientRect();

      const offsetRight = 10;
      const offsetUp = 50;
      let x = anchorRect.right - parentRect.left + offsetRight;
      let y = anchorRect.top - parentRect.top - offsetUp;

      const approxWidth = 96;
      const approxHeight = 34;
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

      const selection = window.getSelection();
      let range: Range | null = null;
      if (selection && selection.rangeCount > 0) range = selection.getRangeAt(0);
      else if (lastRangeRef.current) range = lastRangeRef.current;

      if (range) {
        range.deleteContents();
        range.insertNode(document.createTextNode(rephrased));
      }

      setRephrasePrompt(null);
      lastRangeRef.current = null;
      handleInput();
    };

    const handleMouseDown = () => {
      if (window.getSelection()?.isCollapsed) {
        setRephrasePrompt(null);
        lastRangeRef.current = null;
      }
    };

    const handleSelectionChange = () => {
      saveSelection();
    };

    return (
      <div className="h-full flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-app-sand/30 border-b border-app-sand">
          <h3 className="font-medium text-app-navy">{tab.file.name}</h3>
          <div className="text-xs text-app-navy/70">
            {wordCount} words • {charCount} chars •{" "}
            {saveStatus === "saving"
              ? "Saving…"
              : saveStatus === "saved"
              ? "Saved"
              : ""}
          </div>
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

        {/* Editor area */}
        <div className="flex-1 p-4" ref={wrapperRef}>
          <div
            key={tab.file.id}
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck
            onInput={handleInput}
            onKeyUp={handleSelectionChange}
            onBlur={handleSelectionChange}
            onMouseDown={handleMouseDown}
            onMouseUp={handleTextSelection}
            className="h-full min-h-[300px] bg-white border border-app-sand rounded-lg p-6 outline-none focus:ring-2 focus:ring-app-gold/40"
            style={{ direction: "ltr", unicodeBidi: "plaintext" }}
          />
          {rephrasePrompt && (
            <button
              onClick={handleConfirmRephrase}
              style={{
                position: "absolute",
                top: rephrasePrompt.y,
                left: rephrasePrompt.x,
                background: "rgba(8, 36, 52, 0.65)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "9999px",
                padding: "6px 10px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                zIndex: 20,
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
      </div>
    );
  }
);


/* ---------------- Content Switcher ---------------- */
function FileContentView({
  tab,
  onContentChange,
}: {
  tab: WorkspaceTab;
  onContentChange: (tabId: string, content: string) => void;
}) {
  const ext = getExt(tab.file);

  if (ext === "pdf") {
    const url = tab.file.publicUrl || buildPublicUrl(tab.file.path);
    return <PdfView url={url} title={tab.file.name} />;
  }

  if (ext === "html" || ext === "htm") {
    const url = tab.file.publicUrl || buildPublicUrl(tab.file.path);
    return <HtmlView url={url} title={tab.file.name} />;
  }

  if (ext === "txt" || ext === "md" || tab.file.type === "document" || tab.file.type === "quote" || tab.file.type === "context") {
    return <DocumentEditor tab={tab} onContentChange={onContentChange} />;
  }

  return <ReadonlyView file={tab.file} />;
}

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
    <div className={`bg-app-white h-full flex flex-col border-b border-app-sand ${className}`}>
      {/* Tab Bar */}
      <div className="bg-app-sand border-b border-app-sand/50 flex items-center pt-2">
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
          <FileContentView tab={activeTab} onContentChange={onContentChange} />
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
