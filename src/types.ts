export type SubscriptionTier = 'payg' | 'standard' | 'premium';

export interface TelemetryLog {
  transaction_id: string;
  user_id: string;
  user_name: string;
  user_tier: SubscriptionTier;
  book_id: string;
  book_title: string;
  page_number: number;
  target_language: string;
  cache_hit: boolean;
  timestamp: string;
  metrics: {
    claude_input_tokens: number;
    claude_output_tokens: number;
    azure_characters: number;
    calculated_cost_usd: number;
  };
}

export interface Book {
  id: string;
  title: string;
  author: string;
  subject: 'Law' | 'Economics' | 'Business' | 'Computer Science';
  pagesCount: number;
}

export interface LibraryPageCache {
  book_id: string;
  page_number: number;
  target_language: string;
  processed_text: string;
  timestamp: string;
}

export interface SimulationSummary {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
  cacheHitRate: number;
  activeUsers: {
    payg: number;
    standard: number;
    premium: number;
  };
}

export interface ModelRates {
  claudeInputPerMillion: number;
  claudeOutputPerMillion: number;
  azureSpeechPerMillion: number;
  hostingPerCycle: number;
  cachePerCycle: number;
}
