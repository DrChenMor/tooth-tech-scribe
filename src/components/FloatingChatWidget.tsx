import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, ExternalLink, Loader, AlertCircle, MessageCircle, X, Minimize, BookOpen, Clock, Copy, RefreshCw, RotateCcw } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';

interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
  references?: Array<{
    title: string;
    url: string;
    excerpt: string;
    category: string;
    author: string;
  }>;
  timestamp: Date;
  error?: boolean;
  isTyping?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  query: string;
  icon: React.ReactNode;
}

const FloatingChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { messages, addMessage, updateMessage, clearMessages, getConversationHistory } = useChatContext();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simple scrolling - only auto-scroll for new messages, not during typing
  const scrollToBottom = useCallback((force = false) => {
    if (force) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  // Check if user is at bottom of chat
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
      setIsUserAtBottom(isAtBottom);
    }
  }, []);

  // Enhanced typing animation with realistic speed
  const typeMessage = useCallback((messageId: number, fullContent: string) => {
    const words = fullContent.split(' ');
    let currentIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (currentIndex <= words.length) {
        const partialContent = words.slice(0, currentIndex).join(' ');
        updateMessage(messageId, { 
          content: partialContent, 
          isTyping: currentIndex < words.length 
        });
        currentIndex++;
        // Smart scrolling during typing
        if (isUserAtBottom) {
          scrollToBottom(true);
        }
      } else {
        clearInterval(typeInterval);
        updateMessage(messageId, { isTyping: false });
        scrollToBottom(true);
      }
    }, 80); // Slightly slower for better readability
  }, [updateMessage, scrollToBottom, isUserAtBottom]);

  // Copy message
  const copyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  }, []);

  // Parse message content for clickable links
  const parseMessageContent = useCallback((content: string) => {
    // Parse [Article Title](article-slug) format into clickable links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }

      // Add the link
      parts.push({
        type: 'link',
        title: match[1],
        slug: match[2],
        content: match[0]
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
  }, []);



  useEffect(() => {
    // Only scroll to bottom for new messages, not during user scrolling
    if (messages.length > 0 && !isLoading) {
      scrollToBottom(true);
    }
  }, [messages.length, isLoading, scrollToBottom]);

  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      setHasNewMessage(true);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
    }
  }, [isOpen]);



  const handleSendMessage = async (customQuery?: string) => {
    const query = customQuery || inputValue.trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: query,
      timestamp: new Date()
    };

    addMessage(userMessage);
    setInputValue('');
    setIsLoading(true);

    // Chat Memory - Prepare conversation history
    const conversationHistory = getConversationHistory();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const requestBody = { 
        query,
        language: 'en',
        conversationHistory
      };
      
      console.log('🚀 Sending request:', requestBody);

      const response = await fetch('https://nuhjsrmkkqtecfkjrcox.supabase.co/functions/v1/chat-search-final', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51aGpzcm1ra3F0ZWNma2pyY294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDU5MzksImV4cCI6MjA2NTQ4MTkzOX0.UZ4WC-Rgg3AUNmh91xTCMkmjr_v9UHR5TFO5TFZRq04`
        },
        body: JSON.stringify({ 
          query,
          language: 'en',
          conversationHistory
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Received response:', data);

      if (data.success) {
        const botMessage: Message = {
          id: messages.length + 2,
          type: 'bot',
          content: '',
          references: data.references,
          timestamp: new Date(),
          isTyping: true
        };
        addMessage(botMessage);
        
        setTimeout(() => {
          typeMessage(botMessage.id, data.answer);
        }, 100);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      // Show the actual error to help debug
      const errorMessage: Message = {
        id: messages.length + 2,
        type: 'bot',
        content: `Error: ${error.message}. Please check console for details.`,
        timestamp: new Date(),
        error: true
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Regenerate response
  const regenerateResponse = useCallback(async () => {
    const lastUserMessage = messages.findLast(msg => msg.type === 'user');
    if (!lastUserMessage) return;

    // Remove the last bot message
    const lastBotMessage = messages.findLast(msg => msg.type === 'bot');
    if (lastBotMessage) {
      // We need to implement a removeMessage function in the context
      // For now, we'll just regenerate without removing
    }
    await handleSendMessage(lastUserMessage.content);
  }, [messages, handleSendMessage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isMinimized) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSendMessage();
      }

      if (e.key === 'Escape') {
        setInputValue('');
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized, handleSendMessage]);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="group bg-blue-600 hover:bg-blue-700 text-white p-3 md:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            aria-label="Open chat"
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
              {hasNewMessage && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className={`fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 transition-all duration-300 ${
          isMinimized 
            ? 'bottom-6 right-6 w-80 h-16' 
            : 'bottom-4 right-4 left-4 md:left-auto md:w-96 h-[600px] max-h-[80vh]'
        }`}>
          {/* Header */}
          <div className="bg-blue-600 text-white p-3 md:p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-3 h-3 md:w-4 md:h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-xs md:text-sm">Dental AI Assistant</h3>
                {!isMinimized && (
                  <p className="text-blue-100 text-xs">Ask me anything about dental tech</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  clearMessages();
                }}
                className="text-blue-100 hover:text-white p-1.5 md:p-2 rounded hover:bg-white/10 transition-colors"
                aria-label="Start new chat"
                title="Start new chat"
              >
                <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-blue-100 hover:text-white p-1.5 md:p-2 rounded hover:bg-white/10 transition-colors"
                aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
              >
                <Minimize className="w-3 h-3 md:w-4 md:h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-blue-100 hover:text-white p-1.5 md:p-2 rounded hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50 pb-4"
              >
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : message.error 
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-700 text-white'
                      }`}>
                        {message.type === 'user' ? <User className="w-4 h-4" /> : 
                         message.error ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      
                      <div className={`rounded-lg px-4 py-3 ${
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : message.error 
                            ? 'bg-red-50 border border-red-200 text-red-800'
                            : 'bg-white border border-gray-200'
                      }`}>
                        <div 
                          className="text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: parseMessageContent(message.content).map((part, index) => {
                              if (part.type === 'link') {
                                return `<a href="https://dentalai.live/article/${part.slug}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-medium">${part.title}</a>`;
                              }
                              return part.content;
                            }).join('')
                          }}
                        />
                        {message.isTyping && (
                          <span className="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse rounded-sm mt-1"></span>
                        )}
                        
                        {/* References */}
                        {message.references && message.references.length > 0 && !message.isTyping && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="space-y-2">
                              {message.references.slice(0, 2).map((ref, index) => (
                                <a 
                                  key={index}
                                  href={ref.url} 
                                  className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="text-blue-900 font-medium text-sm group-hover:text-blue-700 transition-colors flex items-center gap-2">
                                        {ref.title}
                                        <BookOpen className="w-3 h-3 opacity-60" />
                                      </h4>
                                      <p className="text-xs text-blue-700 mt-1 flex items-center gap-2">
                                        <span>by {ref.author}</span>
                                        <span>•</span>
                                        <span className="bg-blue-200 px-2 py-0.5 rounded-full text-xs">{ref.category}</span>
                                      </p>
                                    </div>
                                    <ExternalLink className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Message Actions */}
                        {!message.isTyping && !message.error && (
                          <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyMessage(message.content)}
                              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 p-1 rounded hover:bg-gray-100 transition-colors"
                              title="Copy message"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </button>
                            {message.type === 'bot' && (
                              <button
                                onClick={regenerateResponse}
                                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 p-1 rounded hover:bg-gray-100 transition-colors"
                                title="Regenerate response"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Regenerate
                              </button>
                            )}
                          </div>
                        )}
                        
                        <div className={`text-xs mt-2 flex items-center gap-1 ${message.type === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                          <Clock className="w-3 h-3" />
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-600">Searching...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex-shrink-0">
                <div className="flex gap-2 md:gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about dental AI tools, authors, or categories..."
                    className="flex-1 px-3 md:px-4 py-2 md:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    className="px-3 md:px-4 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2 text-sm font-medium transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingChatWidget; 