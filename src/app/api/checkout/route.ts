import { NextRequest, NextResponse } from "next/server";

import Stripe from "@/lib/stripe-sdk";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;

async function findOrCreateCustomer(stripe: Stripe, userId: string, email: string) {
  try {
    const searchResult = await stripe.customers.search({
      query: `email:'${email}' AND metadata['uid']:'${userId}'`,
      limit: 1,
    });

    if (searchResult.data.length > 0) {
      return searchResult.data[0];
    }
  } catch (error) {
    console.error("Failed to search customer", error);
  }

  return stripe.customers.create({
    email,
    metadata: { uid: userId },
  });
}

export async function POST(req: NextRequest) {
  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 500 },
    );
  }

  let payload: Record<string, string>;

  try {
    payload = await req.json();
  } catch (error) {
    console.error("Invalid JSON payload", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { userId, email, calendarId, fiscalYear, universityCode } = payload;

  if (!userId || !email || !calendarId || !fiscalYear || !universityCode) {
    return NextResponse.json(
      { error: "userId, email, calendarId, fiscalYear, universityCode are required" },
      { status: 400 },
    );
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const origin = new URL(req.url).origin;

  try {
    const customer = await findOrCreateCustomer(stripe, userId, email);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "payment",
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: { userId, calendarId, fiscalYear, universityCode },
      success_url: `${origin}/purchase/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/refill-edit`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error("Failed to create checkout session", error);
    return NextResponse.json(
      { error: "Failed to start checkout" },
      { status: 500 },
    );
  }
}
