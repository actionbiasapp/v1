'use client';

import { useMemo } from 'react';
import { type CurrencyCode } from '@/app/lib/currency';
import { CategoryData } from '@/app/lib/types/shared';
import PortfolioCard from './PortfolioCard';

interface FixedPortfolioGridProps {
  categories: CategoryData[];
  totalValue: number;
  expandedCards: Set<string>;
  displayCurrency: CurrencyCode;
  onToggleExpand: (categoryName: string) => void;
  onHoldingsUpdate?: () => void;
}

export default function FixedPortfolioGrid({
  categories,
  totalValue,
  expandedCards,
  displayCurrency,
  onToggleExpand,
  onHoldingsUpdate
}: FixedPortfolioGridProps) {

  // Determine expanded card for grid styling
  const expandedCardName = useMemo(() => {
    return expandedCards.size > 0 ? Array.from(expandedCards)[0] : null;
  }, [expandedCards]);

  // Build grid className for CSS styling
  const gridClassName = useMemo(() => {
    return expandedCardName 
      ? `fixed-portfolio-grid grid-${expandedCardName.toLowerCase()}-expanded`
      : 'fixed-portfolio-grid';
  }, [expandedCardName]);

  return (
    <div className={gridClassName}>
      {categories.map((category) => {
        const isExpanded = expandedCards.has(category.name);
        const isCompressed = expandedCards.size > 0 && !isExpanded;

        return (
          <PortfolioCard
            key={category.name}
            category={category}
            totalValue={totalValue}
            isExpanded={isExpanded}
            isCompressed={isCompressed}
            displayCurrency={displayCurrency}
            onToggleExpand={onToggleExpand}
            onHoldingsUpdate={onHoldingsUpdate}
          />
        );
      })}
    </div>
  );
}