// Content Script for TabMind
// Extracts page content and provides floating icon

// Use the exact color palette provided by user
const COLORS = {
    primary: '#1B3C53',    // Dark blue
    secondary: '#456882',  // Medium blue  
    tertiary: '#D2C1B6',   // Warm beige
    background: '#F9F3EF'  // Light cream
};

// TabMind Floating Panel - Embedded directly to avoid loading issues
class TabMindFloatingPanel {
    constructor() {
        this.isVisible = false;
        this.panel = null;
        this.isInitialized = false;
        this.analysisProgress = { total: 0, completed: 0, current: '' };
        this.hasGoal = false;
        this.allTabs = [];
        this.filteredTabs = [];
        this.undoStack = [];
        this.focusMode = false;
        this.goalOutcome = '';
        this.goalMinimum = '';
        console.log('TabMind copilot initialized');
    }

    async init() {
        if (this.isInitialized) return;
        console.log('Initializing TabMind decision copilot');
        this.isInitialized = true;
        this.addCustomStyles();
    }

    addCustomStyles() {
        // Add custom focus styles to override native blue
        const customStyles = document.createElement('style');
        customStyles.textContent = `
            /* Custom focus styles for TabMind */
            #tabmind-panel input:focus,
            #tabmind-panel textarea:focus,
            #tabmind-panel button:focus {
                outline: 2px solid ${COLORS.primary} !important;
                outline-offset: 2px !important;
                border-color: ${COLORS.primary} !important;
                box-shadow: 0 0 0 3px rgba(27, 60, 83, 0.1) !important;
            }
            
            #tabmind-panel input:focus-visible,
            #tabmind-panel textarea:focus-visible,
            #tabmind-panel button:focus-visible {
                outline: 2px solid ${COLORS.primary} !important;
                outline-offset: 2px !important;
            }
            
            /* Remove default browser focus styles */
            #tabmind-panel *:focus {
                outline: none !important;
            }
            
            /* Custom focus for form elements */
            #tabmind-panel input[type="text"],
            #tabmind-panel textarea {
                transition: all 0.2s ease !important;
            }
            
            #tabmind-panel input[type="text"]:focus,
            #tabmind-panel textarea:focus {
                border-color: ${COLORS.primary} !important;
                box-shadow: 0 0 0 3px rgba(27, 60, 83, 0.1) !important;
            }

            /* Goal Clarity Modal */
            .goal-clarity-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000000;
                animation: fadeIn 0.3s ease-out;
            }

            .goal-clarity-content {
                background: white;
                border-radius: 12px;
                padding: 32px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.3s ease-out;
            }
        `;
        document.head.appendChild(customStyles);
    }

    async createPanel() {
        if (this.panel) {
            console.log('Panel already exists');
            return;
        }
        
        console.log('Creating decision copilot panel');
        this.panel = document.createElement('div');
        this.panel.id = 'tabmind-panel';
        
        Object.assign(this.panel.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '420px',
            maxHeight: '85vh',
            backgroundColor: COLORS.background,
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(27, 60, 83, 0.15)',
            zIndex: '999998',
            display: 'none',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '14px',
            overflow: 'hidden',
            border: `1px solid ${COLORS.tertiary}`
        });

        this.panel.innerHTML = `
            <!-- Header -->
            <div style="background: ${COLORS.primary}; padding: 24px; color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="margin: 0; font-size: 20px; font-weight: 600;">TabMind</h2>
                        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Your decision copilot</p>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button id="focusModeToggle" style="background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 6px; padding: 6px 12px; font-size: 11px; cursor: pointer; font-weight: 500; transition: background 0.2s ease;">Focus Mode</button>
                    </div>
                </div>
            </div>

            <div style="padding: 24px; max-height: 70vh; overflow-y: auto;">
                <!-- Daily Goal Section -->
                <div id="dailyGoalSection" style="margin-bottom: 24px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 16px; color: ${COLORS.primary}; font-weight: 600;">What Will You Ship Today?</h3>
                    
                    <div id="goalDisplay" style="display: none; background: ${COLORS.background}; padding: 20px; border-radius: 8px; border: 1px solid ${COLORS.tertiary}; margin-bottom: 16px;">
                        <p id="currentGoal" style="margin: 0; font-size: 15px; line-height: 1.5; color: ${COLORS.primary}; font-weight: 500;"></p>
                        <div id="goalDetails" style="margin-top: 12px; display: none;">
                            <div style="background: rgba(27, 60, 83, 0.05); padding: 12px; border-radius: 6px; margin-bottom: 8px;">
                                <div style="font-size: 11px; font-weight: 600; color: ${COLORS.secondary}; text-transform: uppercase; margin-bottom: 4px;">Target Outcome</div>
                                <div id="goalOutcomeText" style="font-size: 13px; color: ${COLORS.primary};"></div>
                            </div>
                            <div style="background: rgba(27, 60, 83, 0.05); padding: 12px; border-radius: 6px;">
                                <div style="font-size: 11px; font-weight: 600; color: ${COLORS.secondary}; text-transform: uppercase; margin-bottom: 4px;">Minimum Viable Result</div>
                                <div id="goalMinimumText" style="font-size: 13px; color: ${COLORS.primary};"></div>
                            </div>
                        </div>
                        <button id="editGoalBtn" style="background: ${COLORS.secondary}; color: white; border: none; border-radius: 6px; padding: 10px 16px; font-size: 13px; cursor: pointer; margin-top: 12px; font-weight: 500; transition: background 0.2s ease;" onmouseover="this.style.background='#3a5a7a'" onmouseout="this.style.background='${COLORS.secondary}'">Refine Goal</button>
                    </div>
                    
                    <div id="goalInput">
                        <textarea id="goalTextarea" placeholder="What's the ONE thing you want to ship today? Be specific and focused..." rows="3" style="width: 100%; padding: 16px; border: 1px solid ${COLORS.tertiary}; border-radius: 8px; font-size: 14px; margin-bottom: 12px; resize: vertical; font-family: inherit; box-sizing: border-box; line-height: 1.4; transition: border-color 0.2s ease; background: ${COLORS.background};"></textarea>
                        <button id="saveGoalBtn" style="background: ${COLORS.primary}; color: white; border: none; border-radius: 8px; padding: 12px 20px; font-size: 14px; cursor: pointer; font-weight: 500; width: 100%; transition: background 0.2s ease;" onmouseover="this.style.background='#0f2d42'" onmouseout="this.style.background='${COLORS.primary}'">Ship This Goal 🚀</button>
                    </div>
                </div>

                <!-- Focus Mode Banner -->
                <div id="focusModeBanner" style="display: none; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                    <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px;">🎯 CRUSH IT TODAY MODE</div>
                    <div style="font-size: 13px; opacity: 0.9;">Only your top 3 critical actions. No distractions.</div>
                </div>

                <!-- Tab Analysis Section -->
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="margin: 0; font-size: 16px; color: ${COLORS.primary}; font-weight: 600;">Decision Engine</h3>
                        <button id="analyzeAllBtn" style="background: ${COLORS.background}; border: 1px solid ${COLORS.tertiary}; border-radius: 6px; padding: 8px 14px; font-size: 13px; cursor: pointer; color: ${COLORS.secondary}; font-weight: 500; transition: all 0.2s ease;" onmouseover="this.style.background='${COLORS.tertiary}'; this.style.borderColor='${COLORS.secondary}'" onmouseout="this.style.background='${COLORS.background}'; this.style.borderColor='${COLORS.tertiary}'">Analyze All Tabs</button>
                    </div>
                    
                    <!-- Search Bar -->
                    <div style="margin-bottom: 16px;">
                        <input type="text" id="tabSearch" placeholder="Find tabs by intent, project, or action..." style="width: 100%; padding: 12px 16px; border: 1px solid ${COLORS.tertiary}; border-radius: 8px; font-size: 14px; font-family: inherit; box-sizing: border-box; background: ${COLORS.background}; transition: border-color 0.2s ease;">
                        <div id="searchResults" style="margin-top: 8px; font-size: 12px; color: ${COLORS.secondary};"></div>
                    </div>
                    
                    <!-- Undo Section -->
                    <div id="undoSection" style="display: none; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span id="undoMessage" style="font-size: 13px; color: #856404; font-weight: 500;"></span>
                            <div style="display: flex; gap: 8px;">
                                <button id="undoBtn" style="background: #6c757d; color: white; border: none; border-radius: 4px; padding: 4px 12px; font-size: 11px; cursor: pointer; font-weight: 500;">Undo</button>
                                <button id="dismissUndoBtn" style="background: transparent; color: #856404; border: none; cursor: pointer; font-size: 16px; padding: 0 4px;">×</button>
                            </div>
                        </div>
                    </div>
                    
                    <div id="noGoalMessage" style="display: none; text-align: center; padding: 40px 20px; background: ${COLORS.background}; border: 1px solid ${COLORS.tertiary}; border-radius: 8px;">
                        <p style="margin: 0; font-size: 14px; color: ${COLORS.secondary}; font-weight: 500;">Set your shipping goal first to unlock tab insights</p>
                    </div>
                    
                    <div id="loadingTabs" style="display: none; text-align: center; padding: 40px 20px;">
                        <div style="border: 2px solid ${COLORS.tertiary}; border-top: 2px solid ${COLORS.primary}; border-radius: 50%; width: 32px; height: 32px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
                        <p id="analysisProgress" style="margin: 0; font-size: 14px; color: ${COLORS.secondary}; font-weight: 500;">Analyzing your decision context...</p>
                        <div id="progressDetails" style="margin-top: 8px; font-size: 12px; color: ${COLORS.secondary};">Finding what matters...</div>
                    </div>

                    <div id="tabsList"></div>
                </div>

                <!-- Quick Actions -->
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 16px; color: ${COLORS.primary}; font-weight: 600;">Instant Actions</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                        <button id="analyzeCurrentBtn" style="background: ${COLORS.primary}; color: white; border: none; border-radius: 8px; padding: 10px 12px; font-size: 12px; cursor: pointer; font-weight: 500; transition: background 0.2s ease;" onmouseover="this.style.background='#0f2d42'" onmouseout="this.style.background='${COLORS.primary}'">Analyze This Tab</button>
                        <button id="runAutomationBtn" style="background: #059669; color: white; border: none; border-radius: 8px; padding: 10px 12px; font-size: 12px; cursor: pointer; font-weight: 500; transition: background 0.2s ease;" onmouseover="this.style.background='#047857'" onmouseout="this.style.background='#059669'">🤖 Auto-Manage</button>
                        <button id="clearCacheBtn" style="background: ${COLORS.background}; border: 1px solid ${COLORS.tertiary}; border-radius: 8px; padding: 10px 12px; font-size: 12px; cursor: pointer; color: ${COLORS.secondary}; font-weight: 500; transition: all 0.2s ease;" onmouseover="this.style.background='${COLORS.tertiary}'; this.style.borderColor='${COLORS.secondary}'" onmouseout="this.style.background='${COLORS.background}'; this.style.borderColor='${COLORS.tertiary}'">Fresh Start</button>
                    </div>
                </div>

                <!-- Error Display -->
                <div id="errorDisplay" style="display: none; background: #fef7f3; border: 1px solid #fed7aa; color: #d97706; padding: 16px; border-radius: 8px; font-size: 13px; font-weight: 500;"></div>
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
                box-shadow: 0 4px 12px rgba(27, 60, 83, 0.1);
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(this.panel);
        console.log('Decision copilot panel created');
        this.setupPanelEvents();
    }

    createGoalClarityModal() {
        const modal = document.createElement('div');
        modal.className = 'goal-clarity-modal';
        modal.innerHTML = `
            <div class="goal-clarity-content">
                <h2 style="margin: 0 0 24px 0; font-size: 24px; color: ${COLORS.primary}; font-weight: 600; text-align: center;">🎯 Let's Get Crystal Clear</h2>
                
                <div style="margin-bottom: 24px;">
                    <label style="display: block; font-size: 14px; color: ${COLORS.primary}; font-weight: 600; margin-bottom: 8px;">
                        What specific OUTCOME do you want by end of day?
                    </label>
                    <input type="text" id="clarityOutcome" placeholder="e.g., Live MVP with working payments, 3 user signups, pitch deck sent..." style="width: 100%; padding: 12px 16px; border: 1px solid ${COLORS.tertiary}; border-radius: 8px; font-size: 14px; font-family: inherit; box-sizing: border-box; background: ${COLORS.background};">
                </div>

                <div style="margin-bottom: 32px;">
                    <label style="display: block; font-size: 14px; color: ${COLORS.primary}; font-weight: 600; margin-bottom: 8px;">
                        What's the BARE MINIMUM that still counts as success?
                    </label>
                    <input type="text" id="clarityMinimum" placeholder="e.g., Landing page live, payment button works, one real user test..." style="width: 100%; padding: 12px 16px; border: 1px solid ${COLORS.tertiary}; border-radius: 8px; font-size: 14px; font-family: inherit; box-sizing: border-box; background: ${COLORS.background};">
                </div>

                <div style="display: flex; gap: 12px;">
                    <button id="skipClarityBtn" style="flex: 1; background: ${COLORS.background}; border: 1px solid ${COLORS.tertiary}; color: ${COLORS.secondary}; border-radius: 8px; padding: 12px; font-size: 14px; cursor: pointer; font-weight: 500;">Skip for Now</button>
                    <button id="saveClarityBtn" style="flex: 2; background: ${COLORS.primary}; color: white; border: none; border-radius: 8px; padding: 12px; font-size: 14px; cursor: pointer; font-weight: 500;">Lock & Load 🚀</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('skipClarityBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.proceedWithGoal();
        });

        document.getElementById('saveClarityBtn').addEventListener('click', () => {
            this.goalOutcome = document.getElementById('clarityOutcome').value.trim();
            this.goalMinimum = document.getElementById('clarityMinimum').value.trim();
            document.body.removeChild(modal);
            this.saveGoalClarity();
        });

        // Focus first input
        setTimeout(() => {
            document.getElementById('clarityOutcome').focus();
        }, 100);
    }

    async saveGoalClarity() {
        try {
            // Save the enhanced goal data
            await chrome.runtime.sendMessage({ 
                type: 'SET_GOAL_CLARITY',
                outcome: this.goalOutcome,
                minimum: this.goalMinimum
            });
            
            this.proceedWithGoal();
            this.showFeedback('🎯 Goal clarity locked in! Now analyzing tabs...');
            
            // Auto-analyze after goal setting
            if (this.hasGoal) {
                setTimeout(() => {
                    this.analyzeAllTabs();
                }, 1000);
            }
        } catch (error) {
            console.error('Error saving goal clarity:', error);
            this.proceedWithGoal();
        }
    }

    proceedWithGoal() {
        this.showGoalDisplay(document.getElementById('goalTextarea').value);
        this.updateGoalDetails();
    }

    updateGoalDetails() {
        const goalDetails = document.getElementById('goalDetails');
        const outcomeText = document.getElementById('goalOutcomeText');
        const minimumText = document.getElementById('goalMinimumText');

        if (this.goalOutcome || this.goalMinimum) {
            goalDetails.style.display = 'block';
            outcomeText.textContent = this.goalOutcome || 'Not specified';
            minimumText.textContent = this.goalMinimum || 'Not specified';
        } else {
            goalDetails.style.display = 'none';
        }
    }

    toggleFocusMode() {
        this.focusMode = !this.focusMode;
        const toggle = document.getElementById('focusModeToggle');
        const banner = document.getElementById('focusModeBanner');
        
        if (this.focusMode) {
            toggle.style.background = '#dc2626';
            toggle.textContent = 'Exit Focus';
            banner.style.display = 'block';
        } else {
            toggle.style.background = 'rgba(255,255,255,0.2)';
            toggle.textContent = 'Focus Mode';
            banner.style.display = 'none';
        }
        
        this.displayCurrentTabs();
    }

    addToUndoStack(action) {
        this.undoStack.push(action);
        // Keep only last 5 actions
        if (this.undoStack.length > 5) {
            this.undoStack.shift();
        }
    }

    showUndoNotification(message) {
        const undoSection = document.getElementById('undoSection');
        const undoMessage = document.getElementById('undoMessage');
        
        if (undoSection && undoMessage) {
            undoMessage.textContent = message;
            undoSection.style.display = 'block';
            undoSection.style.animation = 'fadeIn 0.3s ease-out';
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                this.hideUndoNotification();
            }, 10000);
        }
    }

    hideUndoNotification() {
        const undoSection = document.getElementById('undoSection');
        if (undoSection) {
            undoSection.style.display = 'none';
        }
    }

    async performUndo() {
        if (this.undoStack.length === 0) return;
        
        const lastAction = this.undoStack.pop();
        
        try {
            switch (lastAction.type) {
                case 'CLOSE_TAB':
                    await chrome.runtime.sendMessage({ 
                        type: 'REOPEN_TAB', 
                        url: lastAction.data.url,
                        title: lastAction.data.title 
                    });
                    this.showFeedback('Tab restored');
                    break;
                    
                case 'PIN_TAB':
                    await chrome.runtime.sendMessage({ 
                        type: 'UNPIN_TAB', 
                        tabId: lastAction.data.tabId 
                    });
                    this.showFeedback('Tab unpinned');
                    break;
                    
                case 'SAVE_TAB':
                    await chrome.runtime.sendMessage({ 
                        type: 'RESTORE_TAB', 
                        url: lastAction.data.url,
                        title: lastAction.data.title 
                    });
                    this.showFeedback('Tab restored');
                    break;
                    
                case 'DELEGATE_TAB':
                    // Reopen delegated tab and remove delegation record
                    await chrome.runtime.sendMessage({ 
                        type: 'REOPEN_TAB', 
                        url: lastAction.data.url,
                        title: lastAction.data.title 
                    });
                    await chrome.runtime.sendMessage({
                        type: 'REMOVE_DELEGATION',
                        url: lastAction.data.url
                    });
                    this.showFeedback('Delegation undone');
                    break;
            }
            
            this.hideUndoNotification();
            setTimeout(() => {
                this.loadTabs();
            }, 500);
            
        } catch (error) {
            console.error('Error performing undo:', error);
            this.showError('Failed to undo action');
        }
    }

    updateAnalysisProgress(completed, total, currentTask) {
        this.analysisProgress = { completed, total, current: currentTask };
        
        const progressElement = document.getElementById('analysisProgress');
        const detailsElement = document.getElementById('progressDetails');
        
        if (progressElement) {
            progressElement.textContent = `Analyzing decision context (${completed}/${total})...`;
        }
        
        if (detailsElement) {
            detailsElement.textContent = currentTask;
        }
    }

    updateAnalysisButtonsState() {
        const analyzeAllBtn = document.getElementById('analyzeAllBtn');
        const analyzeCurrentBtn = document.getElementById('analyzeCurrentBtn');
        const noGoalMessage = document.getElementById('noGoalMessage');
        const tabsList = document.getElementById('tabsList');
        
        if (this.hasGoal) {
            // Enable analysis buttons
            if (analyzeAllBtn) {
                analyzeAllBtn.disabled = false;
                analyzeAllBtn.style.opacity = '1';
                analyzeAllBtn.style.cursor = 'pointer';
            }
            if (analyzeCurrentBtn) {
                analyzeCurrentBtn.disabled = false;
                analyzeCurrentBtn.style.opacity = '1';
                analyzeCurrentBtn.style.cursor = 'pointer';
            }
            if (noGoalMessage) noGoalMessage.style.display = 'none';
            if (tabsList) tabsList.style.display = 'block';
        } else {
            // Disable analysis buttons
            if (analyzeAllBtn) {
                analyzeAllBtn.disabled = true;
                analyzeAllBtn.style.opacity = '0.5';
                analyzeAllBtn.style.cursor = 'not-allowed';
            }
            if (analyzeCurrentBtn) {
                analyzeCurrentBtn.disabled = true;
                analyzeCurrentBtn.style.opacity = '0.5';
                analyzeCurrentBtn.style.cursor = 'not-allowed';
            }
            if (noGoalMessage) noGoalMessage.style.display = 'block';
            if (tabsList) tabsList.style.display = 'none';
        }
    }

    setupPanelEvents() {
        console.log('Setting up copilot events');

        document.getElementById('editGoalBtn').addEventListener('click', () => {
            this.showGoalInput();
        });

        document.getElementById('saveGoalBtn').addEventListener('click', () => {
            this.saveDailyGoal();
        });

        document.getElementById('focusModeToggle').addEventListener('click', () => {
            this.toggleFocusMode();
        });

        document.getElementById('analyzeAllBtn').addEventListener('click', () => {
            if (this.hasGoal) {
                this.analyzeAllTabs();
            }
        });

        document.getElementById('analyzeCurrentBtn').addEventListener('click', () => {
            if (this.hasGoal) {
                this.analyzeCurrentTab();
            }
        });

        document.getElementById('clearCacheBtn').addEventListener('click', () => {
            this.clearCache();
        });

        document.getElementById('runAutomationBtn').addEventListener('click', async () => {
            try {
                this.showFeedback('🤖 Running automation...');
                await chrome.runtime.sendMessage({ type: 'TRIGGER_AUTOMATION' });
                this.showFeedback('🤖 Automation completed!');
                
                // Refresh the display to reflect changes
                setTimeout(() => {
                    this.loadTabs();
                }, 1000);
            } catch (error) {
                console.error('Error running automation:', error);
                this.showError('Failed to run automation');
            }
        });

        // Search functionality
        document.getElementById('tabSearch').addEventListener('input', (e) => {
            this.searchTabs(e.target.value);
        });

        // Undo functionality
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.performUndo();
        });

        document.getElementById('dismissUndoBtn').addEventListener('click', () => {
            this.hideUndoNotification();
        });
    }

    searchTabs(query) {
        if (!query.trim()) {
            this.filteredTabs = this.allTabs;
            this.displayCurrentTabs();
            document.getElementById('searchResults').textContent = '';
            return;
        }

        const searchTerm = query.toLowerCase().trim();
        
        this.filteredTabs = this.allTabs.filter(tabData => {
            const tab = tabData.tab;
            const analysis = tabData.analysis;
            
            // Search in title
            if (tab.title && tab.title.toLowerCase().includes(searchTerm)) return true;
            
            // Search in URL
            if (tab.url && tab.url.toLowerCase().includes(searchTerm)) return true;
            
            // Search in analysis data if available
            if (analysis) {
                if (analysis.intent && analysis.intent.toLowerCase().includes(searchTerm)) return true;
                if (analysis.project && analysis.project.toLowerCase().includes(searchTerm)) return true;
                if (analysis.next_action && analysis.next_action.toLowerCase().includes(searchTerm)) return true;
                if (analysis.reasoning && analysis.reasoning.toLowerCase().includes(searchTerm)) return true;
                if (analysis.priority && analysis.priority.toLowerCase().includes(searchTerm)) return true;
            }
            
            return false;
        });

        this.displayCurrentTabs();
        
        const resultsText = this.filteredTabs.length === 1 
            ? '1 decision point found' 
            : `${this.filteredTabs.length} decision points found`;
        document.getElementById('searchResults').textContent = resultsText;
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
            const response = await chrome.runtime.sendMessage({ type: 'GET_GOAL_CLARITY' });
            if (response && response.goal) {
                this.hasGoal = true;
                this.goalOutcome = response.outcome || '';
                this.goalMinimum = response.minimum || '';
                this.showGoalDisplay(response.goal);
                this.updateGoalDetails();
            } else {
                this.hasGoal = false;
                this.showGoalInput();
            }
            this.updateAnalysisButtonsState();
        } catch (error) {
            console.error('Error loading daily goal:', error);
            this.hasGoal = false;
            this.showGoalInput();
            this.updateAnalysisButtonsState();
        }
    }

    async saveDailyGoal() {
        try {
            const goalText = document.getElementById('goalTextarea').value.trim();
            if (!goalText) {
                this.showError('Tell me what you want to ship today');
                return;
            }

            const saveBtn = document.getElementById('saveGoalBtn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Locking in...';
            saveBtn.disabled = true;

            await chrome.runtime.sendMessage({ 
                type: 'SET_DAILY_GOAL', 
                goal: goalText 
            });
            
            this.hasGoal = true;
            
            // Show goal clarity modal for enhanced goal setting
            this.createGoalClarityModal();
            
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            this.updateAnalysisButtonsState();
        } catch (error) {
            console.error('Error saving daily goal:', error);
            this.showError('Failed to save goal');
            
            const saveBtn = document.getElementById('saveGoalBtn');
            saveBtn.textContent = 'Ship This Goal 🚀';
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
                await this.prepareTabs(response.tabs);
                this.displayCurrentTabs();
            }
        } catch (error) {
            console.error('Error loading tabs:', error);
            this.showError('Failed to load tabs');
        }
    }

    async prepareTabs(tabs) {
        const response = await chrome.runtime.sendMessage({ type: 'GET_TAB_DATA' });
        const analyses = response?.analyses || {};

        this.allTabs = tabs.map(tab => ({
            tab: tab,
            analysis: analyses[tab.id]
        }));
        
        this.filteredTabs = this.allTabs;
    }

    displayCurrentTabs() {
        const tabsList = document.getElementById('tabsList');
        if (!tabsList) return;

        const dailyGoal = this.hasGoal ? document.getElementById('currentGoal')?.textContent || 'No goal set' : 'No goal set';

        // Group tabs by priority for better visual organization
        const groupedTabs = {
            critical: [],
            later: [],
            distraction: [],
            unanalyzed: []
        };

        this.filteredTabs.forEach(tabData => {
            const priority = tabData.analysis?.priority || 'unanalyzed';
            if (groupedTabs[priority]) {
                groupedTabs[priority].push(tabData);
            } else {
                groupedTabs.unanalyzed.push(tabData);
            }
        });

        // In focus mode, only show top 3 critical tabs
        if (this.focusMode) {
            const criticalTabs = groupedTabs.critical.slice(0, 3);
            this.renderFocusMode(criticalTabs, dailyGoal);
            return;
        }

        let html = `
            <div style="background: ${COLORS.background}; border: 1px solid ${COLORS.tertiary}; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <div style="font-weight: 600; font-size: 12px; color: ${COLORS.secondary}; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Shipping Target</div>
                <div style="font-size: 14px; color: ${COLORS.primary}; line-height: 1.4;">${this.escapeHtml(dailyGoal)}</div>
            </div>
        `;

        // Display priority sections with copilot language
        const priorityConfig = {
            critical: { 
                title: '🎯 Ship Now - Critical Path', 
                color: '#dc2626', 
                bgColor: '#fef2f2',
                description: 'These tabs are blocking your shipping goal - handle immediately'
            },
            later: { 
                title: '⏰ Queue for Later - Important', 
                color: COLORS.secondary, 
                bgColor: '#f8fafc',
                description: 'Valuable but not blocking your main goal - schedule these'
            },
            distraction: { 
                title: '🚫 Distractions - Consider Closing', 
                color: '#6b7280', 
                bgColor: '#f9fafb',
                description: 'These are pulling you away from shipping - safe to close'
            },
            unanalyzed: { 
                title: '📋 Need Decision - Not Analyzed', 
                color: COLORS.tertiary, 
                bgColor: COLORS.background,
                description: 'Run analysis to get clear next actions'
            }
        };

        Object.entries(priorityConfig).forEach(([priority, config]) => {
            const tabs = groupedTabs[priority];
            if (tabs.length > 0) {
                html += this.renderPrioritySection(priority, config, tabs);
            }
        });

        // Enhanced summary with action language
        const totalTabs = this.filteredTabs.length;
        if (totalTabs > 0) {
            html += `
                <div style="background: ${COLORS.background}; border: 1px solid ${COLORS.tertiary}; border-radius: 8px; padding: 16px; margin-top: 16px; text-align: center;">
                    <div style="font-size: 12px; color: ${COLORS.secondary}; font-weight: 500; margin-bottom: 8px;">Decision Summary</div>
                    <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
                        <span style="color: #dc2626; font-weight: 600;">${groupedTabs.critical.length} to Ship</span>
                        <span style="color: ${COLORS.secondary}; font-weight: 600;">${groupedTabs.later.length} Queued</span>
                        <span style="color: #6b7280; font-weight: 600;">${groupedTabs.distraction.length} Distracting</span>
                        <span style="color: ${COLORS.tertiary}; font-weight: 600;">${groupedTabs.unanalyzed.length} Undecided</span>
                    </div>
                </div>
            `;
        }

        tabsList.innerHTML = html;
        tabsList.style.animation = 'fadeIn 0.3s ease-out';
        this.setupTabButtons();
    }

    renderFocusMode(criticalTabs, dailyGoal) {
        const tabsList = document.getElementById('tabsList');
        
        let html = `
            <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center;">
                <div style="font-weight: 600; font-size: 18px; margin-bottom: 8px;">🎯 YOUR TOP 3 CRITICAL ACTIONS</div>
                <div style="font-size: 13px; opacity: 0.9;">${this.escapeHtml(dailyGoal)}</div>
            </div>
        `;

        if (criticalTabs.length === 0) {
            html += `
                <div style="text-align: center; padding: 40px; background: ${COLORS.background}; border-radius: 8px;">
                    <div style="font-size: 16px; color: ${COLORS.primary}; margin-bottom: 8px;">🎉 No critical actions found!</div>
                    <div style="font-size: 14px; color: ${COLORS.secondary};">Either analyze more tabs or you're ready to ship!</div>
                </div>
            `;
        } else {
            criticalTabs.forEach((tabData, index) => {
                const tab = tabData.tab;
                const analysis = tabData.analysis;
                
                html += `
                    <div style="background: white; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 12px;">
                            <div style="flex: 1;">
                                <div style="font-size: 18px; font-weight: 600; color: #dc2626; margin-bottom: 4px;">
                                    ${index + 1}. ${this.escapeHtml(tab.title)}
                                </div>
                                <div style="font-size: 12px; color: ${COLORS.secondary}; margin-bottom: 12px;">${this.escapeHtml(tab.url)}</div>
                            </div>
                        </div>
                        
                        ${analysis ? `
                            <div style="background: #fef2f2; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
                                <div style="font-weight: 600; font-size: 14px; color: #dc2626; margin-bottom: 8px;">
                                    🎯 ${this.escapeHtml(analysis.intent)}
                                </div>
                                <div style="font-size: 13px; color: ${COLORS.primary}; margin-bottom: 6px;">
                                    <span style="font-weight: 500;">Next Action:</span> ${this.escapeHtml(analysis.next_action)}
                                </div>
                                <div style="font-size: 12px; color: ${COLORS.secondary};">
                                    <span style="font-weight: 500;">Why Critical:</span> ${this.escapeHtml(analysis.reasoning)}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;">
                            <button class="do-now-btn" data-tab-id="${tab.id}" style="background: #dc2626; color: white; border: none; border-radius: 6px; padding: 10px; font-size: 11px; cursor: pointer; font-weight: 500;">Do Now</button>
                            <button class="do-later-btn" data-tab-id="${tab.id}" style="background: ${COLORS.secondary}; color: white; border: none; border-radius: 6px; padding: 10px; font-size: 11px; cursor: pointer; font-weight: 500;">Do Later</button>
                            <button class="delegate-btn" data-tab-id="${tab.id}" style="background: #8b5cf6; color: white; border: none; border-radius: 6px; padding: 10px; font-size: 11px; cursor: pointer; font-weight: 500;">Delegate</button>
                            <button class="reference-btn" data-tab-id="${tab.id}" style="background: #059669; color: white; border: none; border-radius: 6px; padding: 10px; font-size: 11px; cursor: pointer; font-weight: 500;">Reference</button>
                            <button class="discard-btn" data-tab-id="${tab.id}" style="background: #6b7280; color: white; border: none; border-radius: 6px; padding: 10px; font-size: 11px; cursor: pointer; font-weight: 500;">Discard</button>
                        </div>
                    </div>
                `;
            });
        }

        tabsList.innerHTML = html;
        this.setupMicroDecisionButtons();
    }

    renderPrioritySection(priority, config, tabs) {
        let html = `
            <div style="margin-bottom: 20px;">
                <div style="background: ${config.bgColor}; border: 1px solid ${config.color}; border-radius: 8px 8px 0 0; padding: 12px 16px;">
                    <h4 style="margin: 0; font-size: 14px; color: ${config.color}; font-weight: 600;">${config.title} (${tabs.length})</h4>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: ${config.color}; opacity: 0.8;">${config.description}</p>
                </div>
                <div style="border: 1px solid ${config.color}; border-top: none; border-radius: 0 0 8px 8px; overflow: hidden;">
        `;

        tabs.forEach((tabData, index) => {
            const tab = tabData.tab;
            const analysis = tabData.analysis;
            const isLast = index === tabs.length - 1;

            html += `
                <div class="tab-item" style="padding: 16px; transition: all 0.2s ease; background: white; ${!isLast ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div style="flex: 1; margin-right: 12px;">
                            <h4 style="margin: 0 0 4px 0; font-size: 14px; color: ${COLORS.primary}; font-weight: 600; line-height: 1.3;">${this.escapeHtml(tab.title)}</h4>
                            <div style="font-size: 11px; font-weight: 500; color: ${config.color}; text-transform: uppercase; letter-spacing: 0.5px;">${priority === 'unanalyzed' ? 'Needs decision' : priority}</div>
                        </div>
                        <div style="display: flex; gap: 3px; flex-shrink: 0; flex-wrap: wrap;">
                            <button class="do-now-btn" data-tab-id="${tab.id}" style="background: #dc2626; color: white; border: none; border-radius: 4px; padding: 3px 6px; font-size: 9px; cursor: pointer; font-weight: 500; margin-bottom: 2px;" title="Do Now - Essential for today">Now</button>
                            <button class="do-later-btn" data-tab-id="${tab.id}" style="background: ${COLORS.secondary}; color: white; border: none; border-radius: 4px; padding: 3px 6px; font-size: 9px; cursor: pointer; font-weight: 500; margin-bottom: 2px;" title="Do Later - Queue for later">Later</button>
                            <button class="delegate-btn" data-tab-id="${tab.id}" style="background: #8b5cf6; color: white; border: none; border-radius: 4px; padding: 3px 6px; font-size: 9px; cursor: pointer; font-weight: 500; margin-bottom: 2px;" title="Delegate - Needs someone else">Delegate</button>
                            <button class="reference-btn" data-tab-id="${tab.id}" style="background: #059669; color: white; border: none; border-radius: 4px; padding: 3px 6px; font-size: 9px; cursor: pointer; font-weight: 500; margin-bottom: 2px;" title="Reference - Keep for info">Ref</button>
                            <button class="discard-btn" data-tab-id="${tab.id}" style="background: #6b7280; color: white; border: none; border-radius: 4px; padding: 3px 6px; font-size: 9px; cursor: pointer; font-weight: 500; margin-bottom: 2px;" title="Discard - Close tab">Discard</button>
                        </div>
                    </div>
                    
                    <p style="margin: 0 0 8px 0; font-size: 11px; color: ${COLORS.secondary}; word-break: break-all;">${this.escapeHtml(tab.url)}</p>
                    
                    ${analysis ? `
                        <div style="background: #f8fafc; border-radius: 6px; padding: 12px; border-left: 3px solid ${config.color};">
                            <div style="font-weight: 500; font-size: 12px; color: ${COLORS.primary}; margin-bottom: 6px;">${this.escapeHtml(analysis.intent)}</div>
                            <div style="font-size: 11px; color: ${COLORS.secondary}; margin-bottom: 4px;">
                                <span style="font-weight: 500;">Project:</span> ${this.escapeHtml(analysis.project)}
                            </div>
                            <div style="font-size: 11px; color: ${COLORS.secondary};">
                                <span style="font-weight: 500;">Next Action:</span> ${this.escapeHtml(analysis.next_action)}
                            </div>
                        </div>
                    ` : `
                        <div style="background: #f8fafc; border-radius: 6px; padding: 12px; text-align: center;">
                            <div style="font-size: 11px; color: ${COLORS.secondary};">Get instant decision guidance</div>
                        </div>
                    `}
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    setupTabButtons() {
        // Legacy support for old button system
        this.setupMicroDecisionButtons();
        
        // Keep existing pin/save/close buttons for backward compatibility
        document.querySelectorAll('.pin-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tabId = parseInt(btn.getAttribute('data-tab-id'));
                await this.doNow(tabId);
            });
        });

        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tabId = parseInt(btn.getAttribute('data-tab-id'));
                await this.doLater(tabId);
            });
        });

        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tabId = parseInt(btn.getAttribute('data-tab-id'));
                await this.discard(tabId);
            });
        });
    }

    setupMicroDecisionButtons() {
        // Do Now buttons (Pin + Priority)
        document.querySelectorAll('.do-now-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tabId = parseInt(btn.getAttribute('data-tab-id'));
                await this.doNow(tabId);
            });
        });

        // Do Later buttons (Queue for later)
        document.querySelectorAll('.do-later-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tabId = parseInt(btn.getAttribute('data-tab-id'));
                await this.doLater(tabId);
            });
        });

        // Delegate buttons (Save with delegation note)
        document.querySelectorAll('.delegate-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tabId = parseInt(btn.getAttribute('data-tab-id'));
                await this.delegate(tabId);
            });
        });

        // Reference buttons (Pin as reference)
        document.querySelectorAll('.reference-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tabId = parseInt(btn.getAttribute('data-tab-id'));
                await this.reference(tabId);
            });
        });

        // Discard buttons (Close tab)
        document.querySelectorAll('.discard-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tabId = parseInt(btn.getAttribute('data-tab-id'));
                await this.discard(tabId);
            });
        });
    }

    async doNow(tabId) {
        try {
            console.log('Do Now action for tab:', tabId);
            
            // Find tab data for undo
            const tabData = this.allTabs.find(t => t.tab.id === tabId);
            if (tabData) {
                this.addToUndoStack({
                    type: 'PIN_TAB',
                    data: { tabId: tabId }
                });
                this.showUndoNotification(`Prioritized "${tabData.tab.title}" for immediate action`);
            }
            
            await chrome.runtime.sendMessage({ type: 'PIN_TAB', tabId });
            this.showFeedback('🎯 Pinned for immediate action');
            
            // Reload tabs after a short delay to show updated pin status
            setTimeout(async () => {
                await this.loadTabs();
            }, 500);
        } catch (error) {
            console.error('Error with Do Now action:', error);
            this.showError('Failed to prioritize tab');
        }
    }

    async doLater(tabId) {
        try {
            console.log('Do Later action for tab:', tabId);
            
            // Find tab data for undo
            const tabData = this.allTabs.find(t => t.tab.id === tabId);
            if (tabData) {
                this.addToUndoStack({
                    type: 'SAVE_TAB',
                    data: {
                        tabId: tabId,
                        url: tabData.tab.url,
                        title: tabData.tab.title
                    }
                });
                this.showUndoNotification(`Queued "${tabData.tab.title}" for later`);
            }
            
            await chrome.runtime.sendMessage({ type: 'SAVE_TAB_FOR_LATER', tabId });
            
            // Remove tab from local arrays
            this.allTabs = this.allTabs.filter(tabData => tabData.tab.id !== tabId);
            this.filteredTabs = this.filteredTabs.filter(tabData => tabData.tab.id !== tabId);
            
            // Refresh display
            this.displayCurrentTabs();
            this.showFeedback('⏰ Queued for later');
        } catch (error) {
            console.error('Error with Do Later action:', error);
            this.showError('Failed to queue tab');
        }
    }

    async delegate(tabId) {
        try {
            console.log('Delegate action for tab:', tabId);
            
            // Find tab data
            const tabData = this.allTabs.find(t => t.tab.id === tabId);
            if (!tabData) return;
            
            // Create delegation modal
            const modal = await this.createDelegationModal(tabData);
            
        } catch (error) {
            console.error('Error with Delegate action:', error);
            this.showError('Failed to delegate tab');
        }
    }

    async createDelegationModal(tabData) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000001;
            animation: fadeIn 0.3s ease-out;
        `;

        modal.innerHTML = `
            <div style="background: white; border-radius: 12px; padding: 24px; max-width: 400px; width: 90%; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);">
                <h3 style="margin: 0 0 16px 0; font-size: 18px; color: ${COLORS.primary}; font-weight: 600;">🤝 Delegate This Task</h3>
                
                <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
                    <div style="font-size: 14px; font-weight: 500; color: ${COLORS.primary}; margin-bottom: 4px;">${this.escapeHtml(tabData.tab.title)}</div>
                    <div style="font-size: 11px; color: ${COLORS.secondary};">${this.escapeHtml(tabData.tab.url)}</div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 14px; color: ${COLORS.primary}; font-weight: 500; margin-bottom: 8px;">
                        Who should handle this?
                    </label>
                    <input type="text" id="delegateWho" placeholder="e.g., John, Sarah, Development team..." style="width: 100%; padding: 10px 12px; border: 1px solid ${COLORS.tertiary}; border-radius: 6px; font-size: 14px; font-family: inherit; box-sizing: border-box;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 14px; color: ${COLORS.primary}; font-weight: 500; margin-bottom: 8px;">
                        Instructions / Context
                    </label>
                    <textarea id="delegateInstructions" placeholder="What should they know? What needs to be done?" rows="3" style="width: 100%; padding: 10px 12px; border: 1px solid ${COLORS.tertiary}; border-radius: 6px; font-size: 14px; font-family: inherit; box-sizing: border-box; resize: vertical;"></textarea>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button id="cancelDelegate" style="flex: 1; background: ${COLORS.background}; border: 1px solid ${COLORS.tertiary}; color: ${COLORS.secondary}; border-radius: 6px; padding: 10px; font-size: 14px; cursor: pointer; font-weight: 500;">Cancel</button>
                    <button id="confirmDelegate" style="flex: 1; background: #8b5cf6; color: white; border: none; border-radius: 6px; padding: 10px; font-size: 14px; cursor: pointer; font-weight: 500;">Delegate & Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event handlers
        document.getElementById('cancelDelegate').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        document.getElementById('confirmDelegate').addEventListener('click', async () => {
            const who = document.getElementById('delegateWho').value.trim();
            const instructions = document.getElementById('delegateInstructions').value.trim();
            
            if (!who) {
                alert('Please specify who should handle this task');
                return;
            }
            
            // Save delegation info and close tab
            await this.completeDelegation(tabData, who, instructions);
            document.body.removeChild(modal);
        });

        // Focus first input
        setTimeout(() => {
            document.getElementById('delegateWho').focus();
        }, 100);
    }

    async completeDelegation(tabData, who, instructions) {
        try {
            // Add to undo stack with delegation info
            this.addToUndoStack({
                type: 'DELEGATE_TAB',
                data: {
                    tabId: tabData.tab.id,
                    url: tabData.tab.url,
                    title: tabData.tab.title,
                    delegatedTo: who,
                    instructions: instructions
                }
            });

            // Save delegation record
            await chrome.runtime.sendMessage({ 
                type: 'SAVE_DELEGATION', 
                tabId: tabData.tab.id,
                url: tabData.tab.url,
                title: tabData.tab.title,
                delegatedTo: who,
                instructions: instructions
            });

            // Close the tab
            await chrome.runtime.sendMessage({ type: 'CLOSE_TAB', tabId: tabData.tab.id });
            
            // Remove tab from local arrays
            this.allTabs = this.allTabs.filter(t => t.tab.id !== tabData.tab.id);
            this.filteredTabs = this.filteredTabs.filter(t => t.tab.id !== tabData.tab.id);
            
            // Refresh display
            this.displayCurrentTabs();
            
            this.showUndoNotification(`Delegated "${tabData.tab.title}" to ${who}`);
            this.showFeedback(`🤝 Delegated to ${who}`);
            
        } catch (error) {
            console.error('Error completing delegation:', error);
            this.showError('Failed to delegate task');
        }
    }

    async reference(tabId) {
        try {
            console.log('Reference action for tab:', tabId);
            
            // Find tab data for undo
            const tabData = this.allTabs.find(t => t.tab.id === tabId);
            if (!tabData) return;
            
            // Pin the tab as reference
            await chrome.runtime.sendMessage({
                type: 'PIN_TAB',
                tabId: tabId
            });
            
            // Update analysis decision
            await chrome.runtime.sendMessage({
                type: 'UPDATE_TAB_DECISION',
                tabId: tabId,
                decision: 'reference'
            });
            
            // Remove from current view (don't close, just hide from decision flow)
            this.allTabs = this.allTabs.filter(tabData => tabData.tab.id !== tabId);
            this.filteredTabs = this.filteredTabs.filter(tabData => tabData.tab.id !== tabId);
            
            // Setup undo
            this.undoStack.push({
                action: 'reference',
                tabId: tabId,
                tab: tabData.tab,
                analysis: tabData.analysis
            });
            
            // Refresh display
            this.displayCurrentTabs();
            this.showUndoNotification(`Referenced "${tabData.tab.title}"`);
            this.showFeedback('📌 Pinned as reference');
            
        } catch (error) {
            console.error('Error with Reference action:', error);
            this.showError('Failed to pin as reference');
        }
    }

    async discard(tabId) {
        try {
            console.log('Discard action for tab:', tabId);
            
            // Find tab data for undo
            const tabData = this.allTabs.find(t => t.tab.id === tabId);
            if (tabData) {
                this.addToUndoStack({
                    type: 'CLOSE_TAB',
                    data: {
                        tabId: tabId,
                        url: tabData.tab.url,
                        title: tabData.tab.title
                    }
                });
                this.showUndoNotification(`Discarded "${tabData.tab.title}"`);
            }
            
            await chrome.runtime.sendMessage({ type: 'CLOSE_TAB', tabId });
            
            // Remove tab from local arrays
            this.allTabs = this.allTabs.filter(tabData => tabData.tab.id !== tabId);
            this.filteredTabs = this.filteredTabs.filter(tabData => tabData.tab.id !== tabId);
            
            // Refresh display
            this.displayCurrentTabs();
            this.showFeedback('🗑️ Discarded');
        } catch (error) {
            console.error('Error discarding tab:', error);
            this.showError('Failed to discard tab');
        }
    }

    getPriorityColor(priority) {
        const colors = {
            'critical': '#dc2626',
            'later': COLORS.secondary,
            'distraction': COLORS.secondary
        };
        return colors[priority] || COLORS.secondary;
    }

    async analyzeAllTabs() {
        if (!this.hasGoal) {
            this.showError('Set your shipping goal first to unlock insights');
            return;
        }

        try {
            const analyzeBtn = document.getElementById('analyzeAllBtn');
            analyzeBtn.textContent = 'Analyzing...';
            analyzeBtn.disabled = true;

            document.getElementById('loadingTabs').style.display = 'block';
            document.getElementById('tabsList').style.display = 'none';

            // Get tabs to show progress
            const tabsResponse = await chrome.runtime.sendMessage({ type: 'GET_ALL_TABS' });
            const totalTabs = tabsResponse.tabs ? tabsResponse.tabs.length : 0;
            
            this.updateAnalysisProgress(0, totalTabs, 'Scanning for shipping blockers...');

            // Start analysis with progress updates
            await chrome.runtime.sendMessage({ 
                type: 'ANALYZE_ALL_TABS',
                progressCallback: true 
            });
            
            // Simulate progress updates with copilot language
            let completed = 0;
            const progressInterval = setInterval(() => {
                completed++;
                if (completed <= totalTabs) {
                    const insights = ['shipping blocker identified', 'distraction detected', 'critical path found', 'decision point mapped'];
                    const randomInsight = insights[Math.floor(Math.random() * insights.length)];
                    this.updateAnalysisProgress(completed, totalTabs, `${randomInsight}...`);
                }
                
                if (completed >= totalTabs) {
                    clearInterval(progressInterval);
                    setTimeout(() => {
                        document.getElementById('loadingTabs').style.display = 'none';
                        document.getElementById('tabsList').style.display = 'block';
                        this.loadTabs();
                        this.showFeedback('🎯 Decision engine activated! Ready to ship.');
                        
                        analyzeBtn.textContent = 'Analyze All Tabs';
                        analyzeBtn.disabled = false;
                    }, 500);
                }
            }, 300);

        } catch (error) {
            console.error('Error analyzing all tabs:', error);
            this.showError('Analysis failed - try again');
            
            document.getElementById('loadingTabs').style.display = 'none';
            document.getElementById('tabsList').style.display = 'block';
            
            const analyzeBtn = document.getElementById('analyzeAllBtn');
            analyzeBtn.textContent = 'Analyze All Tabs';
            analyzeBtn.disabled = false;
        }
    }

    async analyzeCurrentTab() {
        if (!this.hasGoal) {
            this.showError('Set your shipping goal first to unlock insights');
            return;
        }

        try {
            const analyzeBtn = document.getElementById('analyzeCurrentBtn');
            analyzeBtn.textContent = 'Analyzing...';
            analyzeBtn.disabled = true;

            await chrome.runtime.sendMessage({ type: 'ANALYZE_CURRENT_TAB' });
            
            setTimeout(async () => {
                await this.loadTabs();
                this.showFeedback('Tab decision mapped');
                
                analyzeBtn.textContent = 'Analyze This Tab';
                analyzeBtn.disabled = false;
            }, 1500);
            
        } catch (error) {
            console.error('Error analyzing current tab:', error);
            this.showError('Analysis failed - try again');
            
            const analyzeBtn = document.getElementById('analyzeCurrentBtn');
            analyzeBtn.textContent = 'Analyze This Tab';
            analyzeBtn.disabled = false;
        }
    }

    async clearCache() {
        try {
            await chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' });
            this.showFeedback('Fresh start - cache cleared');
            await this.loadTabs();
        } catch (error) {
            console.error('Error clearing cache:', error);
            this.showError('Failed to clear cache');
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
            background: ${COLORS.primary};
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

// Make the class available globally immediately
window.TabMindFloatingPanel = TabMindFloatingPanel;

// Listen for messages from popup
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === 'openFloatingPanel') {
        try {
            console.log('Received message to open decision copilot');
            
            if (!window.tabmindFloating) {
                window.tabmindFloating = new window.TabMindFloatingPanel();
                await window.tabmindFloating.init();
            }
            
            await window.tabmindFloating.showPanel();
            
            sendResponse({ success: true });
        } catch (error) {
            console.error('TabMind copilot error:', error);
            sendResponse({ error: error.message });
        }
    }
    return true;
});

console.log('TabMind decision copilot loaded');

// SINGLE CLEAN FLOATING BUTTON SYSTEM - IMPROVED
function createFloatingButton() {
    console.log('🎯 Creating floating button...');
    
    // Check if document.body exists
    if (!document.body) {
        console.log('🎯 Document body not ready, retrying...');
        setTimeout(createFloatingButton, 100);
        return;
    }
    
    // Remove any existing button to avoid duplicates
    const existing = document.getElementById('tabmind-floating-icon');
    if (existing) {
        console.log('🎯 Removing existing button');
        existing.remove();
    }
    
    // Create button
    const button = document.createElement('div');
    button.id = 'tabmind-floating-icon';
    button.innerHTML = 'T';
    button.title = 'Tabbit - Your Decision Copilot (Drag to move)';
    
    // Load saved position or use default
    let savedPosition = { x: null, y: null };
    if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['tabmind_icon_position'], (result) => {
            if (result.tabmind_icon_position) {
                savedPosition = result.tabmind_icon_position;
                console.log('🎯 Loaded saved position:', savedPosition);
                applyPosition();
            }
        });
    }
    
    function applyPosition() {
        if (savedPosition.x !== null && savedPosition.y !== null) {
            // Ensure position is within viewport bounds
            const maxX = window.innerWidth - 56;
            const maxY = window.innerHeight - 56;
            const safeX = Math.max(0, Math.min(savedPosition.x, maxX));
            const safeY = Math.max(0, Math.min(savedPosition.y, maxY));
            
            button.style.left = safeX + 'px';
            button.style.top = safeY + 'px';
            button.style.right = 'auto';
            button.style.bottom = 'auto';
        }
    }
    
    // Enhanced styling with better z-index and visibility
    button.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        width: 56px !important;
        height: 56px !important;
        background: #1B3C53 !important;
        color: white !important;
        border: 3px solid white !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 18px !important;
        font-weight: 700 !important;
        cursor: move !important;
        z-index: 2147483647 !important;
        box-shadow: 0 8px 32px rgba(27, 60, 83, 0.4) !important;
        user-select: none !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        transition: all 0.3s ease !important;
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        -khtml-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
    `;
    
    // Apply saved position after initial styling
    setTimeout(applyPosition, 50);
    
    // Enhanced draggable functionality - make variables accessible globally
    button.isDragging = false;
    button.hasMoved = false;
    button.startX = 0;
    button.startY = 0;
    button.mouseDownTime = 0;
    
    // Mouse events for dragging
    button.addEventListener('mousedown', (e) => {
        console.log('🎯 Mouse down - starting drag');
        button.isDragging = true;
        button.hasMoved = false;
        button.mouseDownTime = Date.now();
        
        const rect = button.getBoundingClientRect();
        button.startX = e.clientX - rect.left;
        button.startY = e.clientY - rect.top;
        
        button.style.cursor = 'grabbing !important';
        button.style.transition = 'none !important';
        button.style.transform = 'scale(1.05) !important';
        
        // Add visual feedback for dragging
        button.style.boxShadow = '0 8px 25px rgba(27, 60, 83, 0.4) !important';
        
        e.preventDefault();
        e.stopPropagation();
    });
    
    // Global mouse move handler for dragging
    const mouseMoveHandler = (e) => {
        if (!button.isDragging) return;
        
        e.preventDefault();
        button.hasMoved = true;
        
        const newX = e.clientX - button.startX;
        const newY = e.clientY - button.startY;
        
        // Constrain to viewport with padding
        const padding = 10;
        const maxX = window.innerWidth - 56 - padding;
        const maxY = window.innerHeight - 56 - padding;
        const constrainedX = Math.max(padding, Math.min(newX, maxX));
        const constrainedY = Math.max(padding, Math.min(newY, maxY));
        
        button.style.left = constrainedX + 'px';
        button.style.top = constrainedY + 'px';
        button.style.right = 'auto';
        button.style.bottom = 'auto';
        
        console.log('🎯 Dragging to:', constrainedX, constrainedY);
    };
    
    // Global mouse up handler for dragging
    const mouseUpHandler = (e) => {
        if (!button.isDragging) return;
        
        console.log('🎯 Mouse up - ending drag');
        button.isDragging = false;
        const clickDuration = Date.now() - button.mouseDownTime;
        
        button.style.cursor = 'move !important';
        button.style.transition = 'all 0.3s ease !important';
        button.style.transform = 'scale(1) !important';
        button.style.boxShadow = '0 4px 15px rgba(27, 60, 83, 0.2) !important';
        
        if (button.hasMoved) {
            // This was a drag - save position
            const rect = button.getBoundingClientRect();
            const newPosition = { x: rect.left, y: rect.top };
            
            if (chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({
                    tabmind_icon_position: newPosition
                }, () => {
                    console.log('🎯 Position saved:', newPosition);
                });
            }
            console.log('🎯 Button dragged to:', newPosition);
        } else if (clickDuration < 500) {
            // This was a click (no movement, quick release)
            console.log('🎯 Button clicked (no drag detected)');
            handleButtonClick(e);
        }
    };
    
    // Attach global listeners
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    
    // Store handlers for cleanup
    button._mouseMoveHandler = mouseMoveHandler;
    button._mouseUpHandler = mouseUpHandler;
    
    // Function to update button appearance based on panel state
    function updateButtonAppearance() {
        const panel = document.getElementById('tabmind-panel');
        const isOpen = panel && panel.style.display !== 'none' && panel.style.display !== '';
        
        console.log('🎯 Updating button appearance - Panel:', panel ? 'exists' : 'missing', 'Display:', panel ? panel.style.display : 'N/A', 'IsOpen:', isOpen);
        
        if (isOpen) {
            button.innerHTML = '×';
            button.title = 'Close Tabbit Panel (Drag to move)';
            button.style.fontSize = '24px !important';
            button.style.fontWeight = '300 !important';
        } else {
            button.innerHTML = 'T';
            button.title = 'Open Tabbit Panel (Drag to move)';
            button.style.fontSize = '18px !important';
            button.style.fontWeight = '600 !important';
        }
    }
    
    // Periodically check and update button appearance
    setInterval(updateButtonAppearance, 500);
    
    // Improved button click handler with better error handling
    async function handleButtonClick(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎯 Handling button click');
        
        // Visual feedback
        button.style.transform = 'scale(0.95) !important';
        setTimeout(() => {
            button.style.transform = 'scale(1) !important';
        }, 150);
        
        try {
            // Ensure the TabMindFloatingPanel class is available
            if (typeof window.TabMindFloatingPanel !== 'function') {
                console.error('🎯 TabMindFloatingPanel class not available, retrying...');
                // Wait a bit and try again
                setTimeout(() => handleButtonClick(e), 100);
                return;
            }
            
            // Initialize panel if needed
            if (!window.tabmindFloating) {
                console.log('🎯 Creating new TabMindFloatingPanel instance');
                window.tabmindFloating = new window.TabMindFloatingPanel();
                await window.tabmindFloating.init();
            }

            // Check current panel state
            const panel = document.getElementById('tabmind-panel');
            const isCurrentlyOpen = panel && panel.style.display === 'block';
            
            if (isCurrentlyOpen) {
                console.log('🎯 Closing panel');
                window.tabmindFloating.hidePanel();
            } else {
                console.log('🎯 Opening panel');
                await window.tabmindFloating.showPanel();
            }
            
            // Update button appearance
            setTimeout(updateButtonAppearance, 100);
            
        } catch (error) {
            console.error('🎯 Error handling button click:', error);
            // Show user-friendly error
            button.style.background = '#dc2626 !important';
            setTimeout(() => {
                button.style.background = '#1B3C53 !important';
            }, 1000);
        }
    }
    
    // Add button to page
    document.body.appendChild(button);
    console.log('🎯 Floating button created and added to page');
    
    // Enhanced MutationObserver to protect against removal
    const observer = new MutationObserver((mutations) => {
        let buttonRemoved = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.removedNodes.forEach((node) => {
                    if (node.id === 'tabmind-floating-icon') {
                        buttonRemoved = true;
                    }
                });
            }
        });
        
        if (buttonRemoved) {
            console.log('🎯 Button was removed by website, recreating...');
            setTimeout(createFloatingButton, 100);
        }
    });
    
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
    
    // Store observer for cleanup if needed
    button._observer = observer;
    
    return button;
}

// Enhanced initialization system
function initializeButton() {
    console.log('🎯 TabMind: Initializing button for', window.location.href);
    
    // Skip on special pages that might not support extensions
    if (window.location.protocol === 'chrome-extension:' || 
        window.location.protocol === 'moz-extension:' ||
        window.location.href.includes('chrome://') ||
        window.location.href.includes('about:')) {
        console.log('🎯 Skipping initialization on special page');
        return;
    }
    
    if (document.readyState === 'loading') {
        // Page still loading, wait for DOM
        document.addEventListener('DOMContentLoaded', createFloatingButton);
    } else {
        // DOM already ready
        createFloatingButton();
    }
    
    // Staggered backup attempts for problematic sites
    setTimeout(createFloatingButton, 500);   // Quick backup
    setTimeout(createFloatingButton, 2000);  // Medium backup
    setTimeout(createFloatingButton, 5000);  // Slow backup
}

// Initialize immediately
initializeButton();

// Enhanced monitoring system
setInterval(() => {
    // Skip monitoring on special pages
    if (window.location.protocol === 'chrome-extension:' || 
        window.location.href.includes('chrome://')) {
        return;
    }
    
    const button = document.getElementById('tabmind-floating-icon');
    if (!button && document.body) {
        console.log('🎯 Button missing during periodic check, recreating...');
        createFloatingButton();
    } else if (button) {
        // Ensure button is visible and properly styled
        if (button.style.visibility !== 'visible' || button.style.opacity !== '1') {
            console.log('🎯 Button visibility compromised, fixing...');
            button.style.visibility = 'visible !important';
            button.style.opacity = '1 !important';
            button.style.display = 'flex !important';
        }
        
        // Update button appearance to stay in sync with panel state
        const panel = document.getElementById('tabmind-panel');
        const isOpen = panel && panel.style.display === 'block';
        
        const currentText = button.innerHTML;
        const shouldShowClose = isOpen;
        const isShowingClose = currentText === '×';
        
        if (shouldShowClose && !isShowingClose) {
            button.innerHTML = '×';
            button.title = 'Close Tabbit Panel (Drag to move)';
            button.style.fontSize = '24px !important';
        } else if (!shouldShowClose && isShowingClose) {
            button.innerHTML = 'T';
            button.title = 'Open Tabbit Panel (Drag to move)';
            button.style.fontSize = '18px !important';
        }
    }
}, 2000); // Check every 2 seconds (reduced from 3)

// Handle page visibility changes and tab switching
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        setTimeout(() => {
            const button = document.getElementById('tabmind-floating-icon');
            if (!button && document.body) {
                console.log('🎯 Button missing after tab switch, recreating...');
                createFloatingButton();
            }
        }, 100);
    }
});

// Handle window resize to ensure button stays in bounds
window.addEventListener('resize', () => {
    const button = document.getElementById('tabmind-floating-icon');
    if (button) {
        const rect = button.getBoundingClientRect();
        const maxX = window.innerWidth - 56;
        const maxY = window.innerHeight - 56;
        
        if (rect.left > maxX || rect.top > maxY) {
            const safeX = Math.min(rect.left, maxX);
            const safeY = Math.min(rect.top, maxY);
            
            button.style.left = safeX + 'px';
            button.style.top = safeY + 'px';
            
            // Save new position
            if (chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({
                    tabmind_icon_position: { x: safeX, y: safeY }
                });
            }
        }
    }
});
 