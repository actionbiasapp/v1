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
          id: 'core-underweight',
          type: 'opportunity',
          problem: 'Core underweight by 40k (29% vs 40% target)',
          solution: 'Add more VUAA or Indian ETFs to reach 40% target',
          benefit: 'Reach target allocation, earn 7%/year',
          timeline: 'Execute this week',
          actionText: 'Add to Core',
          isClickable: true
        }),
        normalizeActionItem({
          id: 'hedge-overweight',
          type: 'optimization',
          problem: 'Hedge overweight by 49k (22% vs 10% target)',
          solution: 'Consider reducing crypto/gold positions',
          benefit: 'Improve portfolio balance and reduce concentration',
          timeline: 'Next rebalancing',
          actionText: 'Rebalance Hedge',
          isClickable: true
        }),
        normalizeActionItem({
          id: 'liquidity-overweight',
          type: 'opportunity',
          problem: 'Excess cash: 67k above target (27% vs 10% target)',
          solution: 'Deploy excess cash to underweight categories',
          benefit: 'Earn additional returns instead of minimal interest',
          timeline: 'Execute this week',
          actionText: 'Deploy Cash',
          isClickable: true
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