// Explorer.tsx
import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  FileText,
  Settings,
  Plus,
  MoreHorizontal,
  Upload,
  ChevronRight as ChevronRightSmall,
  GripVertical,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'sonner';
import { supabase } from '../config/supabaseClient';

const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@hackathon.com',
  name: 'Demo User',
} as const;

export interface ExplorerFile {
  id: string;
  name: string;
  type: 'document' | 'source' | 'context' | 'quote';
  category: 'Documents' | 'Sources' | 'Context';
  content?: string;
  lastModified: Date;
  path: string;
  extension?: string;
  publicUrl?: string;
}

export interface FileCreationOptions {
  category: 'Documents' | 'Sources' | 'Context';
  action: 'upload' | 'create';
  fileType?: 'md' | 'docx' | 'txt' | 'rtf' | 'pdf' | 'html';
}

interface ExplorerProps {
  files: ExplorerFile[];
  onFileSelect: (file: ExplorerFile) => void;
  selectedFileId?: string;
  onFileAction: (action: 'rename' | 'delete' | 'move', file: ExplorerFile) => void;
  onAddFile: (options: FileCreationOptions) => void;
  onFileMoveToCategory: (
    fileId: string,
    targetCategory: 'Documents' | 'Sources' | 'Context'
  ) => void;
  onPDFProcess?: (file: File) => Promise<void>;
  className?: string;
}

const FILE_ITEM_TYPE = 'FILE_ITEM';
interface FileDragItem {
  id: string;
  file: ExplorerFile;
}

/* ===================== Draggable item ===================== */

type DraggableFileItemProps = {
  file: ExplorerFile;
  isSelected: boolean;
  onFileSelect: (file: ExplorerFile) => void;
  onFileAction: (action: 'rename' | 'delete' | 'move', file: ExplorerFile) => void;
  getFileIcon: (type: ExplorerFile['type']) => React.ReactNode;
};

const DraggableFileItem: React.FC<DraggableFileItemProps> = ({
  file,
  isSelected,
  onFileSelect,
  onFileAction,
  getFileIcon,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: FILE_ITEM_TYPE,
    item: { id: file.id, file },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={drag}
          className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-all duration-200 group ${
            isSelected ? 'bg-app-gold/20 text-app-white' : 'hover:bg-app-sand/20 text-app-white/80'
          } ${isDragging ? 'opacity-50' : ''}`}
          onClick={() => onFileSelect(file)}
          style={{ opacity: isDragging ? 0.5 : 1 }}
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-3 h-3 text-current/50" />
          </div>
          {getFileIcon(file.type)}
          <span className="text-sm truncate flex-1">{file.name}</span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-app-white border-app-sand">
        <ContextMenuItem
          onClick={() => onFileAction('rename', file)}
          className="hover:bg-app-sand/30"
        >
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onFileAction('move', file)}
          className="hover:bg-app-sand/30"
        >
          Move
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onFileAction('delete', file)}
          className="hover:bg-app-sand/30 text-red-600"
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

/* ===================== Droppable section ===================== */

const DroppableCategorySection = ({
  category,
  files: categoryFiles,
  isExpanded,
  selectedFileId,
  onToggleFolder,
  onFileSelect,
  onFileAction,
  onAddFile,
  onFileMoveToCategory,
  onUploadClick,
  getFileIcon,
  getFileTypeOptions,
}: {
  category: 'Documents' | 'Sources' | 'Context';
  files: ExplorerFile[];
  isExpanded: boolean;
  selectedFileId?: string;
  onToggleFolder: (folder: string) => void;
  onFileSelect: (file: ExplorerFile) => void;
  onFileAction: (action: 'rename' | 'delete' | 'move', file: ExplorerFile) => void;
  onAddFile: (options: FileCreationOptions) => void;
  onFileMoveToCategory: (
    fileId: string,
    targetCategory: 'Documents' | 'Sources' | 'Context'
  ) => void;
  onUploadClick: (category: 'Documents' | 'Sources' | 'Context') => void;
  getFileIcon: (type: ExplorerFile['type']) => React.ReactNode;
  getFileTypeOptions: (category: 'Documents' | 'Sources' | 'Context') => any[];
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: FILE_ITEM_TYPE,
    drop: (item: FileDragItem) => {
      if (item.file.category !== category) onFileMoveToCategory(item.file.id, category);
    },
    collect: (monitor) => ({ isOver: monitor.isOver(), canDrop: monitor.canDrop() }),
  });

  return (
    <div
      ref={drop}
      className={`mb-2 rounded transition-all duration-200 ${
        isOver && canDrop ? 'bg-app-gold/10 ring-2 ring-app-gold/30' : ''
      }`}
    >
      <div
        className="flex items-center justify-between py-1 px-2 hover:bg-app-sand/20 rounded cursor-pointer group"
        onClick={() => onToggleFolder(category)}
      >
        <div className="flex items-center gap-1">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-app-white/70" />
          ) : (
            <ChevronRight className="w-4 h-4 text-app-white/70" />
          )}
          <span className="text-sm text-app-white/90">
            {category === 'Context' ? 'Rules' : category}
          </span>
          <span className="text-xs text-app-white/50 ml-1">({categoryFiles.length})</span>
        </div>

        {category !== 'Context' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-app-gold/20 rounded cursor-pointer flex items-center justify-center transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="w-3 h-3 text-app-gold" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-app-white border-app-sand"
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={() => onUploadClick(category)}
                className="hover:bg-app-sand/30 cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-app-sand/50" />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="hover:bg-app-sand/30 cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Create New
                  <ChevronRightSmall className="w-4 h-4 ml-auto" />
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-app-white border-app-sand">
                  {getFileTypeOptions(category).map((option) => (
                    <DropdownMenuItem
                      key={option.type}
                      onClick={() =>
                        onAddFile({ category, action: 'create', fileType: option.type })
                      }
                      className="hover:bg-app-sand/30 cursor-pointer"
                    >
                      {option.icon}
                      <span className="ml-2">{option.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {isOver && canDrop && (
        <div className="mx-2 mb-2 h-0.5 bg-app-gold rounded-full opacity-80" />
      )}

      {isExpanded && (
        <div className="ml-4 space-y-0.5">
          {category === 'Context' ? (
            <div className="space-y-2">
              <div className="px-2 py-2 bg-app-gold/10 rounded border border-app-gold/20">
                <h4 className="text-sm font-medium text-app-gold mb-1">
                  Rules Document Instructions
                </h4>
                <div className="text-xs text-app-white/80 space-y-1">
                  <p>• Write clear, specific rules for your research</p>
                  <p>• Use bullet points or numbered lists</p>
                  <p>• Include formatting guidelines and style preferences</p>
                  <p>• Save changes automatically as you type</p>
                </div>
              </div>
              {categoryFiles.length === 0 ? (
                <div className="px-2 py-1 text-xs text-app-white/50 italic">
                  No rules document yet
                </div>
              ) : (
                categoryFiles.map((file) => (
                  <DraggableFileItem
                    key={file.id}
                    file={file}
                    isSelected={selectedFileId === file.id}
                    onFileSelect={onFileSelect}
                    onFileAction={onFileAction}
                    getFileIcon={getFileIcon}
                  />
                ))
              )}
            </div>
          ) : categoryFiles.length === 0 ? (
            <div className="px-2 py-1 text-xs text-app-white/50 italic">No files yet</div>
          ) : (
            categoryFiles.map((file) => (
              <DraggableFileItem
                key={file.id}
                file={file}
                isSelected={selectedFileId === file.id}
                onFileSelect={onFileSelect}
                onFileAction={onFileAction}
                getFileIcon={getFileIcon}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

/* ===================== Explorer ===================== */

const Explorer = ({
  files,
  onFileSelect,
  selectedFileId,
  onFileAction,
  onAddFile,
  onFileMoveToCategory,
  onPDFProcess,
  className = '',
}: ExplorerProps) => {
  const [expandedFolders, setExpandedFolders] = useState(
    new Set(['Documents', 'Sources', 'Context'])
  );
  const [isLoading, setIsLoading] = useState(false);

  // url helpers
  const isPdfSource = (file: ExplorerFile) => {
    const name = file.name?.toLowerCase() || '';
    const ext = file.extension?.toLowerCase() || '';
    return file.category === 'Sources' && (ext === 'pdf' || name.endsWith('.pdf'));
  };

  const getSupabaseFileUrl = async (path: string) => {
    // public url attempt
    const { data: pub } = supabase.storage.from('documents').getPublicUrl(path);
    if (pub?.publicUrl) return pub.publicUrl;

    // signed url fallback
    const { data: signed, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600);
    if (error) throw error;
    return signed.signedUrl;
  };

  const handleSelect = (file: ExplorerFile) => {
    if (!isPdfSource(file)) {
      onFileSelect(file);
      return;
    }
    (async () => {
      try {
        if (!file.path) {
          toast.error('Missing file path for Supabase object');
          onFileSelect(file);
          return;
        }
        const url = file.publicUrl || (await getSupabaseFileUrl(file.path));
        onFileSelect({ ...file, publicUrl: url });
      } catch (e: any) {
        console.error('URL resolution error:', e);
        toast.error('Could not resolve PDF URL');
        onFileSelect(file);
      }
    })();
  };

  // Check bucket by listing inside it
  React.useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.storage.from('documents').list('', { limit: 1 });
        if (error) {
          const msg = String(error.message || '').toLowerCase();
          if (msg.includes('not found') || msg.includes('does not exist')) {
            console.warn("Bucket 'documents' missing. Create it in Supabase and make it Public.");
          } else {
            console.error('Storage check error:', error);
          }
          return;
        }
        console.log('documents bucket is reachable', data);
      } catch (e) {
        console.error('Error verifying bucket:', e);
      }
    })();
  }, []);

  // Log DB and storage for demo user
  React.useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const userId = DEMO_USER.id;

        const { data: dbData, error: dbErr } = await supabase
          .from('sources')
          .select('*')
          .eq('user_id', userId)
          .order('uploaded_time', { ascending: false });

        if (dbErr) console.error('DB load error:', dbErr);
        if (dbData?.length) console.log('DB rows:', dbData);

        const { data: storageData, error: stErr } = await supabase.storage
          .from('documents')
          .list(userId, { limit: 100, offset: 0 });

        if (stErr) console.error('Storage list error:', stErr);
        if (storageData?.length) console.log('Storage objects:', storageData);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleUploadClick = (category: 'Documents' | 'Sources' | 'Context') => {
    if (category === 'Context') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept =
      '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files?.length) handleFileUpload(Array.from(files), category);
    };
    input.click();
  };

  const ensureBucketExists = async () => {
    const { data, error } = await supabase.storage.from('documents').list('', { limit: 1 });
    if (error) {
      const msg = String(error.message || '').toLowerCase();
      if (msg.includes('not found') || msg.includes('does not exist')) {
        toast.error("Storage bucket 'documents' is missing. Create it in Supabase and make it Public.");
        return false;
      }
      console.error('Storage check error:', error);
      return false;
    }
    return true;
  };

  const handleFileUpload = async (
    uploadedFiles: File[],
    category: 'Documents' | 'Sources' | 'Context'
  ) => {
    const userId = DEMO_USER.id;
    const bucketOk = await ensureBucketExists();
    if (!bucketOk) return;

    for (const file of uploadedFiles) {
      const loading = toast.loading(`Uploading ${file.name}...`);
      try {
        const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
        
        // For PDF files in Sources category, use the PDF processing pipeline
        if (extension === 'pdf' && category === 'Sources' && onPDFProcess) {
          toast.dismiss(loading);
          await onPDFProcess(file);
          continue;
        }

        // For other files, use the standard upload process
        const filePath = `${userId}/${category}/${Date.now()}_${file.name}`;

        // Upload to storage
        const { error: upErr } = await supabase.storage
          .from('documents')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (upErr) {
          console.error('Storage upload error:', upErr);
          toast.error(`Storage error: ${upErr.message}`);
          toast.dismiss(loading);
          continue;
        }

        // Public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('documents').getPublicUrl(filePath);
        console.log('Public URL:', publicUrl);

        // Insert metadata
        const { error: dbErr } = await supabase.from('sources').insert({
          user_id: userId,
          file_name: file.name,
          file_path: filePath,
          file_type: extension,
          uploaded_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });

        if (dbErr) {
          console.error('DB insert error:', dbErr);
          toast.error(`DB error: ${dbErr.message}`);
          toast.dismiss(loading);
          continue;
        }

        // Update UI
        onAddFile({ category, action: 'upload', fileType: extension as any });
        toast.dismiss(loading);
        toast.success(`Uploaded ${file.name}`, { description: `Stored at ${filePath}` });
      } catch (err) {
        console.error('Upload error:', err);
        toast.dismiss(loading);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const toggleFolder = (folder: string) => {
    const next = new Set(expandedFolders);
    next.has(folder) ? next.delete(folder) : next.add(folder);
    setExpandedFolders(next);
  };

  const getFileIcon = (type: ExplorerFile['type']) => {
    switch (type) {
      case 'document':
      case 'quote':
        return <FileText className="w-4 h-4" />;
      case 'source':
        return <File className="w-4 h-4" />;
      case 'context':
        return <Settings className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const filesByCategory = {
    Documents: files.filter((f) => f.category === 'Documents'),
    Sources: files.filter((f) => f.category === 'Sources'),
    Context: files.filter((f) => f.category === 'Context'),
  };

  const getFileTypeOptions = (category: 'Documents' | 'Sources' | 'Context') => {
    switch (category) {
      case 'Documents':
        return [
          { label: 'Markdown (.md)', type: 'md' as const, icon: <FileText className="w-4 h-4" /> },
          { label: 'Word Document (.docx)', type: 'docx' as const, icon: <FileText className="w-4 h-4" /> },
          { label: 'Plain Text (.txt)', type: 'txt' as const, icon: <FileText className="w-4 h-4" /> },
          { label: 'Rich Text (.rtf)', type: 'rtf' as const, icon: <FileText className="w-4 h-4" /> },
        ];
      case 'Sources':
        return [
          { label: 'PDF Document (.pdf)', type: 'pdf' as const, icon: <File className="w-4 h-4" /> },
          { label: 'Web Page (.html)', type: 'html' as const, icon: <File className="w-4 h-4" /> },
          { label: 'Plain Text (.txt)', type: 'txt' as const, icon: <File className="w-4 h-4" /> },
          { label: 'Word Document (.docx)', type: 'docx' as const, icon: <File className="w-4 h-4" /> },
        ];
      case 'Context':
        return [
          { label: 'Markdown (.md)', type: 'md' as const, icon: <Settings className="w-4 h-4" /> },
          { label: 'Plain Text (.txt)', type: 'txt' as const, icon: <Settings className="w-4 h-4" /> },
          { label: 'Rich Text (.rtf)', type: 'rtf' as const, icon: <Settings className="w-4 h-4" /> },
        ];
      default:
        return [];
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`bg-app-navy text-app-white p-4 h-full overflow-y-auto ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-medium text-app-white/90">Explorer</h2>
            {isLoading && (
              <div className="w-4 h-4 border-2 border-app-gold border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <Button variant="ghost" size="sm" className="w-6 h-6 p-0 hover:bg-app-white/10">
            <MoreHorizontal className="w-4 h-4 text-app-white/70" />
          </Button>
        </div>

        <div className="space-y-1">
          <DroppableCategorySection
            category="Documents"
            files={filesByCategory.Documents}
            isExpanded={expandedFolders.has('Documents')}
            selectedFileId={selectedFileId}
            onToggleFolder={toggleFolder}
            onFileSelect={handleSelect}
            onFileAction={onFileAction}
            onAddFile={onAddFile}
            onFileMoveToCategory={onFileMoveToCategory}
            onUploadClick={handleUploadClick}
            getFileIcon={getFileIcon}
            getFileTypeOptions={getFileTypeOptions}
          />
          <DroppableCategorySection
            category="Sources"
            files={filesByCategory.Sources}
            isExpanded={expandedFolders.has('Sources')}
            selectedFileId={selectedFileId}
            onToggleFolder={toggleFolder}
            onFileSelect={handleSelect}
            onFileAction={onFileAction}
            onAddFile={onAddFile}
            onFileMoveToCategory={onFileMoveToCategory}
            onUploadClick={handleUploadClick}
            getFileIcon={getFileIcon}
            getFileTypeOptions={getFileTypeOptions}
          />
          <DroppableCategorySection
            category="Context"
            files={filesByCategory.Context}
            isExpanded={expandedFolders.has('Context')}
            selectedFileId={selectedFileId}
            onToggleFolder={toggleFolder}
            onFileSelect={handleSelect}
            onFileAction={onFileAction}
            onAddFile={onAddFile}
            onFileMoveToCategory={onFileMoveToCategory}
            onUploadClick={handleUploadClick}
            getFileIcon={getFileIcon}
            getFileTypeOptions={getFileTypeOptions}
          />
        </div>
      </div>
    </DndProvider>
  );
};

export default Explorer;
