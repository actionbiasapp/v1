// app/hooks/usePortfolioData.ts - Extracted API Integration Hook

import { useState, useEffect, useCallback } from 'react';
import { generatePortfolioInsights } from '@/app/lib/aiInsights';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  unitPrice: number;
  costBasis: number;
  currency: string;
  costBasisCurrency?: string;
  valueSGD: number;
  valueUSD: number;
  valueINR: number;
  entryCurrency: string;
  category: {
    name: string;
  };
  location: string;
}

interface PortfolioData {
  holdings: Holding[];
  insights: any[];
  loading: boolean;
  error: string | null;
  // Add missing properties for backward compatibility
  dynamicInsights: any[];
  intelligence: any;
  isInsightsLive: boolean;
  isIntelligenceLive: boolean;
  insightsLoading: boolean;
  insightsError: string | null;
  fetchHoldings: () => Promise<void>;
  fetchDynamicInsights: () => Promise<void>;
  handleInsightAction: (insight: any) => Promise<void>;
}

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
      
      // Use sample data if API returns empty array
      if (!data || data.length === 0) {
        const sampleHoldings = [
          {
            id: '1',
            symbol: 'VUAA',
            name: 'Vanguard S&P 500 ETF',
            quantity: 350,
            unitPrice: 63.00,
            costBasis: 22050.00,
            currency: 'USD',
            costBasisCurrency: 'USD',
            valueSGD: 29767.50,
            valueUSD: 22050.00,
            valueINR: 1830150.00,
            entryCurrency: 'USD',
            category: { name: 'Core' },
            location: 'IBKR'
          },
          {
            id: '2',
            symbol: 'HDFC-FOCUS',
            name: 'HDFC Focus Fund',
            quantity: 1000,
            unitPrice: 540.00,
            costBasis: 540000.00,
            currency: 'INR',
            costBasisCurrency: 'INR',
            valueSGD: 8571.43,
            valueUSD: 6349.21,
            valueINR: 540000.00,
            entryCurrency: 'INR',
            category: { name: 'Growth' },
            location: 'ICICI Direct'
          },
          {
            id: '3',
            symbol: 'CASH',
            name: 'Singapore Dollar',
            quantity: 50000,
            unitPrice: 1.00,
            costBasis: 50000.00,
            currency: 'SGD',
            costBasisCurrency: 'SGD',
            valueSGD: 50000.00,
            valueUSD: 37037.04,
            valueINR: 3150000.00,
            entryCurrency: 'SGD',
            category: { name: 'Liquidity' },
            location: 'DBS Bank'
          }
        ];
        setHoldings(sampleHoldings);
      } else {
        setHoldings(data);
      }
    } catch (err) {
      console.error('Error fetching holdings:', err);
      setError('Failed to load portfolio data');
      
      // Use sample data as fallback
      const sampleHoldings = [
        {
          id: '1',
          symbol: 'VUAA',
          name: 'Vanguard S&P 500 ETF',
          quantity: 350,
          unitPrice: 63.00,
          costBasis: 22050.00,
          currency: 'USD',
          costBasisCurrency: 'USD',
          valueSGD: 29767.50,
          valueUSD: 22050.00,
          valueINR: 1830150.00,
          entryCurrency: 'USD',
          category: { name: 'Core' },
          location: 'IBKR'
        },
        {
          id: '2',
          symbol: 'HDFC-FOCUS',
          name: 'HDFC Focus Fund',
          quantity: 1000,
          unitPrice: 540.00,
          costBasis: 540000.00,
          currency: 'INR',
          costBasisCurrency: 'INR',
          valueSGD: 8571.43,
          valueUSD: 6349.21,
          valueINR: 540000.00,
          entryCurrency: 'INR',
          category: { name: 'Growth' },
          location: 'ICICI Direct'
        },
        {
          id: '3',
          symbol: 'CASH',
          name: 'Singapore Dollar',
          quantity: 50000,
          unitPrice: 1.00,
          costBasis: 50000.00,
          currency: 'SGD',
          costBasisCurrency: 'SGD',
          valueSGD: 50000.00,
          valueUSD: 37037.04,
          valueINR: 3150000.00,
          entryCurrency: 'SGD',
          category: { name: 'Liquidity' },
          location: 'DBS Bank'
        }
      ];
      setHoldings(sampleHoldings);
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
    }
  }, [holdings, fetchDynamicInsights]);

  const formattedHoldings = holdings.map(holding => ({
    ...holding,
    quantity: Math.round(holding.quantity * 100) / 100,
    unitPrice: Math.round(holding.unitPrice * 100) / 100,
    costBasis: Math.round(holding.costBasis * 100) / 100
  }));

  return {
    holdings: formattedHoldings,
    insights,
    loading,
    error,
    // Backward compatibility properties
    dynamicInsights: insights,
    intelligence: null,
    isInsightsLive: insights.length > 0,
    isIntelligenceLive: false,
    insightsLoading: false,
    insightsError: null,
    fetchHoldings,
    fetchDynamicInsights,
    handleInsightAction
  };
};