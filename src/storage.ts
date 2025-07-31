import { AnalysisRecord, TabInfo, TabAnalysis } from './types';

// Storage keys
const STORAGE_KEY = 'tabmind_analyses';
const MAX_RECORDS = 50; // Keep only the last 50 analyses

/**
 * Saves an analysis record to Chrome's local storage
 * @param tabInfo - Information about the analyzed tab
 * @param analysis - The analysis results
 */
export async function saveAnalysis(tabInfo: TabInfo, analysis: TabAnalysis): Promise<void> {
  try {
    const record: AnalysisRecord = {
      id: generateId(),
      timestamp: Date.now(),
      tabInfo,
      analysis
    };

    // Get existing records
    const existingData = await chrome.storage.local.get(STORAGE_KEY);
    const records: AnalysisRecord[] = existingData[STORAGE_KEY] || [];

    // Add new record at the beginning
    records.unshift(record);

    // Keep only the most recent records
    if (records.length > MAX_RECORDS) {
      records.splice(MAX_RECORDS);
    }

    // Save back to storage
    await chrome.storage.local.set({ [STORAGE_KEY]: records });
    
    console.log('Analysis saved:', record);
  } catch (error) {
    console.error('Error saving analysis:', error);
    throw error;
  }
}

/**
 * Retrieves all analysis records from storage
 * @returns Promise with array of analysis records
 */
export async function getAnalyses(): Promise<AnalysisRecord[]> {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    return data[STORAGE_KEY] || [];
  } catch (error) {
    console.error('Error retrieving analyses:', error);
    return [];
  }
}

/**
 * Retrieves the most recent analysis records
 * @param limit - Maximum number of records to return
 * @returns Promise with array of recent analysis records
 */
export async function getRecentAnalyses(limit: number = 10): Promise<AnalysisRecord[]> {
  try {
    const allAnalyses = await getAnalyses();
    return allAnalyses.slice(0, limit);
  } catch (error) {
    console.error('Error retrieving recent analyses:', error);
    return [];
  }
}

/**
 * Clears all analysis records from storage
 */
export async function clearAnalyses(): Promise<void> {
  try {
    await chrome.storage.local.remove(STORAGE_KEY);
    console.log('All analyses cleared');
  } catch (error) {
    console.error('Error clearing analyses:', error);
    throw error;
  }
}

/**
 * Generates a unique ID for analysis records
 * @returns Unique string ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
} 