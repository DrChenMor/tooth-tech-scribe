import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ExternalLink, Loader, AlertCircle, MessageCircle, X, Minimize } from 'lucide-react';

interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
  references?: Array<{
    title: string;
    url: string;
    excerpt: string;
    category: string;
  }>;
  timestamp: Date;
  error?: boolean;
}

const FloatingChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your dental AI assistant. I can help you find information from our articles about dental technology, AI tools, and industry insights. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const query = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Call your Supabase function with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('https://nuhjsrmkkqtecfkjrcox.supabase.co/functions/v1/chat-search-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51aGpzcm1ra3F0ZWNma2pyY294Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDU5MzksImV4cCI6MjA2NTQ4MTkzOX0.UZ4WC-Rgg3AUNmh91xTCMkmjr_v9UHR5TFO5TFZRq04`
        },
        body: JSON.stringify({ 
          query,
          language: 'en'
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
          content: data.answer,
          references: data.references,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorContent = "I'm sorry, I encountered an error while searching our articles. Please try again.";
      
      if (error.name === 'AbortError') {
        errorContent = "The request timed out. Our AI service might be temporarily unavailable. Please try again in a moment.";
      } else if (error.message?.includes('HTTP 500')) {
        errorContent = "Our AI service is currently experiencing issues. We're working to fix this. Please try again later.";
      } else if (error.message?.includes('Failed to fetch')) {
        errorContent = "Unable to connect to our AI service. Please check your internet connection and try again.";
      }

      const errorMessage: Message = {
        id: messages.length + 2,
        type: 'bot',
        content: errorContent,
        error: true,
        timestamp: new Date()
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
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
            aria-label="Open chat assistant"
          >
            <MessageCircle className="w-6 h-6" />
            {hasNewMessage && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </button>
        </div>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl border transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-6 h-6" />
              <div>
                <h3 className="font-semibold text-sm">Dental AI Assistant</h3>
                {!isMinimized && (
                  <p className="text-blue-100 text-xs">Powered by Google's #1 AI model</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-blue-100 hover:text-white p-1 rounded"
                aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
              >
                <Minimize className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-blue-100 hover:text-white p-1 rounded"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-[400px] overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : message.error 
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-600 text-white'
                      }`}>
                        {message.type === 'user' ? <User className="w-3 h-3" /> : 
                         message.error ? <AlertCircle className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      </div>
                      
                      <div className={`rounded-lg p-3 ${
                        message.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : message.error 
                            ? 'bg-red-50 border border-red-200 text-red-800'
                            : 'bg-white border border-gray-200'
                      }`}>
                        <div className="text-sm leading-relaxed">
                          {message.content}
                        </div>
                        
                        {/* References */}
                        {message.references && message.references.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 mb-1">📚 Sources:</p>
                            {message.references.map((ref, index) => (
                              <div key={index} className="mb-1 p-2 bg-blue-50 rounded border border-blue-200">
                                <a 
                                  href={ref.url} 
                                  className="text-blue-700 hover:text-blue-900 font-medium text-xs flex items-center gap-1"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {ref.title}
                                  <ExternalLink className="w-2 h-2" />
                                </a>
                                <p className="text-xs text-gray-600 mt-1">{ref.excerpt}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-600 text-white flex items-center justify-center">
                        <Bot className="w-3 h-3" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Loader className="w-3 h-3 animate-spin text-blue-600" />
                          <span className="text-sm text-gray-600">Searching...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about dental AI tools..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="mt-1 text-xs text-gray-500 text-center">
                  🤖 Powered by Google's #1 AI • 📚 Only from our articles
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