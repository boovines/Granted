import React, { useState, useEffect, forwardRef } from 'react';
import { Search, X, FileText, File, Settings, Pin, PinOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { ExplorerFile } from './Explorer';

interface ContextPickerProps {
  files: ExplorerFile[];
  selectedFiles: ExplorerFile[];
  onFilesChange: (files: ExplorerFile[]) => void;
  isPinned: boolean;
  onPinnedChange: (pinned: boolean) => void;
  trigger?: React.ReactNode;
  className?: string;
}

const ContextPicker: React.FC<ContextPickerProps> = ({
  files,
  selectedFiles,
  onFilesChange,
  isPinned,
  onPinnedChange,
  trigger,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Focus the search input when the popover opens
      setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder="Search files..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filesByCategory = {
    Documents: filteredFiles.filter(f => f.category === 'Documents'),
    Sources: filteredFiles.filter(f => f.category === 'Sources'),
    Context: filteredFiles.filter(f => f.category === 'Context')
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
        return <FileText className="w-4 h-4" />;
    }
  };

  const isFileSelected = (file: ExplorerFile) => {
    return selectedFiles.some(f => f.id === file.id);
  };

  const toggleFile = (file: ExplorerFile) => {
    const isSelected = isFileSelected(file);
    if (isSelected) {
      onFilesChange(selectedFiles.filter(f => f.id !== file.id));
    } else {
      onFilesChange([...selectedFiles, file]);
    }
  };

  const removeFile = (fileId: string) => {
    onFilesChange(selectedFiles.filter(f => f.id !== fileId));
  };

  const CategorySection = ({ 
    category, 
    files: categoryFiles 
  }: { 
    category: 'Documents' | 'Sources' | 'Context', 
    files: ExplorerFile[] 
  }) => {
    if (categoryFiles.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-app-navy/80">{category}</h4>
          <span className="text-xs text-app-navy/50">({categoryFiles.length})</span>
        </div>
        <div className="space-y-1">
          {categoryFiles.map(file => (
            <div
              key={file.id}
              className="flex items-center gap-2 p-2 hover:bg-app-sand/30 rounded cursor-pointer"
              onClick={() => toggleFile(file)}
            >
              <Checkbox
                checked={isFileSelected(file)}
                onCheckedChange={() => toggleFile(file)}
                className="border-app-gold data-[state=checked]:bg-app-gold"
              />
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-app-navy truncate block">{file.name}</span>
                <span className="text-xs text-app-navy/50">{file.path}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Create a properly forwarded trigger component
  const TriggerComponent = forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>((props, ref) => (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      className="border-app-gold text-app-gold hover:bg-app-gold/10 focus-visible:ring-app-gold"
      {...props}
    >
      @ Context
    </Button>
  ));

  return (
    <div className={className}>
      {/* Selected Files Display */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedFiles.map(file => (
            <Badge
              key={file.id}
              variant="outline"
              className="border-app-gold text-app-navy bg-app-gold/10 hover:bg-app-gold/20"
            >
              {getFileIcon(file.type)}
              <span className="ml-1">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="w-3 h-3 p-0 ml-1 hover:bg-app-gold/30"
                onClick={() => removeFile(file.id)}
              >
                <X className="w-2 h-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {trigger ? React.cloneElement(trigger as React.ReactElement, {}) : <TriggerComponent />}
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0 bg-app-white border-app-sand"
          align="start"
        >
          <div className="p-3 border-b border-app-sand">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-app-navy/40" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 border-app-sand focus-visible:ring-app-gold"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPinnedChange(!isPinned)}
                className={`w-8 h-8 p-0 ${
                  isPinned 
                    ? 'bg-app-gold/20 text-app-gold' 
                    : 'hover:bg-app-sand/30 text-app-navy/60'
                }`}
                title={isPinned ? 'Unpin context for next message' : 'Pin context for next message'}
              >
                {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
              </Button>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="text-xs text-app-navy/60">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto p-3">
            {filteredFiles.length === 0 ? (
              <div className="text-center text-app-navy/50 py-4">
                <p className="text-sm">No files found</p>
                {searchTerm && (
                  <p className="text-xs mt-1">Try a different search term</p>
                )}
              </div>
            ) : (
              <>
                <CategorySection category="Documents" files={filesByCategory.Documents} />
                <CategorySection category="Sources" files={filesByCategory.Sources} />
                <CategorySection category="Context" files={filesByCategory.Context} />
              </>
            )}
          </div>

          <div className="p-3 border-t border-app-sand flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilesChange([])}
              className="text-app-navy/60 hover:text-app-navy"
              disabled={selectedFiles.length === 0}
            >
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              className="bg-app-gold text-white hover:bg-app-gold/90"
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ContextPicker;