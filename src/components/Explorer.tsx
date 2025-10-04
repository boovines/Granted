import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, FileText, Settings, Plus, MoreHorizontal, Upload, ChevronRight as ChevronRightSmall, GripVertical } from 'lucide-react';
import { Button } from './ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from './ui/context-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './ui/dropdown-menu';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Demo user configuration
const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@hackathon.com',
  password: 'demo123456',
  name: 'Demo User'
};


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

// Initialize Supabase client
const supabase = createClient(
  'https://rjlfjdpjsukdzwmxugau.supabase.co/', // Replace with your actual Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqbGZqZHBqc3VrZHp3bXh1Z2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDI0MzYsImV4cCI6MjA3NTExODQzNn0.SnjnB9SWUP3QmSl02NzdZiJdst7_BgaMvPgvmfkLq0Y' // Replace with your actual Supabase anon key
);

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
        
        {category !== 'Context' && (
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
        )}
      </div>
      
      {/* Drop indicator */}
      {isOver && canDrop && (
        <div className="mx-2 mb-2 h-0.5 bg-app-gold rounded-full opacity-80" />
      )}
      
      {isExpanded && (
        <div className="ml-4 space-y-0.5">
          {category === 'Context' ? (
            // Special Rules section with instructions
            <div className="space-y-2">
              <div className="px-2 py-2 bg-app-gold/10 rounded border border-app-gold/20">
                <h4 className="text-sm font-medium text-app-gold mb-1">Rules Document Instructions</h4>
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
          ) : (
            // Regular file display for other categories
            categoryFiles.length === 0 ? (
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
            )
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
  const [isLoading, setIsLoading] = useState(false);

  // Verify bucket connection on component mount
  React.useEffect(() => {
    const verifyBucketConnection = async () => {
      try {
        console.log('🔍 Verifying bucket connection...');
        
        // Check if documents bucket exists and is accessible
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          console.error('❌ Error accessing storage:', bucketsError);
          return;
        }
        
        const documentsBucket = buckets?.find(bucket => bucket.name === 'documents');
        
        if (documentsBucket) {
          console.log('✅ Documents bucket found:', documentsBucket);
          console.log('📁 Bucket is public:', documentsBucket.public);
          console.log('📊 Bucket size limit:', documentsBucket.file_size_limit);
        } else {
          console.warn('⚠️ Documents bucket not found');
        }
        
      } catch (error) {
        console.error('❌ Error verifying bucket connection:', error);
      }
    };
    
    verifyBucketConnection();
  }, []);

  // Load files from database on component mount
  React.useEffect(() => {
    const loadFilesFromDatabase = async () => {
      try {
        setIsLoading(true);
        const userId = DEMO_USER.id; // Demo user ID
        
        // Load metadata from database
        const { data: dbData, error: dbError } = await supabase
          .from('sources')
          .select('*')
          .eq('user_id', userId)
          .order('uploaded_time', { ascending: false });
        
        if (dbError) {
          console.error('Error loading files from database:', dbError);
          return;
        }
        
        // List files from storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('documents')
          .list(userId, {
            limit: 100,
            offset: 0,
          });
        
        if (storageError) {
          console.error('Error loading files from storage:', storageError);
        }
        
        if (dbData && dbData.length > 0) {
          console.log('Loaded files from database:', dbData);
        }
        
        if (storageData && storageData.length > 0) {
          console.log('Loaded files from storage:', storageData);
        }
        
        // Files are already loaded in the parent component's state
        // This is just for demo logging and verification
      } catch (error) {
        console.error('Error loading files:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFilesFromDatabase();
  }, []);

  const handleUploadClick = (category: 'Documents' | 'Sources' | 'Context') => {
    // Only allow file upload for Documents and Sources, not Context/Rules
    if (category === 'Context') {
      return; // No file upload for Rules tab
    }
    
    // For Documents and Sources, directly open file explorer with PDF and DOCX filter
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

  // Function to create bucket if it doesn't exist
  const createBucketIfNeeded = async () => {
    try {
      // Try to list the bucket to see if it exists
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error checking buckets:', error);
        return false;
      }
      
      const bucketExists = data?.some(bucket => bucket.name === 'documents');
      
      if (!bucketExists) {
        console.log('Creating documents bucket...');
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('documents', {
          public: true,
          allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
          fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
        });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
          return false;
        }
        
        console.log('Bucket created successfully:', newBucket);
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('Error in createBucketIfNeeded:', error);
      return false;
    }
  };

  const handleFileUpload = async (uploadedFiles: File[], category: 'Documents' | 'Sources' | 'Context') => {
    // For demo purposes, use a fixed user ID
    const userId = DEMO_USER.id;
    
    // Ensure bucket exists before uploading
    const bucketReady = await createBucketIfNeeded();
    if (!bucketReady) {
      toast.error('Failed to create or access storage bucket. Please check Supabase Storage settings.');
      return;
    }
    
    for (const file of uploadedFiles) {
      try {
        // Show loading toast
        const loadingToast = toast.loading(`Uploading ${file.name}...`);
        
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        
        // Define storage path (inside your bucket)
        const filePath = `${userId}/${category}/${Date.now()}_${file.name}`;
        
        // Upload the file to Supabase Storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from('documents') // Your bucket name
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });
        
        if (storageError) {
          console.error('Storage error:', storageError);
          
          // Check if it's a bucket not found error
          if (storageError.message.includes('bucket') || storageError.message.includes('not found')) {
            toast.error(`Storage bucket 'documents' not found. Please create it in Supabase Dashboard → Storage`);
          } else {
            toast.error(`Failed to upload ${file.name} to storage: ${storageError.message}`);
          }
          
          toast.dismiss(loadingToast);
          continue;
        }
        
        console.log('File uploaded to storage:', storageData);
        console.log('Storage path:', filePath);
        console.log('Bucket:', 'documents');
        
        // Get the public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
        
        console.log('Public URL:', publicUrlData.publicUrl);
        
        // Determine file type based on category
        let fileType: ExplorerFile['type'] = 'document';
        if (category === 'Sources') {
          fileType = 'source';
        } else if (category === 'Context') {
          fileType = 'context';
        } else if (category === 'Documents') {
          fileType = 'document';
        }
        
        // Insert metadata into Supabase database
        const { data: dbData, error: dbError } = await supabase
          .from('sources')
          .insert({
            user_id: userId,
            file_name: file.name,
            file_path: filePath,
            file_type: extension,
            uploaded_time: new Date().toISOString(),
            created_at: new Date().toISOString()
          })
          .select();
        
        if (dbError) {
          console.error('Database error:', dbError);
          console.error('Error details:', {
            message: dbError.message,
            details: dbError.details,
            hint: dbError.hint,
            code: dbError.code
          });
          toast.error(`Failed to save ${file.name} metadata to database: ${dbError.message}`);
          toast.dismiss(loadingToast);
          continue;
        }
        
        // Create ExplorerFile for UI
        const explorerFile: ExplorerFile = {
          id: dbData[0].id.toString(),
          name: file.name,
          type: fileType,
          category: category,
          content: `[STORAGE + DATABASE] ${file.name} (${Math.round(file.size / 1024)}KB)`,
          lastModified: new Date(),
          path: filePath,
          extension: extension
        };
        
        console.log('File uploaded to storage and database:', explorerFile);
        console.log('Database response:', dbData);
        console.log('Storage response:', storageData);
        
        // Call onAddFile to add to the explorer
        onAddFile({
          category: category,
          action: 'upload',
          fileType: extension as any
        });
        
        toast.dismiss(loadingToast);
        toast.success(`✅ ${file.name} uploaded successfully to documents bucket!`, {
          description: `Storage: ${filePath}`,
          duration: 5000,
        });
        
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
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