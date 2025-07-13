// app/lib/financialDataUtils.ts
// Simplified version for V5.3D Phase 2

export function calculateBasicProfileCompleteness(profile: any): number {
  const currentModalFields = [
    { field: 'annualIncome', weight: 30, required: true },
    { field: 'taxStatus', weight: 10, required: true },
    { field: 'currentSRSContributions', weight: 25, required: true },
    { field: 'srsAutoOptimize', weight: 10, required: false },
    { field: 'customFIAmount', weight: 15, required: false },
    { field: 'customTargetYear', weight: 10, required: false }
  ];
  
  let completeness = 0;
  
  currentModalFields.forEach(({ field, weight, required }) => {
    const value = profile[field];
    const hasValue = value !== null && value !== undefined && value !== 0 && value !== '';
    
    if (hasValue) {
      completeness += weight;
    } else if (!required && value === false) {
      completeness += weight * 0.5;
    }
  });
  
  return Math.min(Math.round(completeness), 100);
}

export const calculateProfileCompleteness = calculateBasicProfileCompleteness;