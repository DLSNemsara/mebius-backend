import Stripe from "stripe";

// Initialize Stripe lazily to ensure environment variables are loaded
let stripe: Stripe | null = null;

function initializeStripe(): Stripe | null {
  if (stripe) return stripe; // Already initialized

  if (process.env.STRIPE_SECRET_KEY) {
    try {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-07-30.basil",
      });
      // Stripe initialized successfully
      return stripe;
    } catch (error) {
      console.error("Failed to initialize Stripe:", error);
      stripe = null;
      return null;
    }
  } else {
    console.warn(
      "STRIPE_SECRET_KEY not found - Stripe functionality will be disabled"
    );
    return null;
  }
}

export class StripeService {
  /**
   * Check if Stripe is available
   */
  private static checkStripeAvailable(): void {
    if (!stripe) {
      // Try to initialize Stripe if not already initialized
      stripe = initializeStripe();
    }

    if (!stripe) {
      throw new Error(
        "Stripe is not configured. Please check your STRIPE_SECRET_KEY environment variable."
      );
    }
  }

  /**
   * Create a Stripe Product and Price for a product
   */
  static async createProductAndPrice(
    name: string,
    price: number,
    description: string
  ): Promise<{ productId: string; priceId: string }> {
    this.checkStripeAvailable();

    try {
      // Create Stripe Product
      const product = await stripe!.products.create({
        name,
        description,
        active: true,
      });

      // Create Stripe Price (in cents)
      const priceInCents = Math.round(price * 100);
      const stripePrice = await stripe!.prices.create({
        product: product.id,
        unit_amount: priceInCents,
        currency: "usd",
        active: true,
      });

      return {
        productId: product.id,
        priceId: stripePrice.id,
      };
    } catch (error) {
      console.error("Error creating Stripe product/price:", error);
      throw new Error("Failed to create Stripe product/price");
    }
  }

  /**
   * Create a PaymentIntent for an order
   */
  static async createPaymentIntent(
    amount: number,
    orderId: string,
    metadata: Record<string, string> = {}
  ): Promise<Stripe.PaymentIntent> {
    this.checkStripeAvailable();

    try {
      const amountInCents = Math.round(amount * 100);

      const paymentIntent = await stripe!.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata: {
          orderId,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error("Error creating PaymentIntent:", error);
      throw new Error("Failed to create PaymentIntent");
    }
  }

  /**
   * Update PaymentIntent metadata
   */
  static async updatePaymentIntentMetadata(
    paymentIntentId: string,
    metadata: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    this.checkStripeAvailable();

    try {
      return await stripe!.paymentIntents.update(paymentIntentId, {
        metadata,
      });
    } catch (error) {
      console.error("Error updating PaymentIntent metadata:", error);
      throw new Error("Failed to update PaymentIntent metadata");
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string
  ): Stripe.Event {
    this.checkStripeAvailable();

    try {
      return stripe!.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      throw new Error("Webhook signature verification failed");
    }
  }

  /**
   * Update Stripe Product
   */
  static async updateProduct(
    stripeProductId: string,
    updates: Partial<Stripe.ProductUpdateParams>
  ): Promise<Stripe.Product> {
    this.checkStripeAvailable();

    try {
      return await stripe!.products.update(stripeProductId, updates);
    } catch (error) {
      console.error("Error updating Stripe product:", error);
      throw new Error("Failed to update Stripe product");
    }
  }

  /**
   * Update Stripe Price
   */
  static async updatePrice(
    stripePriceId: string,
    updates: Partial<Stripe.PriceUpdateParams>
  ): Promise<Stripe.Price> {
    this.checkStripeAvailable();

    try {
      return await stripe!.prices.update(stripePriceId, updates);
    } catch (error) {
      console.error("Error updating Stripe price:", error);
      throw new Error("Failed to update Stripe price");
    }
  }

  /**
   * Deactivate Stripe Product and Price
   */
  static async deactivateProductAndPrice(
    stripeProductId: string,
    stripePriceId: string
  ): Promise<void> {
    this.checkStripeAvailable();

    try {
      await Promise.all([
        stripe!.products.update(stripeProductId, { active: false }),
        stripe!.prices.update(stripePriceId, { active: false }),
      ]);
    } catch (error) {
      console.error("Error deactivating Stripe product/price:", error);
      throw new Error("Failed to deactivate Stripe product/price");
    }
  }
}

export default stripe;
