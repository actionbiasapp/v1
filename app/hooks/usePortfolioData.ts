'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { type Holding, type PortfolioData } from '@/app/lib/types/shared';
import { calculatePortfolioValue, type ExchangeRates } from '@/app/lib/portfolioCalculations';
import { generatePortfolioInsights } from '@/app/lib/portfolioIntelligence';

export const usePortfolioData = (): PortfolioData => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHoldings = useCallback(async () => {
    try {
      const response = await fetch('/api/holdings');
      if (!response.ok) {
        throw new Error('Failed to fetch holdings');
      }
      const data = await response.json();
      
      // Use empty array if API returns empty - no more sample data
      setHoldings(data || []);
    } catch (err) {
      console.error('Error fetching holdings:', err);
      setError('Failed to load portfolio data');
      
      // Use empty array instead of sample data
      setHoldings([]);
    }
  }, []);

  const fetchDynamicInsights = useCallback(async () => {
    try {
      const response = await fetch('/api/insights');
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      const data = await response.json();
      setInsights(data);
    } catch (err) {
      console.error('Error fetching insights:', err);
      
      // Generate local insights if API fails
      if (holdings.length > 0) {
        const localInsights = generatePortfolioInsights(holdings);
        setInsights(localInsights);
      } else {
        setInsights([]);
      }
    }
  }, [holdings.length]);

  const handleInsightAction = useCallback(async (insight: any) => {
    // Placeholder for insight action handling
    console.log('Insight action:', insight);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchHoldings();
      setLoading(false);
    };
    
    loadData();
  }, [fetchHoldings]);

  useEffect(() => {
    if (holdings.length > 0) {
      fetchDynamicInsights();
    } else {
      setInsights([]);
    }
  }, [holdings, fetchDynamicInsights]);

  const formattedHoldings = holdings.map(holding => ({
    ...holding,
    quantity: holding.quantity ? Math.round(holding.quantity * 100) / 100 : 0,
    unitPrice: holding.unitPrice ? Math.round(holding.unitPrice * 100) / 100 : 0,
    costBasis: holding.costBasis ? Math.round(holding.costBasis * 100) / 100 : 0
  }));

  return {
    holdings: formattedHoldings,
    insights,
    loading,
    error,
    handleInsightAction,
    refetch: fetchHoldings
  };
};