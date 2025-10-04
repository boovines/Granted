import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, FileText, Settings, Plus, MoreHorizontal, Upload, ChevronRight as ChevronRightSmall, GripVertical } from 'lucide-react';
import { Button } from './ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './ui/dropdown-menu';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export interface ExplorerFile {
  id: string;
  name: string;
  type: 'document' | 'source' | 'context' | 'quote';
  category: 'Documents' | 'Sources' | 'Context';
  content?: string;
  lastModified: Date;
  path: string;
  extension?: string;
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
  onFileMoveToCategory: (fileId: string, targetCategory: 'Documents' | 'Sources' | 'Context') => void;
  className?: string;
}

// Drag and drop item types
const FILE_ITEM_TYPE = 'FILE_ITEM';

interface FileDragItem {
  id: string;
  file: ExplorerFile;
}

// Draggable file item component
const DraggableFileItem = ({ file, isSelected, onFileSelect, onFileAction, getFileIcon, ...props }: {
  file: ExplorerFile;
  isSelected: boolean;
  onFileSelect: (file: ExplorerFile) => void;
  onFileAction: (action: 'rename' | 'delete' | 'move', file: ExplorerFile) => void;
  getFileIcon: (type: ExplorerFile['type']) => any;
  [key: string]: any;
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: FILE_ITEM_TYPE,
    item: { id: file.id, file },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={drag}
          className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-all duration-200 group ${
            isSelected 
              ? 'bg-app-gold/20 text-app-white' 
              : 'hover:bg-app-sand/20 text-app-white/80'
          } ${isDragging ? 'opacity-50' : ''}`}
          onClick={() => onFileSelect(file)}
          style={{ opacity: isDragging ? 0.5 : 1 }}
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-3 h-3 text-current/50 cursor-grab active:cursor-grabbing" />
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

// Droppable category section component
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
  getFileTypeOptions
}: {
  category: 'Documents' | 'Sources' | 'Context';
  files: ExplorerFile[];
  isExpanded: boolean;
  selectedFileId?: string;
  onToggleFolder: (folder: string) => void;
  onFileSelect: (file: ExplorerFile) => void;
  onFileAction: (action: 'rename' | 'delete' | 'move', file: ExplorerFile) => void;
  onAddFile: (options: FileCreationOptions) => void;
  onFileMoveToCategory: (fileId: string, targetCategory: 'Documents' | 'Sources' | 'Context') => void;
  onUploadClick: (category: 'Documents' | 'Sources' | 'Context') => void;
  getFileIcon: (type: ExplorerFile['type']) => any;
  getFileTypeOptions: (category: 'Documents' | 'Sources' | 'Context') => any[];
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: FILE_ITEM_TYPE,
    drop: (item: FileDragItem) => {
      if (item.file.category !== category) {
        onFileMoveToCategory(item.file.id, category);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
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
          <span className="text-sm text-app-white/90">{category === 'Context' ? 'Rules' : category}</span>
          <span className="text-xs text-app-white/50 ml-1">({categoryFiles.length})</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-app-gold/20 rounded cursor-pointer flex items-center justify-center transition-all"
              onClick={(e) => {
                e.stopPropagation();
              }}
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
                    onClick={() => onAddFile({ 
                      category, 
                      action: 'create', 
                      fileType: option.type 
                    })}
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
      </div>
      
      {/* Drop indicator */}
      {isOver && canDrop && (
        <div className="mx-2 mb-2 h-0.5 bg-app-gold rounded-full opacity-80" />
      )}
      
      {isExpanded && (
        <div className="ml-4 space-y-0.5">
          {categoryFiles.length === 0 ? (
            <div className="px-2 py-1 text-xs text-app-white/50 italic">
              {isOver && canDrop ? 'Drop file here' : 'No files yet'}
            </div>
          ) : (
            categoryFiles.map(file => (
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

const Explorer = ({ 
  files, 
  onFileSelect, 
  selectedFileId,
  onFileAction,
  onAddFile,
  onFileMoveToCategory,
  className = '' 
}: ExplorerProps) => {
  const [expandedFolders, setExpandedFolders] = useState(
    new Set(['Documents', 'Sources', 'Context'])
  );

  const handleUploadClick = (category: 'Documents' | 'Sources' | 'Context') => {
    // For all categories, directly open file explorer with PDF and DOCX filter
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    fileInput.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        handleFileUpload(Array.from(files), category);
      }
    };
    
    fileInput.click();
  };

  const handleFileUpload = (uploadedFiles: File[], category: 'Documents' | 'Sources' | 'Context') => {
    // Convert uploaded files to ExplorerFile format and add them
    uploadedFiles.forEach(file => {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      
      // Determine file type based on category and extension
      let fileType: ExplorerFile['type'] = 'document';
      if (category === 'Sources') {
        fileType = 'source';
      } else if (category === 'Context') {
        fileType = 'context';
      } else if (category === 'Documents') {
        fileType = 'document';
      }
      
      // Create a mock ExplorerFile for display
      const explorerFile: ExplorerFile = {
        id: fileId,
        name: file.name,
        type: fileType,
        category: category,
        content: `[UPLOADED] ${file.name} (${Math.round(file.size / 1024)}KB)`,
        lastModified: new Date(),
        path: `/${category}/${file.name}`,
        extension: extension
      };

      console.log('File uploaded:', explorerFile);
      
      // Call onAddFile to add to the explorer
      onAddFile({
        category: category,
        action: 'upload',
        fileType: extension as any
      });
    });
  };

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder);
    } else {
      newExpanded.add(folder);
    }
    setExpandedFolders(newExpanded);
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
    Documents: files.filter(f => f.category === 'Documents'),
    Sources: files.filter(f => f.category === 'Sources'),
    Context: files.filter(f => f.category === 'Context')
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
          <h2 className="font-medium text-app-white/90">Explorer</h2>
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
            onFileSelect={onFileSelect}
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
            onFileSelect={onFileSelect}
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
            onFileSelect={onFileSelect}
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