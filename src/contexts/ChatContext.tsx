import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

interface ChatContextType {
  messages: Message[];
  addMessage: (message: Message) => void;
  updateMessage: (id: number, updates: Partial<Message>) => void;
  clearMessages: () => void;
  getConversationHistory: () => Array<{role: 'user' | 'assistant', content: string}>;
  hasRecentMessages: () => boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm your dental AI assistant. I can help you find information from our articles about dental technology, AI tools, and industry insights. What would you like to know?",
      timestamp: new Date()
    }
  ]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessage = useCallback((id: number, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([{
      id: 1,
      type: 'bot',
      content: "Hi! I'm your dental AI assistant. I can help you find information from our articles about dental technology, AI tools, and industry insights. What would you like to know?",
      timestamp: new Date()
    }]);
  }, []);

  const getConversationHistory = useCallback(() => {
    return messages
      .filter(msg => msg.type === 'user' || msg.type === 'bot')
      .slice(-10)
      .map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));
  }, [messages]);

  const hasRecentMessages = useCallback(() => {
    return messages.length > 1;
  }, [messages]);

  const value: ChatContextType = {
    messages,
    addMessage,
    updateMessage,
    clearMessages,
    getConversationHistory,
    hasRecentMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 