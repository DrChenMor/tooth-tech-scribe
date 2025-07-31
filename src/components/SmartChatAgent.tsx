import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ExternalLink, Loader, AlertCircle } from 'lucide-react';

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

const SmartChatAgent = () => {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // Chat Memory - Prepare conversation history
      const conversationHistory = messages
        .filter(msg => msg.type === 'user' || msg.type === 'bot')
        .slice(-10)
        .map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));

      const requestBody = { 
        query,
        language: 'en',
        conversationHistory
      };
      
      console.log('🚀 SmartChatAgent sending request:', requestBody);

      // Call your Supabase function
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
        })
      });

      const data = await response.json();
      console.log('📥 SmartChatAgent received response:', data);

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

    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 2,
        type: 'bot',
        content: "I'm sorry, I encountered an error while searching our articles. Please try again.",
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
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-bold">Dental AI Assistant</h2>
            <p className="text-blue-100 text-sm">Powered by Google's #1 AI model • Only answers from our articles</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : message.error 
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-600 text-white'
              }`}>
                {message.type === 'user' ? <User className="w-4 h-4" /> : 
                 message.error ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`rounded-lg p-3 ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : message.error 
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-white border border-gray-200'
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                
                {/* References */}
                {message.references && message.references.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2">📚 Sources:</p>
                    {message.references.map((ref, index) => (
                      <div key={index} className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <a 
                          href={ref.url} 
                          className="text-blue-700 hover:text-blue-900 font-medium text-sm flex items-center gap-1"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {ref.title}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <p className="text-xs text-gray-600 mt-1">{ref.excerpt}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Searching our articles...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about dental AI tools, diagnostics, practice management..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
        
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span>🤖 Powered by Google's #1 AI model</span>
          <span>•</span>
          <span>📚 Only answers from our articles</span>
        </div>
      </div>
    </div>
  );
};

export default SmartChatAgent;