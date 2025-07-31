import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, ExternalLink, Loader, AlertCircle, MessageCircle, X, Minimize, Sparkles, BookOpen, Clock, Copy, RefreshCw, Lightbulb, Search, Filter } from 'lucide-react';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your dental AI assistant. Ask me about dental technology, AI tools, or find articles by specific authors.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Phase 5: Smart Features - Quick Actions
  const quickActions: QuickAction[] = [
    {
      id: 'ai-tools',
      label: 'AI Tools',
      query: 'What are the best AI tools for dentists?',
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      id: 'imaging',
      label: 'Dental Imaging',
      query: 'Tell me about AI in dental imaging',
      icon: <Search className="w-4 h-4" />
    },
    {
      id: 'authors',
      label: 'Authors',
      query: 'Show me articles by Dr. Anya Sharma',
      icon: <User className="w-4 h-4" />
    },
    {
      id: 'categories',
      label: 'Categories',
      query: 'What categories of articles do you have?',
      icon: <Filter className="w-4 h-4" />
    }
  ];

  // Phase 5: Smart Features - Smart Suggestions
  const getSuggestions = useCallback(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.type !== 'bot') return [];

    const suggestions = [];
    
    // Suggest follow-up questions based on content
    if (lastMessage.content.toLowerCase().includes('ai tools')) {
      suggestions.push('What about the cost of AI tools?');
      suggestions.push('Which AI tools are best for diagnostics?');
    }
    
    if (lastMessage.content.toLowerCase().includes('imaging')) {
      suggestions.push('How accurate is AI imaging?');
      suggestions.push('What are the latest imaging technologies?');
    }
    
    if (lastMessage.references && lastMessage.references.length > 0) {
      suggestions.push('Show me more articles like this');
      suggestions.push('What other topics does this author cover?');
    }

    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push('Tell me about the latest dental AI trends');
      suggestions.push('What are the benefits of AI in dentistry?');
      suggestions.push('Show me articles about dental technology');
    }

    return suggestions.slice(0, 3);
  }, [messages]);

  // Smart scrolling - only auto-scroll if user is at bottom
  const scrollToBottom = useCallback((force = false) => {
    if (force || isUserAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isUserAtBottom]);

  // Check if user is at bottom of chat
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setIsUserAtBottom(isAtBottom);
    }
  }, []);

  // Typing animation effect - Phase 1 implementation
  const typeMessage = useCallback((messageId: number, fullContent: string) => {
    const words = fullContent.split(' ');
    let currentIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (currentIndex <= words.length) {
        const partialContent = words.slice(0, currentIndex).join(' ');
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: partialContent, isTyping: currentIndex < words.length }
            : msg
        ));
        currentIndex++;
        scrollToBottom();
      } else {
        clearInterval(typeInterval);
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isTyping: false }
            : msg
        ));
        // Show suggestions after typing is complete
        setTimeout(() => setShowSuggestions(true), 500);
      }
    }, 50); // Speed of typing - 50ms per word
  }, [scrollToBottom]);

  // Phase 5: Smart Features - Copy message
  const copyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  }, []);

  // Phase 5: Smart Features - Regenerate response
  const regenerateResponse = useCallback(async () => {
    const lastUserMessage = messages.findLast(msg => msg.type === 'user');
    if (!lastUserMessage) return;

    // Remove the last bot message
    setMessages(prev => prev.filter(msg => msg.id !== messages[messages.length - 1].id));
    
    // Send the last user message again
    await handleSendMessage(lastUserMessage.content);
  }, [messages]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, scrollToBottom]);

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

  // Phase 5: Smart Features - Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || isMinimized) return;

      // Cmd/Ctrl + Enter to send
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSendMessage();
      }

      // Cmd/Ctrl + K for quick actions
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickActions(prev => !prev);
      }

      // Escape to clear input
      if (e.key === 'Escape') {
        setInputValue('');
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (customQuery?: string) => {
    const query = customQuery || inputValue.trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowQuickActions(false);
    setShowSuggestions(false);

    // Phase 3: Chat Memory - Prepare conversation history
    const conversationHistory = messages
      .filter(msg => msg.type === 'user' || msg.type === 'bot')
      .slice(-10) // Last 10 messages for context
      .map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://nuhjsrmkkqtecfkjrcox.supabase.co/functions/v1/chat-search-final', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51aGpzcm1ra3F0ZWNma2pyY294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDU5MzksImV4cCI6MjA2NTQ4MTkzOX0.UZ4WC-Rgg3AUNmh91xTCMkmjr_v9UHR5TFO5TFZRq04`
        },
        body: JSON.stringify({ 
          query,
          language: 'en',
          conversationHistory // Phase 3: Send conversation history
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const botMessage: Message = {
          id: messages.length + 2,
          type: 'bot',
          content: '', // Start empty for typing animation
          references: data.references,
          timestamp: new Date(),
          isTyping: true
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Phase 1: Start typing animation
        setTimeout(() => {
          typeMessage(botMessage.id, data.answer);
        }, 100);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: messages.length + 2,
        type: 'bot',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
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

  return (
    <>
      {/* Floating Button - Phase 4: Enhanced Design */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:rotate-3"
            aria-label="Open chat"
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6 group-hover:animate-pulse" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            </div>
            {hasNewMessage && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </button>
        </div>
      )}

      {/* Chat Widget - Phase 4: Enhanced UI */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-3xl shadow-2xl border border-gray-200 transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
        }`}>
          {/* Header - Phase 4: Enhanced Design */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-4 rounded-t-3xl flex items-center justify-between relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  Dental AI Assistant
                  <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
                </h3>
                {!isMinimized && (
                  <p className="text-blue-100 text-xs flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Ask me anything about dental tech
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 relative z-10">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-blue-100 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-200 hover:scale-105"
                aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
              >
                <Minimize className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-blue-100 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-200 hover:scale-105"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Content - Phase 4: Enhanced Design */}
          {!isMinimized && (
            <>
              {/* Messages - Phase 4: Enhanced Message Bubbles */}
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white scroll-smooth"
              >
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                          : message.error 
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                            : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white'
                      }`}>
                        {message.type === 'user' ? <User className="w-4 h-4" /> : 
                         message.error ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      
                      <div className={`rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                          : message.error 
                            ? 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-800'
                            : 'bg-white/80 border border-gray-200/50 shadow-xl'
                      }`}>
                        <div className="text-sm leading-relaxed">
                          {message.content}
                          {/* Phase 1: Typing Animation Cursor */}
                          {message.isTyping && (
                            <span className="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse rounded-sm"></span>
                          )}
                        </div>
                        
                        {/* References - Phase 4: Enhanced Source Display */}
                        {message.references && message.references.length > 0 && !message.isTyping && (
                          <div className="mt-3 pt-3 border-t border-gray-100/50">
                            <div className="space-y-2">
                              {message.references.slice(0, 2).map((ref, index) => (
                                <a 
                                  key={index}
                                  href={ref.url} 
                                  className="block p-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border border-blue-200/50 transition-all duration-200 group hover:shadow-md hover:scale-[1.02]"
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

                        {/* Phase 5: Smart Features - Message Actions */}
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
                      <div className="w-9 h-9 rounded-full bg-gradient-to-r from-gray-700 to-gray-800 text-white flex items-center justify-center shadow-lg">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-white/80 border border-gray-200/50 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          <Loader className="w-4 h-4 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-600">Searching...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Phase 5: Smart Features - Smart Suggestions */}
                {showSuggestions && !isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white flex items-center justify-center shadow-lg">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div className="bg-white/80 border border-gray-200/50 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-sm">
                        <p className="text-sm text-gray-600 mb-2">💡 You might also want to ask:</p>
                        <div className="space-y-1">
                          {getSuggestions().map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSendMessage(suggestion)}
                              className="block text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors text-left w-full"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input - Phase 4: Enhanced Design */}
              <div className="p-4 border-t border-gray-200/50 bg-white/80 backdrop-blur-sm rounded-b-3xl">
                {/* Phase 5: Smart Features - Quick Actions */}
                {showQuickActions && (
                  <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
                    <p className="text-xs text-blue-700 mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Quick Actions:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleSendMessage(action.query)}
                          className="flex items-center gap-2 p-2 bg-white/80 hover:bg-white rounded-lg border border-blue-200/50 transition-all duration-200 hover:scale-105 text-xs"
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about dental AI tools, authors, or categories..."
                    className="flex-1 px-4 py-3 text-sm border border-gray-300/50 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => setShowQuickActions(prev => !prev)}
                    className="px-3 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 hover:scale-105 shadow-lg"
                    title="Quick Actions (Ctrl+K)"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-2 text-xs text-gray-500 text-center flex items-center justify-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  Powered by Google Gemini
                  <span>•</span>
                  <BookOpen className="w-3 h-3" />
                  Only from our articles
                  <span>•</span>
                  <Bot className="w-3 h-3" />
                  Remembers conversations
                  <span>•</span>
                  <span className="bg-gray-200 px-1 rounded text-xs">Ctrl+K</span>
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