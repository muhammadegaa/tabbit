import { TabInfo, TabAnalysis } from './types';
import { analyzeTab, getPageSnippet } from './api';
import { saveAnalysis, getRecentAnalyses } from './storage';

// DOM elements
const analyzeBtn = document.getElementById('analyzeBtn') as HTMLButtonElement;
const loadingDiv = document.getElementById('loading') as HTMLDivElement;
const resultDiv = document.getElementById('result') as HTMLDivElement;
const errorDiv = document.getElementById('error') as HTMLDivElement;
const historyList = document.getElementById('historyList') as HTMLDivElement;

// Result display elements
const intentElement = document.getElementById('intent') as HTMLDivElement;
const projectElement = document.getElementById('project') as HTMLDivElement;
const nextActionElement = document.getElementById('nextAction') as HTMLDivElement;

/**
 * Main initialization function
 */
async function initialize(): Promise<void> {
  try {
    // Load recent analyses
    await loadRecentAnalyses();
    
    // Set up event listeners
    analyzeBtn.addEventListener('click', handleAnalyzeClick);
    
    console.log('TabMind popup initialized');
  } catch (error) {
    console.error('Error initializing popup:', error);
    showError('Failed to initialize extension');
  }
}

/**
 * Handles the analyze button click
 */
async function handleAnalyzeClick(): Promise<void> {
  try {
    // Disable button and show loading
    setLoadingState(true);
    hideError();
    hideResult();

    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }

    // Prepare tab info
    const tabInfo: TabInfo = {
      title: tab.title || 'Unknown Title',
      url: tab.url || 'Unknown URL'
    };

    // Try to get page snippet (optional)
    try {
      tabInfo.snippet = await getPageSnippet(tab.id);
    } catch (snippetError) {
      console.warn('Failed to get page snippet:', snippetError);
      // Continue without snippet
    }

    // Analyze the tab
    const analysis = await analyzeTab(tabInfo);
    
    // Save the analysis
    await saveAnalysis(tabInfo, analysis);
    
    // Display results
    displayResults(analysis);
    
    // Refresh history
    await loadRecentAnalyses();
    
  } catch (error) {
    console.error('Error analyzing tab:', error);
    showError(error instanceof Error ? error.message : 'Failed to analyze tab');
  } finally {
    setLoadingState(false);
  }
}

/**
 * Displays the analysis results in the UI
 */
function displayResults(analysis: TabAnalysis): void {
  intentElement.textContent = analysis.intent;
  projectElement.textContent = analysis.project;
  nextActionElement.textContent = analysis.next_action;
  
  resultDiv.style.display = 'block';
}

/**
 * Loads and displays recent analyses in the history section
 */
async function loadRecentAnalyses(): Promise<void> {
  try {
    const recentAnalyses = await getRecentAnalyses(5);
    
    if (recentAnalyses.length === 0) {
      historyList.innerHTML = '<div style="opacity: 0.6; text-align: center; padding: 20px;">No analyses yet</div>';
      return;
    }
    
    historyList.innerHTML = recentAnalyses.map(record => `
      <div class="history-item" data-id="${record.id}">
        <div class="history-title">${escapeHtml(record.tabInfo.title)}</div>
        <div class="history-intent">${escapeHtml(record.analysis.intent)}</div>
      </div>
    `).join('');
    
    // Add click handlers for history items
    historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const recordId = item.getAttribute('data-id');
        if (recordId) {
          showHistoryDetails(recordId, recentAnalyses);
        }
      });
    });
    
  } catch (error) {
    console.error('Error loading recent analyses:', error);
    historyList.innerHTML = '<div style="opacity: 0.6; text-align: center; padding: 20px;">Failed to load history</div>';
  }
}

/**
 * Shows details for a specific history item
 */
function showHistoryDetails(recordId: string, analyses: any[]): void {
  const record = analyses.find(a => a.id === recordId);
  if (record) {
    displayResults(record.analysis);
  }
}

/**
 * Sets the loading state of the UI
 */
function setLoadingState(isLoading: boolean): void {
  analyzeBtn.disabled = isLoading;
  loadingDiv.style.display = isLoading ? 'block' : 'none';
}

/**
 * Shows an error message
 */
function showError(message: string): void {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

/**
 * Hides the error message
 */
function hideError(): void {
  errorDiv.style.display = 'none';
}

/**
 * Hides the result display
 */
function hideResult(): void {
  resultDiv.style.display = 'none';
}

/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize); 