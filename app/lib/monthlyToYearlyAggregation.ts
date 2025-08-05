import { MonthlySnapshot, YearlyData } from '@/app/lib/types/shared';

/**
 * Aggregates monthly snapshot data into yearly format
 * This provides a complete historical view from monthly data
 */
export function aggregateMonthlyToYearlyData(monthlySnapshots: MonthlySnapshot[]): YearlyData[] {
  if (!monthlySnapshots || monthlySnapshots.length === 0) {
    return [];
  }

  // Group snapshots by year
  const snapshotsByYear = monthlySnapshots.reduce((acc, snapshot) => {
    if (!acc[snapshot.year]) {
      acc[snapshot.year] = [];
    }
    acc[snapshot.year].push(snapshot);
    return acc;
  }, {} as Record<number, MonthlySnapshot[]>);

  // First pass: create basic yearly data without market gains
  const basicYearlyData: Array<{
    year: number;
    income: number;
    expenses: number;
    savings: number;
    netWorth: number;
    yearSnapshots: MonthlySnapshot[];
  }> = Object.keys(snapshotsByYear)
    .map(yearStr => {
      const year = parseInt(yearStr);
      const yearSnapshots = snapshotsByYear[year];
      
      // Sort snapshots by month to get proper order
      const sortedSnapshots = yearSnapshots.sort((a, b) => a.month - b.month);
      
      // Calculate totals - convert to numbers to handle Decimal types
      const totalIncome = yearSnapshots.reduce((sum, s) => sum + Number(s.income), 0);
      const totalExpenses = yearSnapshots.reduce((sum, s) => sum + Number(s.expenses), 0);
      const totalSavings = yearSnapshots.reduce((sum, s) => sum + (Number(s.income) - Number(s.expenses)), 0);
      
      // Net worth is cumulative - use the last month's value as the year-end net worth
      // Don't sum monthly net worth values!
      const yearEndNetWorth = Number(sortedSnapshots[sortedSnapshots.length - 1]?.netWorth) || 0;
      
      return {
        year,
        income: totalIncome,
        expenses: totalExpenses,
        savings: totalSavings,
        netWorth: yearEndNetWorth,
        yearSnapshots
      };
    })
    .sort((a, b) => a.year - b.year);

  // Second pass: calculate market gains using the sorted data
  const aggregatedData: YearlyData[] = basicYearlyData.map((yearData, index) => {
    const previousNetWorth = index > 0 ? basicYearlyData[index - 1].netWorth : 0;
    
    // For now, use net worth change as market gains to avoid complex calculations
    // This is a simplified approach - in reality, market gains would be more complex
    const marketGains = Math.max(0, yearData.netWorth - previousNetWorth);
    
    const returnPercent = previousNetWorth > 0 ? (marketGains / previousNetWorth) * 100 : 0;
    const savingsRate = yearData.income > 0 ? (yearData.savings / yearData.income) * 100 : 0;

    return {
      id: `monthly-aggregated-${yearData.year}`,
      userId: 'dev-user',
      year: yearData.year,
      income: yearData.income,
      expenses: yearData.expenses,
      savings: yearData.savings,
      netWorth: yearData.netWorth,
      marketGains: Math.max(0, marketGains), // Ensure non-negative
      returnPercent,
      savingsRate,
      srs: 0, // Not available in monthly data
      isEstimated: false,
      confidence: 'high', // Monthly data is more accurate
      notes: `Aggregated from ${yearData.yearSnapshots.length} monthly snapshots`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  return aggregatedData;
}

/**
 * Merges monthly-aggregated data with existing yearly data
 * Monthly data takes precedence for overlapping years
 */
export function mergeMonthlyAndYearlyData(
  monthlySnapshots: MonthlySnapshot[], 
  yearlyData: YearlyData[]
): YearlyData[] {
  const monthlyAggregated = aggregateMonthlyToYearlyData(monthlySnapshots);
  
  // Create a map of yearly data for easy lookup
  const yearlyDataMap = new Map(yearlyData.map(y => [y.year, y]));
  
  // Merge the data, with monthly aggregated data taking precedence
  const mergedData: YearlyData[] = [];
  
  // Get all unique years from both sources
  const allYears = new Set([
    ...monthlyAggregated.map(d => d.year),
    ...yearlyData.map(d => d.year)
  ]);
  
  // Sort years and merge data
  Array.from(allYears).sort().forEach(year => {
    const monthlyData = monthlyAggregated.find(d => d.year === year);
    const yearlyData = yearlyDataMap.get(year);
    
    if (monthlyData) {
      // Use monthly aggregated data (more complete)
      mergedData.push(monthlyData);
    } else if (yearlyData) {
      // Use existing yearly data
      mergedData.push(yearlyData);
    }
  });
  
  return mergedData;
} 