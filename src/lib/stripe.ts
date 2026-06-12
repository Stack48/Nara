import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  // En dev, on évite de crasher immédiatement si la clé n'est pas là, mais on prévient
  console.warn('⚠️ STRIPE_SECRET_KEY is missing. Please set it in your .env file.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123', {
  apiVersion: '2025-01-27.acacia',
  appInfo: {
    name: 'Nara App',
    version: '0.1.0',
  },
});
