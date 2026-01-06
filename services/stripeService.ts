const STRIPE_API_BASE = 'https://api.stripe.com/v1';

export interface StripeBalance {
  available: Array<{
    amount: number;
    currency: string;
    source_types: {
      card: number;
      bank_account: number;
    };
  }>;
  pending: Array<{
    amount: number;
    currency: string;
    source_types: {
      card: number;
      bank_account: number;
    };
  }>;
  connect_reserved: Array<{
    amount: number;
    currency: string;
  }>;
}

export interface StripeTransaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created: number;
  customer: string;
  payment_method: string;
  metadata: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        nickname: string;
        product: string;
      };
      quantity: number;
    }>;
  };
}

export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  description: string;
  created: number;
}

export class StripeService {
  private static apiKey: string | null = null;

  static initialize(apiKey: string) {
    this.apiKey = apiKey;
  }

  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Stripe API key not initialized. Call StripeService.initialize(apiKey) first.');
    }

    const response = await fetch(`${STRIPE_API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Stripe API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  static async getBalance(): Promise<StripeBalance> {
    try {
      return await this.request<StripeBalance>('/balance');
    } catch (error) {
      console.error('Failed to fetch Stripe balance:', error);
      throw new Error('Unable to fetch account balance.');
    }
  }

  static async getTransactions(limit: number = 10): Promise<StripeTransaction[]> {
    try {
      const response = await this.request<{ data: StripeTransaction[] }>(`/balance_transactions?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw new Error('Unable to fetch transaction history.');
    }
  }

  static async getSubscriptions(limit: number = 10): Promise<StripeSubscription[]> {
    try {
      const response = await this.request<{ data: StripeSubscription[] }>(`/subscriptions?limit=${limit}&status=active`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      throw new Error('Unable to fetch subscriptions.');
    }
  }

  static async getCustomers(limit: number = 10): Promise<StripeCustomer[]> {
    try {
      const response = await this.request<{ data: StripeCustomer[] }>(`/customers?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      throw new Error('Unable to fetch customers.');
    }
  }

  static async createPaymentIntent(amount: number, currency: string = 'usd', customer?: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        amount: (amount * 100).toString(), // Stripe uses cents
        currency,
        ...(customer && { customer }),
      });

      return await this.request('/payment_intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw new Error('Unable to create payment intent.');
    }
  }

  static async createCustomer(email: string, name?: string, description?: string): Promise<StripeCustomer> {
    try {
      const params = new URLSearchParams({
        email,
        ...(name && { name }),
        ...(description && { description }),
      });

      return await this.request('/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw new Error('Unable to create customer.');
    }
  }

  static async createSubscription(customerId: string, priceId: string): Promise<StripeSubscription> {
    try {
      const params = new URLSearchParams({
        customer: customerId,
        items: `[{"price":"${priceId}"}]`,
      });

      return await this.request('/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw new Error('Unable to create subscription.');
    }
  }

  static async cancelSubscription(subscriptionId: string): Promise<StripeSubscription> {
    try {
      return await this.request(`/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw new Error('Unable to cancel subscription.');
    }
  }

  static async getMetrics(): Promise<{
    totalRevenue: number;
    activeCustomers: number;
    monthlyRevenue: number;
    conversionRate: number;
  }> {
    try {
      // Calculate metrics from real data
      const [balance, transactions, customers, subscriptions] = await Promise.all([
        this.getBalance(),
        this.getTransactions(100),
        this.getCustomers(100),
        this.getSubscriptions(100),
      ]);

      const totalRevenue = balance.available.reduce((sum, bal) => sum + bal.amount, 0) / 100;
      const activeCustomers = customers.length;
      const monthlyRevenue = subscriptions.reduce((sum, sub) => {
        const monthlyAmount = sub.items.data[0]?.price.unit_amount || 0;
        return sum + (monthlyAmount * sub.items.data[0].quantity) / 100;
      }, 0);

      // Simple conversion rate calculation (successful payments / total attempts)
      const successfulPayments = transactions.filter(t => t.status === 'succeeded').length;
      const conversionRate = transactions.length > 0 ? (successfulPayments / transactions.length) * 100 : 0;

      return {
        totalRevenue,
        activeCustomers,
        monthlyRevenue,
        conversionRate,
      };
    } catch (error) {
      console.error('Failed to calculate metrics:', error);
      throw new Error('Unable to calculate metrics.');
    }
  }
}
