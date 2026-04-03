import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import { dashboardAPI, aiAPI } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { FiTrendingUp, FiTrendingDown, FiX } from 'react-icons/fi';
import './WeeklyChart.css';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getDayName(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { weekday: 'short' });
}

// Custom tooltip for the chart
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const isProfit = value >= 0;
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        <p className={`chart-tooltip-value ${isProfit ? 'text-success' : 'text-danger'}`}>
          {isProfit ? '+' : ''}{formatCurrency(value)}
        </p>
      </div>
    );
  }
  return null;
}

export default function WeeklyChart() {
  const { t, i18n } = useTranslation();
  const toast = useToast();

  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [showInsight, setShowInsight] = useState(false);

  useEffect(() => {
    fetchWeekly();
  }, []);

  const fetchWeekly = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getWeekly();
      const data = (res.data || []).map((d) => ({
        ...d,
        day: getDayName(d.date || d.summaryDate),
        profit: (d.totalSales || 0) - (d.totalExpenses || 0),
      }));
      setWeeklyData(data);
    } catch (err) {
      // Generate mock data for demo/preview
      const mockData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockData.push({
          day: getDayName(date.toISOString()),
          date: date.toISOString().split('T')[0],
          totalSales: 0,
          totalExpenses: 0,
          profit: 0,
        });
      }
      setWeeklyData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsight = async () => {
    setInsightLoading(true);
    setShowInsight(true);
    try {
      const res = await aiAPI.getWeeklyInsight();
      setInsight(res.data?.insight || res.data?.summary || 'Weekly insight generated.');
    } catch (err) {
      setInsight('Unable to generate weekly insight. Ensure the AI service is running and you have transactions.');
    } finally {
      setInsightLoading(false);
    }
  };

  // Calculate stats
  const totalProfit = weeklyData.reduce((sum, d) => sum + d.profit, 0);
  const bestDay = weeklyData.reduce((best, d) => (d.profit > (best?.profit || -Infinity) ? d : best), weeklyData[0]);
  const worstDay = weeklyData.reduce((worst, d) => (d.profit < (worst?.profit || Infinity) ? d : worst), weeklyData[0]);
  const avgDaily = weeklyData.length > 0 ? totalProfit / weeklyData.length : 0;

  return (
    <div className="page container" id="charts-page">
      <h2 className="page-title">{t('charts.title')}</h2>

      {/* Chart */}
      <div className="chart-card card" id="weekly-chart">
        <h3 className="chart-title">{t('charts.weekly_chart')}</h3>
        {loading ? (
          <div className="skeleton" style={{ height: 220, borderRadius: 12 }}></div>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border-color)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border-color)' }}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="profit" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="chart-stats stagger">
        <div className="chart-stat-card" id="stat-best-day">
          <div className="chart-stat-icon"><FiTrendingUp style={{ color: 'var(--color-success)' }} /></div>
          <div>
            <div className="chart-stat-label">{t('charts.best_day')}</div>
            <div className="chart-stat-value text-success">
              {bestDay ? `${bestDay.day} · ${formatCurrency(bestDay.profit)}` : '—'}
            </div>
          </div>
        </div>

        <div className="chart-stat-card" id="stat-worst-day">
          <div className="chart-stat-icon"><FiTrendingDown style={{ color: 'var(--color-danger)' }} /></div>
          <div>
            <div className="chart-stat-label">{t('charts.worst_day')}</div>
            <div className="chart-stat-value text-danger">
              {worstDay ? `${worstDay.day} · ${formatCurrency(worstDay.profit)}` : '—'}
            </div>
          </div>
        </div>

        <div className="chart-stat-card" id="stat-avg-daily">
          <div className="chart-stat-icon">📊</div>
          <div>
            <div className="chart-stat-label">{t('charts.avg_daily')}</div>
            <div className={`chart-stat-value ${avgDaily >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(avgDaily)}
            </div>
          </div>
        </div>

        <div className="chart-stat-card" id="stat-total-week">
          <div className="chart-stat-icon">💰</div>
          <div>
            <div className="chart-stat-label">{t('charts.total_week')}</div>
            <div className={`chart-stat-value ${totalProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(totalProfit)}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly AI Insight Button */}
      <button
        className="btn btn-primary btn-block ai-summary-btn"
        onClick={handleGenerateInsight}
        disabled={insightLoading}
        id="generate-insight-btn"
      >
        <span>🧠</span>
        {insightLoading ? t('common.loading') : t('charts.generate_insight')}
      </button>

      {/* AI Insight Modal */}
      {showInsight && (
        <div className="ai-summary-overlay" onClick={() => setShowInsight(false)}>
          <div className="ai-summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-summary-modal-header">
              <h3>{t('charts.ai_insight')}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowInsight(false)}>
                <FiX />
              </button>
            </div>
            {insightLoading ? (
              <div className="ai-summary-loading">
                <div className="spinner"></div>
                <p>{t('common.loading')}</p>
              </div>
            ) : (
              <div className="ai-summary">
                <div className="ai-summary-title">
                  <span>🧠</span> Weekly AI Insight
                </div>
                <p className="ai-summary-text">{insight}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
