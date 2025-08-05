// app/lib/iconUtils.tsx - Lean, polished MVP icon system
import React from 'react';

// Simple, intuitive category icons following 80-20 principle
export const CategoryIcons = {
  Core: {
    emoji: '🛡️',
    name: 'Core Holdings',
    description: 'Foundation investments'
  },
  Growth: {
    emoji: '📈',
    name: 'Growth',
    description: 'High-growth potential'
  },
  Hedge: {
    emoji: '⚖️',
    name: 'Hedge',
    description: 'Risk management'
  },
  Liquidity: {
    emoji: '💰',
    name: 'Liquidity',
    description: 'Cash and equivalents'
  }
};

// Asset type mapping for intuitive icons
const getAssetTypeIcon = (symbol: string, name?: string): string => {
  const symbolUpper = symbol.toUpperCase();
  const nameUpper = name?.toUpperCase() || '';
  
  // Crypto assets
  if (['BTC', 'WBTC', 'ETH', 'USDC', 'USDT'].includes(symbolUpper)) {
    return '₿';
  }
  
  // Gold/Commodities
  if (['GOLD', 'GLD', 'SLV', 'XAU'].includes(symbolUpper) || 
      nameUpper.includes('GOLD') || nameUpper.includes('SILVER')) {
    return '🥇';
  }
  
  // ETFs (common patterns)
  if (['VUAA', 'VOO', 'SPY', 'QQQ', 'IWM'].includes(symbolUpper) || 
      symbolUpper.includes('ETF') || nameUpper.includes('ETF')) {
    return '📊';
  }
  
  // Tech companies (major ones)
  if (['AAPL', 'GOOG', 'MSFT', 'NVDA', 'TSLA', 'META', 'AMZN', 'CRM'].includes(symbolUpper)) {
    return '💻';
  }
  
  // Financial/Insurance
  if (['UNH', 'JPM', 'BAC', 'WFC', 'GS'].includes(symbolUpper) || 
      nameUpper.includes('BANK') || nameUpper.includes('INSURANCE')) {
    return '🏦';
  }
  
  // Healthcare/Biotech
  if (['HIMS', 'AMGN', 'JNJ', 'PFE', 'MRNA'].includes(symbolUpper) || 
      nameUpper.includes('HEALTH') || nameUpper.includes('MEDICAL')) {
    return '🏥';
  }
  
  // Energy/Utilities
  if (['XOM', 'CVX', 'COP', 'EOG'].includes(symbolUpper) || 
      nameUpper.includes('ENERGY') || nameUpper.includes('OIL')) {
    return '⚡';
  }
  
  // Real Estate
  if (['VNQ', 'IYR', 'SCHH'].includes(symbolUpper) || 
      nameUpper.includes('REIT') || nameUpper.includes('REAL ESTATE')) {
    return '🏢';
  }
  
  // Cash/Money Market
  if (['CASH', 'MONEY', 'USD', 'SGD'].includes(symbolUpper)) {
    return '💵';
  }
  
  // Default for stocks
  return '📈';
};

// Asset icons with intelligent fallback
export const AssetIcons = {
  // Crypto
  BTC: { emoji: '₿', name: 'Bitcoin' },
  WBTC: { emoji: '₿', name: 'Wrapped Bitcoin' },
  ETH: { emoji: '⟠', name: 'Ethereum' },
  USDC: { emoji: '💵', name: 'USD Coin' },
  
  // Commodities
  GOLD: { emoji: '🥇', name: 'Gold' },
  GLD: { emoji: '🥇', name: 'Gold ETF' },
  
  // Major Tech
  AAPL: { emoji: '💻', name: 'Apple' },
  GOOG: { emoji: '💻', name: 'Alphabet' },
  NVDA: { emoji: '💻', name: 'NVIDIA' },
  TSLA: { emoji: '🚗', name: 'Tesla' },
  META: { emoji: '💻', name: 'Meta' },
  AMZN: { emoji: '📦', name: 'Amazon' },
  CRM: { emoji: '💻', name: 'Salesforce' },
  
  // Financial
  UNH: { emoji: '🏦', name: 'UnitedHealth' },
  JPM: { emoji: '🏦', name: 'JPMorgan' },
  
  // Healthcare
  HIMS: { emoji: '🏥', name: 'Hims & Hers' },
  AMGN: { emoji: '🏥', name: 'Amgen' },
  
  // ETFs
  VUAA: { emoji: '📊', name: 'Vanguard S&P 500' },
  VOO: { emoji: '📊', name: 'Vanguard S&P 500' },
  SPY: { emoji: '📊', name: 'SPDR S&P 500' },
  
  // Energy
  IREN: { emoji: '⚡', name: 'Iris Energy' },
  
  // Cash
  CASH: { emoji: '💵', name: 'Cash' },
  SGD: { emoji: '💵', name: 'Singapore Dollar' },
  USD: { emoji: '💵', name: 'US Dollar' },
  
  // Default
  DEFAULT: { emoji: '📈', name: 'Stock' }
};

// Smart icon getter with intelligent categorization
export function getAssetIcon(symbol: string, name?: string): string {
  const symbolUpper = symbol.toUpperCase();
  
  // Check if we have a specific icon defined
  if (AssetIcons[symbolUpper as keyof typeof AssetIcons]) {
    return AssetIcons[symbolUpper as keyof typeof AssetIcons].emoji;
  }
  
  // Use intelligent categorization
  return getAssetTypeIcon(symbol, name);
}

// Get category icon
export function getCategoryIcon(category: string): string {
  const categoryUpper = category.toUpperCase();
  return CategoryIcons[categoryUpper as keyof typeof CategoryIcons]?.emoji || CategoryIcons.Core.emoji;
}

// Get category info
export function getCategoryInfo(category: string) {
  const categoryUpper = category.toUpperCase();
  return CategoryIcons[categoryUpper as keyof typeof CategoryIcons] || CategoryIcons.Core;
}

// Simple emoji support detection (80-20 approach)
export function useEmojiSupport(): boolean {
  if (typeof window === 'undefined') return true;
  
  // Simple test - if we can render a basic emoji, we're good
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  
  ctx.font = '16px Arial';
  const metrics = ctx.measureText('📈');
  return metrics.width > 10;
} 