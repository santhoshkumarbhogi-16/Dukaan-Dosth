import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { aiAPI, transactionAPI } from '../../services/api';
import VoiceRecorder from './VoiceRecorder';
import { FiSend, FiCheck, FiEdit2, FiX } from 'react-icons/fi';
import './TransactionInput.css';

const QUICK_TYPES = [
  { key: 'SALE', emoji: '🛒', labelKey: 'input.sale', color: 'var(--color-success)' },
  { key: 'EXPENSE', emoji: '💰', labelKey: 'input.expense', color: 'var(--color-danger)' },
  { key: 'CREDIT_GIVEN', emoji: '📝', labelKey: 'input.udhaar_given', color: 'var(--color-udhaar)' },
  { key: 'CREDIT_RECEIVED', emoji: '📥', labelKey: 'input.udhaar_received', color: 'var(--color-info)' },
];

export default function TransactionInput() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('voice');
  const [textInput, setTextInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);

  // Quick entry form
  const [quickType, setQuickType] = useState(null);
  const [quickForm, setQuickForm] = useState({
    amount: '',
    description: '',
    customerName: '',
    category: '',
  });

  const lang = i18n.language;

  // Handle AI parsing
  const handleParse = async (text) => {
    if (!text.trim()) return;
    setParsing(true);
    setParsed(null);
    setSaved(false);

    try {
      const res = await aiAPI.parse(text, lang);
      setParsed({
        type: res.data.type || 'SALE',
        amount: res.data.amount || 0,
        description: res.data.description || '',
        category: res.data.category || '',
        customerName: res.data.customer_name || res.data.customerName || '',
        rawInput: text,
        confidence: res.data.confidence || 1,
        clarification: res.data.clarification || null,
      });
    } catch (err) {
      toast.error('Failed to parse input. Please try again or use Quick Entry.');
      console.error('Parse error:', err);
    } finally {
      setParsing(false);
    }
  };

  // Handle voice transcript
  const handleVoiceTranscript = (text) => {
    handleParse(text);
  };

  // Handle text submit
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleParse(textInput);
    }
  };

  // Handle quick entry submit
  const handleQuickSubmit = () => {
    if (!quickForm.amount || quickForm.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setParsed({
      type: quickType,
      amount: parseFloat(quickForm.amount),
      description: quickForm.description,
      category: quickForm.category,
      customerName: quickForm.customerName,
      rawInput: `${quickType}: ${quickForm.description} ₹${quickForm.amount}`,
    });
    setQuickType(null);
  };

  // Save transaction
  const handleSave = async () => {
    if (!parsed) return;
    setSaving(true);

    try {
      await transactionAPI.create({
        type: parsed.type,
        amount: parsed.amount,
        description: parsed.description,
        category: parsed.category,
        customerName: parsed.customerName,
        rawInput: parsed.rawInput,
        transactionDate: new Date().toISOString().split('T')[0],
      });
      setSaved(true);
      toast.success(t('input.saved_success'));
      setTimeout(() => {
        setParsed(null);
        setSaved(false);
        setTextInput('');
        setEditing(false);
      }, 1500);
    } catch (err) {
      toast.error('Failed to save transaction');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle edit mode
  const handleEdit = () => {
    setEditing(true);
  };

  const handleEditSave = () => {
    setEditing(false);
  };

  // Cancel parsed
  const handleCancel = () => {
    setParsed(null);
    setTextInput('');
    setSaved(false);
    setEditing(false);
  };

  const typeConfig = {
    SALE: { emoji: '🛒', label: t('input.sale'), colorClass: 'text-success' },
    EXPENSE: { emoji: '💰', label: t('input.expense'), colorClass: 'text-danger' },
    CREDIT_GIVEN: { emoji: '📝', label: t('input.udhaar_given'), colorClass: 'text-udhaar' },
    CREDIT_RECEIVED: { emoji: '📥', label: t('input.udhaar_received'), colorClass: 'text-info' },
  };

  return (
    <div className="page container" id="transaction-input-page">
      <h2 className="page-title">{t('input.title')}</h2>

      {/* Success animation */}
      {saved && (
        <div className="saved-overlay">
          <div className="success-check">✅</div>
          <p>{t('input.saved_success')}</p>
        </div>
      )}

      {/* Parsing loader */}
      {parsing && (
        <div className="parsing-loader">
          <div className="spinner"></div>
          <p>{t('input.parsing')}</p>
        </div>
      )}

      {/* Confirmation card */}
      {parsed && !parsing && !saved && (
        <div className="confirm-card" id="confirm-card">
          <div className="confirm-card-header">
            <span style={{ fontSize: '1.5rem' }}>{typeConfig[parsed.type]?.emoji}</span>
            <span className={`confirm-card-type ${typeConfig[parsed.type]?.colorClass}`}>
              {typeConfig[parsed.type]?.label}
            </span>
            {parsed.confidence && parsed.confidence < 0.7 && (
              <span className="badge badge-expense" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                Low confidence
              </span>
            )}
          </div>

          <div className="confirm-amount">
            <span className={typeConfig[parsed.type]?.colorClass}>
              ₹{parsed.amount?.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="confirm-card-details">
            {parsed.description && (
              <div className="confirm-row">
                <span className="confirm-label">{t('input.description')}</span>
                {editing ? (
                  <input
                    className="input"
                    value={parsed.description}
                    onChange={(e) => setParsed({ ...parsed, description: e.target.value })}
                    style={{ width: '55%', minHeight: 36 }}
                  />
                ) : (
                  <span className="confirm-value">{parsed.description}</span>
                )}
              </div>
            )}
            {parsed.category && (
              <div className="confirm-row">
                <span className="confirm-label">{t('input.category')}</span>
                {editing ? (
                  <input
                    className="input"
                    value={parsed.category}
                    onChange={(e) => setParsed({ ...parsed, category: e.target.value })}
                    style={{ width: '55%', minHeight: 36 }}
                  />
                ) : (
                  <span className="confirm-value">{parsed.category}</span>
                )}
              </div>
            )}
            {parsed.customerName && (
              <div className="confirm-row">
                <span className="confirm-label">{t('input.customer_name')}</span>
                {editing ? (
                  <input
                    className="input"
                    value={parsed.customerName}
                    onChange={(e) => setParsed({ ...parsed, customerName: e.target.value })}
                    style={{ width: '55%', minHeight: 36 }}
                  />
                ) : (
                  <span className="confirm-value">{parsed.customerName}</span>
                )}
              </div>
            )}
            {editing && (
              <div className="confirm-row">
                <span className="confirm-label">{t('input.amount')}</span>
                <input
                  type="number"
                  className="input"
                  value={parsed.amount}
                  onChange={(e) => setParsed({ ...parsed, amount: parseFloat(e.target.value) || 0 })}
                  style={{ width: '55%', minHeight: 36 }}
                />
              </div>
            )}
          </div>

          {parsed.clarification && (
            <div className="ai-summary" style={{ marginBottom: 'var(--sp-4)' }}>
              <p className="ai-summary-text" style={{ fontSize: 'var(--fs-sm)' }}>
                💡 {parsed.clarification}
              </p>
            </div>
          )}

          <div className="confirm-actions">
            {editing ? (
              <button className="btn btn-primary" onClick={handleEditSave} id="edit-save-btn">
                <FiCheck /> Done
              </button>
            ) : (
              <>
                <button className="btn btn-success" onClick={handleSave} disabled={saving} id="confirm-save-btn">
                  {saving ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : <><FiCheck /> {t('input.confirm_save')}</>}
                </button>
                <button className="btn btn-outline" onClick={handleEdit} id="confirm-edit-btn">
                  <FiEdit2 /> {t('input.confirm_edit')}
                </button>
                <button className="btn btn-ghost" onClick={handleCancel} id="confirm-cancel-btn">
                  <FiX />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Input methods — only show when no parsed result and not parsing */}
      {!parsed && !parsing && !saved && (
        <>
          {/* Tab bar */}
          <div className="tab-bar" id="input-tabs">
            <button
              className={`tab-item ${activeTab === 'voice' ? 'active' : ''}`}
              onClick={() => setActiveTab('voice')}
              id="tab-voice"
            >
              🎤 {t('input.voice_tab')}
            </button>
            <button
              className={`tab-item ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
              id="tab-text"
            >
              ⌨️ {t('input.text_tab')}
            </button>
            <button
              className={`tab-item ${activeTab === 'quick' ? 'active' : ''}`}
              onClick={() => setActiveTab('quick')}
              id="tab-quick"
            >
              ⚡ {t('input.quick_tab')}
            </button>
          </div>

          {/* Voice tab */}
          {activeTab === 'voice' && (
            <VoiceRecorder onTranscript={handleVoiceTranscript} language={lang} />
          )}

          {/* Text tab */}
          {activeTab === 'text' && (
            <form className="text-input-section" onSubmit={handleTextSubmit} id="text-input-form">
              <textarea
                className="input text-input-area"
                id="text-input"
                placeholder={t('input.text_placeholder')}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={3}
              />
              <p className="text-example">{t('input.text_example')}</p>
              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block"
                id="text-send-btn"
                disabled={!textInput.trim()}
              >
                <FiSend /> {t('input.send')}
              </button>
            </form>
          )}

          {/* Quick entry tab */}
          {activeTab === 'quick' && (
            <div className="quick-entry-section">
              {!quickType ? (
                <div className="quick-actions" id="quick-actions">
                  {QUICK_TYPES.map((qt) => (
                    <button
                      key={qt.key}
                      className="quick-btn"
                      onClick={() => setQuickType(qt.key)}
                      id={`quick-${qt.key.toLowerCase()}`}
                    >
                      <span className="quick-btn-icon">{qt.emoji}</span>
                      <span className="quick-btn-label">{t(qt.labelKey)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="quick-form" id="quick-form">
                  <div className="quick-form-header">
                    <span style={{ fontSize: '1.2rem' }}>
                      {QUICK_TYPES.find((q) => q.key === quickType)?.emoji}
                    </span>
                    <strong>{t(`input.${quickType === 'CREDIT_GIVEN' ? 'udhaar_given' : quickType === 'CREDIT_RECEIVED' ? 'udhaar_received' : quickType.toLowerCase()}`)}</strong>
                    <button className="btn btn-ghost" onClick={() => setQuickType(null)} style={{ marginLeft: 'auto' }}>
                      <FiX />
                    </button>
                  </div>

                  <div className="input-group">
                    <label className="input-label">{t('input.amount')} *</label>
                    <input
                      type="number"
                      className="input"
                      id="quick-amount"
                      placeholder="500"
                      value={quickForm.amount}
                      onChange={(e) => setQuickForm({ ...quickForm, amount: e.target.value })}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{t('input.description')}</label>
                    <input
                      type="text"
                      className="input"
                      id="quick-description"
                      placeholder="Rice, Dal, etc."
                      value={quickForm.description}
                      onChange={(e) => setQuickForm({ ...quickForm, description: e.target.value })}
                    />
                  </div>

                  {(quickType === 'CREDIT_GIVEN' || quickType === 'CREDIT_RECEIVED' || quickType === 'SALE') && (
                    <div className="input-group">
                      <label className="input-label">{t('input.customer_name')}</label>
                      <input
                        type="text"
                        className="input"
                        id="quick-customer"
                        placeholder="Ramesh"
                        value={quickForm.customerName}
                        onChange={(e) => setQuickForm({ ...quickForm, customerName: e.target.value })}
                      />
                    </div>
                  )}

                  <button
                    className="btn btn-primary btn-lg btn-block mt-4"
                    onClick={handleQuickSubmit}
                    id="quick-submit-btn"
                  >
                    <FiCheck /> {t('input.confirm_save')}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
