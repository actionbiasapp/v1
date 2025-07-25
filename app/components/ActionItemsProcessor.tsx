'use client';

import { 
  UnifiedActionItem as ActionItem,
  normalizeActionItem,
  Holding,
  IntelligenceReport
} from '@/app/lib/types/shared';

interface ActionItemsProcessorProps {
  dynamicInsights: ActionItem[];
  intelligence?: IntelligenceReport;
  holdings: Holding[];
}

export function useActionItemsProcessor({ 
  dynamicInsights, 
  intelligence, 
  holdings 
}: ActionItemsProcessorProps) {
  // Process action items using shared normalization
  const actionItems: ActionItem[] = dynamicInsights.length > 0 
    ? dynamicInsights
    : intelligence?.actionIntelligence?.map(normalizeActionItem) || [
        // Final fallback static actions with proper normalization
        normalizeActionItem({
          id: 'srs',
          type: 'urgent',
          problem: 'Missing $5,355 tax savings',
          solution: 'Buy $35,700 VUAA in SRS account',
          benefit: 'Save $5,355 in taxes (15% bracket)',
          timeline: 'Deadline: Dec 31, 2025',
          actionText: 'Open SRS Account',
          isClickable: true
        }),
        normalizeActionItem({
          id: 'core-gap',
          type: 'opportunity',
          problem: 'Core underweight by 4k',
          solution: 'Transfer from cash → Buy more VUAA or Indian ETFs',
          benefit: 'Reach target allocation, earn 7%/year',
          timeline: 'Execute this week',
          actionText: 'Transfer & Buy',
          isClickable: true
        }),
        normalizeActionItem({
          id: 'growth-rebalance',
          type: 'optimization',
          problem: 'Growth slightly overweight',
          solution: 'Consider trimming from top performers when rebalancing',
          benefit: 'Maintain optimal risk balance',
          timeline: 'Next quarterly review',
          actionText: 'Plan Rebalance',
          isClickable: false
        })
      ];

  // Filter and prioritize action items
  const prioritizedActionItems = actionItems
    .filter(item => item && (item.problem || item.description))
    .slice(0, 6); // Limit to top 6 items

  return {
    actionItems: prioritizedActionItems,
    hasLiveInsights: dynamicInsights.length > 0,
    hasIntelligenceData: !!intelligence?.actionIntelligence,
    totalActionItems: actionItems.length
  };
}

// Export types for use in other components
export type { ActionItemsProcessorProps };
export default useActionItemsProcessor;