// src/App.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './components/ui/resizable';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

import Explorer, { ExplorerFile, FileCreationOptions } from './components/Explorer';
import TabbedWorkspace, { WorkspaceTab } from './components/TabbedWorkspace';
import AssistantChat from './components/AssistantChat';

import { LoginButton, initializeOAuth } from '../oauth/integration/vite';
import { UserProfile } from '../oauth/components/UserProfile';
import AuthDebug from '../oauth/components/AuthDebug';
import { Button } from './components/ui/button';
import { FolderOpen, Award } from 'lucide-react';
import Grants from './components/Grants';

import { useSupabaseExplorerFiles } from './hooks/useSupabaseExplorerFiles';
import { supabase } from './config/supabaseClient';

/* ================= Chat model ================= */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  contextFiles?: ExplorerFile[];
  citations?: {
    id: string;
    text: string;
    sourceFile: ExplorerFile;
    position?: { page?: number; offset?: number };
  }[];
}

/* ================= App ================= */
export default function App() {
  /* ----- OAuth init + welcome ----- */
  useEffect(() => {
    initializeOAuth();
  }, []);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    if (code && state) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => toast.success("Welcome! You're now signed in. 🎉", { duration: 4000 }), 800);
    }
  }, []);

  /* ----- Supabase sources (PDFs) ----- */
  const USER_ID = 'demo-user-123';
  const { files: remoteFiles, loading: filesLoading, refresh } = useSupabaseExplorerFiles(USER_ID);

  /* ----- Local Documents (typable) – the “old” ones ----- */
  const [localDocs, setLocalDocs] = useState<ExplorerFile[]>([
    {
      id: 'doc-1',
      name: 'Research Proposal Draft.md',
      type: 'document',
      category: 'Documents',
      content: '# Research Proposal\n\nIntroduction to the study...',
      lastModified: new Date('2024-01-15'),
      path: '/Documents/Research Proposal Draft.md',
      extension: 'md',
    },
    {
      id: 'doc-2',
      name: 'Literature Review.md',
      type: 'document',
      category: 'Documents',
      content: '# Literature Review\n\nRelevant studies include...',
      lastModified: new Date('2024-01-14'),
      path: '/Documents/Literature Review.md',
      extension: 'md',
    },
    {
      id: 'doc-quotes',
      name: 'Saved Quotes',
      type: 'quote',
      category: 'Documents',
      content: '',
      lastModified: new Date('2024-01-16'),
      path: '/Documents/Saved Quotes',
      extension: 'md',
    },
  ]);

  /* ----- Local Rules (typable) ----- */
  const [localRules, setLocalRules] = useState<ExplorerFile[]>([
    {
      id: 'rule-1',
      name: 'Research Rules.md',
      type: 'context',
      category: 'Context',
      content:
        '# Research Rules & Guidelines\n\n' +
        '## Writing Standards\n- Use clear, concise language\n- Academic tone\n- Follow APA\n\n' +
        '## Formatting\n- Double-spaced\n- 12pt Times New Roman\n- 1-inch margins\n',
      lastModified: new Date('2024-01-08'),
      path: '/Context/Research Rules.md',
      extension: 'md',
    },
  ]);

  /* ----- Combine: local docs + remote sources + local rules ----- */
  const files: ExplorerFile[] = useMemo(() => {
    const sourcesOnly = remoteFiles.filter((f) => f.category === 'Sources');
    return [...localDocs, ...sourcesOnly, ...localRules];
  }, [localDocs, remoteFiles, localRules]);

  /* ----- Tabs and chat ----- */
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPage, setCurrentPage] = useState<'explorer' | 'grants'>('grants');

  /* ================= Keyboard shortcuts ================= */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        const chatInput = document.querySelector('textarea[placeholder*="Ask me anything"]') as HTMLTextAreaElement | null;
        chatInput?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        const btns = document.querySelectorAll('button');
        for (const b of Array.from(btns)) {
          if (b.textContent?.includes('@ Add Context')) {
            (b as HTMLButtonElement).click();
            break;
          }
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* ================= Helpers ================= */
  const getFileTypeMapping = (category: ExplorerFile['category']) =>
    category === 'Documents' ? 'document' : category === 'Sources' ? 'source' : 'context';

  const getDefaultContent = (fileType: string, extension: string) => {
    switch (extension) {
      case 'md':
        return `# New ${fileType}\n\nStart writing here...`;
      case 'txt':
      case 'rtf':
      case 'docx':
        return `New ${fileType}\n\nStart writing here...`;
      case 'html':
        return `<!DOCTYPE html>\n<html>\n<head>\n  <title>New ${fileType}</title>\n</head>\n<body>\n  <h1>New ${fileType}</h1>\n  <p>Start writing here...</p>\n</body>\n</html>`;
      default:
        return '';
    }
  };

  const isPdf = (f: ExplorerFile) => (f.extension || '').toLowerCase() === 'pdf';

  /* ================= File actions ================= */
  const handleFileSelect = useCallback((file: ExplorerFile) => {
    setSelectedFileId(file.id);

    const ext = file.extension?.toLowerCase() || '';
    const isEditable =
      file.category === 'Documents' ||
      (file.category === 'Context') ||
      ['txt', 'md', 'rtf', 'docx', 'html'].includes(ext);

    const newTab: WorkspaceTab = {
      id: `tab-${file.id}`,
      file,
      isActive: true,
      isDirty: false,
      isEditable,
    };

    setTabs((current) => {
      const existing = current.find((t) => t.file.id === file.id);
      if (!existing) {
        return [...current.map((t) => ({ ...t, isActive: false })), newTab];
      }
      return current.map((t) => ({ ...t, isActive: t.id === existing.id }));
    });
  }, []);

  const handleFileAction = useCallback(
    async (action: 'rename' | 'delete' | 'move', file: ExplorerFile) => {
      if (action === 'rename') {
        toast.info('Rename not wired yet');
        return;
      }

      if (action === 'delete') {
        if (file.category === 'Sources') {
          try {
            console.log('Deleting file from storage:', file.path);
            const { error: storageError } = await supabase.storage.from('documents').remove([file.path]);
            if (storageError) {
              console.error('Storage delete error:', storageError);
              toast.error(`Failed to delete file from storage: ${storageError.message}`);
              return;
            }
            console.log('File deleted from storage successfully');
          } catch (error) {
            console.error('Storage delete exception:', error);
            toast.error('Failed to delete file from storage');
            return;
          }
          
          try {
            console.log('Deleting database entry for file ID:', file.id);
            const { error: dbError } = await supabase.from('sources').delete().eq('id', file.id);
            if (dbError) {
              console.error('Database delete error:', dbError);
              toast.error(`Failed to delete database entry: ${dbError.message}`);
              return;
            }
            console.log('Database entry deleted successfully');
          } catch (error) {
            console.error('Database delete exception:', error);
            toast.error('Failed to delete database entry');
            return;
          }
          
          await refresh();
          setTabs((current) => current.filter((t) => t.file.id !== file.id));
          toast.success(`Deleted ${file.name}`);
        } else if (file.category === 'Documents') {
          setLocalDocs((d) => d.filter((x) => x.id !== file.id));
          setTabs((current) => current.filter((t) => t.file.id !== file.id));
          toast.success(`Deleted ${file.name}`);
        } else {
          setLocalRules((r) => r.filter((x) => x.id !== file.id));
          setTabs((current) => current.filter((t) => t.file.id !== file.id));
          toast.success(`Deleted ${file.name}`);
        }
        return;
      }

      if (action === 'move') {
        toast.info('Drag and drop between sections. Moving PDFs to Documents is not supported.');
      }
    },
    [refresh]
  );

  const handleFileMoveToCategory = useCallback(
    async (fileId: string, targetCategory: 'Documents' | 'Sources' | 'Context') => {
      const all = files;
      const file = all.find((f) => f.id === fileId);
      if (!file || file.category === targetCategory) return;

      // Do not allow moving PDFs into Documents
      if (isPdf(file) && targetCategory === 'Documents') {
        toast.error('Cannot move PDFs into Documents. Keep them in Sources.');
        return;
      }

      if (file.category === 'Sources') {
        // Remote source → move in storage + DB
        const row = (await supabase.from('sources').select('*').eq('id', fileId).single()).data;
        if (!row) {
          toast.error('Could not load source record');
          return;
        }
        const oldPath = row.file_path as string;
        const parts = oldPath.split('/');
        parts[1] = targetCategory; // userId/<cat>/...
        const newPath = parts.join('/');

        const { error: moveErr } = await supabase.storage.from('documents').move(oldPath, newPath);
        if (moveErr) {
          toast.error(`Storage move failed: ${moveErr.message}`);
          return;
        }

        await supabase.from('sources').update({ file_path: newPath }).eq('id', fileId);
        await refresh();
        toast.success(`Moved to ${targetCategory}`);
      } else {
        // Local doc/rule → just update local state
        const updater = (arr: ExplorerFile[]) =>
          arr.map((f) => (f.id === fileId ? { ...f, category: targetCategory, path: `/${targetCategory}/${f.name}` } : f));

        if (file.category === 'Documents') setLocalDocs((d) => updater(d));
        if (file.category === 'Context') setLocalRules((r) => updater(r));
        toast.success(`Moved to ${targetCategory}`);
      }

      // Mark any open tab dirty with the new category/path
      setTabs((current) =>
        current.map((t) =>
          t.file.id === fileId
            ? {
                ...t,
                file: { ...t.file, category: targetCategory, path: `/${targetCategory}/${t.file.name}` },
                isDirty: true,
              }
            : t
        )
      );
    },
    [files, refresh]
  );

  const handleAddFile = useCallback(
    (options: FileCreationOptions) => {
    const { category, action, fileType } = options;

    if (action === 'upload') {
        // Explorer already uploaded to Supabase. Just refresh.
        refresh();
      return;
    }

    if (action === 'create' && fileType) {
        const base = category.slice(0, -1);
      const extension = fileType;
        const fileName = `New ${base}.${extension}`;

      const newFile: ExplorerFile = {
          id: `local-${Date.now()}`,
        name: fileName,
        type: getFileTypeMapping(category),
        category,
          content: getDefaultContent(base, extension),
        lastModified: new Date(),
        path: `/${category}/${fileName}`,
          extension,
        };

        if (category === 'Documents') {
          setLocalDocs((d) => [...d, newFile]);
        } else if (category === 'Context') {
          setLocalRules((r) => [...r, newFile]);
        } else {
          toast.info('Create in Sources is disabled. Use Upload for PDFs.');
          return;
        }

      handleFileSelect(newFile);
      
        const labels: Record<string, string> = {
          md: 'Markdown',
          txt: 'Text',
          rtf: 'Rich Text',
          docx: 'Word Document',
          pdf: 'PDF',
          html: 'HTML',
        };
        toast.success(`Created new ${labels[extension] || extension.toUpperCase()} in ${category}`);
      }
    },
    [handleFileSelect, refresh]
  );

  /* ================= Tabs ================= */
  const handleTabClose = useCallback((tabId: string) => {
    setTabs((current) => {
      const tab = current.find((t) => t.id === tabId);
      const remaining = current.filter((t) => t.id !== tabId);
      if (tab?.isActive && remaining.length > 0) {
        const next = remaining[remaining.length - 1];
        return remaining.map((t) => ({ ...t, isActive: t.id === next.id }));
      }
      return remaining;
    });
  }, []);

  const handleTabSelect = useCallback((tabId: string) => {
    setTabs((current) => current.map((t) => ({ ...t, isActive: t.id === tabId })));
  }, []);

  const handleTabReorder = useCallback((from: number, to: number) => {
    setTabs((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const handleContentChange = useCallback((tabId: string, content: string) => {
    let targetFileId: string | null = null;
    
    setTabs((current) => {
      const target = current.find((t) => t.id === tabId);
      if (target) targetFileId = target.file.id;
      return current.map((t) => (t.id === tabId ? { ...t, isDirty: true, file: { ...t.file, content } } : t));
    });

    if (!targetFileId) return;

    // Update local docs or rules only
    setLocalDocs((docs) =>
      docs.some((f) => f.id === targetFileId)
        ? docs.map((f) => (f.id === targetFileId ? { ...f, content, lastModified: new Date() } : f))
        : docs
    );
    setLocalRules((rules) =>
      rules.some((f) => f.id === targetFileId)
        ? rules.map((f) => (f.id === targetFileId ? { ...f, content, lastModified: new Date() } : f))
        : rules
    );
  }, []);

  /* ================= Chat ================= */
  const handleSendMessage = useCallback(async (content: string, contextFiles: ExplorerFile[]) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date(),
      contextFiles: contextFiles.length > 0 ? contextFiles : undefined,
    };
    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const replies = [
        'Based on your research context, I can help you develop that thesis statement further.',
        "I've analyzed the documents you've shared. Here are some key insights that could strengthen your proposal...",
        'Your literature review covers important ground. I notice some gaps that could be addressed with additional sources.',
        "The methodology you've outlined aligns well with your research questions. Consider these refinements...",
      ];
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date(),
        citations:
          contextFiles.length > 0
            ? [
                {
          id: 'citation-1',
          text: 'Referenced content from your sources',
          sourceFile: contextFiles[0],
                  position: { page: Math.floor(Math.random() * 20) + 1, offset: Math.floor(Math.random() * 1000) },
                },
              ]
            : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1200);
  }, []);

  const handleCitationClick = useCallback(
    (citation: any) => {
    handleFileSelect(citation.sourceFile);
    toast.info(`Opened ${citation.sourceFile.name} with citation highlighted`);
    },
    [handleFileSelect]
  );

  const handleSaveQuote = useCallback((quote: string, sourceFile?: ExplorerFile) => {
    setLocalDocs((current) => {
      let quotes = current.find((f) => f.type === 'quote');
      if (!quotes) {
        quotes = {
          id: `quotes-${Date.now()}`,
          name: 'Saved Quotes',
          type: 'quote',
          category: 'Documents',
          content: '',
          lastModified: new Date(),
          path: '/Documents/Saved Quotes',
          extension: 'md',
        };
        current = [...current, quotes];
      }

      const timestamp = new Date().toISOString();
      const sourceInfo = sourceFile ? `\nSource: ${sourceFile.name}` : '';
      const newEntry = `\n\n---\n**Saved ${timestamp}**\n\n"${quote}"${sourceInfo}\n`;

      const updated = current.map((f) =>
        f.id === quotes!.id ? { ...f, content: (f.content || '') + newEntry, lastModified: new Date() } : f
      );

      // update any open tab with quotes
      setTabs((tabs) =>
        tabs.map((t) => (t.file.id === quotes!.id ? { ...t, file: updated.find((f) => f.id === quotes!.id)! } : t))
      );

      toast.success('Quote saved to Documents');
      return updated;
    });
  }, []);

  /* ================= Render ================= */
  return (
    <div className="h-screen w-full bg-app-navy overflow-hidden">
      {/* Header */}
      <div className="h-16 bg-app-gold border-b border-app-sand/20 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-bold text-app-navy" style={{ fontSize: '1.5em' }}>
            Granted: Academic Writing IDE
          </h1>
        </div>
        
        
        <div className="flex items-center space-x-3">
          <LoginButton className="bg-app-navy text-app-sand hover:bg-app-navy/90" />
          <UserProfile />
        </div>
      </div>

      {currentPage === 'explorer' ? (
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-3rem)]">
          {/* Explorer */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
          <Explorer
            files={files}
            // if you add a loading prop to Explorer, pass filesLoading here
            onFileSelect={handleFileSelect}
            selectedFileId={selectedFileId}
            onFileAction={handleFileAction}
            onAddFile={handleAddFile}
            onFileMoveToCategory={handleFileMoveToCategory}
            onNavigateToGrants={() => {
              console.log('Navigating to grants from Explorer');
              setCurrentPage('grants');
            }}
            className="h-full"
          />
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-app-sand hover:bg-app-gold transition-colors" />

          {/* Workspace */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <TabbedWorkspace
            tabs={tabs}
            onTabClose={handleTabClose}
            onTabSelect={handleTabSelect}
            onTabReorder={handleTabReorder}
            onContentChange={handleContentChange}
            onSaveQuote={handleSaveQuote}
            className="h-full"
          />
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-app-sand hover:bg-app-gold transition-colors" />

          {/* Assistant */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <AssistantChat
            files={files}
            messages={messages}
            onSendMessage={handleSendMessage}
            onCitationClick={handleCitationClick}
            onSaveQuote={handleSaveQuote}
            className="h-full"
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-3rem)]">
          {/* Grants */}
          <ResizablePanel defaultSize={60} minSize={40} maxSize={80}>
            <Grants 
              className="h-full"
              onNavigateToHome={() => setCurrentPage('explorer')}
            />
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-app-sand hover:bg-app-gold transition-colors" />

          {/* Assistant */}
          <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
            <AssistantChat
              files={files}
              messages={messages}
              onSendMessage={handleSendMessage}
              onCitationClick={handleCitationClick}
              onSaveQuote={handleSaveQuote}
              className="h-full"
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}


      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-app-white)',
            border: '1px solid var(--color-app-sand)',
            color: 'var(--color-app-navy)',
          },
        }}
      />

      <AuthDebug />
    </div>
  );
}
