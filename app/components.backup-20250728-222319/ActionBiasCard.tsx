// app/components/ActionBiasCard.tsx - Extracted from PortfolioDashboard.tsx

import React from 'react';
import { UnifiedActionItem as ActionItem } from '@/app/lib/types/shared';

interface ActionBiasCardProps {
  action: ActionItem;
  isLive: boolean;
  onAction?: () => void;
}

export default function ActionBiasCard({ 
  action, 
  isLive, 
  onAction 
}: ActionBiasCardProps) {
  const getTypeColor = () => {
    switch (action.type) {
      case 'urgent': return 'border-red-500/50 bg-red-500/10';
      case 'opportunity': return 'border-blue-500/50 bg-blue-500/10';
      case 'optimization': return 'border-yellow-500/50 bg-yellow-500/10';
      default: return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const getTypeIcon = () => {
    switch (action.type) {
      case 'urgent': return '🚨';
      case 'opportunity': return '💡';
      case 'optimization': return '⚡';
      default: return '📊';
    }
  };

  const getCategoryBadge = () => {
    if (action.category) {
      switch (action.category) {
        case 'tax': return '🇸🇬 TAX';
        case 'allocation': return '📊 ALLOCATION';
        case 'risk': return '🛡️ RISK';
        case 'performance': return '📈 PERFORMANCE';
        default: return action.category.toUpperCase();
      }
    }
    return action.type.toUpperCase();
  };

  return (
    <div className={`rounded-lg p-4 border ${getTypeColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getTypeIcon()}</span>
          <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-300 font-medium">
            {getCategoryBadge()}
          </span>
        </div>
        {isLive && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span className="text-xs text-green-400">AI</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        <div>
          <span className="text-sm text-white font-medium">
            {action.title}
          </span>
        </div>
        
        <div>
          <span className="text-sm text-gray-300">
            {action.description}
          </span>
        </div>
        
        {/* Show benefit if available (legacy support) */}
        {action.benefit && (
          <div>
            <span className="text-xs text-gray-400 block">BENEFIT:</span>
            <span className="text-sm text-green-300">{action.benefit}</span>
          </div>
        )}
        
        {/* Show dollar impact if available */}
        {action.dollarImpact && action.dollarImpact > 0 && (
          <div>
            <span className="text-xs text-gray-400 block">IMPACT:</span>
            <span className="text-lg font-bold text-emerald-400">
              ${action.dollarImpact.toLocaleString()}
            </span>
          </div>
        )}
        
        {/* Show timeline */}
        {action.timeline && (
          <div>
            <span className="text-xs text-gray-400 block">TIMELINE:</span>
            <span className="text-xs text-orange-300">{action.timeline}</span>
          </div>
        )}
      </div>

      {action.isClickable && onAction ? (
        <button 
          onClick={onAction}
          className="w-full bg-white text-gray-900 py-2 px-4 rounded font-medium hover:bg-gray-100 transition-colors"
        >
          {action.actionText}
        </button>
      ) : (
        <div className="w-full bg-gray-700 text-gray-300 py-2 px-4 rounded text-center font-medium border border-gray-600">
          {action.actionText}
        </div>
      )}
    </div>
  );
}