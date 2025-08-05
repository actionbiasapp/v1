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
  completedAction?: {
    intent: string;
    entities: any;
    message: string;
    canUndo: boolean;
  };
}

interface AgentChatProps {
  context: AgentContext;
  onPortfolioUpdate?: () => void;
  insights?: any[];
}

// Unified state machine for chat
type ChatState = 'idle' | 'processing' | 'awaiting_confirmation' | 'executing_action' | 'error';

interface ChatStateMachine {
  state: ChatState;
  pendingAction?: any;
  lastAction?: any;
  error?: string;
}

export default function AgentChat({ context, onPortfolioUpdate, insights = [] }: AgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [chatState, setChatState] = useState<ChatStateMachine>({ state: 'idle' });
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Default suggestions for new chat
  const defaultSuggestions = [
    'Add a new holding',
    'Show portfolio summary', 
    'Show my biggest holding'
  ];

  const scrollToBottom = () => {
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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
    
    // Show welcome message with suggestions when chat is first opened
    if (isOpen && messages.length === 0) {
      const welcomeMessage: AgentMessage = {
        type: 'agent',
        content: 'Hello! I\'m your portfolio assistant. How can I help you today?',
        suggestions: defaultSuggestions,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Unified message processing
  const processMessage = async (message: string) => {
    if (!message.trim() || chatState.state === 'processing' || chatState.state === 'executing_action') return;

    const userMessage: AgentMessage = {
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setChatState({ state: 'processing' });

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          context,
          displayCurrency: context.displayCurrency
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      const result = await response.json();
      
      if (result.action === 'confirm' && result.requires_confirmation) {
        // Awaiting confirmation
        setChatState({ 
          state: 'awaiting_confirmation',
          pendingAction: {
            intent: result.data.intent,
            entities: result.data.entities,
            message: result.message
          }
        });

        const agentMessage: AgentMessage = {
          type: 'agent',
          content: result.message,
          suggestions: ['Yes', 'No'],
          timestamp: new Date()
        };

        setMessages(prev => [...prev, agentMessage]);
      } else if (result.action === 'execute' && result.data) {
        // Direct execution
        await executeAction(result.data);
      } else {
        // Regular response
        setChatState({ state: 'idle' });
        
        const agentMessage: AgentMessage = {
          type: 'agent',
          content: result.message,
          suggestions: result.suggestions,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      setChatState({ state: 'error', error: 'Failed to process message' });
      
      const errorMessage: AgentMessage = {
        type: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Unified action execution
  const executeAction = async (actionData: any) => {
    setChatState({ state: 'executing_action' });

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionData })
      });

      if (!response.ok) {
        throw new Error('Failed to execute action');
      }

      const result = await response.json();

      if (result.success) {
        const actionMessage: AgentMessage = {
          type: 'agent',
          content: result.message,
          completedAction: {
            intent: actionData.type,
            entities: actionData.data,
            message: result.message,
            canUndo: true
          },
          timestamp: new Date()
        };

        setMessages(prev => [...prev, actionMessage]);
        setChatState({ 
          state: 'idle',
          lastAction: {
            intent: actionData.type,
            entities: {
              ...actionData.data,
              originalData: result.originalData
            }
          }
        });

        if (onPortfolioUpdate) {
          onPortfolioUpdate();
        }
      } else {
        throw new Error(result.message || 'Action failed');
      }
    } catch (error) {
      console.error('Error executing action:', error);
      setChatState({ state: 'error', error: 'Failed to execute action' });
      
      const errorMessage: AgentMessage = {
        type: 'agent',
        content: `Failed to execute action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Handle simple confirmations
  const handleConfirmation = async (isConfirmed: boolean) => {
    if (chatState.state !== 'awaiting_confirmation' || !chatState.pendingAction) {
      return;
    }

    if (isConfirmed) {
      await executeAction({
        type: 'confirm_action',
        data: {
          originalAction: chatState.pendingAction.intent,
          originalEntities: chatState.pendingAction.entities
        }
      });
    } else {
      // Cancel action
      setChatState({ state: 'idle' });
      
      const cancelMessage: AgentMessage = {
        type: 'agent',
        content: 'Action cancelled. How else can I help you?',
        suggestions: defaultSuggestions,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, cancelMessage]);
    }
  };

  // Handle undo action
  const handleUndoAction = async (completedAction: any) => {
    if (!chatState.lastAction) return;

    setChatState({ state: 'executing_action' });

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: {
            type: 'undo_action',
            data: {
              originalAction: chatState.lastAction.intent,
              originalEntities: chatState.lastAction.entities
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to undo action');
      }

      const result = await response.json();

      if (result.success) {
        const undoMessage: AgentMessage = {
          type: 'agent',
          content: result.message,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, undoMessage]);
        setChatState({ state: 'idle' });

        if (onPortfolioUpdate) {
          onPortfolioUpdate();
        }
      } else {
        throw new Error(result.message || 'Undo failed');
      }
    } catch (error) {
      console.error('Error undoing action:', error);
      setChatState({ state: 'error', error: 'Failed to undo action' });
      
      const errorMessage: AgentMessage = {
        type: 'agent',
        content: `Failed to undo action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      processMessage(inputValue);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (suggestion === 'Yes') {
      await handleConfirmation(true);
    } else if (suggestion === 'No') {
      await handleConfirmation(false);
    } else {
      await processMessage(suggestion);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-glass-primary backdrop-blur-xl border border-glass-border hover:border-glass-border-hover text-text-primary rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
        aria-label="Toggle chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 h-96 bg-glass-primary backdrop-blur-xl rounded-xl shadow-xl border border-glass-border flex flex-col">
          {/* Chat Header */}
          <div className="bg-glass-secondary backdrop-blur-xl text-text-primary p-4 rounded-t-xl border-b border-glass-border">
            <h3 className="text-lg font-semibold">Portfolio Assistant</h3>
            <p className="text-sm text-text-secondary">Ask me about your portfolio</p>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-accent-primary text-white' 
                    : 'bg-glass-secondary text-text-primary border border-glass-border'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left px-2 py-1 text-xs bg-glass-primary bg-opacity-20 rounded hover:bg-opacity-30 transition-colors border border-glass-border"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Undo Button */}
                  {message.completedAction && (
                    <button
                      onClick={() => handleUndoAction(message.completedAction)}
                      className="mt-2 text-xs text-accent-primary hover:text-accent-primary-hover underline"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-glass-border bg-glass-secondary">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about your portfolio..."
                className="flex-1 px-3 py-2 bg-glass-primary border border-glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent text-text-primary placeholder-text-quaternary backdrop-blur-sm"
                disabled={chatState.state === 'processing' || chatState.state === 'executing_action'}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || chatState.state === 'processing' || chatState.state === 'executing_action'}
                className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {chatState.state === 'processing' || chatState.state === 'executing_action' ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 