import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import './Auth.css';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone || !password) {
      setError('Please fill in all fields');
      return;
    }

    const result = await login(phone, password);
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
          <h2 className="auth-title">{t('auth.login')}</h2>

          {error && <div className="auth-error" id="login-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit} id="login-form">
            <div className="input-group">
              <label className="input-label">{t('auth.phone')}</label>
              <div style={{ position: 'relative' }}>
                <FiPhone style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="tel"
                  className="input"
                  id="login-phone"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ paddingLeft: 40 }}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">{t('auth.password')}</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  id="login-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                  autoComplete="current-password"
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

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              id="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" style={{ width: 22, height: 22, borderWidth: 2 }}></span>
              ) : (
                t('auth.login_btn')
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span>{t('auth.no_account')} </span>
            <button onClick={() => navigate('/register')} id="go-to-register">
              {t('auth.register')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
