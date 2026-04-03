import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiPhone, FiLock, FiUser, FiShoppingBag, FiEye, FiEyeOff } from 'react-icons/fi';
import './Auth.css';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    ownerName: '',
    shopName: '',
    languagePref: 'en',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.phone || !form.password || !form.ownerName || !form.shopName) {
      setError('Please fill in all required fields');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const result = await register({
      phone: form.phone,
      password: form.password,
      ownerName: form.ownerName,
      shopName: form.shopName,
      languagePref: form.languagePref,
    });

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <span className="auth-logo">🏪</span>
          <h1 className="auth-app-name">{t('app_name')}</h1>
          <p className="auth-tagline">{t('app_tagline')}</p>
        </div>

        <div className="auth-card">
          <h2 className="auth-title">{t('auth.register')}</h2>

          {error && <div className="auth-error" id="register-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit} id="register-form">
            <div className="input-group">
              <label className="input-label">{t('auth.owner_name')} *</label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input"
                  id="register-name"
                  placeholder="Ramesh"
                  value={form.ownerName}
                  onChange={(e) => update('ownerName', e.target.value)}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">{t('auth.shop_name')} *</label>
              <div style={{ position: 'relative' }}>
                <FiShoppingBag style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input"
                  id="register-shop"
                  placeholder="Ramesh Kirana Store"
                  value={form.shopName}
                  onChange={(e) => update('shopName', e.target.value)}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">{t('auth.phone')} *</label>
              <div style={{ position: 'relative' }}>
                <FiPhone style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="tel"
                  className="input"
                  id="register-phone"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  style={{ paddingLeft: 40 }}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">{t('auth.password')} *</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  id="register-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                  }}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">{t('auth.confirm_password')} *</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  id="register-confirm-password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  style={{ paddingLeft: 40 }}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">{t('auth.language')}</label>
              <div className="auth-lang-row">
                <button
                  type="button"
                  className={`auth-lang-option ${form.languagePref === 'en' ? 'selected' : ''}`}
                  onClick={() => update('languagePref', 'en')}
                  id="lang-en-option"
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  className={`auth-lang-option ${form.languagePref === 'te' ? 'selected' : ''}`}
                  onClick={() => update('languagePref', 'te')}
                  id="lang-te-option"
                >
                  🇮🇳 తెలుగు
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              id="register-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" style={{ width: 22, height: 22, borderWidth: 2 }}></span>
              ) : (
                t('auth.register_btn')
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span>{t('auth.has_account')} </span>
            <button onClick={() => navigate('/login')} id="go-to-login">
              {t('auth.login')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
