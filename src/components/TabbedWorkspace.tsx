import React, { useState, memo } from 'react';
import { X, FileText, File, Settings, SplitSquareHorizontal, GripVertical } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { ExplorerFile } from './Explorer';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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
  onTabReorder: (fromIndex: number, toIndex: number) => void;
  onContentChange: (tabId: string, content: string) => void;
  onSaveQuote?: (quote: string, sourceFile: ExplorerFile) => void;
  className?: string;
}

// Drag and drop item type
const ITEM_TYPE = 'TAB';

interface DragItem {
  id: string;
  index: number;
}

// Individual draggable tab component
const DraggableTab: React.FC<{
  tab: WorkspaceTab;
  index: number;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onMoveTab: (fromIndex: number, toIndex: number) => void;
  getTabIcon: (type: ExplorerFile['type']) => React.ReactNode;
}> = ({ tab, index, onTabSelect, onTabClose, onMoveTab, getTabIcon }) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { id: tab.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: DragItem) => {
      if (item.index !== index) {
        onMoveTab(item.index, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine drag and drop refs
  const dragDropRef = (node: HTMLDivElement | null) => {
    drag(drop(node));
  };

  return (
    <div
      ref={dragDropRef}
      className={`flex items-center gap-2 px-3 py-2 border-r border-app-sand/50 cursor-pointer transition-all min-w-0 relative group ${
        tab.isActive 
          ? 'bg-app-navy text-app-white' 
          : 'bg-app-sand hover:bg-app-sand/70 text-app-navy'
      } ${isDragging ? 'opacity-50 z-50' : ''} ${
        isOver && canDrop ? 'border-l-2 border-app-gold' : ''
      }`}
      onClick={() => onTabSelect(tab.id)}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {/* Drag handle - only visible on hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3 h-3 text-current/50 cursor-grab active:cursor-grabbing" />
      </div>
      
      {getTabIcon(tab.file.type)}
      <span className="text-sm truncate max-w-32">
        {tab.file.name}
        {tab.isDirty && '*'}
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
      
      {/* Drop indicator */}
      {isOver && canDrop && (
        <div className="absolute left-0 top-0 w-1 h-full bg-app-gold rounded-l" />
      )}
    </div>
  );
};

const TabbedWorkspace: React.FC<TabbedWorkspaceProps> = ({
  tabs,
  onTabClose,
  onTabSelect,
  onTabReorder,
  onContentChange,
  onSaveQuote,
  className = ''
}) => {
  const [splitViews, setSplitViews] = useState<Set<string>>(new Set());

  const activeTab = tabs.find(tab => tab.isActive);

  const getTabIcon = (type: ExplorerFile['type']) => {
    switch (type) {
      case 'document':
      case 'quote':
        return <FileText className="w-3 h-3" />;
      case 'source':
        return <File className="w-3 h-3" />;
      case 'context':
        return <Settings className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const handleMoveTab = (fromIndex: number, toIndex: number) => {
    onTabReorder(fromIndex, toIndex);
  };

  const toggleSplitView = (tabId: string) => {
    const newSplitViews = new Set(splitViews);
    if (newSplitViews.has(tabId)) {
      newSplitViews.delete(tabId);
    } else {
      newSplitViews.add(tabId);
    }
    setSplitViews(newSplitViews);
  };

  const DocumentEditor = memo(({ tab }: { tab: WorkspaceTab }) => {
    const isInSplitView = splitViews.has(tab.id);
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 bg-app-sand/30 border-b border-app-sand">
          <h3 className="font-medium text-app-navy">{tab.file.name}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSplitView(tab.id)}
            className="hover:bg-app-gold/20"
          >
            <SplitSquareHorizontal className="w-4 h-4 text-app-navy/70" />
          </Button>
        </div>
        
        <div className={`flex-1 ${isInSplitView ? 'flex' : ''}`}>
          {isInSplitView && (
            <>
              <div className="w-1/2 p-4">
                <h4 className="text-sm font-medium text-app-navy/80 mb-2">Outline</h4>
                <Textarea
                  placeholder="Create your outline here..."
                  className="h-full resize-none border-app-sand focus-visible:ring-app-gold"
                  value={tab.file.content || ''}
                  onChange={(e) => onContentChange(tab.id, e.target.value)}
                />
              </div>
              <Separator orientation="vertical" className="bg-app-sand" />
              <div className="w-1/2 p-4">
                <h4 className="text-sm font-medium text-app-navy/80 mb-2">Draft</h4>
                <Textarea
                  placeholder="Write your draft here..."
                  className="h-full resize-none border-app-sand focus-visible:ring-app-gold"
                  value={tab.file.content || ''}
                  onChange={(e) => onContentChange(tab.id, e.target.value)}
                />
              </div>
            </>
          )}
          
          {!isInSplitView && (
            <div className="h-full p-4">
              <Textarea
                placeholder="Start writing your document..."
                className="h-full resize-none border-app-sand focus-visible:ring-app-gold bg-app-white"
                value={tab.file.content || ''}
                onChange={(e) => onContentChange(tab.id, e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    );
  });

  const SourceViewer = ({ tab }: { tab: WorkspaceTab }) => {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 bg-app-sand/30 border-b border-app-sand">
          <h3 className="font-medium text-app-navy">{tab.file.name}</h3>
        </div>
        <div className="flex-1 p-4 bg-app-white">
          <div className="h-full border border-app-sand rounded p-4 bg-white">
            <p className="text-app-navy/70 text-sm mb-4">PDF/Source content would be displayed here</p>
            <div className="space-y-2">
              <p className="text-app-navy">Sample source content that could be highlighted and cited...</p>
              <p className="text-app-navy">This is where the PDF viewer or text content would appear.</p>
              {onSaveQuote && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSaveQuote("Sample quote text", tab.file)}
                  className="border-app-gold text-app-gold hover:bg-app-gold/10"
                >
                  Save Quote
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ContextViewer = ({ tab }: { tab: WorkspaceTab }) => {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 bg-app-sand/30 border-b border-app-sand">
          <h3 className="font-medium text-app-navy">{tab.file.name}</h3>
        </div>
        <div className="flex-1 p-4">
          <Textarea
            placeholder="Rules, rubrics, or thesis requirements..."
            className="h-full resize-none border-app-sand focus-visible:ring-app-gold bg-app-white"
            value={tab.file.content || ''}
            onChange={(e) => onContentChange(tab.id, e.target.value)}
          />
        </div>
      </div>
    );
  };

  const renderTabContent = (tab: WorkspaceTab) => {
    switch (tab.file.type) {
      case 'document':
      case 'quote':
        return <DocumentEditor tab={tab} />;
      case 'source':
        return <SourceViewer tab={tab} />;
      case 'context':
        return <ContextViewer tab={tab} />;
      default:
        return <DocumentEditor tab={tab} />;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`bg-app-white h-full flex flex-col ${className}`}>
        {/* Tab Bar */}
        <div className="bg-app-sand border-b border-app-sand/50 flex items-center">
          {tabs.length === 0 ? (
            <div className="flex-1 p-4 text-center text-app-navy/50">
              Open a file from the Explorer to start working
            </div>
          ) : (
            <div className="flex items-center overflow-x-auto">
              {tabs.map((tab, index) => (
                <DraggableTab
                  key={tab.id}
                  tab={tab}
                  index={index}
                  onTabSelect={onTabSelect}
                  onTabClose={onTabClose}
                  onMoveTab={handleMoveTab}
                  getTabIcon={getTabIcon}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab ? (
            renderTabContent(activeTab)
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
    </DndProvider>
  );
};

export default memo(TabbedWorkspace);