// TabMind Floating Panel
class TabMindFloatingPanel {
    constructor() {
        this.isVisible = false;
        this.panel = null;
        this.isInitialized = false;
        
        // Define calm, focused color palette
        this.colors = {
            primary: '#065f46',    // Deep forest green - calm focus
            secondary: '#6b7280',  // Warm gray - balanced
            accent: '#d97706'      // Warm amber - attention without aggression
        };
        
        console.log('TabMindFloatingPanel constructor called');
    }

    async init() {
        if (this.isInitialized) return;
        console.log('Initializing TabMind floating panel');
        this.isInitialized = true;
    }

    async createPanel() {
        if (this.panel) {
            console.log('Panel already exists');
            return;
        }
        
        console.log('Creating new panel');
        this.panel = document.createElement('div');
        this.panel.id = 'tabmind-panel';
        
        Object.assign(this.panel.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '420px',
            maxHeight: '85vh',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
            zIndex: '999998',
            display: 'none',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb'
        });

        this.panel.innerHTML = `
            <!-- Header -->
            <div style="background: ${this.colors.primary}; padding: 24px; color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 600;">TabMind</h2>
                        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Focus without drama</p>
                    </div>
                    <button id="tabmind-close" style="background: rgba(255, 255, 255, 0.2); border: none; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; color: white; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: background 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">×</button>
                </div>
            </div>

            <div style="padding: 24px; max-height: 70vh; overflow-y: auto;">
                <!-- Daily Goal Section -->
                <div id="dailyGoalSection" style="margin-bottom: 24px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1f2937; font-weight: 600;">Today's Goal</h3>
                    
                    <div id="goalDisplay" style="display: none; background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 16px;">
                        <p id="currentGoal" style="margin: 0; font-size: 15px; line-height: 1.5; color: #1f2937; font-weight: 500;"></p>
                        <button id="editGoalBtn" style="background: ${this.colors.secondary}; color: white; border: none; border-radius: 6px; padding: 10px 16px; font-size: 13px; cursor: pointer; margin-top: 12px; font-weight: 500; transition: background 0.2s ease;" onmouseover="this.style.background='#4b5563'" onmouseout="this.style.background='${this.colors.secondary}'">Edit Goal</button>
                    </div>
                    
                    <div id="goalInput">
                        <textarea id="goalTextarea" placeholder="What do you want to accomplish today? Be specific and focused..." rows="3" style="width: 100%; padding: 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; margin-bottom: 12px; resize: vertical; font-family: inherit; box-sizing: border-box; line-height: 1.4; transition: border-color 0.2s ease;" onfocus="this.style.borderColor='${this.colors.primary}'" onblur="this.style.borderColor='#d1d5db'"></textarea>
                        <button id="saveGoalBtn" style="background: ${this.colors.primary}; color: white; border: none; border-radius: 8px; padding: 12px 20px; font-size: 14px; cursor: pointer; font-weight: 500; width: 100%; transition: background 0.2s ease;" onmouseover="this.style.background='#047857'" onmouseout="this.style.background='${this.colors.primary}'">Save Goal</button>
                    </div>
                </div>

                <!-- Tab Analysis Section -->
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="margin: 0; font-size: 16px; color: #1f2937; font-weight: 600;">Tab Analysis</h3>
                        <button id="analyzeAllBtn" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 14px; font-size: 13px; cursor: pointer; color: ${this.colors.secondary}; font-weight: 500; transition: all 0.2s ease;" onmouseover="this.style.background='#f3f4f6'; this.style.borderColor='#d1d5db'" onmouseout="this.style.background='#f9fafb'; this.style.borderColor='#e5e7eb'">Analyze All Tabs</button>
                    </div>
                    
                    <div id="loadingTabs" style="display: none; text-align: center; padding: 40px 20px;">
                        <div style="border: 2px solid #f3f4f6; border-top: 2px solid ${this.colors.primary}; border-radius: 50%; width: 32px; height: 32px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
                        <p style="margin: 0; font-size: 14px; color: ${this.colors.secondary}; font-weight: 500;">Analyzing your tabs...</p>
                    </div>

                    <div id="tabsList"></div>
                </div>

                <!-- Quick Actions -->
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #1f2937; font-weight: 600;">Quick Actions</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <button id="analyzeCurrentBtn" style="background: ${this.colors.primary}; color: white; border: none; border-radius: 8px; padding: 12px 16px; font-size: 13px; cursor: pointer; font-weight: 500; transition: background 0.2s ease;" onmouseover="this.style.background='#047857'" onmouseout="this.style.background='${this.colors.primary}'">Analyze Current</button>
                        <button id="clearCacheBtn" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; font-size: 13px; cursor: pointer; color: ${this.colors.secondary}; font-weight: 500; transition: all 0.2s ease;" onmouseover="this.style.background='#f3f4f6'; this.style.borderColor='#d1d5db'" onmouseout="this.style.background='#f9fafb'; this.style.borderColor='#e5e7eb'">Clear Cache</button>
                    </div>
                </div>

                <!-- Error Display -->
                <div id="errorDisplay" style="display: none; background: #fef7f3; border: 1px solid #fed7aa; color: ${this.colors.accent}; padding: 16px; border-radius: 8px; font-size: 13px; font-weight: 500;"></div>
            </div>
        `;

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes slideIn {
                0% { 
                    opacity: 0; 
                    transform: translateX(20px);
                }
                100% { 
                    opacity: 1; 
                    transform: translateX(0px);
                }
            }
            
            @keyframes fadeIn {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
            
            .tab-item:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(this.panel);
        console.log('Panel added to DOM');
        this.setupPanelEvents();
    }

    setupPanelEvents() {
        console.log('Setting up panel events');
        
        document.getElementById('tabmind-close').addEventListener('click', () => {
            console.log('Close button clicked');
            this.hidePanel();
        });

        document.getElementById('editGoalBtn').addEventListener('click', () => {
            this.showGoalInput();
        });

        document.getElementById('saveGoalBtn').addEventListener('click', () => {
            this.saveDailyGoal();
        });

        document.getElementById('analyzeAllBtn').addEventListener('click', () => {
            this.analyzeAllTabs();
        });

        document.getElementById('analyzeCurrentBtn').addEventListener('click', () => {
            this.analyzeCurrentTab();
        });

        document.getElementById('clearCacheBtn').addEventListener('click', () => {
            this.clearCache();
        });
    }

    async showPanel() {
        console.log('showPanel called');
        
        if (!this.panel) {
            console.log('Panel does not exist, creating it');
            await this.createPanel();
        }
        
        console.log('Setting panel display to block');
        this.panel.style.display = 'block';
        this.panel.style.animation = 'slideIn 0.3s ease-out';
        this.isVisible = true;
        
        console.log('Panel should now be visible');
        
        // Load data after showing panel
        await this.loadDailyGoal();
        await this.loadTabs();
    }

    hidePanel() {
        console.log('hidePanel called');
        if (this.panel) {
            this.panel.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                this.panel.style.display = 'none';
                this.isVisible = false;
                console.log('Panel hidden');
            }, 300);
        }
    }

    async loadDailyGoal() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'GET_DAILY_GOAL' });
            if (response && response.goal) {
                this.showGoalDisplay(response.goal);
            } else {
                this.showGoalInput();
            }
        } catch (error) {
            console.error('Error loading daily goal:', error);
            this.showGoalInput();
        }
    }

    async saveDailyGoal() {
        try {
            const goalText = document.getElementById('goalTextarea').value.trim();
            if (!goalText) {
                this.showError('Please enter a goal for today');
                return;
            }

            // Add loading state
            const saveBtn = document.getElementById('saveGoalBtn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;

            await chrome.runtime.sendMessage({ 
                type: 'SET_DAILY_GOAL', 
                goal: goalText 
            });
            
            this.showGoalDisplay(goalText);
            this.showFeedback('Goal saved successfully');
            
            // Reset button
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        } catch (error) {
            console.error('Error saving daily goal:', error);
            this.showError('Failed to save goal');
            
            // Reset button
            const saveBtn = document.getElementById('saveGoalBtn');
            saveBtn.textContent = 'Save Goal';
            saveBtn.disabled = false;
        }
    }

    showGoalDisplay(goal) {
        document.getElementById('goalInput').style.display = 'none';
        document.getElementById('goalDisplay').style.display = 'block';
        document.getElementById('goalDisplay').style.animation = 'fadeIn 0.3s ease-out';
        document.getElementById('currentGoal').textContent = goal;
    }

    showGoalInput() {
        document.getElementById('goalDisplay').style.display = 'none';
        document.getElementById('goalInput').style.display = 'block';
        document.getElementById('goalInput').style.animation = 'fadeIn 0.3s ease-out';
        setTimeout(() => {
            document.getElementById('goalTextarea').focus();
        }, 100);
    }

    async loadTabs() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'GET_ALL_TABS' });
            if (response && response.tabs) {
                this.displayTabs(response.tabs);
            }
        } catch (error) {
            console.error('Error loading tabs:', error);
            this.showError('Failed to load tabs');
        }
    }

    async displayTabs(tabs) {
        const tabsList = document.getElementById('tabsList');
        if (!tabsList) return;

        // Get daily goal and analyses from background
        const response = await chrome.runtime.sendMessage({ type: 'GET_TAB_DATA' });
        const dailyGoal = response?.goal || 'No goal set';
        const analyses = response?.analyses || {};

        let html = '';
        let criticalCount = 0;
        let laterCount = 0;
        let distractionCount = 0;

        // Add goal context
        html += `
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <div style="font-weight: 600; font-size: 12px; color: ${this.colors.secondary}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Current Goal</div>
                <div style="font-size: 14px; color: #1f2937; line-height: 1.4;">${this.escapeHtml(dailyGoal)}</div>
            </div>
        `;

        for (const tab of tabs) {
            const analysis = analyses[tab.id];
            const priorityClass = analysis?.priority || 'later';
            const priorityColor = this.getPriorityColor(priorityClass);

            if (priorityClass === 'critical') criticalCount++;
            else if (priorityClass === 'later') laterCount++;
            else if (priorityClass === 'distraction') distractionCount++;

            html += `
                <div class="tab-item" style="border: 1px solid ${priorityColor}; border-radius: 8px; padding: 16px; margin-bottom: 12px; transition: all 0.2s ease; background: white;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="flex: 1; margin-right: 12px;">
                            <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #1f2937; font-weight: 600; line-height: 1.3;">${this.escapeHtml(tab.title)}</h4>
                            <div style="font-size: 11px; font-weight: 500; color: ${priorityColor}; text-transform: uppercase; letter-spacing: 0.5px;">${priorityClass}</div>
                        </div>
                        <div style="display: flex; gap: 4px; flex-shrink: 0;">
                            <button onclick="window.tabmindFloating.pinTab(${tab.id})" style="background: ${this.colors.primary}; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 10px; cursor: pointer; font-weight: 500;">Pin</button>
                            <button onclick="window.tabmindFloating.saveForLater(${tab.id})" style="background: ${this.colors.secondary}; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 10px; cursor: pointer; font-weight: 500;">Save</button>
                            <button onclick="window.tabmindFloating.closeTab(${tab.id})" style="background: ${this.colors.accent}; color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 10px; cursor: pointer; font-weight: 500;">Close</button>
                        </div>
                    </div>
                    
                    <p style="margin: 0 0 8px 0; font-size: 11px; color: ${this.colors.secondary}; word-break: break-all;">${this.escapeHtml(tab.url)}</p>
                    
                    ${analysis ? `
                        <div style="background: #f9fafb; border-radius: 6px; padding: 12px; border-left: 3px solid ${priorityColor};">
                            <div style="font-weight: 500; font-size: 12px; color: #1f2937; margin-bottom: 6px;">${this.escapeHtml(analysis.intent)}</div>
                            <div style="font-size: 11px; color: ${this.colors.secondary}; margin-bottom: 4px;">
                                <span style="font-weight: 500;">Project:</span> ${this.escapeHtml(analysis.project)}
                            </div>
                            <div style="font-size: 11px; color: ${this.colors.secondary};">
                                <span style="font-weight: 500;">Next:</span> ${this.escapeHtml(analysis.next_action)}
                            </div>
                        </div>
                    ` : `
                        <div style="background: #f9fafb; border-radius: 6px; padding: 12px; text-align: center;">
                            <div style="font-size: 11px; color: ${this.colors.secondary};">Click 'Analyze All Tabs' for insights</div>
                        </div>
                    `}
                </div>
            `;
        }

        // Add summary
        if (criticalCount > 0 || distractionCount > 0 || laterCount > 0) {
            html += `
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 16px; text-align: center;">
                    <div style="font-size: 12px; color: ${this.colors.secondary}; font-weight: 500; margin-bottom: 8px;">Summary</div>
                    <div style="display: flex; justify-content: center; gap: 16px;">
                        <span style="color: ${this.colors.accent}; font-weight: 600;">${criticalCount} Critical</span>
                        <span style="color: ${this.colors.secondary}; font-weight: 600;">${laterCount} Later</span>
                        <span style="color: ${this.colors.secondary}; font-weight: 600;">${distractionCount} Distractions</span>
                    </div>
                </div>
            `;
        }

        tabsList.innerHTML = html;
        tabsList.style.animation = 'fadeIn 0.3s ease-out';
    }

    getPriorityColor(priority) {
        const colors = {
            'critical': this.colors.accent,
            'later': this.colors.secondary,
            'distraction': this.colors.secondary
        };
        return colors[priority] || this.colors.secondary;
    }

    async analyzeAllTabs() {
        try {
            const analyzeBtn = document.getElementById('analyzeAllBtn');
            analyzeBtn.textContent = 'Analyzing...';
            analyzeBtn.disabled = true;

            document.getElementById('loadingTabs').style.display = 'block';
            document.getElementById('tabsList').style.display = 'none';

            await chrome.runtime.sendMessage({ type: 'ANALYZE_ALL_TABS' });
            
            setTimeout(async () => {
                document.getElementById('loadingTabs').style.display = 'none';
                document.getElementById('tabsList').style.display = 'block';
                await this.loadTabs();
                this.showFeedback('All tabs analyzed');
                
                analyzeBtn.textContent = 'Analyze All Tabs';
                analyzeBtn.disabled = false;
            }, 3000);

        } catch (error) {
            console.error('Error analyzing all tabs:', error);
            this.showError('Failed to analyze tabs');
            
            document.getElementById('loadingTabs').style.display = 'none';
            document.getElementById('tabsList').style.display = 'block';
            
            const analyzeBtn = document.getElementById('analyzeAllBtn');
            analyzeBtn.textContent = 'Analyze All Tabs';
            analyzeBtn.disabled = false;
        }
    }

    async analyzeCurrentTab() {
        try {
            const analyzeBtn = document.getElementById('analyzeCurrentBtn');
            analyzeBtn.textContent = 'Analyzing...';
            analyzeBtn.disabled = true;

            await chrome.runtime.sendMessage({ type: 'ANALYZE_CURRENT_TAB' });
            
            setTimeout(async () => {
                await this.loadTabs();
                this.showFeedback('Current tab analyzed');
                
                analyzeBtn.textContent = 'Analyze Current';
                analyzeBtn.disabled = false;
            }, 1500);
            
        } catch (error) {
            console.error('Error analyzing current tab:', error);
            this.showError('Failed to analyze current tab');
            
            const analyzeBtn = document.getElementById('analyzeCurrentBtn');
            analyzeBtn.textContent = 'Analyze Current';
            analyzeBtn.disabled = false;
        }
    }

    async clearCache() {
        try {
            await chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' });
            this.showFeedback('Cache cleared');
            await this.loadTabs();
        } catch (error) {
            console.error('Error clearing cache:', error);
            this.showError('Failed to clear cache');
        }
    }

    async closeTab(tabId) {
        try {
            await chrome.runtime.sendMessage({ type: 'CLOSE_TAB', tabId });
            await this.loadTabs();
            this.showFeedback('Tab closed');
        } catch (error) {
            console.error('Error closing tab:', error);
            this.showError('Failed to close tab');
        }
    }

    async pinTab(tabId) {
        try {
            await chrome.runtime.sendMessage({ type: 'PIN_TAB', tabId });
            this.showFeedback('Tab pinned');
        } catch (error) {
            console.error('Error pinning tab:', error);
            this.showError('Failed to pin tab');
        }
    }

    async saveForLater(tabId) {
        try {
            await chrome.runtime.sendMessage({ type: 'SAVE_TAB_FOR_LATER', tabId });
            await this.loadTabs();
            this.showFeedback('Tab saved for later');
        } catch (error) {
            console.error('Error saving tab for later:', error);
            this.showError('Failed to save tab');
        }
    }

    showFeedback(message) {
        const feedback = document.createElement('div');
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${this.colors.primary};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;
        
        document.body.appendChild(feedback);
        setTimeout(() => {
            if (document.body.contains(feedback)) {
                document.body.removeChild(feedback);
            }
        }, 2500);
    }

    showError(message) {
        const errorDisplay = document.getElementById('errorDisplay');
        if (errorDisplay) {
            errorDisplay.textContent = message;
            errorDisplay.style.display = 'block';
            errorDisplay.style.animation = 'fadeIn 0.3s ease-out';
            
            setTimeout(() => {
                errorDisplay.style.animation = 'fadeIn 0.3s ease-out reverse';
                setTimeout(() => {
                    errorDisplay.style.display = 'none';
                }, 300);
            }, 4000);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Make the class available globally
window.TabMindFloatingPanel = TabMindFloatingPanel;
console.log('TabMindFloatingPanel class defined and made globally available');
 