// Vercel serverless function for handling Stripe webhooks
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, updateDoc, getDoc } = require('firebase/firestore');

// Initialize Firebase (you may need to set these as environment variables)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "tabbit-f3fd7.firebaseapp.com",
  projectId: "tabbit-f3fd7",
  storageBucket: "tabbit-f3fd7.firebasestorage.app",
  messagingSenderId: "45262224715",
  appId: "1:45262224715:web:9989605cd1b5cb0f393cce"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleCheckoutCompleted(session) {
  const userId = session.client_reference_id || session.metadata?.user_id;
  
  if (!userId) {
    console.error('No user ID found in checkout session');
    return;
  }

  // Create or update user subscription record
  const subscriptionId = session.subscription;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  await updateUserSubscription(userId, subscription, session.customer);
}

async function handleSubscriptionChange(subscription) {
  // Find user by customer ID
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata?.user_id;
  
  if (!userId) {
    console.error('No user ID found for customer:', subscription.customer);
    return;
  }
  
  await updateUserSubscription(userId, subscription, subscription.customer);
}

async function handleSubscriptionDeleted(subscription) {
  // Find user by customer ID and update to free plan
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata?.user_id;
  
  if (!userId) {
    console.error('No user ID found for customer:', subscription.customer);
    return;
  }
  
  // Update user to free plan
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    subscription: 'free',
    lastActive: new Date()
  });
  
  console.log(`User ${userId} subscription canceled, reverted to free plan`);
}

async function handlePaymentSucceeded(invoice) {
  console.log('Payment succeeded for invoice:', invoice.id);
  // Could update usage limits, send confirmation email, etc.
}

async function handlePaymentFailed(invoice) {
  console.log('Payment failed for invoice:', invoice.id);
  // Could send notification to user, update subscription status, etc.
}

async function updateUserSubscription(userId, subscription, customerId) {
  try {
    // Determine plan from subscription
    const plan = determinePlanFromSubscription(subscription);
    
    // Update user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      subscription: plan,
      lastActive: new Date()
    });
    
    // Create or update subscription document
    const subscriptionData = {
      id: subscription.id,
      userId: userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan: plan,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      usage: {
        tabAnalyses: 0,
        dailyGoals: 0,
        automationActions: 0,
        lastResetDate: new Date()
      },
      limits: getSubscriptionLimits(plan)
    };
    
    const subscriptionRef = doc(db, 'subscriptions', subscription.id);
    await setDoc(subscriptionRef, subscriptionData);
    
    console.log(`Updated subscription for user ${userId} to ${plan}`);
    
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

function determinePlanFromSubscription(subscription) {
  // This will need to be updated with actual price IDs
  const priceId = subscription.items.data[0]?.price?.id;
  
  if (priceId?.includes('pro')) {
    return 'pro';
  } else if (priceId?.includes('team')) {
    return 'team';
  }
  
  return 'free';
}

function getSubscriptionLimits(plan) {
  const limits = {
    free: {
      tabAnalysesPerDay: 5,
      goalsPerDay: 1,
      teamMembers: 0,
      historyRetention: 7
    },
    pro: {
      tabAnalysesPerDay: -1, // Unlimited
      goalsPerDay: -1,
      teamMembers: 0,
      historyRetention: 90
    },
    team: {
      tabAnalysesPerDay: -1,
      goalsPerDay: -1,
      teamMembers: 10,
      historyRetention: 365
    }
  };
  
  return limits[plan] || limits.free;
} 