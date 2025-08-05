'use client';

import { useState } from 'react';
import { CategoryData } from '@/app/lib/types/shared';
import { formatCurrency, type CurrencyCode, type ExchangeRates } from '@/app/lib/currency';
import { formatCurrencyWithVisibility } from '@/app/lib/numberVisibility';
import { useNumberVisibility } from '@/app/lib/context/NumberVisibilityContext';

interface AppleRadialAllocationProps {
  categories: CategoryData[];
  className?: string;
  displayCurrency?: CurrencyCode;
  exchangeRates?: ExchangeRates | null;
}

// Color mapping from your existing system
const COLOR_MAP = {
  'bg-blue-500': { main: '#3b82f6', light: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)' },
  'bg-green-500': { main: '#10b981', light: '#34d399', bg: 'rgba(16, 185, 129, 0.1)' },
  'bg-yellow-500': { main: '#f59e0b', light: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)' },
  'bg-purple-500': { main: '#8b5cf6', light: '#a78bfa', bg: 'rgba(139, 92, 246, 0.1)' }
};

// Status colors for rings
const STATUS_COLORS = {
  perfect: '#10b981',
  underweight: '#f59e0b', 
  excess: '#ef4444'
};

export default function AppleRadialAllocation({ 
  categories, 
  className = '',
  displayCurrency = 'SGD',
  exchangeRates = null
}: AppleRadialAllocationProps) {
  const { numbersVisible } = useNumberVisibility();
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter active categories
  const activeCategories = categories.filter(cat => cat.currentPercent > 0 || cat.target > 0);
  
  if (activeCategories.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <div className="text-center text-gray-400">
          <p className="text-lg font-medium mb-2">Portfolio Allocation</p>
          <p className="text-sm">Add holdings to see allocation visualization</p>
        </div>
      </div>
    );
  }

  // Handle category click
  const handleCategoryClick = (category: CategoryData) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  // Calculate progress percentage - for overallocated, show actual percentage over 100%
  const getProgressPercentage = (category: CategoryData) => {
    if (category.target === 0) return 0;
    return (category.currentPercent / category.target) * 100;
  };

  // Calculate target value in dollars
  const getTargetValue = (category: CategoryData) => {
    const totalPortfolioValue = categories.reduce((sum, cat) => sum + cat.currentValue, 0);
    return (category.target / 100) * totalPortfolioValue;
  };

  // Calculate circle properties
  const getCircleProperties = (percentage: number) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return { radius, circumference, strokeDashoffset };
  };

  return (
    <>
      <div className={`bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-700 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Portfolio Allocation</h3>
          <div className="text-xs text-gray-400">Tap for details</div>
        </div>

        {/* Desktop: 4-column grid, Mobile: 2-column grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
          {activeCategories.map((category, index) => {
            const colors = COLOR_MAP[category.color as keyof typeof COLOR_MAP] || COLOR_MAP['bg-blue-500'];
            const progressPercentage = getProgressPercentage(category);
            const { radius, circumference, strokeDashoffset } = getCircleProperties(progressPercentage);
            const isOver = category.status === 'excess';

            return (
              <div
                key={index}
                onClick={() => handleCategoryClick(category)}
                className="flex flex-col items-center p-4 rounded-2xl bg-gray-700/40 backdrop-blur-sm border border-gray-600/50 cursor-pointer transition-all duration-300 hover:bg-gray-700/60 hover:scale-105 hover:shadow-lg active:scale-95"
                style={{ minHeight: '180px' }}
              >
                {/* Ring Container */}
                <div className="relative mb-3">
                  <svg width="90" height="90" className="transform -rotate-90">
                    {/* Background ring */}
                    <circle
                      cx="45"
                      cy="45"
                      r={radius}
                      fill="none"
                      stroke="rgba(75, 85, 99, 0.3)"
                      strokeWidth="5"
                    />
                    
                    {/* Progress ring */}
                    <circle
                      cx="45"
                      cy="45"
                      r={radius}
                      fill="none"
                      stroke={STATUS_COLORS[category.status]}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={progressPercentage > 100 ? 0 : strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                      }}
                    />
                    
                    {/* Excess indicator ring for overweight categories */}
                    {isOver && (
                      <circle
                        cx="45"
                        cy="45"
                        r={radius + 6}
                        fill="none"
                        stroke={STATUS_COLORS.excess}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={circumference * 1.34}
                        strokeDashoffset={circumference * 1.34 * (1 - Math.abs(category.gap) / 100)}
                        className="transition-all duration-1000 ease-out opacity-70"
                      />
                    )}
                  </svg>
                  
                  {/* Center content - show percentage of target completed */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="text-base font-bold text-white">
                      {progressPercentage.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Category Info */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-xl">{category.icon}</span>
                    <span className="text-sm font-semibold text-white">{category.name}</span>
                  </div>
                  
                  <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                    category.status === 'perfect' ? 'bg-green-900/50 text-green-300' :
                    category.status === 'underweight' ? 'bg-yellow-900/50 text-yellow-300' :
                    'bg-red-900/50 text-red-300'
                  }`}>
                    {category.shortStatus}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="flex items-center justify-between text-sm border-t border-gray-700 pt-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              {activeCategories.filter(c => c.status === 'perfect').length} Perfect
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              {activeCategories.filter(c => c.status === 'underweight').length} Under
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              {activeCategories.filter(c => c.status === 'excess').length} Over
            </span>
          </div>
          <div className="text-gray-400">
            {activeCategories.length} categories
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedCategory && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-gray-800 rounded-2xl border border-gray-600 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xl"
            >
              ×
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{selectedCategory.icon}</span>
              <h2 className="text-xl font-bold text-white">{selectedCategory.name}</h2>
            </div>

            {/* Large Ring - show percentage of target completed */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <svg width="160" height="160" className="transform -rotate-90">
                  {/* Background ring */}
                  <circle
                    cx="80"
                    cy="80"
                    r="65"
                    fill="none"
                    stroke="rgba(75, 85, 99, 0.3)"
                    strokeWidth="8"
                  />
                  
                  {/* Progress ring */}
                  <circle
                    cx="80"
                    cy="80"
                    r="65"
                    fill="none"
                    stroke={STATUS_COLORS[selectedCategory.status]}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 65}
                    strokeDashoffset={getProgressPercentage(selectedCategory) > 100 ? 0 : 2 * Math.PI * 65 * (1 - getProgressPercentage(selectedCategory) / 100)}
                    className="transition-all duration-1000 ease-out"
                  />
                  
                  {/* Excess indicator */}
                  {selectedCategory.status === 'excess' && (
                    <circle
                      cx="80"
                      cy="80"
                      r="75"
                      fill="none"
                      stroke={STATUS_COLORS.excess}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 75}
                      strokeDashoffset={2 * Math.PI * 75 * (1 - Math.abs(selectedCategory.gap) / 100)}
                      className="opacity-70"
                    />
                  )}
                </svg>
                
                {/* Center content - percentage of target completed */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="text-2xl font-bold text-white">
                    {getProgressPercentage(selectedCategory).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Stats - Current Value & Target Value */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-white">
                  {formatCurrencyWithVisibility(selectedCategory.currentValue, displayCurrency, numbersVisible)}
                </div>
                <div className="text-sm text-gray-400 mb-1">
                  {selectedCategory.currentPercent.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">Current</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-white">
                  {formatCurrencyWithVisibility(getTargetValue(selectedCategory), displayCurrency, numbersVisible)}
                </div>
                <div className="text-sm text-gray-400 mb-1">
                  {selectedCategory.target}%
                </div>
                <div className="text-xs text-gray-400">Target</div>
              </div>
            </div>

            {/* Description - use centralized callout */}
            {selectedCategory.statusText && (
              <div className={`rounded-lg p-4 text-sm ${
                selectedCategory.status === 'perfect' ? 'bg-green-900/50 text-green-300' :
                selectedCategory.status === 'underweight' ? 'bg-yellow-900/50 text-yellow-300' :
                'bg-red-900/50 text-red-300'
              }`}>
                <p className="text-sm text-gray-300">{selectedCategory.statusText}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}