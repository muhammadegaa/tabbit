import { TabInfo, TabAnalysis, OpenRouterRequest, OpenRouterResponse } from './types';

// Configuration for OpenRouter API
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';
const API_KEY = 'your_openrouter_api_key_here';

/**
 * Analyzes a tab using OpenRouter LLM API
 * @param tabInfo - Information about the current tab
 * @returns Promise with the analysis results
 */
export async function analyzeTab(tabInfo: TabInfo): Promise<TabAnalysis> {
  try {
    // Construct the prompt for the LLM
    const prompt = `You are a productivity assistant. For the browser tab described below, return a JSON object with:
- intent: user's likely purpose for this tab
- project: what this tab is related to
- next_action: what they should do next

Tab Info:
- Title: ${tabInfo.title}
- URL: ${tabInfo.url}
- Snippet: ${tabInfo.snippet || 'None'}

Please respond with only valid JSON in this exact format:
{
  "intent": "brief description of user's purpose",
  "project": "related project or context",
  "next_action": "specific next step to take"
}`;

    // Prepare the request payload
    const requestBody: OpenRouterRequest = {
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful productivity assistant that analyzes browser tabs and provides actionable insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 500
    };

    // Make the API call
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://tabmind-extension.com', // Required by OpenRouter
        'X-Title': 'TabMind Chrome Extension'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: OpenRouterResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from API');
    }

    // Extract the JSON response from the LLM
    const content = data.choices[0].message.content;
    
    // Try to parse the JSON response
    try {
      const analysis: TabAnalysis = JSON.parse(content);
      
      // Validate the response structure
      if (!analysis.intent || !analysis.project || !analysis.next_action) {
        throw new Error('Invalid response structure from API');
      }
      
      return analysis;
    } catch (parseError) {
      console.error('Failed to parse API response:', content);
      throw new Error('Invalid JSON response from API');
    }
    
  } catch (error) {
    console.error('Error analyzing tab:', error);
    throw error;
  }
}

/**
 * Extracts a snippet from the current tab's content
 * @param tabId - The ID of the tab to extract content from
 * @returns Promise with the page snippet
 */
export async function getPageSnippet(tabId: number): Promise<string> {
  try {
    // Inject a content script to extract page content
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // Get the main content of the page
        const selectors = [
          'main',
          'article',
          '.content',
          '#content',
          '.main',
          '#main',
          'body'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && element.textContent) {
            const text = element.textContent.trim();
            if (text.length > 100) {
              return text.substring(0, 500) + (text.length > 500 ? '...' : '');
            }
          }
        }
        
        // Fallback to body text
        return document.body?.textContent?.substring(0, 500) || '';
      }
    });
    
    return results[0]?.result || '';
  } catch (error) {
    console.warn('Failed to extract page snippet:', error);
    return '';
  }
} 