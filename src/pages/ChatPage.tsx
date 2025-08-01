import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, ExternalLink, Loader, AlertCircle, MessageCircle, X, RotateCcw, BookOpen, Clock, Copy, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
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

const ChatPage = () => {
  const { messages, addMessage, updateMessage, clearMessages, getConversationHistory } = useChatContext();
  
  // Prevent page scrolling and ensure proper layout
  useEffect(() => {
    // Prevent any scrolling on the page
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    // Force the page to start at the top
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    
    return () => {
      // Restore scrolling when leaving the page
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Parse message content for clickable links
  const parseMessageContent = useCallback((content: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }

      parts.push({
        type: 'link',
        title: match[1],
        slug: match[2],
        content: match[0]
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
  }, []);

  // Simple scrolling
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

  // Enhanced typing animation
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
        if (isUserAtBottom) {
          scrollToBottom(true);
        }
      } else {
        clearInterval(typeInterval);
        updateMessage(messageId, { isTyping: false });
        scrollToBottom(true);
      }
    }, 80);
  }, [updateMessage, scrollToBottom, isUserAtBottom]);

  // Copy message
  const copyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  }, []);



  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      scrollToBottom(true);
    }
  }, [messages.length, isLoading, scrollToBottom]);

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
      
      console.log('🚀 Full-screen chat sending request:', requestBody);

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
      console.log('📥 Full-screen chat received response:', data);

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
      
      const errorMessage: Message = {
        id: messages.length + 2,
        type: 'bot',
        content: `Error: ${error.message}. Please try again.`,
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

  const startNewChat = () => {
    clearMessages();
  };

  // Regenerate response
  const regenerateResponse = useCallback(async () => {
    const lastUserMessage = messages.filter(msg => msg.type === 'user').pop();
    if (!lastUserMessage) return;

    // Remove the last bot message - we'll need to implement this in context
    // For now, just regenerate without removing
    await handleSendMessage(lastUserMessage.content);
  }, [messages, handleSendMessage]);

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link 
            to="/"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors text-sm font-medium"
            title="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to DentAI</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Dental AI Assistant</h1>
            <p className="text-xs text-gray-500 hidden sm:block -mt-0.5">Powered by Google's #1 AI model • Only answers from our articles</p>
          </div>
        </div>
        <button
          onClick={startNewChat}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium"
          title="Start new chat"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden lg:inline">New Chat</span>
        </button>
      </div>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 lg:p-6 min-h-0 h-0"
          >
            <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] lg:max-w-[75%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
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
                  <span className="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse rounded-sm"></span>
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
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 p-4 lg:p-5 flex-shrink-0">
            <div className="flex gap-3 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about dental AI tools, authors, or categories..."
            className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 