import { NextFunction, Request, Response } from "express";
import Order from "../infrastructure/schemas/Order";
import { StripeService } from "../infrastructure/stripe";

export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signature = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    if (!signature) {
      console.error("No Stripe signature found");
      return res.status(400).json({ error: "No signature found" });
    }

    // Verify webhook signature
    let event;
    try {
      event = StripeService.verifyWebhookSignature(
        req.body,
        signature,
        webhookSecret
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Received webhook event

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object);
        break;

      case "payment_intent.canceled":
        await handlePaymentCanceled(event.data.object);
        break;

      default:
      // Unhandled event type
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    next(error);
  }
};

async function handlePaymentSuccess(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      console.error("No orderId found in payment intent metadata");
      return;
    }

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "PAID",
      stripePaymentIntentStatus: paymentIntent.status,
      orderStatus: "CONFIRMED", // Move order to confirmed status
    });

    // Order payment confirmed
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
}

async function handlePaymentFailure(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      console.error("No orderId found in payment intent metadata");
      return;
    }

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "FAILED",
      stripePaymentIntentStatus: paymentIntent.status,
    });

    // Order payment failed
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}

async function handlePaymentCanceled(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    if (!orderId) {
      console.error("No orderId found in payment intent metadata");
      return;
    }

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "FAILED",
      stripePaymentIntentStatus: paymentIntent.status,
    });

    // Order payment canceled
  } catch (error) {
    console.error("Error handling payment canceled:", error);
  }
}
