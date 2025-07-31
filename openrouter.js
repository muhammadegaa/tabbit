// OpenRouter API Handler for TabMind
class OpenRouterAPI {
    constructor() {
        this.apiKey = 'your_openrouter_api_key_here';
        this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
        this.model = 'anthropic/claude-3.5-sonnet';
    }

    /**
     * Analyze a tab with the user's daily goal context
     * @param {Object} tabInfo - Tab information
     * @param {string} dailyGoal - User's daily goal
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeTab(tabInfo, dailyGoal) {
        try {
            const prompt = this.buildPrompt(tabInfo, dailyGoal);
            
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://tabmind-extension.com',
                    'X-Title': 'TabMind Chrome Extension'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an AI productivity assistant helping users stay focused. Always respond with valid JSON only.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.choices || data.choices.length === 0) {
                throw new Error('No response from API');
            }

            const content = data.choices[0].message.content;
            return this.parseResponse(content);
            
        } catch (error) {
            console.error('OpenRouter API error:', error);
            throw error;
        }
    }

    /**
     * Build the prompt for tab analysis
     * @param {Object} tabInfo - Tab information
     * @param {string} dailyGoal - User's daily goal
     * @returns {string} Formatted prompt
     */
    buildDecisionPrompt(tabInfo, dailyGoal) {
        return `My goal today is: ${dailyGoal}.

This tab has title: "${tabInfo.title}", url: ${tabInfo.url}, and visible content: "${tabInfo.snippet || 'No content available'}".

Analyze this tab in relation to my goal and classify it into one of 5 decision categories. Respond with ONLY a valid JSON object in this exact format (no other text):
{
  "intent": "brief description of what this tab is about",
  "project": "what project or context this belongs to",
  "decision": "do_now|do_later|delegate|reference|discard",
  "next_action": "specific next action to take based on my goal",
  "reasoning": "why this tab fits this decision category for achieving my goal"
}

Decision Categories:
- do_now: Essential for today's goal, requires immediate action
- do_later: Relevant to goal but not urgent, can be queued
- delegate: Needs someone else's input or action
- reference: Useful information to keep accessible but no immediate action needed
- discard: Not relevant to goal, can be safely closed`;
    }

    /**
     * Parse the LLM response
     * @param {string} content - Raw response content
     * @returns {Object} Parsed analysis
     */
    parseResponse(content) {
        try {
            // Clean the content first
            let cleanContent = content.trim();
            
            // Remove any markdown code blocks
            cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            
            // Try to extract JSON from the response
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            let jsonString = jsonMatch[0];
            
            // Handle truncated JSON by trying to complete it
            if (!jsonString.includes('"next_action"')) {
                // If next_action is missing, try to extract what we have
                const intentMatch = jsonString.match(/"intent"\s*:\s*"([^"]*)"/);
                const projectMatch = jsonString.match(/"project"\s*:\s*"([^"]*)"/);
                const priorityMatch = jsonString.match(/"priority"\s*:\s*"([^"]*)"/);
                
                if (intentMatch && projectMatch) {
                    return {
                        intent: intentMatch[1].trim(),
                        project: projectMatch[1].trim(),
                        priority: priorityMatch ? priorityMatch[1].trim() : 'later',
                        next_action: "Complete the analysis by reviewing the tab content",
                        reasoning: "Analysis incomplete - review tab content for full context"
                    };
                }
            }

            const analysis = JSON.parse(jsonString);
            
            // Validate required fields
            if (!analysis.intent || !analysis.project || !analysis.next_action) {
                throw new Error('Invalid response structure');
            }

            return {
                intent: analysis.intent.trim(),
                project: analysis.project.trim(),
                priority: analysis.priority ? analysis.priority.trim() : 'later',
                next_action: analysis.next_action.trim(),
                reasoning: analysis.reasoning ? analysis.reasoning.trim() : 'Analysis completed'
            };
            
        } catch (parseError) {
            console.error('Failed to parse API response:', content);
            console.error('Parse error:', parseError);
            
                                    // Fallback: try to extract partial information
                        try {
                            const intentMatch = content.match(/"intent"\s*:\s*"([^"]*)"/);
                            const projectMatch = content.match(/"project"\s*:\s*"([^"]*)"/);
                            const actionMatch = content.match(/"next_action"\s*:\s*"([^"]*)"/);
                            const priorityMatch = content.match(/"priority"\s*:\s*"([^"]*)"/);
                            const reasoningMatch = content.match(/"reasoning"\s*:\s*"([^"]*)"/);
                            
                            if (intentMatch || projectMatch || actionMatch) {
                                return {
                                    intent: intentMatch ? intentMatch[1].trim() : "Tab analysis",
                                    project: projectMatch ? projectMatch[1].trim() : "General browsing",
                                    priority: priorityMatch ? priorityMatch[1].trim() : "later",
                                    next_action: actionMatch ? actionMatch[1].trim() : "Review the tab content",
                                    reasoning: reasoningMatch ? reasoningMatch[1].trim() : "Fallback analysis"
                                };
                            }
                        } catch (fallbackError) {
                            console.error('Fallback parsing also failed:', fallbackError);
                        }
            
            throw new Error('Invalid JSON response from API');
        }
    }

    /**
     * Check if API key is valid
     * @returns {Promise<boolean>}
     */
    async validateApiKey() {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://tabmind-extension.com',
                    'X-Title': 'TabMind Chrome Extension'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 1
                })
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Export for use in other modules
window.OpenRouterAPI = OpenRouterAPI; 