# 🔥 Tabbit Firebase & Stripe Setup Guide

## 🚀 Quick Setup Overview

TabMind is ready for Firebase Authentication, Firestore database, and Stripe subscriptions. Here's what you need to configure:

---

## 📋 **1. Firebase Setup**

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" 
3. Name it `tabmind-production` (or your choice)
4. Enable Google Analytics (optional)

### Enable Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Google** provider
3. Add your domain to authorized domains
4. Copy the Web SDK config

### Set up Firestore Database
1. Go to **Firestore Database** → **Create database**
2. Start in **production mode**
3. Choose your region (us-central1 recommended)

### Get Firebase Config
1. Go to **Project Settings** → **General**
2. Scroll to "Your apps" → **Web app**
3. Copy the config object
4. Replace values in `src/config/firebase.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "tabmind-production.firebaseapp.com",
  projectId: "tabmind-production", 
  storageBucket: "tabmind-production.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
};
```

---

## 💳 **2. Stripe Setup**

### Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create account or sign in
3. Switch to **Test mode** for development

### Create Products & Prices
1. Go to **Products** → **Add product**
2. Create these products:

**TabMind Pro**
- Monthly: $9.00 USD
- Yearly: $90.00 USD (save $18)

**TabMind Team** 
- Monthly: $29.00 USD
- Yearly: $290.00 USD (save $58)

3. Copy the **Price IDs** from each product
4. Update `src/services/stripe.service.ts`:

```typescript
const PRICE_IDS = {
  pro_monthly: 'price_1ABC123...', // Your actual price IDs
  pro_yearly: 'price_1DEF456...',
  team_monthly: 'price_1GHI789...',
  team_yearly: 'price_1JKL012...'
} as const;
```

### Get API Keys
1. Go to **Developers** → **API keys**
2. Copy **Publishable key** (starts with `pk_test_`)
3. Update `src/services/stripe.service.ts`:

```typescript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_actual_key_here';
```

---

## 🔧 **3. Backend API Setup (Required for Stripe)**

TabMind needs a simple backend for Stripe webhook handling. Options:

### Option A: Vercel Functions (Recommended)
1. Create `api/` folder in project root
2. Add these endpoints:
   - `api/create-checkout-session.js`
   - `api/create-portal-session.js` 
   - `api/webhook.js`

### Option B: Firebase Functions
1. Enable **Cloud Functions** in Firebase
2. Deploy webhook handlers
3. Update Stripe webhook URL

### Option C: Express.js Server
1. Simple Node.js/Express server
2. Deploy to Railway, Render, or Heroku

**Sample webhook endpoint needed:**
```
POST /api/webhook
- Handle subscription.created
- Handle subscription.updated  
- Handle subscription.deleted
- Update Firestore user records
```

---

## 🔐 **4. Environment Variables**

Create `.env` file (don't commit this):

```bash
# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=tabmind-production

# Stripe  
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# OpenRouter (existing)
OPENROUTER_API_KEY=sk-or-v1-your_existing_key
```

---

## 🎯 **5. Testing Checklist**

### Authentication Flow
- [ ] Google Sign-In works
- [ ] User profile created in Firestore
- [ ] Local data migrated to cloud
- [ ] Sign-out clears session

### Subscription Flow  
- [ ] Upgrade to Pro redirects to Stripe
- [ ] Payment completed creates subscription
- [ ] Webhook updates user in Firestore
- [ ] Feature limits enforced correctly

### Data Sync
- [ ] Goals sync across devices
- [ ] Tab analyses saved to cloud
- [ ] Offline mode degrades gracefully

---

## 🚨 **Current Status: READY FOR CREDENTIALS**

✅ **Firebase SDK** - Installed and configured  
✅ **Stripe SDK** - Installed and configured  
✅ **Auth Service** - Built with Google Sign-In  
✅ **Migration Service** - Local → Cloud data transfer  
✅ **Type Definitions** - Complete user/subscription models  
✅ **Error Handling** - Comprehensive fallbacks  

**Next Step:** Provide Firebase config and Stripe keys to activate!

---

## 📞 **Need Help?**

The codebase is production-ready. When you provide credentials:

1. **Firebase**: Replace config in `src/config/firebase.ts`
2. **Stripe**: Update keys in `src/services/stripe.service.ts`  
3. **Test**: Load extension and try authentication
4. **Deploy**: Ready for Chrome Web Store

**Time to activation: ~15 minutes after credentials provided** 