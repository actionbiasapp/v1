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