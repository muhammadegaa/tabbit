// Stripe Subscription Service for Tabbit

import { loadStripe, Stripe } from '@stripe/stripe-js';
import { SubscriptionPlan, Subscription } from '../types/user';

// Stripe configuration - Updated with actual credentials
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RqfzRK82harqV5sJSHSB3ZjtmZIe8o5Al5U1N2IMjAZPEXGMUKWVAD95Zn3McnfjsDH6jfPMJozJ3H5EPixfUVO00Q8rVTGQc';

// Production API base URL
const API_BASE_URL = 'https://tabmind-j3qouq5rv-shortsys-projects.vercel.app';

// Price IDs for different plans - Updated with actual Stripe price IDs
// Pro: $7/month, Team: $19/month (no free tier, 1 trial analysis only)
const PRICE_IDS = {
  pro_monthly: 'price_1RqgXsK82harqV5s75vhLiD5',
  pro_yearly: 'price_1RqgXsK82harqV5szhhYMOIt',
  team_monthly: 'price_1RqgXtK82harqV5sZXo4vWZL',
  team_yearly: 'price_1RqgXtK82harqV5sBIJpkAiX'
} as const;

export interface CreateCheckoutSessionRequest {
  priceId: string;
  userId: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreatePortalSessionRequest {
  customerId: string;
  returnUrl?: string;
}

export class StripeService {
  private stripe: Promise<Stripe | null>;
  
  constructor() {
    this.stripe = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }

  /**
   * Create a Stripe checkout session for subscription
   */
  async createCheckoutSession(request: CreateCheckoutSessionRequest): Promise<string> {
    try {
      // This would normally be called to your backend API
      // For Chrome extension, we'll need to set up a simple backend endpoint
      const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: request.priceId,
          user_id: request.userId,
          success_url: request.successUrl || chrome.runtime.getURL('popup.html?success=true'),
          cancel_url: request.cancelUrl || chrome.runtime.getURL('popup.html?canceled=true'),
        }),
      });

      const session = await response.json();
      
      if (!response.ok) {
        throw new Error(session.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      const stripe = await this.stripe;
      if (!stripe) {
        throw new Error('Stripe not loaded');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) {
        throw new Error(error.message);
      }

      return session.id;
      
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }
  }

  /**
   * Create a Stripe customer portal session
   */
  async createPortalSession(request: CreatePortalSessionRequest): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: request.customerId,
          return_url: request.returnUrl || chrome.runtime.getURL('popup.html'),
        }),
      });

      const session = await response.json();
      
      if (!response.ok) {
        throw new Error(session.error || 'Failed to create portal session');
      }

      // Open portal in new tab
      chrome.tabs.create({ url: session.url });
      
      return session.url;
      
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      throw new Error(error.message || 'Failed to create portal session');
    }
  }

  /**
   * Get subscription by user ID
   */
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No subscription found
        }
        throw new Error('Failed to fetch subscription');
      }

      const subscription = await response.json();
      
      return {
        ...subscription,
        currentPeriodStart: new Date(subscription.currentPeriodStart),
        currentPeriodEnd: new Date(subscription.currentPeriodEnd),
        usage: {
          ...subscription.usage,
          lastResetDate: new Date(subscription.usage.lastResetDate)
        }
      };
      
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel subscription');
      }

      console.log('Subscription canceled successfully');
      
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      throw new Error(error.message || 'Failed to cancel subscription');
    }
  }

  /**
   * Resume subscription (undo cancellation)
   */
  async resumeSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/${subscriptionId}/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to resume subscription');
      }

      console.log('Subscription resumed successfully');
      
    } catch (error: any) {
      console.error('Error resuming subscription:', error);
      throw new Error(error.message || 'Failed to resume subscription');
    }
  }

  /**
   * Get pricing information
   */
  async getPricing(): Promise<Record<string, any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pricing`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pricing');
      }

      return await response.json();
      
    } catch (error: any) {
      console.error('Error fetching pricing:', error);
      
      // Return fallback pricing
      return {
        pro: {
          monthly: { amount: 900, currency: 'usd' }, // $9.00
          yearly: { amount: 9000, currency: 'usd' }  // $90.00 (2 months free)
        },
        team: {
          monthly: { amount: 2900, currency: 'usd' }, // $29.00  
          yearly: { amount: 29000, currency: 'usd' }  // $290.00 (2 months free)
        }
      };
    }
  }

  /**
   * Format currency amount for display
   */
  formatCurrency(amount: number, currency: string = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Convert cents to dollars
  }

  /**
   * Get plan upgrade URL
   */
  getUpgradeUrl(currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan): string {
    if (targetPlan === 'pro') {
      return chrome.runtime.getURL(`popup.html?upgrade=pro`);
    } else if (targetPlan === 'team') {
      return chrome.runtime.getURL(`popup.html?upgrade=team`);
    }
    
    return chrome.runtime.getURL('popup.html');
  }

  /**
   * Check if user has reached usage limits
   */
  checkUsageLimit(subscription: Subscription | null, usageType: 'tabAnalyses' | 'dailyGoals'): boolean {
    if (!subscription) {
      // Free tier limits
      if (usageType === 'tabAnalyses') {
        return false; // Will be checked against daily limit elsewhere
      }
      return false;
    }

    const limits = subscription.limits;
    const usage = subscription.usage;

    switch (usageType) {
      case 'tabAnalyses':
        return limits.tabAnalysesPerDay > 0 && usage.tabAnalyses >= limits.tabAnalysesPerDay;
      case 'dailyGoals':
        return limits.goalsPerDay > 0 && usage.dailyGoals >= limits.goalsPerDay;
      default:
        return false;
    }
  }

  /**
   * Get price ID for plan and billing period
   */
  getPriceId(plan: SubscriptionPlan, period: 'monthly' | 'yearly'): string {
    if (plan === 'pro') {
      return period === 'monthly' ? PRICE_IDS.pro_monthly : PRICE_IDS.pro_yearly;
    } else if (plan === 'team') {
      return period === 'monthly' ? PRICE_IDS.team_monthly : PRICE_IDS.team_yearly;
    }
    
    throw new Error('Invalid plan or period');
  }
} 