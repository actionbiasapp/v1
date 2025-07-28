import { YearlyData } from '@/app/lib/types/shared';

export const calculateFinancialMetrics = (data: YearlyData[]): YearlyData[] => {
  if (!data || data.length === 0) {
    return [];
  }

  const sortedData = [...data].sort((a, b) => a.year - b.year);

  return sortedData.map((yearData, index) => {
    const income = Number(yearData.income) || 0;
    const savings = Number(yearData.savings) || 0;
    const netWorth = Number(yearData.netWorth) || 0;

    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    let marketGains: number;
    let returnPercent: number;

    if (index === 0) {
      // For the first year, gains are net worth minus savings.
      marketGains = netWorth - savings;
      // Return is based on savings as the initial investment for the year.
      returnPercent = savings > 0 ? (marketGains / savings) * 100 : 0;
    } else {
      const previousNetWorth = Number(sortedData[index - 1].netWorth) || 0;
      marketGains = netWorth - previousNetWorth - savings;
      // Return is based on the previous year's net worth.
      returnPercent = previousNetWorth > 0 ? (marketGains / previousNetWorth) * 100 : 0;
    }
    
    return {
      ...yearData,
      savingsRate,
      marketGains,
      returnPercent,
    };
  });
};

/**
 * Calculate year-to-date portfolio performance
 * @param yearlyData - Array of yearly financial data
 * @param currentPortfolioValue - Current live portfolio value
 * @returns Object with YTD performance metrics
 */
export const calculateYTDPerformance = (
  yearlyData: YearlyData[],
  currentPortfolioValue: number
): {
  totalGain: number;
  percentageChange: number;
  timeframe: string;
  startingValue: number;
} => {
  const currentYear = new Date().getFullYear();
  
  // Find the previous year's net worth as starting point
  const previousYearData = yearlyData.find(data => data.year === currentYear - 1);
  const currentYearData = yearlyData.find(data => data.year === currentYear);
  
  if (!previousYearData) {
    // No previous year data available
    return {
      totalGain: 0,
      percentageChange: 0,
      timeframe: "YTD (no baseline)",
      startingValue: 0
    };
  }
  
  const startingValue = Number(previousYearData.netWorth) || 0;
  
  // Calculate YTD gains by subtracting previous year's net worth and this year's savings
  const currentYearSavings = currentYearData ? Number(currentYearData.savings) || 0 : 0;
  const totalGain = currentPortfolioValue - startingValue - currentYearSavings;
  
  // Calculate percentage change
  const percentageChange = startingValue > 0 ? (totalGain / startingValue) * 100 : 0;
  
  return {
    totalGain,
    percentageChange,
    timeframe: "YTD",
    startingValue
  };
};

/**
 * Calculate overall portfolio gains (all time)
 * @param yearlyData - Array of yearly financial data
 * @param currentPortfolioValue - Current live portfolio value
 * @returns Object with overall performance metrics
 */
export const calculateOverallGains = (
  yearlyData: YearlyData[],
  currentPortfolioValue: number
): {
  totalGain: number;
  percentageChange: number;
  totalSavings: number;
} => {
  if (!yearlyData || yearlyData.length === 0) {
    return {
      totalGain: 0,
      percentageChange: 0,
      totalSavings: 0
    };
  }
  
  // Calculate total savings across all years
  const totalSavings = yearlyData.reduce((sum, data) => sum + Number(data.savings || 0), 0);
  
  // Overall gain is current value minus total savings
  const totalGain = currentPortfolioValue - totalSavings;
  
  // Percentage change based on total savings as "investment"
  const percentageChange = totalSavings > 0 ? (totalGain / totalSavings) * 100 : 0;
  
  return {
    totalGain,
    percentageChange,
    totalSavings
  };
}; 