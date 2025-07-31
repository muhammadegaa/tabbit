#!/usr/bin/env node

// Script to automatically create Stripe products and prices for Tabbit
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'your_stripe_secret_key_here');

async function setupStripeProducts() {
  console.log('🚀 Setting up Tabbit Stripe products...');
  
  try {
    // Create Tabbit Pro product
    console.log('📦 Creating Tabbit Pro product...');
    const proProduct = await stripe.products.create({
      name: 'Tabbit Pro',
      description: 'Unlimited AI-powered tab analysis and automation. Perfect for focused productivity.',
      metadata: {
        plan: 'pro',
        features: 'unlimited_analysis,automation,progress_tracking,7_day_history'
      }
    });
    
    // Create Pro monthly price ($7/month)
    const proMonthlyPrice = await stripe.prices.create({
      unit_amount: 700, // $7.00 in cents
      currency: 'usd',
      recurring: { interval: 'month' },
      product: proProduct.id,
      nickname: 'Pro Monthly - Competitive pricing vs $10-20 competitors'
    });
    
    // Create Pro yearly price ($70/year = $5.83/month, 17% discount)
    const proYearlyPrice = await stripe.prices.create({
      unit_amount: 7000, // $70.00 in cents
      currency: 'usd',
      recurring: { interval: 'year' },
      product: proProduct.id,
      nickname: 'Pro Yearly - 17% discount vs monthly'
    });
    
    console.log('✅ Tabbit Pro created successfully!');
    console.log(`   Monthly: ${proMonthlyPrice.id} ($7/month)`);
    console.log(`   Yearly:  ${proYearlyPrice.id} ($70/year)`);
    
    // Create Tabbit Team product
    console.log('📦 Creating Tabbit Team product...');
    const teamProduct = await stripe.products.create({
      name: 'Tabbit Team',
      description: 'Pro features plus team collaboration and shared goals. Scale productivity across your team.',
      metadata: {
        plan: 'team',
        features: 'unlimited_analysis,automation,team_goals,30_day_history,team_analytics,10_members'
      }
    });
    
    // Create Team monthly price ($19/month)
    const teamMonthlyPrice = await stripe.prices.create({
      unit_amount: 1900, // $19.00 in cents
      currency: 'usd',
      recurring: { interval: 'month' },
      product: teamProduct.id,
      nickname: 'Team Monthly - Premium collaboration features'
    });
    
    // Create Team yearly price ($190/year = $15.83/month, 17% discount)
    const teamYearlyPrice = await stripe.prices.create({
      unit_amount: 19000, // $190.00 in cents
      currency: 'usd',
      recurring: { interval: 'year' },
      product: teamProduct.id,
      nickname: 'Team Yearly - 17% discount vs monthly'
    });
    
    console.log('✅ Tabbit Team created successfully!');
    console.log(`   Monthly: ${teamMonthlyPrice.id} ($19/month)`);
    console.log(`   Yearly:  ${teamYearlyPrice.id} ($190/year)`);
    
    // Output the price IDs for updating the code
    console.log('\n🎯 COPY THESE PRICE IDs TO YOUR CODE:');
    console.log('=====================================');
    console.log(`const PRICE_IDS = {`);
    console.log(`  pro_monthly: '${proMonthlyPrice.id}',`);
    console.log(`  pro_yearly: '${proYearlyPrice.id}',`);
    console.log(`  team_monthly: '${teamMonthlyPrice.id}',`);
    console.log(`  team_yearly: '${teamYearlyPrice.id}'`);
    console.log(`} as const;`);
    
    // Create webhook endpoint (instructions)
    console.log('\n📡 NEXT: Set up webhook endpoint');
    console.log('================================');
    console.log('1. Go to: https://dashboard.stripe.com/webhooks');
    console.log('2. Add endpoint: https://tabmind-j3qouq5rv-shortsys-projects.vercel.app/api/webhook');
    console.log('3. Select events: checkout.session.completed, customer.subscription.*');
    console.log('4. Copy webhook secret and add to Vercel env vars');
    
    console.log('\n🎉 Stripe products setup complete!');
    
  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupStripeProducts(); 