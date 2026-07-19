import stripe from 'stripe';
import * as fs from 'fs';
import appConfig from '../../../../config/app.config';
import { Fetch } from '../../Fetch';
import * as dotenv from 'dotenv';
dotenv.config();

const STRIPE_SECRET_KEY = appConfig().payment.stripe.secret_key;

const Stripe = new stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-03-31.basil',
});

const STRIPE_WEBHOOK_SECRET = appConfig().payment.stripe.webhook_secret;

/**
 * Stripe payment method helper
 */
export class StripePayment {
  static async createPaymentMethod({
    card,
    billing_details,
  }: {
    card: stripe.PaymentMethodCreateParams.Card;
    billing_details: stripe.PaymentMethodCreateParams.BillingDetails;
  }): Promise<stripe.PaymentMethod> {
    const paymentMethod = await Stripe.paymentMethods.create({
      card: {
        number: card.number,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        cvc: card.cvc,
      },
      billing_details: billing_details,
    });
    return paymentMethod;
  }

  /**
   * Add customer to stripe
   */
  static async createCustomer({
    user_id,
    name,
    email,
  }: {
    user_id: string;
    name: string;
    email: string;
  }): Promise<stripe.Customer> {
    const customer = await Stripe.customers.create({
      name: name,
      email: email,
      metadata: {
        user_id: user_id,
      },
      description: 'New Customer',
    });
    return customer;
  }

  static async attachCustomerPaymentMethodId({
    customer_id,
    payment_method_id,
  }: {
    customer_id: string;
    payment_method_id: string;
  }): Promise<stripe.PaymentMethod> {
    const customer = await Stripe.paymentMethods.attach(payment_method_id, {
      customer: customer_id,
    });
    return customer;
  }

  static async setCustomerDefaultPaymentMethodId({
    customer_id,
    payment_method_id,
  }: {
    customer_id: string;
    payment_method_id: string;
  }): Promise<stripe.Customer> {
    const customer = await Stripe.customers.update(customer_id, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    });
    return customer;
  }

  static async updateCustomer({
    customer_id,
    name,
    email,
  }: {
    customer_id: string;
    name: string;
    email: string;
  }): Promise<stripe.Customer> {
    const customer = await Stripe.customers.update(customer_id, {
      name: name,
      email: email,
    });
    return customer;
  }

  static async getCustomerByID(id: string): Promise<stripe.Customer> {
    const customer = await Stripe.customers.retrieve(id);
    return customer as stripe.Customer;
  }

  static async getCharge(chargeId: string): Promise<stripe.Charge> {
    return Stripe.charges.retrieve(chargeId);
  }

  static async getPaymentIntent(paymentIntentId: string): Promise<stripe.PaymentIntent> {
    return Stripe.paymentIntents.retrieve(paymentIntentId);
  }

  static async getCheckoutSession(sessionId: string): Promise<stripe.Checkout.Session> {
    return Stripe.checkout.sessions.retrieve(sessionId);
  }

  static async refundPaymentIntent(
    paymentIntentId: string,
    reason?: string,
  ): Promise<stripe.Refund> {
    return Stripe.refunds.create({
      payment_intent: paymentIntentId,
      metadata: {
        reason: reason || 'stall_already_booked_conflict',
      },
    });
  }

  static async createBillingSession(customer: string) {
    const session = await Stripe.billingPortal.sessions.create({
      customer: customer,
      return_url: appConfig().app.url,
    });
    return session;
  }

  static async createPaymentIntent({
    amount,
    currency,
    customer_id,
    metadata,
  }: {
    amount: number;
    currency: string;
    customer_id?: string;
    metadata?: stripe.MetadataParam;
  }): Promise<stripe.PaymentIntent> {
    return Stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // amount in cents
      currency: currency,
      ...(customer_id ? { customer: customer_id } : {}),
      metadata: metadata,
    });
  }

  /**
   * Create stripe hosted checkout session for stall booking
   */
  static async createBookingCheckoutSession({
    bookingId,
    userId,
    title,
    amount,
    currency = 'usd',
    customerEmail,
    successUrl,
    cancelUrl,
  }: {
    bookingId: string;
    userId?: string;
    title: string;
    amount: number;
    currency?: string;
    customerEmail?: string;
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<stripe.Checkout.Session> {
    const success_url =
      successUrl ||
      `${appConfig().app.url}/booking/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url =
      cancelUrl || `${appConfig().app.url}/booking/payment/cancel`;

    const session = await Stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      metadata: {
        bookingId,
        userId: userId || '',
      },
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: title,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
    });
    return session;
  }

  static async calculateTax({
    amount,
    currency,
    customer_details,
  }: {
    amount: number;
    currency: string;
    customer_details: stripe.Tax.CalculationCreateParams.CustomerDetails;
  }): Promise<stripe.Tax.Calculation> {
    const taxCalculation = await Stripe.tax.calculations.create({
      currency: currency,
      customer_details: customer_details,
      line_items: [
        {
          amount: Math.round(amount * 100),
          tax_behavior: 'exclusive',
          reference: 'tax_calculation',
        },
      ],
    });
    return taxCalculation;
  }

  static async createTaxTransaction(
    tax_calculation: string,
  ): Promise<stripe.Tax.Transaction> {
    const taxTransaction = await Stripe.tax.transactions.createFromCalculation({
      calculation: tax_calculation,
      reference: 'tax_transaction',
    });
    return taxTransaction;
  }

  static async downloadInvoiceUrl(
    payment_intent_id: string,
  ): Promise<string | null> {
    const invoice = await Stripe.invoices.retrieve(payment_intent_id);
    if (invoice.hosted_invoice_url) {
      return invoice.hosted_invoice_url;
    }
    return null;
  }

  static async downloadInvoiceFile(payment_intent_id: string) {
    const invoice = await Stripe.invoices.retrieve(payment_intent_id);
    if (invoice.hosted_invoice_url) {
      const response = await Fetch.get(invoice.hosted_invoice_url, {
        responseType: 'stream',
      });
      return fs.writeFileSync('receipt.pdf', response.data);
    } else {
      return null;
    }
  }

  static async sendInvoiceToEmail(payment_intent_id: string) {
    const invoice = await Stripe.invoices.sendInvoice(payment_intent_id);
    return invoice;
  }

  static handleWebhook(rawBody: string, sig: string | string[]): stripe.Event {
    const event = Stripe.webhooks.constructEvent(
      rawBody,
      sig,
      STRIPE_WEBHOOK_SECRET,
    );
    return event;
  }
}
