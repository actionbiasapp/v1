// app/lib/agent/types.ts
export interface AgentContext {
  currentHoldings: any[];
  yearlyData: any[];
  financialProfile: any;
  displayCurrency: string;
}

export interface AgentRequest {
  message: string;
  context: AgentContext;
  files?: File[];
}

export interface AgentResponse {
  action: 'confirm' | 'execute' | 'clarify' | 'analyze' | 'error';
  data: any;
  message: string;
  confidence: number;
  suggestions?: string[];
  requires_confirmation?: boolean;
}

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface AgentAction {
  type: ActionType;
  data: any;
  category?: string;
  holdingId?: string;
}

export type IntentType = 
  | 'add_holding'
  | 'reduce_holding'
  | 'increase_holding'
  | 'edit_holding'
  | 'delete_holding'
  | 'add_yearly_data'
  | 'update_profile'
  | 'portfolio_analysis'
  | 'unknown';

export type ActionType = 
  | 'add_holding'
  | 'reduce_holding'
  | 'increase_holding'
  | 'add_to_existing_holding'
  | 'edit_holding'
  | 'delete_holding'
  | 'add_yearly_data'
  | 'update_profile'
  | 'portfolio_analysis';

export interface ExtractedHoldingData {
  symbol?: string;
  name?: string;
  quantity?: number;
  unitPrice?: number;
  currency?: string;
  category?: string;
  location?: string;
}

export interface ExtractedYearlyData {
  year?: number;
  income?: number;
  expenses?: number;
  netWorth?: number;
  savings?: number;
  marketGains?: number;
} 