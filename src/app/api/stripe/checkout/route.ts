import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma'; // Assuming this exists or I will need to check the path

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planType, userId } = body;

    if (!userId || !planType) {
      return NextResponse.json({ error: 'Missing userId or planType' }, { status: 400 });
    }

    // In a real app, you would fetch the user's email from the database
    // For now, let's assume we have the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Map plan to Stripe Price ID (to be configured in .env or hardcoded for now)
    let priceId = '';
    if (planType === 'BASIC') {
      priceId = process.env.STRIPE_PRICE_BASIC || '';
    } else if (planType === 'PRO') {
      priceId = process.env.STRIPE_PRICE_PRO || '';
    } else {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price ID not configured for ${planType}` },
        { status: 500 }
      );
    }

    let customerId = user.subscription?.stripeCustomerId;

    // Create a new customer in Stripe if they don't have one
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Create subscription record locally
      await prisma.subscription.create({
        data: {
          userId: user.id,
          stripeCustomerId: customerId,
          planType: 'FREE_TRIAL', // Defaults to FREE_TRIAL until checkout succeeds
          status: 'incomplete',
        },
      });
    }

    // Create Checkout Session
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?canceled=true`,
      metadata: {
        userId: user.id,
        planType,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
