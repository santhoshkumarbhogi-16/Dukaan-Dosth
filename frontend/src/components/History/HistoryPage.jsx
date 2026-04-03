import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import { transactionAPI } from '../../services/api';
import { FiSearch, FiTrash2, FiCalendar } from 'react-icons/fi';
import './History.css';

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

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function HistoryPage() {
  const { t } = useTranslation();
  const toast = useToast();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('today');

  useEffect(() => {
    fetchTransactions();
  }, [dateRange]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let res;
      const today = new Date();
      
      if (dateRange === 'today') {
        res = await transactionAPI.getToday();
      } else if (dateRange === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        res = await transactionAPI.getByDate(yesterday.toISOString().split('T')[0]);
      } else {
        // This week
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        res = await transactionAPI.getRange(
          weekAgo.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
      }
      setTransactions(res.data || []);
    } catch (err) {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await transactionAPI.delete(id);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      toast.success('Transaction deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  // Filters
  const filtered = transactions.filter((tx) => {
    if (activeFilter !== 'all' && tx.type !== activeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        tx.description?.toLowerCase().includes(q) ||
        tx.customerName?.toLowerCase().includes(q) ||
        tx.category?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page container" id="history-page">
      <h2 className="page-title">{t('history.title')}</h2>

      {/* Date range tabs */}
      <div className="tab-bar mb-4" id="date-tabs">
        {[
          { key: 'today', label: t('history.today') },
          { key: 'yesterday', label: t('history.yesterday') },
          { key: 'week', label: t('history.this_week') },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab-item ${dateRange === tab.key ? 'active' : ''}`}
            onClick={() => setDateRange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="search-bar" id="search-bar">
        <FiSearch className="search-icon" />
        <input
          type="text"
          className="input search-input"
          placeholder={t('history.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="search-input"
        />
      </div>

      {/* Type filter chips */}
      <div className="filter-chips" id="filter-chips">
        <button
          className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          {t('history.all')}
        </button>
        <button
          className={`filter-chip ${activeFilter === 'SALE' ? 'active' : ''}`}
          onClick={() => setActiveFilter('SALE')}
        >
          🛒 {t('input.sale')}
        </button>
        <button
          className={`filter-chip ${activeFilter === 'EXPENSE' ? 'active' : ''}`}
          onClick={() => setActiveFilter('EXPENSE')}
        >
          💰 {t('input.expense')}
        </button>
        <button
          className={`filter-chip ${activeFilter === 'CREDIT_GIVEN' ? 'active' : ''}`}
          onClick={() => setActiveFilter('CREDIT_GIVEN')}
        >
          📝 {t('input.udhaar_given')}
        </button>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="stagger">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: 64, margin: '8px 0', borderRadius: 12 }}></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-title">{t('dashboard.no_transactions')}</p>
          <p className="empty-state-desc">{t('dashboard.no_transactions_desc')}</p>
        </div>
      ) : (
        <div className="transaction-list stagger">
          {filtered.map((tx) => {
            const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.SALE;
            return (
              <div className="transaction-item history-item" key={tx.id}>
                <div className={`transaction-icon ${config.color}`}>
                  {config.emoji}
                </div>
                <div className="transaction-details">
                  <div className="transaction-desc">
                    {tx.description || tx.category || tx.type}
                  </div>
                  <div className="transaction-meta">
                    {tx.customerName && `${tx.customerName} · `}
                    {formatDate(tx.transactionDate || tx.createdAt)}
                    {tx.createdAt && ` · ${formatTime(tx.createdAt)}`}
                  </div>
                </div>
                <div className="history-item-right">
                  <div className={`transaction-amount ${
                    tx.type === 'SALE' || tx.type === 'CREDIT_RECEIVED' ? 'positive' :
                    tx.type === 'CREDIT_GIVEN' ? 'udhaar' : 'negative'
                  }`}>
                    {config.sign}{formatCurrency(tx.amount)}
                  </div>
                  <button
                    className="btn btn-ghost history-delete"
                    onClick={() => handleDelete(tx.id)}
                    aria-label="Delete"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
