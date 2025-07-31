#!/usr/bin/env node

// Script to automatically create Stripe webhook endpoint for Tabbit
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'your_stripe_secret_key_here');

async function setupStripeWebhook() {
  console.log('🔗 Setting up Tabbit Stripe webhook endpoint...');
  
  try {
    // Create webhook endpoint
    const webhook = await stripe.webhookEndpoints.create({
      url: 'https://tabmind-j3qouq5rv-shortsys-projects.vercel.app/api/webhook',
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_succeeded',
        'invoice.payment_failed'
      ],
      description: 'Tabbit subscription management webhook'
    });
    
    console.log('✅ Webhook endpoint created successfully!');
    console.log(`   Endpoint ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Secret: ${webhook.secret}`);
    
    console.log('\n🎯 NEXT: Add webhook secret to Vercel environment variables');
    console.log('========================================================');
    console.log(`vercel env add STRIPE_WEBHOOK_SECRET`);
    console.log(`Value: ${webhook.secret}`);
    console.log('Environment: Production, Preview, Development');
    
    console.log('\n🎉 Webhook setup complete!');
    
    return webhook.secret;
    
  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupStripeWebhook(); 