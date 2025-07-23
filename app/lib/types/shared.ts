// app/lib/types/shared.ts
// Enhanced unified interface system for Action Bias V5.3D

// 1. Holding interface - needed by 3 components
export interface Holding {
  id: string;
  symbol: string;
  name: string;
  valueSGD: number;
  valueINR: number;
  valueUSD: number;
  entryCurrency: string;
  category: string;
  location: string;
  quantity?: number;
  unitPrice?: number;
  currentUnitPrice?: number;
  _confirmedQuantity?: number;
  _confirmedUnitPrice?: number;
  _confirmedTotalCost?: number;
  _priceSource?: string;
  _enableAutoPricing?: boolean;
  costBasis?: number | null;
  // Backward compatibility fields
  value?: number;
  currentValue?: number;
  assetType?: 'stock' | 'crypto' | 'manual'; // NEW
  priceSource?: string;
  priceUpdated?: string;
}

// UNIFIED ACTION ITEM INTERFACE
// Supports both API responses and local analysis formats
export interface UnifiedActionItem {
  id: string;
  type: 'urgent' | 'opportunity' | 'optimization' | 'warning';
  category: 'tax' | 'portfolio' | 'allocation' | 'risk' | 'opportunity' | 'performance';
  source: 'intelligence' | 'insights' | 'analysis';
  
  // Core content - FIXED: Added missing title property
  title: string;                   // PRIMARY DISPLAY TITLE
  problem: string;
  solution: string;
  benefit: string;
  timeline: string;
  actionText: string;
  
  // Legacy compatibility - these may be used by some components
  description?: string;            // Fallback for components expecting description
  
  // Metadata
  priority: number;
  dollarImpact?: number;
  isClickable: boolean;
  completed?: boolean;
  
  // Action handling
  onClick?: () => void;
  data?: any;
}

// 2. Intelligence interface - needed by ActionItemsProcessor
export interface Intelligence {
  statusIntelligence?: {
    fiProgress?: string;
    urgentAction?: string;
    deadline?: string | null;
  };
  actionIntelligence?: Array<{
    id: string;
    type: string;
    problem: string;
    solution: string;
    benefit: string;
    timeline: string;
    actionText: string;
    isClickable: boolean;
  }>;
  allocationIntelligence?: Array<{
    name: string;
    status: 'perfect' | 'underweight' | 'excess';
    callout: string;
  }>;
}

// 3. NetWorth Tracker Types - Added for component extraction
export interface YearlyData {
  year: number;
  netWorth: number;
  annualInvestment?: number;
  savings: number;
  income: number;
  expenses: number;
  srsContributions: number;
  marketGains?: number; // calculated field
  returnPercent?: number; // calculated field
  savingsRate?: number;
}

export interface EditFormData {
  year: string;
  netWorth: string;
  annualInvestment: string;
}

// 4. Portfolio Form Types - Extracted from FixedPortfolioGrid.tsx
export interface HoldingFormData {
  symbol: string;
  name: string;
  amount: number;
  currency: 'SGD' | 'USD' | 'INR';
  location: string;
  quantity?: number;
  unitPrice?: number;
  currentUnitPrice?: number; // NEW: Manual current price override
  manualPricing?: boolean; // NEW: Disable API updates
  _confirmedQuantity?: number;
  _confirmedUnitPrice?: number;
  _confirmedTotalCost?: number;
  _priceSource?: string;
  _enableAutoPricing?: boolean;
  assetType?: 'stock' | 'crypto' | 'manual'; // NEW
}

export interface PortfolioCardProps {
  category: CategoryData;
  totalValue: number;
  isExpanded: boolean;
  isCompressed: boolean;
  displayCurrency: 'SGD' | 'USD' | 'INR';
  onToggleExpand: (categoryName: string) => void;
  onHoldingsUpdate?: () => void;
}

export interface IndividualHoldingProps {
  holding: Holding;
  categoryCurrentValue: number;
  displayCurrency: 'SGD' | 'USD' | 'INR';
  loading: boolean;
  onEdit: (holding: Holding) => void;
  onDelete: (holdingId: string) => void;
}

// TAX INTELLIGENCE INTERFACE
// Single source of truth for all tax-related data
export interface TaxIntelligence {
  srsOptimization: {
    remainingRoom: number;           // SGD remaining for SRS contributions
    taxSavings: number;              // Potential tax savings SGD
    daysToDeadline: number;          // Days until Dec 31 deadline
    monthlyTarget: number;           // Required monthly contribution
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    maxContribution: number;         // 35700 for EP, 15000 for citizens
    currentContributions: number;    // YTD contributions
    taxBracket: number;              // User's marginal tax rate %
  };
  
  opportunityCost: {
    monthlyPotentialSavings: number; // Monthly opportunity cost
    actionMessage: string;           // Recommended action text
    urgencyMessage: string;          // Why urgent/timeline message
  };
  
  employmentPassAdvantage: {
    srsLimitAdvantage: number;       // 35700 - 15000 = 20700 advantage
    additionalTaxSavings: number;    // Extra savings vs citizens/PRs
    vsComparison: string;            // Comparison message
  };
}

// ENHANCED FINANCIAL PROFILE INTERFACE (MVP SIMPLIFIED)
// Removed Phase 2 expansion fields per 80/20 principle
export interface FinancialProfile {
  // BASIC INCOME & TAX
  annualIncome?: number;
  bonusIncome?: number;
  incomeCurrency: 'SGD' | 'USD' | 'INR';
  taxStatus: 'Employment Pass' | 'Citizen' | 'PR';
  
  // BASIC SRS OPTIMIZATION
  currentSRSContributions: number;
  srsAutoOptimize: boolean;
  
  // BASIC FI GOALS
  fiGoal: number;                  // Default 2500000
  fiTargetYear: number;            // Default 2032
  firstMillionTarget: boolean;     // Milestone tracking
  
  // BASIC PORTFOLIO TARGETS
  coreTarget: number;              // Default 25%
  growthTarget: number;            // Default 55%
  hedgeTarget: number;             // Default 10%
  liquidityTarget: number;         // Default 10%
  rebalanceThreshold: number;      // Default 5%
  
  // SIMPLIFIED EXPENSES (MVP)
  annualExpenses?: number;         // Total annual expenses
  emergencyFundTarget?: number;    // Emergency fund goal (months)
  
  // PROFILE MANAGEMENT
  profileCompleteness: number;     // 0-100%
  lastProfileUpdate?: Date;
}

// PORTFOLIO CATEGORY INTERFACE
export interface CategoryData {
  name: string;
  holdings: Holding[];             // Holdings array
  currentValue: number;            // Current value in display currency
  currentPercent: number;          // Current allocation %
  target: number;                  // Target allocation %
  gap: number;                     // Percentage gap (+ excess, - underweight)
  gapAmount: number;              // Dollar amount gap
  completionPercent: number;     // NEW: (currentPercent / target) * 100
  status: 'perfect' | 'underweight' | 'excess';
  statusText: string;             // Human readable status
  shortStatus?: string;           // Short status for summary cards
  callout?: string;               // Intelligence callout message
  
  // Enhanced properties for UI
  id?: string;
  icon?: React.ReactNode;
  color?: string;
  description?: string;
}

// INTELLIGENCE REPORT INTERFACE
export interface IntelligenceReport {
  statusIntelligence: {
    fiProgress: string;             // "48.7% to first million"
    urgentAction: string;           // Primary urgent action
    deadline: string | null;        // SRS deadline or null
    netWorth: number;               // Portfolio value
    
    // Enhanced status indicators
    srsDeadline?: string;           // Days remaining
    taxSavingsAvailable?: number;   // Available tax savings
    hasUrgentTaxActions?: boolean;  // Urgent tax actions flag
    urgentTaxAction?: string | null; // Urgent tax action description
  };
  
  allocationIntelligence: Array<{
    name: string;                   // Category name
    status: 'perfect' | 'underweight' | 'excess';
    callout: string;                // Status message
    priority: number;               // 1-10 priority
  }>;
  
  actionIntelligence: UnifiedActionItem[]; // Array of actions
  
  // Narrative intelligence
  narrativeIntelligence?: {
    primaryMessage: string;         // Main portfolio message
    supportingMessages: string[];   // Supporting insights
  };
  
  // Metadata
  generated: string;               // ISO timestamp
  nextRefresh: string;            // ISO timestamp
  version?: string;               // API version
  userId?: string;                // User identifier
}

// DATA NORMALIZATION HELPERS
interface RawActionItem {
  id?: string;
  type?: string;
  category?: string;
  source?: string;
  title?: string;
  problem?: string;
  solution?: string;
  benefit?: string;
  timeline?: string;
  actionText?: string;
  description?: string;
  priority?: number;
  dollarImpact?: number;
  isClickable?: boolean;
  completed?: boolean;
  metadata?: unknown;
  data?: unknown;
}

export function normalizeActionItem(item: RawActionItem): UnifiedActionItem {
  return {
    id: item.id || `action-${Date.now()}`,
    type: (item.type as 'urgent' | 'opportunity' | 'optimization' | 'warning') || 'optimization',
    category: (item.category as 'tax' | 'portfolio' | 'allocation' | 'risk' | 'opportunity' | 'performance') || 'portfolio',
    source: (item.source as 'intelligence' | 'insights' | 'analysis') || 'analysis',
    
    // Primary display properties - smart fallback with title priority
    title: item.title || item.problem || 'Action Required',
    problem: item.problem || item.description || 'Portfolio optimization available',
    solution: item.solution || 'Take recommended action',
    benefit: item.benefit || 'Improve portfolio performance',
    timeline: item.timeline || 'When convenient',
    actionText: item.actionText || 'Take Action',
    
    // Legacy compatibility
    description: item.description || item.problem,
    
    // Metadata
    priority: item.priority || 5,
    dollarImpact: item.dollarImpact || 0,
    isClickable: item.isClickable !== undefined ? item.isClickable : true,
    completed: item.completed || false,
    data: item.metadata || item.data
  };
}

export function createDefaultFinancialProfile(): FinancialProfile {
  return {
    // Income defaults
    incomeCurrency: 'SGD',
    taxStatus: 'Employment Pass',
    
    // SRS defaults
    currentSRSContributions: 0,
    srsAutoOptimize: true,
    
    // FI defaults
    fiGoal: 2500000,
    fiTargetYear: 2032,
    firstMillionTarget: true,
    
    // Portfolio defaults
    coreTarget: 25,
    growthTarget: 55,
    hedgeTarget: 10,
    liquidityTarget: 10,
    rebalanceThreshold: 5,
    
    // Profile management
    profileCompleteness: 0
  };
}

// SIMPLIFIED: Profile completeness calculation (80/20 applied)
export function calculateProfileCompleteness(profile: Partial<FinancialProfile>): number {
  // Simplified calculation focusing on core fields only
  const coreFields = [
    { field: 'annualIncome', weight: 40 },      // Most critical
    { field: 'currentSRSContributions', weight: 30 }, // Tax optimization
    { field: 'annualExpenses', weight: 20 },    // Financial health
    { field: 'emergencyFundTarget', weight: 10 } // Planning
  ];
  
  let completeness = 0;
  
  coreFields.forEach(({ field, weight }) => {
    const value = (profile as Record<string, unknown>)[field];
    const hasValue = value !== null && value !== undefined && value !== '';
    
    if (hasValue) {
      completeness += weight;
    }
  });
  
  return Math.min(Math.round(completeness), 100);
}

// SIMPLIFIED: Savings rate calculation
export function calculateSavingsRate(annualIncome?: number, annualExpenses?: number): number {
  if (!annualIncome || !annualExpenses || annualIncome <= 0) return 0;
  return Math.max(0, ((annualIncome - annualExpenses) / annualIncome) * 100);
}

// TYPE GUARDS
export function isUnifiedActionItem(item: unknown): item is UnifiedActionItem {
  return (
    item !== null &&
    typeof item === 'object' &&
    'id' in item && typeof (item as any).id === 'string' &&
    'type' in item && typeof (item as any).type === 'string' &&
    'title' in item && typeof (item as any).title === 'string' &&
    'actionText' in item && typeof (item as any).actionText === 'string' &&
    'isClickable' in item && typeof (item as any).isClickable === 'boolean'
  );
}

export function isTaxIntelligence(obj: unknown): obj is TaxIntelligence {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'srsOptimization' in obj &&
    typeof (obj as any).srsOptimization === 'object' &&
    (obj as any).srsOptimization !== null &&
    typeof (obj as any).srsOptimization.remainingRoom === 'number' &&
    typeof (obj as any).srsOptimization.taxSavings === 'number'
  );
}

// EXPORT ALL TYPES
export type {
  UnifiedActionItem as ActionItem, // Alias for backwards compatibility
};
