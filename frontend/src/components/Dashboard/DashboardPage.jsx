import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dashboardAPI, transactionAPI, aiAPI } from '../../services/api';
import {
  FiTrendingUp, FiTrendingDown, FiDollarSign, FiUsers, FiRefreshCw, FiPlus, FiX,
} from 'react-icons/fi';
import './Dashboard.css';

const TYPE_CONFIG = {
  SALE: { emoji: '🛒', color: 'sale', sign: '+' },
  EXPENSE: { emoji: '💰', color: 'expense', sign: '-' },
  CREDIT_GIVEN: { emoji: '📝', color: 'credit-given', sign: '↗' },
  CREDIT_RECEIVED: { emoji: '📥', color: 'credit-received', sign: '↙' },
};

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [dashData, setDashData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, txRes] = await Promise.all([
        dashboardAPI.getToday(),
        transactionAPI.getToday(),
      ]);
      setDashData(dashRes.data);
      setTransactions(txRes.data || []);
    } catch (err) {
      // If backend is not available, use mock data for demo
      setDashData({
        totalSales: 0,
        totalExpenses: 0,
        netProfit: 0,
        creditGiven: 0,
        creditReceived: 0,
        transactionCount: 0,
      });
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setShowSummary(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await aiAPI.getDailySummary(today);
      setAiSummary(res.data?.summary || res.data?.insight || 'Summary generated successfully.');
    } catch (err) {
      setAiSummary('Unable to generate summary right now. Please ensure you have transactions and the AI service is running.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const netProfit = dashData ? (dashData.totalSales - dashData.totalExpenses) : 0;
  const isProfit = netProfit >= 0;

  if (loading) {
    return (
      <div className="page container">
        <div className="dashboard-greeting skeleton" style={{ height: 32, width: '60%', marginBottom: 16 }}></div>
        <div className="stat-grid stagger">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card"></div>
          ))}
        </div>
        <div className="skeleton skeleton-card" style={{ height: 200, marginTop: 20 }}></div>
      </div>
    );
  }

  return (
    <div className="page container" id="dashboard-page">
      {/* Greeting */}
      <div className="dashboard-header">
        <div>
          <p className="dashboard-greeting">
            {t('dashboard.greeting')}, <strong>{user?.ownerName || 'Boss'}</strong> 👋
          </p>
          <p className="dashboard-subtext">{t('dashboard.today_summary')}</p>
        </div>
        <button
          className="btn btn-icon btn-ghost"
          onClick={handleRefresh}
          title="Refresh"
          id="dashboard-refresh-btn"
        >
          <FiRefreshCw className={refreshing ? 'spin-anim' : ''} />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid stagger">
        <div className="stat-card sale" id="stat-sales">
          <div className="stat-icon">🛒</div>
          <div className="stat-label">{t('dashboard.total_sales')}</div>
          <div className="stat-value text-success">{formatCurrency(dashData?.totalSales)}</div>
        </div>
        <div className="stat-card expense" id="stat-expenses">
          <div className="stat-icon">💸</div>
          <div className="stat-label">{t('dashboard.total_expenses')}</div>
          <div className="stat-value text-danger">{formatCurrency(dashData?.totalExpenses)}</div>
        </div>
        <div className="stat-card profit" id="stat-profit">
          <div className="stat-icon">{isProfit ? '📈' : '📉'}</div>
          <div className="stat-label">{isProfit ? t('dashboard.net_profit') : t('dashboard.net_loss')}</div>
          <div className={`stat-value ${isProfit ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(Math.abs(netProfit))}
          </div>
        </div>
        <div className="stat-card udhaar" id="stat-udhaar">
          <div className="stat-icon">📋</div>
          <div className="stat-label">{t('dashboard.pending_udhaar')}</div>
          <div className="stat-value text-udhaar">{formatCurrency(dashData?.creditGiven)}</div>
        </div>
      </div>

      {/* AI Summary Button */}
      <button
        className="btn btn-primary btn-block ai-summary-btn"
        onClick={handleGenerateSummary}
        disabled={summaryLoading}
        id="generate-summary-btn"
      >
        <span>✨</span>
        {summaryLoading ? t('common.loading') : t('dashboard.generate_summary')}
      </button>

      {/* AI Summary Modal */}
      {showSummary && (
        <div className="ai-summary-overlay" onClick={() => setShowSummary(false)}>
          <div className="ai-summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-summary-modal-header">
              <h3>{t('dashboard.ai_summary')}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowSummary(false)}>
                <FiX />
              </button>
            </div>
            {summaryLoading ? (
              <div className="ai-summary-loading">
                <div className="spinner"></div>
                <p>{t('input.parsing')}</p>
              </div>
            ) : (
              <div className="ai-summary">
                <div className="ai-summary-title">
                  <span>🤖</span> AI Summary
                </div>
                <p className="ai-summary-text">{aiSummary}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="dashboard-section">
        <div className="section-header">
          <h3 className="section-title">{t('dashboard.recent')}</h3>
          {transactions.length > 0 && (
            <button className="btn btn-ghost" onClick={() => navigate('/history')} style={{ fontSize: 'var(--fs-sm)' }}>
              View All →
            </button>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-title">{t('dashboard.no_transactions')}</p>
            <p className="empty-state-desc">{t('dashboard.no_transactions_desc')}</p>
            <button
              className="btn btn-primary mt-4"
              onClick={() => navigate('/input')}
              id="empty-add-btn"
            >
              <FiPlus /> {t('nav.add')}
            </button>
          </div>
        ) : (
          <div className="transaction-list stagger">
            {transactions.slice(0, 8).map((tx) => {
              const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.SALE;
              return (
                <div className="transaction-item" key={tx.id}>
                  <div className={`transaction-icon ${config.color}`}>
                    {config.emoji}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-desc">
                      {tx.description || tx.category || tx.type}
                    </div>
                    <div className="transaction-meta">
                      {tx.customerName && `${tx.customerName} · `}
                      {tx.category || tx.type}
                    </div>
                  </div>
                  <div className={`transaction-amount ${
                    tx.type === 'SALE' || tx.type === 'CREDIT_RECEIVED' ? 'positive' :
                    tx.type === 'CREDIT_GIVEN' ? 'udhaar' : 'negative'
                  }`}>
                    {config.sign}{formatCurrency(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
