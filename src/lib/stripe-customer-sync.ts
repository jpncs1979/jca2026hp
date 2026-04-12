import Stripe from "stripe";

/**
 * Checkout 完了後、Customer のデフォルト支払方法を設定（1月の off_session 課金用）
 */
export async function syncStripeCustomerDefaultPaymentMethod(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<void> {
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer && typeof session.customer === "object" && "id" in session.customer
        ? (session.customer as Stripe.Customer).id
        : null;
  const piId = session.payment_intent;
  if (!customerId || !piId || typeof piId !== "string") return;

  const pi = await stripe.paymentIntents.retrieve(piId);
  const pmId =
    typeof pi.payment_method === "string"
      ? pi.payment_method
      : pi.payment_method && typeof pi.payment_method === "object" && "id" in pi.payment_method
        ? (pi.payment_method as Stripe.PaymentMethod).id
        : null;
  if (!pmId) return;

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: pmId },
  });
}

/**
 * Checkout `mode: setup` 完了後、SetupIntent から支払方法を取り Customer のデフォルトに設定
 */
export async function syncStripeCustomerFromSetupCheckoutSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<void> {
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer && typeof session.customer === "object" && "id" in session.customer
        ? (session.customer as Stripe.Customer).id
        : null;
  const setupIntentId = session.setup_intent;
  if (!customerId || typeof setupIntentId !== "string") return;

  const si = await stripe.setupIntents.retrieve(setupIntentId);
  const pmId =
    typeof si.payment_method === "string"
      ? si.payment_method
      : si.payment_method && typeof si.payment_method === "object" && "id" in si.payment_method
        ? (si.payment_method as Stripe.PaymentMethod).id
        : null;
  if (!pmId) return;

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: pmId },
  });
}
