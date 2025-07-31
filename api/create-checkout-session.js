// Vercel serverless function for creating Stripe checkout sessions
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Set CORS headers for Chrome extension
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { price_id, user_id, success_url, cancel_url } = req.body;

    if (!price_id || !user_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url || 'chrome-extension://your-extension-id/popup.html?success=true',
      cancel_url: cancel_url || 'chrome-extension://your-extension-id/popup.html?canceled=true',
      client_reference_id: user_id,
      metadata: {
        user_id: user_id
      }
    });

    res.status(200).json({ id: session.id, url: session.url });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
} 