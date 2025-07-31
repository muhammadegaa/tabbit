// Type definitions for TabMind Chrome Extension

export interface TabAnalysis {
  intent: string;
  project: string;
  next_action: string;
}

export interface TabInfo {
  title: string;
  url: string;
  snippet?: string;
}

export interface AnalysisRecord {
  id: string;
  timestamp: number;
  tabInfo: TabInfo;
  analysis: TabAnalysis;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user';
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
} 