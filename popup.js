// Tabbit Popup Script - Complete with Auth & Subscriptions
// Note: Services will be accessed via background script

class TabbitPopup {
    constructor() {
        this.currentUser = null;
        this.subscription = null;
        this.init();
    }

    async init() {
        console.log('🎯 Initializing Tabbit popup');
        this.showLoading();
        
        try {
            // Initialize auth state
            await this.initializeAuthState();
            this.setupEventListeners();
            this.updateUI();
        } catch (error) {
            console.error('🎯 Popup initialization error:', error);
            this.showError('Failed to initialize. Please try again.');
        }
    }

    async initializeAuthState() {
        try {
            // Get auth state from background script
            const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' });
            if (response && response.success) {
                this.currentUser = response.user;
                this.subscription = response.subscription;
            }
        } catch (error) {
            console.error('🎯 Auth state error:', error);
        }
    }

    setupEventListeners() {
        // Authentication
        const signInBtn = document.getElementById('signInBtn');
        const signInAnonymousBtn = document.getElementById('signInAnonymousBtn');
        const signOutBtn = document.getElementById('signOutBtn');

        if (signInBtn) {
            signInBtn.addEventListener('click', () => this.signInWithGoogle());
        }
        if (signInAnonymousBtn) {
            signInAnonymousBtn.addEventListener('click', () => this.signInAnonymously());
        }
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.signOut());
        }

        // Main actions
        const openFloatingPanel = document.getElementById('openFloatingPanel');
        const analyzeCurrentTab = document.getElementById('analyzeCurrentTab');

        if (openFloatingPanel) {
            openFloatingPanel.addEventListener('click', () => this.openFloatingPanel());
        }
        if (analyzeCurrentTab) {
            analyzeCurrentTab.addEventListener('click', () => this.analyzeCurrentTab());
        }

        // Subscription actions
        const upgradeToPro = document.getElementById('upgradeToPro');
        const upgradeToTeam = document.getElementById('upgradeToTeam');
        const upgradeToTeamFromPro = document.getElementById('upgradeToTeamFromPro');
        const manageSubscription = document.getElementById('manageSubscription');
        const manageTeamSubscription = document.getElementById('manageTeamSubscription');

        if (upgradeToPro) {
            upgradeToPro.addEventListener('click', () => this.upgradeToProMonthly());
        }
        if (upgradeToTeam) {
            upgradeToTeam.addEventListener('click', () => this.upgradeToTeamMonthly());
        }
        if (upgradeToTeamFromPro) {
            upgradeToTeamFromPro.addEventListener('click', () => this.upgradeToTeamMonthly());
        }
        if (manageSubscription) {
            manageSubscription.addEventListener('click', () => this.openCustomerPortal());
        }
        if (manageTeamSubscription) {
            manageTeamSubscription.addEventListener('click', () => this.openCustomerPortal());
        }
    }

    updateUI() {
        this.hideLoading();
        
        if (!this.currentUser) {
            this.showAuthSection();
        } else {
            this.showUserSection();
            this.showMainSection();
            this.showSubscriptionSection();
            this.showUsageSection();
        }
    }

    showAuthSection() {
        this.hideAllSections();
        document.getElementById('authSection').style.display = 'block';
    }

    showUserSection() {
        const userSection = document.getElementById('userSection');
        const userName = document.getElementById('userName');
        const userPlan = document.getElementById('userPlan');
        const userAvatar = document.getElementById('userAvatar');

        if (this.currentUser) {
            userName.textContent = this.currentUser.displayName || this.currentUser.email || 'Anonymous User';
            userPlan.textContent = this.subscription ? `${this.subscription.plan} Plan` : 'Trial Mode';
            
            if (this.currentUser.photoURL) {
                userAvatar.src = this.currentUser.photoURL;
                userAvatar.style.display = 'block';
            }
        }

        userSection.style.display = 'block';
    }

    showMainSection() {
        document.getElementById('mainSection').style.display = 'block';
    }

    showSubscriptionSection() {
        const subscriptionSection = document.getElementById('subscriptionSection');
        const freeStatus = document.getElementById('freeStatus');
        const proStatus = document.getElementById('proStatus');
        const teamStatus = document.getElementById('teamStatus');

        // Hide all status divs first
        freeStatus.style.display = 'none';
        proStatus.style.display = 'none';
        teamStatus.style.display = 'none';

        if (!this.subscription || this.subscription.plan === 'free') {
            // Show trial/free status
            const analysesLeft = document.getElementById('analysesLeft');
            if (analysesLeft) {
                analysesLeft.textContent = '1'; // Trial gets 1 analysis
            }
            freeStatus.style.display = 'block';
        } else if (this.subscription.plan === 'pro') {
            proStatus.style.display = 'block';
        } else if (this.subscription.plan === 'team') {
            teamStatus.style.display = 'block';
        }

        subscriptionSection.style.display = 'block';
    }

    showUsageSection() {
        // This would be populated with real usage data
        document.getElementById('usageSection').style.display = 'block';
    }

    hideAllSections() {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('userSection').style.display = 'none';
        document.getElementById('mainSection').style.display = 'none';
        document.getElementById('subscriptionSection').style.display = 'none';
        document.getElementById('usageSection').style.display = 'none';
    }

    // Authentication methods
    async signInWithGoogle() {
        try {
            this.showLoading('Signing in...');
            const response = await chrome.runtime.sendMessage({ type: 'SIGN_IN_GOOGLE' });
            if (response && response.success) {
                this.currentUser = response.user;
                this.subscription = response.subscription;
                this.updateUI();
                this.showSuccess('Successfully signed in!');
            } else {
                throw new Error(response?.error || 'Sign-in failed');
            }
        } catch (error) {
            console.error('🎯 Google sign-in error:', error);
            this.showError('Sign-in failed. Please try again.');
            this.hideLoading();
        }
    }

    async signInAnonymously() {
        try {
            this.showLoading('Creating trial account...');
            const response = await chrome.runtime.sendMessage({ type: 'SIGN_IN_ANONYMOUS' });
            if (response && response.success) {
                this.currentUser = response.user;
                this.subscription = null; // Anonymous users get trial mode
                this.updateUI();
                this.showSuccess('Trial mode activated!');
            } else {
                throw new Error(response?.error || 'Failed to create trial account');
            }
        } catch (error) {
            console.error('🎯 Anonymous sign-in error:', error);
            this.showError('Failed to create trial account.');
            this.hideLoading();
        }
    }

    async signOut() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'SIGN_OUT' });
            if (response && response.success) {
                this.currentUser = null;
                this.subscription = null;
                this.updateUI();
                this.showSuccess('Signed out successfully');
            } else {
                throw new Error(response?.error || 'Sign-out failed');
            }
        } catch (error) {
            console.error('🎯 Sign-out error:', error);
            this.showError('Sign-out failed. Please try again.');
        }
    }

    // Subscription methods
    async upgradeToProMonthly() {
        if (!this.currentUser) {
            this.showError('Please sign in first');
            return;
        }

        try {
            this.showLoading('Redirecting to checkout...');
            const response = await chrome.runtime.sendMessage({ 
                type: 'CREATE_CHECKOUT_SESSION',
                priceId: 'price_your_pro_monthly_id' // Pro monthly
            });
            
            if (response && response.success) {
                chrome.tabs.create({ url: response.checkoutUrl });
                window.close();
            } else {
                throw new Error(response?.error || 'Failed to create checkout session');
            }
        } catch (error) {
            console.error('🎯 Checkout error:', error);
            this.showError('Failed to start checkout. Please try again.');
            this.hideLoading();
        }
    }

    async upgradeToTeamMonthly() {
        if (!this.currentUser) {
            this.showError('Please sign in first');
            return;
        }

        try {
            this.showLoading('Redirecting to checkout...');
            const response = await chrome.runtime.sendMessage({ 
                type: 'CREATE_CHECKOUT_SESSION',
                priceId: 'price_your_team_monthly_id' // Team monthly
            });
            
            if (response && response.success) {
                chrome.tabs.create({ url: response.checkoutUrl });
                window.close();
            } else {
                throw new Error(response?.error || 'Failed to create checkout session');
            }
        } catch (error) {
            console.error('🎯 Checkout error:', error);
            this.showError('Failed to start checkout. Please try again.');
            this.hideLoading();
        }
    }

    async openCustomerPortal() {
        if (!this.currentUser || !this.subscription?.stripeCustomerId) {
            this.showError('No subscription found');
            return;
        }

        try {
            this.showLoading('Opening subscription management...');
            const response = await chrome.runtime.sendMessage({ 
                type: 'CREATE_PORTAL_SESSION'
            });
            
            if (response && response.success) {
                chrome.tabs.create({ url: response.portalUrl });
                window.close();
            } else {
                throw new Error(response?.error || 'Failed to create portal session');
            }
        } catch (error) {
            console.error('🎯 Portal error:', error);
            this.showError('Failed to open subscription management.');
            this.hideLoading();
        }
    }

    // Main functionality
    async openFloatingPanel() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                await chrome.tabs.sendMessage(tab.id, { action: 'openFloatingPanel' });
                window.close();
            }
        } catch (error) {
            this.showError('Please refresh the page to use Tabbit');
        }
    }

    async analyzeCurrentTab() {
        if (!this.currentUser) {
            this.showError('Please sign in to analyze tabs');
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                this.showError('No active tab found');
                return;
            }

            chrome.runtime.sendMessage({
                type: 'ANALYZE_CURRENT_TAB',
                tabInfo: {
                    title: tab.title,
                    url: tab.url,
                    content: 'Content analysis not available'
                }
            });

            this.showSuccess('Analysis started! Check the floating panel.');
            window.close();
        } catch (error) {
            console.error('🎯 Tab analysis error:', error);
            this.showError('Failed to analyze tab');
        }
    }

    // UI helper methods
    showLoading(message = 'Loading...') {
        const loadingDiv = document.getElementById('loadingDisplay');
        if (loadingDiv) {
            loadingDiv.textContent = message;
            loadingDiv.style.display = 'block';
        }
    }

    hideLoading() {
        const loadingDiv = document.getElementById('loadingDisplay');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorDisplay');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    showSuccess(message) {
        // Create temporary success message
        const container = document.querySelector('.container');
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            background: #D1FAE5;
            border: 1px solid #10B981;
            color: #047857;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
            margin: 16px 24px;
        `;
        
        container.appendChild(successDiv);
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TabbitPopup();
});
 