import React, { useState, useEffect, useCallback } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './components/ui/resizable';
import { Toaster } from './components/ui/sonner';
import { toast } from "sonner";
import Explorer, { ExplorerFile, FileCreationOptions } from './components/Explorer';
import TabbedWorkspace, { WorkspaceTab } from './components/TabbedWorkspace';
import AssistantChat from './components/AssistantChat';
import { LoginButton, initializeOAuth } from '../oauth/integration/vite';
import { UserProfile } from '../oauth/components/UserProfile';
import AuthDebug from '../oauth/components/AuthDebug';
import LandingPage from '../landing/Landing Page Design/src/components/LandingPage';
import { useSupabaseExplorerFiles } from './hooks/useSupabaseExplorerFiles';
import { supabase } from './config/supabaseClient';
import { sendChatMessage } from './utils/chatApi';

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

export default function App() {
  const [showLandingPage, setShowLandingPage] = useState(true);
  
  // Initialize OAuth
  useEffect(() => {
    initializeOAuth();
  }, []);

  // Check for successful OAuth callback and show welcome message
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    // If we have OAuth parameters, we just came back from OAuth
    if (code && state) {
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Hide landing page and show main app
      setShowLandingPage(false);
      
      // Show welcome message after a brief delay
      setTimeout(() => {
        toast.success("Welcome! You're now signed in. 🎉", {
          duration: 4000,
        });
      }, 1000);
    }
  }, []);

  // Sample data
  const [files, setFiles] = useState<ExplorerFile[]>([
    {
      id: '1',
      name: 'Research Proposal Draft.md',
      type: 'document',
      category: 'Documents',
      content: '# Research Proposal\n\nIntroduction to the study...',
      lastModified: new Date('2024-01-15'),
      path: '/Documents/Research Proposal Draft.md',
      extension: 'md'
    },
    {
      id: '2',
      name: 'Literature Review.md',
      type: 'document',
      category: 'Documents',
      content: '# Literature Review\n\nRelevant studies include...',
      lastModified: new Date('2024-01-14'),
      path: '/Documents/Literature Review.md',
      extension: 'md'
    },
    {
      id: '3',
      name: 'Saved Quotes',
      type: 'quote',
      category: 'Documents',
      content: '',
      lastModified: new Date('2024-01-16'),
      path: '/Documents/Saved Quotes',
      extension: 'md'
    },
    {
      id: '4',
      name: 'Academic Paper - Smith et al.pdf',
      type: 'source',
      category: 'Sources',
      content: 'PDF content would be extracted here...',
      lastModified: new Date('2024-01-10'),
      path: '/Sources/Academic Paper - Smith et al.pdf',
      extension: 'pdf'
    },
    {
      id: '5',
      name: 'Web Article - Research Methods.html',
      type: 'source',
      category: 'Sources',
      content: 'Web scraped content...',
      lastModified: new Date('2024-01-12'),
      path: '/Sources/Web Article - Research Methods.html',
      extension: 'html'
    },
    {
      id: '6',
      name: 'Research Rules.md',
      type: 'context',
      category: 'Context',
      content: '# Research Rules & Guidelines\n\n## Writing Standards\n- Use clear, concise language\n- Maintain academic tone throughout\n- Follow APA citation format\n- Include proper references for all claims\n\n## Content Requirements\n- Original research and analysis required\n- Minimum 50-80 pages for thesis\n- Include methodology section\n- Provide evidence-based conclusions\n\n## Formatting Guidelines\n- Double-spaced text\n- 12pt Times New Roman font\n- 1-inch margins on all sides\n- Page numbers in top-right corner\n\n## Review Process\n- Self-review before submission\n- Check for grammar and spelling\n- Verify all citations are complete\n- Ensure logical flow and structure',
      lastModified: new Date('2024-01-08'),
      path: '/Context/Research Rules.md',
      extension: 'md'
    }
  ]);

  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        // Focus chat input
        const chatInput = document.querySelector('textarea[placeholder*="Ask me anything"]') as HTMLTextAreaElement;
        if (chatInput) {
          chatInput.focus();
        }
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        // Open context picker by finding and clicking the button
        const contextButtons = document.querySelectorAll('button');
        for (const button of contextButtons) {
          if (button.textContent?.includes('@ Add Context')) {
            button.click();
            break;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // File operations
  const handleFileSelect = useCallback((file: ExplorerFile) => {
    setSelectedFileId(file.id);
    
    // Use functional update to avoid dependency on tabs state
    setTabs(currentTabs => {
      const existingTab = currentTabs.find(tab => tab.file.id === file.id);
      
      if (!existingTab) {
        const newTab: WorkspaceTab = {
          id: `tab-${file.id}`,
          file,
          isActive: true,
          isDirty: false
        };
        
        // Deactivate other tabs and add new one
        return [
          ...currentTabs.map(tab => ({ ...tab, isActive: false })),
          newTab
        ];
      } else {
        // Just activate existing tab
        return currentTabs.map(tab => ({
          ...tab,
          isActive: tab.id === existingTab.id
        }));
      }
    });
  }, []);

  const handleFileAction = useCallback((action: 'rename' | 'delete' | 'move', file: ExplorerFile) => {
    switch (action) {
      case 'rename':
        // Mock rename functionality
        toast.info(`Rename functionality for ${file.name} would be implemented here`);
        break;
      case 'delete':
        setFiles(currentFiles => currentFiles.filter(f => f.id !== file.id));
        setTabs(currentTabs => currentTabs.filter(tab => tab.file.id !== file.id));
        toast.success(`Deleted ${file.name}`);
        break;
      case 'move':
        toast.info(`Move functionality for ${file.name} would be implemented here`);
        break;
    }
  }, []);

  const handleFileMoveToCategory = useCallback((fileId: string, targetCategory: 'Documents' | 'Sources' | 'Context') => {
    setFiles(currentFiles => {
      const file = currentFiles.find(f => f.id === fileId);
      if (!file) return currentFiles;

      const oldCategory = file.category;
      if (oldCategory === targetCategory) return currentFiles;

      // Update file type based on target category
      const getFileTypeFromCategory = (category: 'Documents' | 'Sources' | 'Context'): ExplorerFile['type'] => {
        switch (category) {
          case 'Documents':
            return file.type === 'quote' ? 'quote' : 'document';
          case 'Sources':
            return 'source';
          case 'Context':
            return 'context';
        }
      };

      const updatedFile: ExplorerFile = {
        ...file,
        category: targetCategory,
        type: getFileTypeFromCategory(targetCategory),
        path: `/${targetCategory}/${file.name}`,
        lastModified: new Date()
      };

      // Update any open tabs with the updated file
      setTabs(currentTabs => currentTabs.map(tab => 
        tab.file.id === fileId 
          ? { ...tab, file: updatedFile, isDirty: true }
          : tab
      ));

      toast.success(`Moved "${file.name}" from ${oldCategory} to ${targetCategory}`);
      
      return currentFiles.map(f => f.id === fileId ? updatedFile : f);
    });
  }, []);

  const getFileTypeMapping = (category: string) => {
    switch (category) {
      case 'Documents':
        return 'document' as const;
      case 'Sources':
        return 'source' as const;
      case 'Context':
        return 'context' as const;
      default:
        return 'document' as const;
    }
  };

  const getDefaultContent = (fileType: string, extension: string) => {
    switch (extension) {
      case 'md':
        return `# New ${fileType}\n\nStart writing here...`;
      case 'txt':
        return `New ${fileType}\n\nStart writing here...`;
      case 'rtf':
        return `New ${fileType}\n\nStart writing here...`;
      case 'html':
        return `<!DOCTYPE html>\n<html>\n<head>\n  <title>New ${fileType}</title>\n</head>\n<body>\n  <h1>New ${fileType}</h1>\n  <p>Start writing here...</p>\n</body>\n</html>`;
      case 'docx':
        return `New ${fileType}\n\nStart writing here...`;
      case 'pdf':
        return 'PDF content would be processed here...';
      default:
        return '';
    }
  };

  const handleAddFile = useCallback((options: FileCreationOptions) => {
    const { category, action, fileType } = options;

    if (action === 'upload') {
      // Mock file upload functionality
      toast.info(`File upload functionality for ${category} would be implemented here`);
      // In a real app, this would open a file picker dialog
      return;
    }

    if (action === 'create' && fileType) {
      const fileTypeDisplay = category.slice(0, -1); // Remove 's' from plural
      const extension = fileType;
      const fileName = `New ${fileTypeDisplay}.${extension}`;

      const newFile: ExplorerFile = {
        id: `file-${Date.now()}`,
        name: fileName,
        type: getFileTypeMapping(category),
        category,
        content: getDefaultContent(fileTypeDisplay, extension),
        lastModified: new Date(),
        path: `/${category}/${fileName}`,
        extension
      };

      setFiles(currentFiles => [...currentFiles, newFile]);
      handleFileSelect(newFile);
      
      // Show success message with file type
      const fileTypeLabels: Record<string, string> = {
        'md': 'Markdown',
        'txt': 'Text',
        'rtf': 'Rich Text',
        'docx': 'Word Document',
        'pdf': 'PDF',
        'html': 'HTML'
      };
      
      toast.success(`Created new ${fileTypeLabels[extension]} file in ${category}`);
    }
  }, [handleFileSelect]);

  // Tab operations
  const handleTabClose = useCallback((tabId: string) => {
    setTabs(currentTabs => {
      const tab = currentTabs.find(t => t.id === tabId);
      const remainingTabs = currentTabs.filter(t => t.id !== tabId);
      
      if (tab?.isActive && remainingTabs.length > 0) {
        // Activate the next tab
        const nextTab = remainingTabs[remainingTabs.length - 1];
        return remainingTabs.map(t => ({
          ...t,
          isActive: t.id === nextTab.id
        }));
      }
      
      return remainingTabs;
    });
  }, []);

  const handleTabSelect = useCallback((tabId: string) => {
    setTabs(currentTabs => currentTabs.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })));
  }, []);

  const handleTabReorder = useCallback((fromIndex: number, toIndex: number) => {
    setTabs(currentTabs => {
      const newTabs = [...currentTabs];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      return newTabs;
    });
  }, []);

  const handleContentChange = useCallback((tabId: string, content: string) => {
    // Get the file ID first to avoid dependency on tabs state
    let targetFileId: string | null = null;
    
    // Update tab content and mark as dirty
    setTabs(currentTabs => {
      const targetTab = currentTabs.find(tab => tab.id === tabId);
      if (targetTab) {
        targetFileId = targetTab.file.id;
      }
      
      return currentTabs.map(tab => 
        tab.id === tabId 
          ? { ...tab, isDirty: true, file: { ...tab.file, content } }
          : tab
      );
    });
    
    // Update file content using functional update
    if (targetFileId) {
      setFiles(currentFiles => 
        currentFiles.map(file =>
          file.id === targetFileId
            ? { ...file, content, lastModified: new Date() }
            : file
        )
      );
    }
  }, []); // Remove dependencies to prevent recreation

  // Assistant chat operations
  const handleSendMessage = useCallback(async (content: string, contextFiles: ExplorerFile[]) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date(),
      contextFiles: contextFiles.length > 0 ? contextFiles : undefined
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Send the message to the backend
      const response = await sendChatMessage({
        message: content,
        workspace_id: '550e8400-e29b-41d4-a716-446655440000', // Default test workspace
        chat_id: `chat-${Date.now()}`,
        context_files: contextFiles.map(f => f.id)
      });

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        citations: contextFiles.length > 0 ? [{
          id: 'citation-1',
          text: 'Referenced content from your sources',
          sourceFile: contextFiles[0],
          position: { page: Math.floor(Math.random() * 20) + 1, offset: Math.floor(Math.random() * 1000) }
        }] : undefined
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (!response.success) {
        toast.error('Chat response may be limited. Check backend connection.');
      }

    } catch (error) {
      console.error('Error sending chat message:', error);
      
      // Fallback to a simple response if there's an error
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: `I apologize, but I encountered an error processing your request. Please try again or check if the backend server is running. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      
      toast.error('Failed to send message. Check console for details.');
    }
  }, []);

  const handleCitationClick = useCallback((citation: any) => {
    // Open the source file in a tab and highlight the citation
    handleFileSelect(citation.sourceFile);
    toast.info(`Opened ${citation.sourceFile.name} with citation highlighted`);
  }, [handleFileSelect]);

  const handleSaveQuote = useCallback((quote: string, sourceFile?: ExplorerFile, citation?: any) => {
    setFiles(currentFiles => {
      // Find or create the Quotes file
      let quotesFile = currentFiles.find(f => f.type === 'quote');
      
      if (!quotesFile) {
        quotesFile = {
          id: `quotes-${Date.now()}`,
          name: 'Saved Quotes',
          type: 'quote',
          category: 'Documents',
          content: '',
          lastModified: new Date(),
          path: '/Documents/Saved Quotes',
          extension: 'md'
        };
      }

      // Add the quote to the quotes file
      const timestamp = new Date().toISOString();
      const sourceInfo = sourceFile ? `\nSource: ${sourceFile.name}` : '';
      const newQuote = `\n\n---\n**Saved ${timestamp}**\n\n"${quote}"${sourceInfo}\n`;
      
      const updatedQuotesFile = {
        ...quotesFile,
        content: (quotesFile.content || '') + newQuote,
        lastModified: new Date()
      };

      // Update tab if open
      setTabs(currentTabs => currentTabs.map(tab => 
        tab.file.id === quotesFile!.id 
          ? { ...tab, file: updatedQuotesFile, isDirty: true }
          : tab
      ));

      toast.success('Quote saved to Documents');
      
      // If quotes file didn't exist, add it, otherwise update it
      if (!currentFiles.find(f => f.type === 'quote')) {
        return [...currentFiles, updatedQuotesFile];
      } else {
        return currentFiles.map(f => f.id === quotesFile!.id ? updatedQuotesFile : f);
      }
    });
  }, []);

  // Navigation handlers for landing page
  const handleNavigateToLogin = () => {
    // This will be handled by the OAuth flow in the landing page
    setShowLandingPage(false);
  };

  const handleNavigateToApp = () => {
    setShowLandingPage(false);
  };

  // Show landing page by default
  if (showLandingPage) {
    return (
      <LandingPage 
        onNavigateToLogin={handleNavigateToLogin}
        onNavigateToApp={handleNavigateToApp}
      />
    );
  }

  return (
    <div className="h-screen w-full bg-app-navy overflow-hidden">
      {/* Header with OAuth components */}
      <div className="h-32 bg-app-gold border-b border-app-sand/20 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-app-navy" style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
            Granted: Academic Writing IDE
          </h1>
        </div>
        <div className="flex items-center space-x-3 transition-all duration-300">
          <LoginButton className="bg-app-navy text-app-sand hover:bg-app-navy/90" />
          <UserProfile />
        </div>
      </div>
      
      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-8rem)]">
        {/* Left Panel - Explorer */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
          <Explorer
            files={files}
            onFileSelect={handleFileSelect}
            selectedFileId={selectedFileId}
            onFileAction={handleFileAction}
            onAddFile={handleAddFile}
            onFileMoveToCategory={handleFileMoveToCategory}
            className="h-full"
          />
        </ResizablePanel>

        <ResizableHandle className="w-3 bg-app-sand hover:bg-app-gold transition-colors" />

        {/* Middle Panel - Tabbed Workspace */}
        <ResizablePanel defaultSize={45} minSize={25}>
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

        <ResizableHandle className="w-3 bg-app-sand hover:bg-app-gold transition-colors" />

        {/* Right Panel - Assistant Chat */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
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
      
      {/* Debug component for development */}
      <AuthDebug />
    </div>
  );
}