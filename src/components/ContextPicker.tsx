import React, { useState, useEffect, forwardRef } from 'react';
import { Search, X, FileText, File, Settings, Pin, PinOff, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ExplorerFile } from './Explorer';

interface ContextPickerProps {
  files: ExplorerFile[];
  selectedFiles: ExplorerFile[];
  onFilesChange: (files: ExplorerFile[]) => void;
  isPinned: boolean;
  onPinnedChange: (pinned: boolean) => void;
  trigger?: any;
  className?: string;
}

const ContextPicker = ({
  files,
  selectedFiles,
  onFilesChange,
  isPinned,
  onPinnedChange,
  trigger,
  className = ''
}: ContextPickerProps) => {
  const [searchTerm, setSearchTerm] = useState('');


  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filesByCategory = {
    Documents: filteredFiles.filter(f => f.category === 'Documents'),
    Sources: filteredFiles.filter(f => f.category === 'Sources'),
    Context: filteredFiles.filter(f => f.category === 'Context')
  };

  const handleFileSelect = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    const isSelected = selectedFiles.some(f => f.id === fileId);
    if (isSelected) {
      onFilesChange(selectedFiles.filter(f => f.id !== fileId));
    } else {
      onFilesChange([...selectedFiles, file]);
    }
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

  const SelectOption = ({ file }: { file: ExplorerFile }) => (
    <SelectItem 
      value={file.id}
      className="flex items-center gap-2 p-2 cursor-pointer"
    >
      <div className="flex items-center gap-2 w-full">
        <Checkbox
          checked={selectedFiles.some(f => f.id === file.id)}
          className="border-app-gold data-[state=checked]:bg-app-gold"
          readOnly
        />
        {getFileIcon(file.type)}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-app-navy truncate block">{file.name}</span>
          <span className="text-xs text-app-navy/50">{file.path}</span>
        </div>
      </div>
    </SelectItem>
  );

  const CategoryGroup = ({ 
    category, 
    files: categoryFiles 
  }: { 
    category: 'Documents' | 'Sources' | 'Context', 
    files: ExplorerFile[] 
  }) => {
    if (categoryFiles.length === 0) return null;

    return (
      <div className="mb-2">
        <div className="px-2 py-1 text-xs font-medium text-app-navy/60 bg-app-sand/30 border-b border-app-sand/50">
          {category} ({categoryFiles.length})
        </div>
        {categoryFiles.map(file => (
          <React.Fragment key={file.id}>
            <SelectOption file={file} />
          </React.Fragment>
        ))}
      </div>
    );
  };

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

      {/* Context Selector */}
      <div className="flex items-center gap-2">
        <Select onValueChange={handleFileSelect}>
          <SelectTrigger className="w-[200px] border-app-gold text-app-gold hover:bg-app-gold/10 focus-visible:ring-app-gold">
            <SelectValue placeholder="@ Context" />
            <ChevronDown className="w-4 h-4 opacity-50" />
          </SelectTrigger>
          <SelectContent className="w-80 max-h-96 bg-app-white border-app-sand">
            <div className="p-2 border-b border-app-sand">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-app-navy/40" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 border-app-sand focus-visible:ring-app-gold"
                />
              </div>
              {selectedFiles.length > 0 && (
                <div className="text-xs text-app-navy/60 mt-2">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {filteredFiles.length === 0 ? (
                <div className="text-center text-app-navy/50 py-4">
                  <p className="text-sm">No files found</p>
                  {searchTerm && (
                    <p className="text-xs mt-1">Try a different search term</p>
                  )}
                </div>
              ) : (
                <>
                  <CategoryGroup category="Documents" files={filesByCategory.Documents} />
                  <CategoryGroup category="Sources" files={filesByCategory.Sources} />
                  <CategoryGroup category="Context" files={filesByCategory.Context} />
                </>
              )}
            </div>

            {selectedFiles.length > 0 && (
              <div className="p-2 border-t border-app-sand">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFilesChange([])}
                  className="w-full text-app-navy/60 hover:text-app-navy"
                >
                  Clear All
                </Button>
              </div>
            )}
          </SelectContent>
        </Select>

        {/* Pin/Unpin Button */}
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
    </div>
  );
};

export default ContextPicker;