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
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    // Only scroll if we're near the bottom to avoid disrupting user's view
    const chatContainer = messagesEndRef.current?.parentElement;
    if (chatContainer) {
      const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

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
    
    // Store the input ref to restore focus later
    const currentInputRef = inputRef.current;

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context })
      });

      const result = await response.json();

      // Handle message processing responses (no success field)
      if (result.action) {
        // Handle confirmation actions with a single message
        if (result.action === 'confirm' && result.data) {
          const confirmationMessage: AgentMessage = {
            type: 'agent',
            content: `${result.message}\n\nWould you like me to proceed?`,
            data: result.data,
            suggestions: result.suggestions,
            pendingAction: result.requires_confirmation ? {
              intent: result.data.intent,
              entities: result.data.entities,
              message: result.message
            } : undefined,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, confirmationMessage]);
        } else if (result.action === 'clarify') {
          // Handle clarification requests
          const clarificationMessage: AgentMessage = {
            type: 'agent',
            content: result.message,
            data: result.data,
            suggestions: result.suggestions,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, clarificationMessage]);
        } else {
          const agentMessage: AgentMessage = {
            type: 'agent',
            content: result.message,
            data: result.data,
            suggestions: result.suggestions,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, agentMessage]);
        }
      } else if (result.success !== undefined) {
        // Handle action execution responses (has success field)
        if (result.success) {
          const agentMessage: AgentMessage = {
            type: 'agent',
            content: result.message,
            data: result.data,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, agentMessage]);
        } else {
          const errorMessage: AgentMessage = {
            type: 'agent',
            content: result.message || 'Sorry, I encountered an error.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
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
      
      // More aggressive focus restoration with multiple strategies
      const restoreFocus = () => {
        // Try the stored ref first
        if (currentInputRef && currentInputRef.focus) {
          currentInputRef.focus();
          return true;
        }
        
        // Try the current ref
        if (inputRef.current && inputRef.current.focus) {
          inputRef.current.focus();
          return true;
        }
        
        // Try finding the input by selector as last resort
        const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (inputElement && inputElement.focus) {
          inputElement.focus();
          return true;
        }
        
        return false;
      };
      
      // Multiple attempts with increasing delays
      setTimeout(() => restoreFocus(), 50);
      setTimeout(() => restoreFocus(), 150);
      setTimeout(() => restoreFocus(), 300);
      setTimeout(() => restoreFocus(), 600);
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
      
      // Restore focus after action execution
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      const errorMessage: AgentMessage = {
        type: 'agent',
        content: 'Failed to execute action. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Restore focus after error too
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    
    try {
      // Send the suggestion as a userSelection with the original message
      const originalMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
      
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: originalMessage,
          userSelection: suggestion,
          context 
        })
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

        // Remove the pending action from the previous message
        setMessages(prev => prev.map(msg => 
          msg.pendingAction ? { ...msg, pendingAction: undefined } : msg
        ));

        setMessages(prev => [...prev, agentMessage]);

        if (result.success && onPortfolioUpdate) {
          onPortfolioUpdate();
        }
      } else {
        const errorMessage: AgentMessage = {
          type: 'agent',
          content: result.message || 'Failed to process selection. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: AgentMessage = {
        type: 'agent',
        content: 'Failed to process selection. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      
      // Restore focus
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleConfirmAction = async (pendingAction: any) => {
    if (isExecutingAction) return; // Prevent duplicate executions
    
    setIsExecutingAction(true);
    
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

      // Remove the pending action from the previous message
      setMessages(prev => prev.map(msg => 
        msg.pendingAction ? { ...msg, pendingAction: undefined } : msg
      ));

      setMessages(prev => [...prev, actionMessage]);

      if (result.success && onPortfolioUpdate) {
        onPortfolioUpdate();
      }
      
      // Restore focus after confirmation action
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      const errorMessage: AgentMessage = {
        type: 'agent',
        content: 'Failed to execute action. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Restore focus after error too
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } finally {
      setIsExecutingAction(false);
      
      // Final focus attempt
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  };
  
  const handleCancelAction = () => {
    // Remove the pending action from the previous message
    setMessages(prev => prev.map(msg => 
      msg.pendingAction ? { ...msg, pendingAction: undefined } : msg
    ));

    const cancelMessage: AgentMessage = {
      type: 'agent',
      content: 'Action cancelled. How else can I help you?',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, cancelMessage]);
    
    // Restore focus after cancel
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const suggestions = [
    'Show my portfolio summary',
    'What\'s my biggest holding?',
    'Show allocation gaps',
    'What\'s my total value?',
    'Show Core holdings only',
    'Add 100 shares of [SYMBOL] at $150',
    '2023 income was $120,000',
    'How is my portfolio performing?'
  ];

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
          title="Ask Portfolio Agent"
        >
          <span className="text-lg">🤖</span>
          <span className="font-medium text-sm hidden sm:inline">Agent</span>
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
                    disabled={isExecutingAction}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      isExecutingAction 
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isExecutingAction ? 'Executing...' : 'Yes, proceed'}
                  </button>
                  <button
                    onClick={handleCancelAction}
                    disabled={isExecutingAction}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      isExecutingAction 
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                        : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
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