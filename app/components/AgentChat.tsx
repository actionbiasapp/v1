'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AgentResponse, AgentContext, AgentAction } from '@/app/lib/agent/types';

interface AgentMessage {
  type: 'user' | 'agent';
  content: string;
  data?: any;
  suggestions?: string[];
  timestamp: Date;
  pendingAction?: {
    intent: string;
    entities: any;
    message: string;
  };
}

interface AgentChatProps {
  context: AgentContext;
  onPortfolioUpdate?: () => void;
}

export default function AgentChat({ context, onPortfolioUpdate }: AgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    const userMessage: AgentMessage = {
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context })
      });

      const result = await response.json();

      if (result.success) {
        const agentMessage: AgentMessage = {
          type: 'agent',
          content: result.message,
          data: result.data,
          suggestions: result.suggestions,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, agentMessage]);

        // Handle confirmation actions inline
        if (result.action === 'confirm' && result.data) {
          const confirmationMessage: AgentMessage = {
            type: 'agent',
            content: `${result.message}\n\nWould you like me to proceed?`,
            pendingAction: {
              intent: result.data.intent,
              entities: result.data.entities,
              message: result.message
            },
            timestamp: new Date()
          };
          setMessages(prev => [...prev, confirmationMessage]);
        }
      } else {
        const errorMessage: AgentMessage = {
          type: 'agent',
          content: result.message || 'Sorry, I encountered an error.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: AgentMessage = {
        type: 'agent',
        content: 'Sorry, I encountered a network error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeAction = async (data: any) => {
    const action: AgentAction = {
      type: data.intent,
      data: data.entities
    };

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const result = await response.json();

      const actionMessage: AgentMessage = {
        type: 'agent',
        content: result.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, actionMessage]);

      if (result.success && onPortfolioUpdate) {
        onPortfolioUpdate();
      }
    } catch (error) {
      const errorMessage: AgentMessage = {
        type: 'agent',
        content: 'Failed to execute action. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleConfirmAction = async (pendingAction: any) => {
    const action: AgentAction = {
      type: pendingAction.intent,
      data: pendingAction.entities
    };
  
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
  
      const result = await response.json();
  
      const actionMessage: AgentMessage = {
        type: 'agent',
        content: result.message,
        timestamp: new Date()
      };
  
      setMessages(prev => [...prev, actionMessage]);
  
      if (result.success && onPortfolioUpdate) {
        onPortfolioUpdate();
      }
    } catch (error) {
      const errorMessage: AgentMessage = {
        type: 'agent',
        content: 'Failed to execute action. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  const handleCancelAction = () => {
    const cancelMessage: AgentMessage = {
      type: 'agent',
      content: 'Action cancelled. How else can I help you?',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  const suggestions = [
    'Add 100 shares of Apple at $150',
    '2023 income was $120,000',
    'How is my portfolio performing?',
    'Delete Tesla holding'
  ];

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Ask Agent"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-gray-800 rounded-lg shadow-xl border border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-white font-medium">Portfolio Agent</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm">
            <p className="mb-2">Ask me to manage your portfolio!</p>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="block w-full text-left text-xs text-blue-400 hover:text-blue-300 p-1 rounded"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs p-2 rounded-lg text-sm ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {message.pendingAction && (
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => handleConfirmAction(message.pendingAction)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                  >
                    Yes, proceed
                  </button>
                  <button
                    onClick={handleCancelAction}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
                  >
                    No, cancel
                  </button>
                </div>
              )}
              
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="block w-full text-left text-xs text-blue-400 hover:text-blue-300 p-1 rounded"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-200 p-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me to add, edit, or analyze..."
            className="flex-1 bg-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
            className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 