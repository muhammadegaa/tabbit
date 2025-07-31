# 🚀 Tabbit Complete Deployment Guide

## 📋 **Current Status**
✅ **Firebase Configured** - Auth & Firestore ready  
✅ **Stripe Configured** - Publishable key integrated  
✅ **Extension Built** - TypeScript compiled successfully  
✅ **Backend API Created** - Vercel functions ready  

---

## 🔥 **Step 1: Deploy Backend API (5 minutes)**

### Prerequisites
1. Install [Vercel CLI](https://vercel.com/cli): `npm i -g vercel`
2. Sign up for [Vercel account](https://vercel.com)

### Deploy Steps
```bash
# 1. Navigate to project root
cd /Users/muhammadegaa/Documents/Projects/tabmind

# 2. Login to Vercel
vercel login

# 3. Deploy the project
vercel --prod

# 4. Set environment variables in Vercel dashboard
# Go to your project → Settings → Environment Variables
```

### Environment Variables to Set in Vercel:
```bash
STRIPE_SECRET_KEY=your_stripe_secret_key_here

FIREBASE_API_KEY=your_firebase_api_key_here

STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
# (Get this after setting up webhook in Step 2)
```

### Get Your API URLs
After deployment, Vercel will give you URLs like:
- `https://your-project.vercel.app/api/create-checkout-session`
- `https://your-project.vercel.app/api/create-portal-session`
- `https://your-project.vercel.app/api/webhook`

---

## 💳 **Step 2: Configure Stripe Products (10 minutes)**

### Create Products in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Create these products:

#### **TabMind Pro**
- Name: `TabMind Pro`
- Description: `Unlimited tab analysis and automation`
- **Monthly Price**: $9.00 USD (Recurring)
- **Yearly Price**: $90.00 USD (Recurring)

#### **TabMind Team**  
- Name: `TabMind Team`
- Description: `Pro features + team collaboration`
- **Monthly Price**: $29.00 USD (Recurring)
- **Yearly Price**: $290.00 USD (Recurring)

### Copy Price IDs
After creating products, copy the **Price IDs** (start with `price_`)

### Update Extension Code
Replace price IDs in `src/services/stripe.service.ts`:
```typescript
const PRICE_IDS = {
  pro_monthly: 'price_YOUR_PRO_MONTHLY_ID',
  pro_yearly: 'price_YOUR_PRO_YEARLY_ID',
  team_monthly: 'price_YOUR_TEAM_MONTHLY_ID',
  team_yearly: 'price_YOUR_TEAM_YEARLY_ID'
} as const;
```

### Set up Webhook Endpoint
1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://your-project.vercel.app/api/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`  
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **Webhook Secret** and add to Vercel environment variables

---

## 🔧 **Step 3: Update Extension API URLs**

Update `src/services/stripe.service.ts` to use your Vercel URLs:

```typescript
// Replace '/api/' with your actual Vercel URL
const API_BASE_URL = 'https://your-project.vercel.app';

// In createCheckoutSession method:
const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
  // ... rest of the code
});

// In createPortalSession method:
const response = await fetch(`${API_BASE_URL}/api/create-portal-session`, {
  // ... rest of the code  
});
```

---

## 🏗️ **Step 4: Final Extension Build**

```bash
# 1. Update the stripe service with your URLs
# 2. Rebuild the extension
npm run build

# 3. Test locally first
# Load extension in Chrome → chrome://extensions/ → Load unpacked
```

---

## 🌐 **Step 5: Firebase Setup (5 minutes)**

### Set Firestore Rules
1. Go to [Firebase Console](https://console.firebase.google.com/project/tabbit-f3fd7/firestore/rules)
2. Update rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Goals belong to users
    match /goals/{goalId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Tab analyses belong to users
    match /tabAnalyses/{analysisId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Subscriptions are read-only for users
    match /subscriptions/{subId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### Enable Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Google** provider
3. Add authorized domains:
   - `chrome-extension://YOUR_EXTENSION_ID` (after publishing)
   - `localhost` (for testing)

---

## 🎯 **Step 6: Test Complete Flow**

### Test Checklist
- [ ] Extension loads without errors
- [ ] Floating button appears on websites
- [ ] Goal setting works
- [ ] Tab analysis works with OpenRouter
- [ ] Firebase authentication works (might need HTTPS for full testing)
- [ ] Local storage migration works
- [ ] Stripe checkout redirects properly

### Testing Authentication
```bash
# For local testing, you might need to serve over HTTPS
# Use a tool like ngrok or test after publishing to Chrome store
```

---

## 📦 **Step 7: Chrome Web Store Submission**

### Prepare Extension Package
```bash
# 1. Create zip file of extension
zip -r tabmind-extension.zip . -x "node_modules/*" "src/*" "*.md" "api/*" "vercel.json"

# 2. Or use only necessary files:
# - manifest.json
# - popup.html, popup.css, popup.js  
# - background.js
# - contentScript.js
# - openrouter.js
# - icon.svg (if you have icons)
```

### Chrome Web Store
1. Go to [Chrome Developer Console](https://chrome.google.com/webstore/devconsole/)
2. Pay $5 developer fee (one-time)
3. Upload extension zip
4. Fill out store listing:
   - **Name**: TabMind
   - **Description**: AI-powered decision copilot for goal-driven productivity
   - **Category**: Productivity
   - **Screenshots**: Show floating panel, goal setting, decision engine
5. Submit for review (usually 1-7 days)

---

## 🔐 **Security Notes**

### Environment Variables Needed
```bash
# Vercel (Backend)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FIREBASE_API_KEY=AIzaSyA...

# Extension (Client-side - already configured)
# Firebase config in src/config/firebase.ts
# Stripe publishable key in src/services/stripe.service.ts
```

### Production Considerations
1. **Switch to Stripe Live Mode** when ready for real payments
2. **Update Firebase to Production Mode** 
3. **Set up proper error monitoring** (Sentry, LogRocket)
4. **Configure analytics** (Google Analytics, Mixpanel)

---

## 🚨 **Current Deployment Status**

✅ **Ready to Deploy**: All code complete, credentials integrated  
⚠️ **Needs**: Vercel deployment, Stripe products creation, price ID updates  
🚀 **ETA to Live**: ~30 minutes after completing above steps

---

## 📞 **Support & Next Steps**

### Immediate Actions Needed:
1. **Deploy to Vercel** (5 min)
2. **Create Stripe products** (10 min)  
3. **Update price IDs** (2 min)
4. **Test extension** (10 min)
5. **Submit to Chrome Store** (15 min)

### After Launch:
- Set up analytics and monitoring
- Gather user feedback
- Iterate on UX based on usage data
- Scale backend as needed

**Everything is ready for production deployment! 🎉** 