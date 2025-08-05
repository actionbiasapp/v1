'use client';

import React, { useState } from 'react';
import { UnifiedActionItem } from '@/app/lib/types/shared';

interface ContextualInsightsProps {
  actionItems: UnifiedActionItem[];
  currentSection: string;
  onAction: (action: UnifiedActionItem) => void;
}

export default function ContextualInsights({ 
  actionItems, 
  currentSection, 
  onAction 
}: ContextualInsightsProps) {
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

  // Filter insights relevant to current section
  const relevantInsights = actionItems.filter(item => {
    switch (currentSection) {
      case 'portfolio':
        return item.category === 'allocation' || item.category === 'performance';
      case 'tax':
        return item.category === 'tax';
      case 'planning':
        return item.category === 'opportunity' || item.category === 'risk';
      default:
        return true;
    }
  });

  if (relevantInsights.length === 0) {
    return null;
  }

  const currentInsight = relevantInsights[currentInsightIndex];
  const totalInsights = relevantInsights.length;

  const handleNextInsight = () => {
    setCurrentInsightIndex((prev) => (prev + 1) % totalInsights);
  };

  const handleAction = () => {
    if (currentInsight.isClickable) {
      onAction(currentInsight);
    }
  };

  return (
    <div className="mt-4">
      <div 
        className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 transition-all duration-200 hover:bg-slate-800/70 cursor-pointer"
        onClick={handleNextInsight}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
              {currentInsight.category?.toUpperCase()}
            </span>
            {currentInsight.dollarImpact && (
              <span className="text-xs text-green-400 font-medium">
                +${currentInsight.dollarImpact.toLocaleString()}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400">
            {currentInsightIndex + 1} of {totalInsights}
          </div>
        </div>
        
        <h3 className="text-sm text-white font-medium mb-2">
          {currentInsight.title}
        </h3>
        
        <p className="text-xs text-slate-400 mb-3">
          {currentInsight.description || currentInsight.solution}
        </p>
        
        {currentInsight.isClickable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction();
            }}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors"
          >
            {currentInsight.actionText}
          </button>
        )}
        
        <div className="mt-3 text-xs text-slate-500">
          Tap to see next insight
        </div>
      </div>
    </div>
  );
} 