import React, { useState, useEffect } from 'react';
import { Send, User, Bot, Quote, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import ContextPicker from './ContextPicker';
import { ExplorerFile } from './Explorer';

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

interface AssistantChatProps {
  files: ExplorerFile[];
  messages: ChatMessage[];
  onSendMessage: (content: string, contextFiles: ExplorerFile[]) => void;
  onCitationClick: (citation: ChatMessage['citations'][0]) => void;
  onSaveQuote: (quote: string, sourceFile: ExplorerFile, citation?: ChatMessage['citations'][0]) => void;
  className?: string;
}

const AssistantChat: React.FC<AssistantChatProps> = ({
  files,
  messages,
  onSendMessage,
  onCitationClick,
  onSaveQuote,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedContextFiles, setSelectedContextFiles] = useState<ExplorerFile[]>([]);
  const [isPinnedContext, setIsPinnedContext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    const scrollElement = document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() && selectedContextFiles.length === 0) return;
    
    setIsLoading(true);
    try {
      await onSendMessage(inputValue, selectedContextFiles);
      setInputValue('');
      
      // Clear context files unless pinned
      if (!isPinnedContext) {
        setSelectedContextFiles([]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Mock citations for demonstration
  const mockCitations = [
    {
      id: '1',
      text: 'According to the research methodology outlined in the source document...',
      sourceFile: files.find(f => f.type === 'source') || files[0],
      position: { page: 12, offset: 156 }
    }
  ];

  const CitationChip = ({ citation }: { citation: ChatMessage['citations'][0] }) => (
    <Badge
      variant="outline"
      className="border-app-gold text-app-gold bg-app-gold/10 hover:bg-app-gold/20 cursor-pointer transition-colors ml-1"
      onClick={() => onCitationClick(citation)}
    >
      <ExternalLink className="w-3 h-3 mr-1" />
      {citation.sourceFile.name}
      {citation.position?.page && ` (p.${citation.position.page})`}
    </Badge>
  );

  const MessageBubble = ({ message }: { message: ChatMessage }) => (
    <div className={`flex gap-3 mb-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
      <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          message.role === 'user' 
            ? 'bg-app-gold text-white' 
            : 'bg-app-navy text-white'
        }`}>
          {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        
        <div className={`rounded-lg p-3 ${
          message.role === 'user'
            ? 'bg-app-gold/10 border border-app-gold/30'
            : 'bg-app-white border border-app-sand'
        }`}>
          <div className="text-sm text-app-navy whitespace-pre-wrap">
            {message.content}
            {message.role === 'assistant' && mockCitations.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {mockCitations.map(citation => (
                  <CitationChip key={citation.id} citation={citation} />
                ))}
              </div>
            )}
          </div>
          
          {message.contextFiles && message.contextFiles.length > 0 && (
            <div className="mt-2 pt-2 border-t border-app-sand/50">
              <div className="text-xs text-app-navy/60 mb-1">Context files:</div>
              <div className="flex flex-wrap gap-1">
                {message.contextFiles.map(file => (
                  <Badge key={file.id} variant="secondary" className="text-xs">
                    {file.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {message.role === 'assistant' && (
            <div className="mt-2 pt-2 border-t border-app-sand/50 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSaveQuote(message.content, mockCitations[0]?.sourceFile)}
                className="text-xs text-app-navy/60 hover:text-app-navy hover:bg-app-sand/30"
              >
                <Quote className="w-3 h-3 mr-1" />
                Save Quote
              </Button>
            </div>
          )}
          
          <div className="text-xs text-app-navy/40 mt-2">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-app-white h-full flex flex-col border-l border-app-sand ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-app-sand bg-app-sand/30">
        <h3 className="font-medium text-app-navy">Research Assistant</h3>
        <p className="text-xs text-app-navy/60 mt-1">
          Use @ to attach context files for better responses
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="text-app-navy/50">
              <Bot className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Attach files via @ to ground your question</p>
              <p className="text-xs mt-1">I can help analyze your sources and draft content</p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {isLoading && (
              <div className="flex gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-app-navy text-white flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-app-white border border-app-sand rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-app-navy/30 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-app-navy/30 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-app-navy/30 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-app-sand">
        <div className="mb-2">
          <ContextPicker
            files={files}
            selectedFiles={selectedContextFiles}
            onFilesChange={setSelectedContextFiles}
            isPinned={isPinnedContext}
            onPinnedChange={setIsPinnedContext}
          />
        </div>
        
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask me anything about your research..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none border-app-sand focus-visible:ring-app-gold"
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={(!inputValue.trim() && selectedContextFiles.length === 0) || isLoading}
            className="bg-app-gold hover:bg-app-gold/90 text-white self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="text-xs text-app-navy/50 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line • Cmd+/ to focus input
        </div>
      </div>
    </div>
  );
};

export default AssistantChat;