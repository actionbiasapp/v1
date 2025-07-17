'use client';

import ActionBiasCard from './ActionBiasCard';
import { UnifiedActionItem as ActionItem } from '@/app/lib/types/shared';

interface InsightsSectionProps {
  actionItems: ActionItem[];
  isLive: boolean;
  isLoading: boolean;
  error?: string | null;
  onRefresh: () => void;
  onAction: (action: ActionItem) => void;
}

// Live indicator component
const LiveIndicator = () => (
  <div className="flex items-center gap-1">
    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    <span className="text-xs text-green-400">Live</span>
  </div>
);

export default function InsightsSection({
  actionItems,
  isLive,
  isLoading,
  error,
  onRefresh,
  onAction
}: InsightsSectionProps) {
  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-200">
          AI Insights & Recommendations
          {isLoading && (
            <span className="ml-2 text-sm text-gray-400">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></span>
              Analyzing...
            </span>
          )}
        </h2>
        
        <div className="flex items-center gap-4">
          {isLive && <LiveIndicator />}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm transition-colors"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
          AI Insights temporarily unavailable: {error}
          <br />
          <span className="text-gray-400">Using fallback analysis and recommendations</span>
        </div>
      )}
      
      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actionItems.slice(0, 6).map(action => (
          <ActionBiasCard 
            key={action.id} 
            action={action} 
            isLive={isLive}
            onAction={action.isClickable ? () => onAction(action) : undefined}
          />
        ))}
      </div>
      
      {/* Empty State */}
      {actionItems.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-400">
          <div className="text-lg mb-2">No insights available</div>
          <p className="text-sm">Try refreshing or check back later</p>
        </div>
      )}
      
      {/* Insights Summary */}
      {actionItems.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            Showing {Math.min(actionItems.length, 6)} of {actionItems.length} recommendations
            {isLive && (
              <span className="ml-2 text-green-400">• Live Analysis Active</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}