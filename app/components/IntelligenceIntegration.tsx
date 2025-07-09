// /app/components/IntelligenceIntegration.tsx - Smart Intelligence Components

import React, { useState, useEffect } from 'react';
import { type PortfolioIntelligenceReport } from '@/app/lib/portfolioIntelligence';

// Intelligence Status Bar Component
interface IntelligenceStatusBarProps {
  intelligence: PortfolioIntelligenceReport | null;
  loading: boolean;
}

export const IntelligenceStatusBar: React.FC<IntelligenceStatusBarProps> = ({ 
  intelligence, 
  loading 
}) => {
  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-3 mb-6">
        <div className="flex items-center gap-4">
          <div className="animate-pulse flex space-x-4">
            <div className="h-4 bg-slate-600 rounded w-32"></div>
            <div className="h-4 bg-slate-600 rounded w-24"></div>
            <div className="h-4 bg-slate-600 rounded w-28"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!intelligence) return null;

  const { fiProgress, urgentAction, deadline, netWorth } = intelligence.statusIntelligence;

  return (
    <div className="bg-gradient-to-r from-slate-800/70 to-slate-700/50 backdrop-blur-sm rounded-lg p-3 mb-6 border border-slate-600/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          {/* FI Progress */}
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">📊</span>
            <span className="text-slate-300">{fiProgress}</span>
          </div>
          
          {/* Urgent Action */}
          <div className="flex items-center gap-2">
            <span className="text-amber-400">⚡</span>
            <span className="text-slate-200">{urgentAction}</span>
          </div>
          
          {/* SRS Deadline (if applicable) */}
          {deadline && (
            <div className="flex items-center gap-2">
              <span className="text-red-400">⏰</span>
              <span className="text-slate-300">SRS deadline: {deadline}</span>
            </div>
          )}
        </div>
        
        {/* Net Worth Display */}
        <div className="text-right">
          <div className="text-lg font-medium text-white">
            ${(netWorth / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-slate-400">Portfolio Value</div>
        </div>
      </div>
    </div>
  );
};

// Smart Allocation Callout Component
interface AllocationCalloutProps {
  categoryName: string;
  intelligence: PortfolioIntelligenceReport | null;
}

export const AllocationCallout: React.FC<AllocationCalloutProps> = ({ 
  categoryName, 
  intelligence 
}) => {
  if (!intelligence) return null;

  const categoryIntel = intelligence.allocationIntelligence.find(
    cat => cat.name === categoryName
  );

  if (!categoryIntel) return null;

  const getCalloutStyle = (status: string) => {
    switch (status) {
      case 'perfect':
        return 'bg-emerald-900/30 text-emerald-300 border-emerald-600/30';
      case 'underweight':
        return 'bg-blue-900/30 text-blue-300 border-blue-600/30';
      case 'excess':
        return 'bg-amber-900/30 text-amber-300 border-amber-600/30';
      default:
        return 'bg-slate-700/30 text-slate-300 border-slate-600/30';
    }
  };

  return (
    <div className={`
      text-xs px-2 py-1 rounded-full border font-medium mt-2
      ${getCalloutStyle(categoryIntel.status)}
    `}>
      {categoryIntel.callout}
    </div>
  );
};

// Dynamic Action Cards Component
interface ActionIntelligencePanelProps {
  intelligence: PortfolioIntelligenceReport | null;
  loading: boolean;
  onActionClick?: (actionId: string) => void;
}

export const ActionIntelligencePanel: React.FC<ActionIntelligencePanelProps> = ({
  intelligence,
  loading,
  onActionClick
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white mb-4">Portfolio Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-800 rounded-lg p-4 h-32">
                <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!intelligence) return null;

  const { actionIntelligence, narrativeIntelligence } = intelligence;

  return (
    <div className="space-y-6">
      {/* Narrative Intelligence */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <h2 className="text-xl font-semibold text-white mb-2">Portfolio Intelligence</h2>
        <p className="text-slate-200 mb-2">{narrativeIntelligence.primaryMessage}</p>
        {narrativeIntelligence.supportingMessages.length > 0 && (
          <div className="space-y-1">
            {narrativeIntelligence.supportingMessages.map((message, index) => (
              <p key={index} className="text-sm text-slate-400">• {message}</p>
            ))}
          </div>
        )}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actionIntelligence.map((action) => (
          <ActionIntelligenceCard
            key={action.id}
            action={action}
            onActionClick={onActionClick}
          />
        ))}
      </div>
    </div>
  );
};

// Individual Action Card Component
interface ActionIntelligenceCardProps {
  action: any;
  onActionClick?: (actionId: string) => void;
}

const ActionIntelligenceCard: React.FC<ActionIntelligenceCardProps> = ({
  action,
  onActionClick
}) => {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'urgent':
        return {
          icon: '🚨',
          gradient: 'bg-gradient-to-br from-red-900/20 to-red-800/10',
          border: 'border-red-500/30',
          badge: 'bg-red-600 text-white'
        };
      case 'opportunity':
        return {
          icon: '💡',
          gradient: 'bg-gradient-to-br from-blue-900/20 to-blue-800/10',
          border: 'border-blue-500/30',
          badge: 'bg-blue-600 text-white'
        };
      case 'optimization':
        return {
          icon: '⚡',
          gradient: 'bg-gradient-to-br from-amber-900/20 to-amber-800/10',
          border: 'border-amber-500/30',
          badge: 'bg-amber-600 text-white'
        };
      default:
        return {
          icon: '📊',
          gradient: 'bg-gradient-to-br from-slate-800/20 to-slate-700/10',
          border: 'border-slate-500/30',
          badge: 'bg-slate-600 text-white'
        };
    }
  };

  const config = getTypeConfig(action.type);

  return (
    <div className={`
      rounded-2xl p-4 backdrop-blur-xl border transition-all duration-300
      hover:scale-[1.02] hover:shadow-lg cursor-pointer
      ${config.gradient} ${config.border}
    `}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-lg">{config.icon}</span>
        <span className={`
          text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide
          ${config.badge}
        `}>
          {action.type}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-2 mb-4">
        <h3 className="font-medium text-white text-sm">{action.title}</h3>
        <p className="text-xs text-slate-300">{action.description}</p>
        
        {action.dollarImpact > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">Impact:</span>
            <span className="text-sm font-bold text-emerald-400">
              ${action.dollarImpact.toLocaleString()}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400">Timeline:</span>
          <span className="text-xs text-orange-300">{action.timeline}</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onActionClick?.(action.id)}
        className="w-full bg-white text-gray-900 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
      >
        {action.actionText}
      </button>
    </div>
  );
};

// Intelligence Hook for Easy Integration
export const usePortfolioIntelligence = (holdings: any[]) => {
  const [intelligence, setIntelligence] = useState<PortfolioIntelligenceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshIntelligence = async () => {
    if (holdings.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/intelligence', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setIntelligence(data.intelligence);
      } else {
        setError(data.error);
        // Use fallback intelligence if available
        if (data.fallback) {
          setIntelligence(data.fallback);
        }
      }
    } catch (err) {
      console.error('Failed to fetch intelligence:', err);
      setError('Failed to load portfolio intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshIntelligence();
  }, [holdings.length]); // Refresh when holdings change

  return {
    intelligence,
    loading,
    error,
    refreshIntelligence
  };
};