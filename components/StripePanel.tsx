import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, TrendingUp, Users, Activity, Download, RefreshCw, Plus, Eye, EyeOff, CheckCircle, AlertCircle, Clock, Settings, LogOut } from 'lucide-react';
import { StripeService, StripeBalance, StripeTransaction, StripeSubscription, StripeCustomer } from '../services/stripeService';

const StripePanel: React.FC = () => {
  const [balance, setBalance] = useState<StripeBalance | null>(null);
  const [transactions, setTransactions] = useState<StripeTransaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<StripeSubscription[]>([]);
  const [customers, setCustomers] = useState<StripeCustomer[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'subscriptions'>('overview');
  const [showBalance, setShowBalance] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  useEffect(() => {
    // Check if API key is stored
    const storedKey = localStorage.getItem('stripe_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      StripeService.initialize(storedKey);
      loadStripeData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadStripeData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [balanceData, transactionsData, subscriptionsData, customersData, metricsData] = await Promise.all([
        StripeService.getBalance(),
        StripeService.getTransactions(20),
        StripeService.getSubscriptions(20),
        StripeService.getCustomers(20),
        StripeService.getMetrics()
      ]);

      setBalance(balanceData);
      setTransactions(transactionsData);
      setSubscriptions(subscriptionsData);
      setCustomers(customersData);
      setMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Stripe data');
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    try {
      localStorage.setItem('stripe_api_key', apiKey);
      StripeService.initialize(apiKey);
      setShowApiKeyModal(false);
      await loadStripeData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid API key');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('stripe_api_key');
    setApiKey('');
    setBalance(null);
    setTransactions([]);
    setSubscriptions([]);
    setCustomers([]);
    setMetrics(null);
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100); // Stripe uses cents
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
      case 'active':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'pending':
      case 'trialing':
      case 'past_due':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'failed':
      case 'canceled':
      case 'incomplete':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  if (loading && !apiKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <CreditCard className="w-12 h-12 text-violet-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Stripe</h2>
            <p className="text-zinc-400">Enter your Stripe API key to manage payments</p>
          </div>
          
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Stripe API Key (sk_test_...)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk_test_..."
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-400"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors"
            >
              Connect Stripe
            </button>
          </form>
          
          <p className="text-zinc-500 text-xs text-center mt-4">
            Your API key is stored locally and never sent to our servers
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1800px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <CreditCard className="w-8 h-8 mr-3 text-violet-400" />
            Stripe Dashboard
          </h1>
          <p className="text-zinc-400">Manage payments, subscriptions, and financial analytics</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => loadStripeData()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Payment
          </button>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors flex items-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Balance Card */}
      {balance && (
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm mb-2">Available Balance</p>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold text-white">
                  {showBalance ? formatCurrency(balance.available[0]?.amount || 0, balance.available[0]?.currency) : '••••••••'}
                </h2>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {showBalance ? <EyeOff className="w-4 h-4 text-white" /> : <Eye className="w-4 h-4 text-white" />}
                </button>
              </div>
              <p className="text-violet-200 text-sm mt-2">Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
            <div className="text-right">
              <p className="text-violet-100 text-sm mb-1">Pending Transfers</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(balance.pending[0]?.amount || 0, balance.pending[0]?.currency)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">+12.5%</span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{formatCurrency(metrics.totalRevenue)}</p>
            <p className="text-zinc-400 text-sm">Total Revenue</p>
          </div>
          <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">+8.3%</span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{metrics.activeCustomers.toLocaleString()}</p>
            <p className="text-zinc-400 text-sm">Active Customers</p>
          </div>
          <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">+15.2%</span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{formatCurrency(metrics.monthlyRevenue)}</p>
            <p className="text-zinc-400 text-sm">Monthly Revenue</p>
          </div>
          <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-medium text-red-400">-0.4%</span>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{metrics.conversionRate.toFixed(1)}%</p>
            <p className="text-zinc-400 text-sm">Conversion Rate</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'overview' 
              ? 'bg-white text-black' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'transactions' 
              ? 'bg-white text-black' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'subscriptions' 
              ? 'bg-white text-black' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Subscriptions
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Recent Transactions</h3>
            {transactions.slice(0, 5).map(transaction => (
              <div key={transaction.id} className="bg-[#1c1c1e] border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{transaction.description || 'Payment'}</p>
                    <p className="text-zinc-400 text-sm">
                      {customers.find(c => c.id === transaction.customer)?.email || transaction.customer}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{formatCurrency(transaction.amount, transaction.currency)}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Subscription Activity</h3>
            <div className="bg-[#1c1c1e] border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-zinc-400">Active Subscriptions</span>
                <span className="text-2xl font-bold text-white">{subscriptions.filter(s => s.status === 'active').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Monthly Recurring Revenue</span>
                <span className="text-xl font-bold text-emerald-400">
                  {formatCurrency(
                    subscriptions
                      .filter(s => s.status === 'active')
                      .reduce((sum, s) => {
                        const monthlyAmount = s.items.data[0]?.price.unit_amount || 0;
                        return sum + (monthlyAmount * s.items.data[0].quantity);
                      }, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {transactions.map(transaction => (
            <div key={transaction.id} className="bg-[#1c1c1e] border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.status === 'succeeded' ? 'bg-emerald-400/20' :
                    transaction.status === 'pending' ? 'bg-amber-400/20' : 'bg-red-400/20'
                  }`}>
                    {transaction.status === 'succeeded' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                    {transaction.status === 'pending' && <Clock className="w-5 h-5 text-amber-400" />}
                    {transaction.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-400" />}
                  </div>
                  <div>
                    <p className="text-white font-medium">{transaction.description || 'Payment'}</p>
                    <p className="text-zinc-400 text-sm">
                      {customers.find(c => c.id === transaction.customer)?.email || transaction.customer} • {formatDate(transaction.created)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">{formatCurrency(transaction.amount, transaction.currency)}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {subscriptions.map(subscription => (
            <div key={subscription.id} className="bg-[#1c1c1e] border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">
                    {subscription.items.data[0]?.price.nickname || subscription.items.data[0]?.price.product}
                  </p>
                  <p className="text-zinc-400 text-sm">
                    {customers.find(c => c.id === subscription.customer)?.email || subscription.customer}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(
                      (subscription.items.data[0]?.price.unit_amount || 0) * (subscription.items.data[0]?.quantity || 1),
                      subscription.items.data[0]?.price.currency
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                      {subscription.status}
                    </span>
                    <span className="text-zinc-400 text-sm">
                      {subscription.status === 'active' ? `Next: ${formatDate(subscription.current_period_end)}` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StripePanel;
