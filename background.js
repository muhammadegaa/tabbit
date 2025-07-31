// TabMind Background Service Worker
class TabMindBackground {
    constructor() {
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupAlarms();
    }

    setupEventListeners() {
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        chrome.action.onClicked.addListener((tab) => {
            this.handleIconClick(tab);
        });
    }

    async handleInstallation(details) {
        if (details.reason === 'install') {
            console.log('TabMind decision copilot installed');
            await this.checkDailyGoal();
        }
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.type) {
                case 'GET_DAILY_GOAL':
                    const goalResult = await chrome.storage.local.get(['tabmind_daily_goal']);
                    sendResponse({ goal: goalResult.tabmind_daily_goal });
                    break;

                case 'GET_GOAL_CLARITY':
                    const clarityResult = await chrome.storage.local.get([
                        'tabmind_daily_goal', 
                        'tabmind_goal_outcome', 
                        'tabmind_goal_minimum'
                    ]);
                    sendResponse({ 
                        goal: clarityResult.tabmind_daily_goal,
                        outcome: clarityResult.tabmind_goal_outcome,
                        minimum: clarityResult.tabmind_goal_minimum
                    });
                    break;

                case 'SET_DAILY_GOAL':
                    await chrome.storage.local.set({ tabmind_daily_goal: request.goal });
                    sendResponse({ success: true });
                    break;

                case 'SET_GOAL_CLARITY':
                    await chrome.storage.local.set({ 
                        tabmind_goal_outcome: request.outcome,
                        tabmind_goal_minimum: request.minimum
                    });
                    sendResponse({ success: true });
                    break;

                case 'GET_ALL_TABS':
                    const tabs = await chrome.tabs.query({});
                    sendResponse({ tabs });
                    break;

                case 'GET_TAB_DATA':
                    const [goalData, analysesData] = await Promise.all([
                        chrome.storage.local.get(['tabmind_daily_goal']),
                        chrome.storage.local.get(['tabmind_analyses'])
                    ]);
                    sendResponse({ 
                        goal: goalData.tabmind_daily_goal,
                        analyses: analysesData.tabmind_analyses || {}
                    });
                    break;

                case 'ANALYZE_ALL_TABS':
                    await this.analyzeAllTabs();
                    sendResponse({ success: true });
                    break;

                case 'ANALYZE_CURRENT_TAB':
                    await this.analyzeCurrentTab();
                    sendResponse({ success: true });
                    break;

                case 'CLEAR_CACHE':
                    await chrome.storage.local.remove(['tabmind_analyses']);
                    sendResponse({ success: true });
                    break;

                case 'CLOSE_TAB':
                    await chrome.tabs.remove(request.tabId);
                    sendResponse({ success: true });
                    break;

                case 'PIN_TAB':
                    await chrome.tabs.update(request.tabId, { pinned: true });
                    sendResponse({ success: true });
                    break;

                case 'UNPIN_TAB':
                    await chrome.tabs.update(request.tabId, { pinned: false });
                    sendResponse({ success: true });
                    break;

                case 'SAVE_TAB_FOR_LATER':
                    await this.saveTabForLater(request.tabId);
                    sendResponse({ success: true });
                    break;

                case 'REOPEN_TAB':
                    const newTab = await chrome.tabs.create({ 
                        url: request.url,
                        active: false 
                    });
                    sendResponse({ success: true, tabId: newTab.id });
                    break;

                case 'RESTORE_TAB':
                    // Create tab and remove from saved tabs
                    const restoredTab = await chrome.tabs.create({ 
                        url: request.url,
                        active: false 
                    });
                    await this.removeFromSavedTabs(request.url);
                    sendResponse({ success: true, tabId: restoredTab.id });
                    break;

                case 'SAVE_DELEGATION':
                    await this.saveDelegation(request);
                    sendResponse({ success: true });
                    break;

                case 'REMOVE_DELEGATION':
                    await this.removeDelegation(request.url);
                    sendResponse({ success: true });
                    break;

                case 'UPDATE_TAB_DECISION':
                    await this.updateTabDecision(request.tabId, request.decision);
                    sendResponse({ success: true });
                    break;

                case 'GET_AUTH_STATE':
                    try {
                        // Return dummy auth state for now - will implement Firebase later
                        sendResponse({ 
                            success: true, 
                            user: null,
                            subscription: { plan: 'trial', analysesLeft: 1 }
                        });
                    } catch (error) {
                        sendResponse({ error: error.message });
                    }
                    break;

                case 'SIGN_IN_GOOGLE':
                    try {
                        // Use Chrome Identity API for Google sign-in
                        chrome.identity.getAuthToken({ interactive: true }, (token) => {
                            if (chrome.runtime.lastError) {
                                sendResponse({ error: chrome.runtime.lastError.message });
                            } else if (token) {
                                // For now, just return success - will implement Firebase user creation later
                                sendResponse({ 
                                    success: true, 
                                    user: { 
                                        email: 'user@example.com', 
                                        name: 'Test User' 
                                    }
                                });
                            } else {
                                sendResponse({ error: 'No token received' });
                            }
                        });
                        return true; // Keep message channel open for async response
                    } catch (error) {
                        sendResponse({ error: error.message });
                    }
                    break;

                case 'SIGN_IN_ANONYMOUS':
                    try {
                        // Anonymous sign-in simulation
                        sendResponse({ 
                            success: true, 
                            user: { 
                                email: 'anonymous@tabbit.app', 
                                name: 'Anonymous User' 
                            }
                        });
                    } catch (error) {
                        sendResponse({ error: error.message });
                    }
                    break;

                case 'SIGN_OUT':
                    try {
                        // Clear auth token and user data
                        chrome.identity.removeCachedAuthToken({ token: '' }, () => {
                            sendResponse({ success: true });
                        });
                        return true; // Keep message channel open for async response
                    } catch (error) {
                        sendResponse({ error: error.message });
                    }
                    break;

                case 'CREATE_CHECKOUT_SESSION':
                    try {
                        // Redirect to Stripe checkout
                        const checkoutUrl = `https://tabmind-60aqwm707-shortsys-projects.vercel.app/api/create-checkout-session?plan=${request.plan}`;
                        chrome.tabs.create({ url: checkoutUrl });
                        sendResponse({ success: true });
                    } catch (error) {
                        sendResponse({ error: error.message });
                    }
                    break;

                case 'CREATE_PORTAL_SESSION':
                    try {
                        // Redirect to Stripe customer portal
                        const portalUrl = `https://tabmind-60aqwm707-shortsys-projects.vercel.app/api/create-portal-session`;
                        chrome.tabs.create({ url: portalUrl });
                        sendResponse({ success: true });
                    } catch (error) {
                        sendResponse({ error: error.message });
                    }
                    break;

                case 'TRIGGER_AUTOMATION':
                    console.log('Manual automation trigger received');
                    console.log('this.runTabAutomation exists:', typeof this.runTabAutomation);
                    
                    if (typeof this.runTabAutomation !== 'function') {
                        console.error('runTabAutomation method not available');
                        sendResponse({ error: 'runTabAutomation method not available' });
                        break;
                    }
                    
                    try {
                        await this.runTabAutomation();
                        console.log('Manual automation completed successfully');
                        sendResponse({ success: true, message: 'Tab automation completed successfully' });
                    } catch (automationError) {
                        console.error('Manual automation failed:', automationError);
                        sendResponse({ 
                            error: automationError.message,
                            details: automationError.stack 
                        });
                    }
                    break;

                default:
                    sendResponse({ error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ error: error.message });
        }
    }

    async handleIconClick(tab) {
        try {
            await chrome.tabs.sendMessage(tab.id, { action: 'openFloatingPanel' });
        } catch (error) {
            console.error('Error opening decision copilot:', error);
        }
    }

    async analyzeAllTabs() {
        try {
            const tabs = await chrome.tabs.query({});
            if (tabs.length === 0) return;

            const api = new OpenRouterAPI();
            let processedCount = 0;

            // Get enhanced goal context
            const goalContext = await this.getEnhancedGoalContext();

            for (const tab of tabs) {
                try {
                    // Check cache first
                    const cachedAnalysis = await this.getCachedAnalysis(tab.id);
                    if (cachedAnalysis) {
                        processedCount++;
                        continue;
                    }

                    // Analyze tab with enhanced context
                    const analysis = await api.analyzeTab({
                        title: tab.title,
                        url: tab.url,
                        content: 'Content analysis not available'
                    }, goalContext);

                    await this.saveAnalysis(tab.id, analysis);
                    processedCount++;

                } catch (error) {
                    console.error(`Error analyzing tab ${tab.id}:`, error);
                    processedCount++;
                }
            }

            console.log(`Decision engine processed ${processedCount} tabs`);
        } catch (error) {
            console.error('Error running decision engine:', error);
        }
    }

    async analyzeCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) return;

            const api = new OpenRouterAPI();
            const goalContext = await this.getEnhancedGoalContext();
            
            const analysis = await api.analyzeTab({
                title: tab.title,
                url: tab.url,
                content: 'Content analysis not available'
            }, goalContext);

            await this.saveAnalysis(tab.id, analysis);
            console.log('Current tab decision mapped');
        } catch (error) {
            console.error('Error analyzing current tab:', error);
        }
    }

    async getEnhancedGoalContext() {
        try {
            const result = await chrome.storage.local.get([
                'tabmind_daily_goal',
                'tabmind_goal_outcome', 
                'tabmind_goal_minimum'
            ]);
            
            return {
                mainGoal: result.tabmind_daily_goal || 'No specific goal set',
                targetOutcome: result.tabmind_goal_outcome || '',
                minimumViable: result.tabmind_goal_minimum || ''
            };
        } catch (error) {
            return {
                mainGoal: 'No specific goal set',
                targetOutcome: '',
                minimumViable: ''
            };
        }
    }

    async getCachedAnalysis(tabId) {
        try {
            const result = await chrome.storage.local.get(['tabmind_analyses']);
            const analyses = result.tabmind_analyses || {};
            const analysis = analyses[tabId];
            
            if (analysis && analysis.timestamp) {
                const age = Date.now() - analysis.timestamp;
                const maxAge = 6 * 60 * 60 * 1000; // 6 hours
                
                if (age < maxAge) {
                    return analysis;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error getting cached analysis:', error);
            return null;
        }
    }

    async saveAnalysis(tabId, analysis) {
        try {
            const result = await chrome.storage.local.get(['tabmind_analyses']);
            const analyses = result.tabmind_analyses || {};
            
            analyses[tabId] = {
                ...analysis,
                timestamp: Date.now()
            };
            
            await chrome.storage.local.set({ tabmind_analyses: analyses });
        } catch (error) {
            console.error('Error saving analysis:', error);
        }
    }

    async saveTabForLater(tabId) {
        try {
            const [savedTabsResult, tab] = await Promise.all([
                chrome.storage.local.get(['tabmind_saved_tabs']),
                chrome.tabs.get(tabId)
            ]);
            
            const savedTabs = savedTabsResult.tabmind_saved_tabs || [];
            savedTabs.push({
                id: tabId,
                title: tab.title,
                url: tab.url,
                savedAt: Date.now()
            });
            
            await Promise.all([
                chrome.storage.local.set({ tabmind_saved_tabs: savedTabs }),
                chrome.tabs.remove(tabId)
            ]);
        } catch (error) {
            console.error('Error saving tab for later:', error);
        }
    }

    async removeFromSavedTabs(url) {
        try {
            const result = await chrome.storage.local.get(['tabmind_saved_tabs']);
            const savedTabs = result.tabmind_saved_tabs || [];
            
            // Remove the tab with matching URL
            const filteredTabs = savedTabs.filter(tab => tab.url !== url);
            
            await chrome.storage.local.set({ tabmind_saved_tabs: filteredTabs });
        } catch (error) {
            console.error('Error removing from saved tabs:', error);
        }
    }

    async saveDelegation(delegationData) {
        try {
            const result = await chrome.storage.local.get(['tabmind_delegations']);
            const delegations = result.tabmind_delegations || [];
            
            delegations.push({
                tabId: delegationData.tabId,
                url: delegationData.url,
                title: delegationData.title,
                delegatedTo: delegationData.delegatedTo,
                instructions: delegationData.instructions,
                delegatedAt: Date.now()
            });
            
            await chrome.storage.local.set({ tabmind_delegations: delegations });
            console.log('Delegation saved:', delegationData.title, 'to', delegationData.delegatedTo);
        } catch (error) {
            console.error('Error saving delegation:', error);
        }
    }

    async removeDelegation(url) {
        try {
            const result = await chrome.storage.local.get(['tabmind_delegations']);
            const delegations = result.tabmind_delegations || [];
            
            // Remove the delegation with matching URL
            const filteredDelegations = delegations.filter(delegation => delegation.url !== url);
            
            await chrome.storage.local.set({ tabmind_delegations: filteredDelegations });
            console.log('Delegation removed for URL:', url);
        } catch (error) {
            console.error('Error removing delegation:', error);
        }
    }

    async updateTabDecision(tabId, decision) {
        try {
            const result = await chrome.storage.local.get(['tabmind_analyses']);
            const analyses = result.tabmind_analyses || {};
            
            if (analyses[tabId]) {
                analyses[tabId].decision = decision;
                analyses[tabId].priority = decision; // Keep for backwards compatibility
                analyses[tabId].timestamp = Date.now();
                
                await chrome.storage.local.set({ tabmind_analyses: analyses });
                console.log(`Updated tab ${tabId} decision to:`, decision);
            }
        } catch (error) {
            console.error('Error updating tab decision:', error);
        }
    }

    async getDailyGoal() {
        try {
            const result = await chrome.storage.local.get(['tabmind_daily_goal']);
            return result.tabmind_daily_goal || 'No shipping goal set';
        } catch (error) {
            return 'No shipping goal set';
        }
    }

    async checkDailyGoal() {
        try {
            const result = await chrome.storage.local.get(['tabmind_daily_goal', 'tabmind_last_goal_check']);
            const today = new Date().toDateString();
            
            if (!result.tabmind_daily_goal || result.tabmind_last_goal_check !== today) {
                await chrome.storage.local.set({ tabmind_last_goal_check: today });
                this.showNotification('TabMind Copilot', 'What are you shipping today?');
            }
        } catch (error) {
            console.error('Error checking daily goal:', error);
        }
    }

    setupAlarms() {
        try {
            // Check if chrome.alarms is available
            if (chrome.alarms && chrome.alarms.create) {
                chrome.alarms.create('dailyGoalCheck', { delayInMinutes: 1, periodInMinutes: 1440 }); // 24 hours
                chrome.alarms.create('cacheCleanup', { delayInMinutes: 60, periodInMinutes: 360 }); // 6 hours
                chrome.alarms.create('tabAutomation', { delayInMinutes: 10, periodInMinutes: 10 }); // 10 minutes
                chrome.alarms.create('progressCheck', { delayInMinutes: 90, periodInMinutes: 90 }); // 90 minutes
                
                // Bind the alarm handler to preserve context
                chrome.alarms.onAlarm.addListener((alarm) => {
                    this.handleAlarm(alarm);
                });
                
                console.log('TabMind copilot alarms set up successfully');
            } else {
                console.warn('chrome.alarms not available, using setTimeout fallback');
                // Fallback to setTimeout for environments where alarms aren't available
                // Use arrow functions to preserve 'this' context
                setInterval(() => this.checkDailyGoal(), 1440 * 60 * 1000); // 24 hours
                setInterval(() => this.cleanupCache(), 360 * 60 * 1000); // 6 hours
                setInterval(() => this.runTabAutomation(), 10 * 60 * 1000); // 10 minutes
                setInterval(() => this.checkProgress(), 90 * 60 * 1000); // 90 minutes
            }
        } catch (error) {
            console.error('Error setting up alarms:', error);
        }
    }

    handleAlarm(alarm) {
        try {
            console.log('Alarm triggered:', alarm.name);
            console.log('TabMindBackground instance methods available:', typeof this.runTabAutomation);
            
            switch (alarm.name) {
                case 'dailyGoalCheck':
                    console.log('Running daily goal check...');
                    this.checkDailyGoal();
                    break;
                case 'cacheCleanup':
                    console.log('Running cache cleanup...');
                    this.cleanupCache();
                    break;
                case 'tabAutomation':
                    console.log('Running tab automation...');
                    if (typeof this.runTabAutomation === 'function') {
                        this.runTabAutomation();
                    } else {
                        console.error('runTabAutomation method not found on this instance');
                    }
                    break;
                case 'progressCheck':
                    console.log('Running progress check...');
                    this.checkProgress();
                    break;
                default:
                    console.log('Unknown alarm:', alarm.name);
            }
        } catch (error) {
            console.error('Error handling alarm:', error);
        }
    }

    async cleanupCache() {
        try {
            const result = await chrome.storage.local.get(['tabmind_analyses']);
            const analyses = result.tabmind_analyses || {};
            const now = Date.now();
            const maxAge = 6 * 60 * 60 * 1000; // 6 hours
            
            let cleaned = false;
            for (const [tabId, analysis] of Object.entries(analyses)) {
                if (analysis.timestamp && (now - analysis.timestamp) > maxAge) {
                    delete analyses[tabId];
                    cleaned = true;
                }
            }
            
            if (cleaned) {
                await chrome.storage.local.set({ tabmind_analyses: analyses });
                console.log('Decision cache cleaned up');
            }
        } catch (error) {
            console.error('Error cleaning up cache:', error);
        }
    }

    showNotification(title, message) {
        try {
            if (chrome.notifications && chrome.notifications.create) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon48.png',
                    title: title,
                    message: message
                });
            } else {
                console.log('Notification would show:', title, message);
            }
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }
}

// Enhanced OpenRouter API Handler for Decision Copilot
class OpenRouterAPI {
    constructor() {
        this.API_KEY = 'your_openrouter_api_key_here';
        this.API_URL = 'https://openrouter.ai/api/v1/chat/completions';
    }

    async analyzeTab(tabInfo, goalContext) {
        const prompt = this.buildDecisionPrompt(tabInfo, goalContext);
        const response = await this.makeApiCall(prompt);
        return this.parseResponse(response);
    }

    buildDecisionPrompt(tabInfo, goalContext) {
        const hasEnhancedGoal = goalContext.targetOutcome || goalContext.minimumViable;
        
        let goalSection = `My shipping goal today: ${goalContext.mainGoal}`;
        
        if (hasEnhancedGoal) {
            goalSection += `
TARGET OUTCOME: ${goalContext.targetOutcome || 'Not specified'}
MINIMUM VIABLE: ${goalContext.minimumViable || 'Not specified'}`;
        }

        return `${goalSection}

This tab: "${tabInfo.title}" | URL: ${tabInfo.url}

As my decision copilot, analyze this tab and classify it into one of 5 decision categories. Respond with ONLY valid JSON in this exact format:
{
  "intent": "what this tab is for in context of my shipping goal",
  "project": "which project/context this belongs to", 
  "decision": "do_now|do_later|delegate|reference|discard",
  "next_action": "specific action I should take with this tab based on my goal",
  "reasoning": "why this tab fits this decision category for shipping my goal"
}

Decision Categories:
- do_now: Essential for shipping today's goal, requires immediate action
- do_later: Relevant to goal but not urgent, can be queued for later
- delegate: Needs someone else's input, expertise, or action to progress
- reference: Useful information to keep accessible but no immediate action needed
- discard: Not relevant to shipping goal, can be safely closed

Focus on SHIPPING decisions and actionable next steps.`;
    }

    async makeApiCall(prompt) {
        const response = await fetch(this.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.API_KEY}`,
                'HTTP-Referer': 'https://tabmind-extension.com',
                'X-Title': 'TabMind Decision Copilot'
            },
            body: JSON.stringify({
                model: 'anthropic/claude-3.5-sonnet',
                messages: [
                    {
                        role: 'system',
                        content: 'You are TabMind, an AI decision copilot helping users ship their goals. Always respond with valid JSON only. Focus on actionable shipping decisions, not just organization.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            throw new Error(`Decision engine API failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    parseResponse(content) {
        try {
            // Clean the content
            let cleanedContent = content.trim();
            
            // Remove markdown code blocks if present
            cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
            
            // Try to parse as JSON
            let analysis = JSON.parse(cleanedContent);
            
            // Validate required fields
            if (!analysis.intent || !analysis.project || !analysis.next_action) {
                throw new Error('Missing required fields in decision response');
            }
            
            return {
                intent: analysis.intent.trim(),
                project: analysis.project.trim(),
                decision: analysis.decision ? analysis.decision.trim() : 'do_later',
                priority: analysis.decision ? analysis.decision.trim() : 'do_later', // Keep for backwards compatibility
                next_action: analysis.next_action.trim(),
                reasoning: analysis.reasoning ? analysis.reasoning.trim() : 'Decision analysis completed'
            };
            
        } catch (error) {
            console.error('Failed to parse decision response:', content);
            
            // Try to extract fields using regex as fallback
            const intentMatch = content.match(/"intent"\s*:\s*"([^"]+)"/);
            const projectMatch = content.match(/"project"\s*:\s*"([^"]+)"/);
            const decisionMatch = content.match(/"decision"\s*:\s*"([^"]+)"/);
            const priorityMatch = content.match(/"priority"\s*:\s*"([^"]+)"/); // Legacy fallback
            const actionMatch = content.match(/"next_action"\s*:\s*"([^"]+)"/);
            const reasoningMatch = content.match(/"reasoning"\s*:\s*"([^"]+)"/);
            
            const finalDecision = decisionMatch ? decisionMatch[1].trim() : (priorityMatch ? priorityMatch[1].trim() : 'do_later');
            
            return {
                intent: intentMatch ? intentMatch[1].trim() : 'Need decision guidance',
                project: projectMatch ? projectMatch[1].trim() : 'Unknown project',
                decision: finalDecision,
                priority: finalDecision, // Keep for backwards compatibility
                next_action: actionMatch ? actionMatch[1].trim() : 'Review for shipping relevance',
                reasoning: reasoningMatch ? reasoningMatch[1].trim() : 'Fallback decision analysis'
            };
        }
    }

    // ===== MICRO-DECISION ENGINE & AUTOMATION =====

    async runTabAutomation() {
        try {
            console.log('🤖 Running tab automation...');
            
            // Get all open tabs
            const tabs = await chrome.tabs.query({});
            
            // Get stored analyses
            const result = await chrome.storage.local.get(['tabmind_analyses']);
            const analyses = result.tabmind_analyses || {};
            
            const automationResults = {
                discarded: 0,
                pinned: 0,
                grouped: 0
            };
            
            for (const tab of tabs) {
                const analysis = analyses[tab.id];
                if (!analysis) continue;
                
                const decision = analysis.decision || analysis.priority;
                
                try {
                    switch (decision) {
                        case 'discard':
                            // Close discard tabs
                            await chrome.tabs.remove(tab.id);
                            automationResults.discarded++;
                            console.log(`🗑️ Auto-discarded: ${tab.title}`);
                            break;
                            
                        case 'reference':
                            // Pin reference tabs if not already pinned
                            if (!tab.pinned) {
                                await chrome.tabs.update(tab.id, { pinned: true });
                                automationResults.pinned++;
                                console.log(`📌 Auto-pinned reference: ${tab.title}`);
                            }
                            break;
                            
                        case 'do_later':
                            // Group do_later tabs (if tab groups API is available)
                            if (chrome.tabGroups) {
                                try {
                                    const groups = await chrome.tabGroups.query({ title: 'Later' });
                                    let laterGroup = groups[0];
                                    
                                    if (!laterGroup) {
                                        // Create "Later" group
                                        const groupId = await chrome.tabs.group({ tabIds: [tab.id] });
                                        await chrome.tabGroups.update(groupId, { 
                                            title: 'Later',
                                            color: 'grey'
                                        });
                                        automationResults.grouped++;
                                    } else if (tab.groupId !== laterGroup.id) {
                                        // Add to existing Later group
                                        await chrome.tabs.group({ 
                                            tabIds: [tab.id], 
                                            groupId: laterGroup.id 
                                        });
                                        automationResults.grouped++;
                                    }
                                    console.log(`📂 Auto-grouped for later: ${tab.title}`);
                                } catch (groupError) {
                                    console.log('Tab grouping not available or failed:', groupError.message);
                                }
                            }
                            break;
                    }
                } catch (tabError) {
                    console.error(`Error automating tab ${tab.id}:`, tabError);
                }
            }
            
            // Clean up analyses for closed tabs
            const validTabIds = tabs.map(tab => tab.id.toString());
            const cleanedAnalyses = {};
            Object.keys(analyses).forEach(tabId => {
                if (validTabIds.includes(tabId)) {
                    cleanedAnalyses[tabId] = analyses[tabId];
                }
            });
            await chrome.storage.local.set({ tabmind_analyses: cleanedAnalyses });
            
            // Show notification if any automation occurred
            if (automationResults.discarded + automationResults.pinned + automationResults.grouped > 0) {
                this.showNotification(
                    'TabMind Automation',
                    `🤖 Auto-managed ${automationResults.discarded} discards, ${automationResults.pinned} references, ${automationResults.grouped} queued tabs`
                );
            }
            
            console.log('🤖 Tab automation completed:', automationResults);
            
        } catch (error) {
            console.error('Error in tab automation:', error);
        }
    }

    async checkProgress() {
        try {
            console.log('📊 Checking progress...');
            
            // Get last progress check time
            const result = await chrome.storage.local.get(['tabmind_last_progress_check', 'tabmind_daily_goal']);
            const lastCheck = result.tabmind_last_progress_check || 0;
            const dailyGoal = result.tabmind_daily_goal;
            
            // Don't check if no goal is set
            if (!dailyGoal) {
                console.log('📊 No goal set, skipping progress check');
                return;
            }
            
            const now = Date.now();
            const ninetyMinutes = 90 * 60 * 1000;
            
            // Check if it's been more than 90 minutes since last check
            if (now - lastCheck > ninetyMinutes) {
                // Get current tab activity
                const tabs = await chrome.tabs.query({});
                const analysesResult = await chrome.storage.local.get(['tabmind_analyses']);
                const analyses = analysesResult.tabmind_analyses || {};
                
                // Count active do_now tabs
                const doNowTabs = tabs.filter(tab => {
                    const analysis = analyses[tab.id];
                    return analysis && (analysis.decision === 'do_now' || analysis.priority === 'critical');
                });
                
                // Show progress prompt
                this.showProgressPrompt(dailyGoal, doNowTabs.length);
                
                // Update last check time
                await chrome.storage.local.set({ tabmind_last_progress_check: now });
            }
            
        } catch (error) {
            console.error('Error checking progress:', error);
        }
    }

    async showProgressPrompt(goal, criticalTabCount) {
        try {
            const options = {
                type: 'basic',
                iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMxQjNDNTMiLz4KPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VE08L3RleHQ+Cjwvc3ZnPgo=',
                title: '📊 TabMind Progress Check',
                message: `Are you making progress on "${goal}"? (${criticalTabCount} critical tabs active)`,
                buttons: [
                    { title: '✅ Yes, on track' },
                    { title: '🧠 Stuck, need help' },
                    { title: '🔄 Switch tasks' }
                ]
            };

            if (chrome.notifications && chrome.notifications.create) {
                await chrome.notifications.create('progress-check', options);
                
                // Listen for button clicks
                chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
                    if (notificationId === 'progress-check') {
                        await this.handleProgressResponse(buttonIndex, goal);
                        chrome.notifications.clear(notificationId);
                    }
                });
            } else {
                console.log('📊 Progress check: Would show notification about goal progress');
            }
            
        } catch (error) {
            console.error('Error showing progress prompt:', error);
        }
    }

    async handleProgressResponse(buttonIndex, goal) {
        try {
            switch (buttonIndex) {
                case 0: // Yes, on track
                    console.log('📊 User is on track with goal');
                    break;
                    
                case 1: // Stuck, need help
                    console.log('📊 User is stuck, could suggest next actions');
                    // Could trigger re-analysis of current tabs with focus on unblocking
                    this.showNotification(
                        'TabMind Assistance',
                        '🧠 Analyze your current tabs for next actions or try breaking down your goal into smaller steps'
                    );
                    break;
                    
                case 2: // Switch tasks
                    console.log('📊 User wants to switch tasks');
                    // Could save current context and suggest alternative tasks
                    await this.handleTaskSwitch(goal);
                    break;
            }
        } catch (error) {
            console.error('Error handling progress response:', error);
        }
    }

    async handleTaskSwitch(currentGoal) {
        try {
            // Save current context
            const result = await chrome.storage.local.get(['tabmind_task_history']);
            const taskHistory = result.tabmind_task_history || [];
            
            taskHistory.push({
                goal: currentGoal,
                timestamp: Date.now(),
                status: 'switched'
            });
            
            // Keep only last 10 tasks
            if (taskHistory.length > 10) {
                taskHistory.splice(0, taskHistory.length - 10);
            }
            
            await chrome.storage.local.set({ tabmind_task_history: taskHistory });
            
            this.showNotification(
                'Task Context Saved',
                '🔄 Previous task context saved. Set a new goal when you\'re ready to focus on something else.'
            );
            
        } catch (error) {
            console.error('Error handling task switch:', error);
        }
    }

    // Recovery Mode - for completed goals and recently closed tabs
    async offerRecoveryMode() {
        try {
            const result = await chrome.storage.local.get(['tabmind_task_history', 'tabmind_saved_tabs']);
            const taskHistory = result.tabmind_task_history || [];
            const savedTabs = result.tabmind_saved_tabs || [];
            
            if (taskHistory.length > 0 || savedTabs.length > 0) {
                this.showNotification(
                    'TabMind Recovery',
                    `🔄 Would you like to continue where you left off? ${taskHistory.length} recent tasks, ${savedTabs.length} saved tabs available`
                );
            }
        } catch (error) {
            console.error('Error in recovery mode:', error);
        }
    }
}

// Initialize background service worker
const tabMindBackground = new TabMindBackground();
console.log('TabMind decision copilot background loaded'); 