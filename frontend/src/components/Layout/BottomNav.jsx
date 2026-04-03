import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiClock, FiBarChart2, FiPlus } from 'react-icons/fi';
import './Layout.css';

const navItems = [
  { path: '/', icon: FiHome, labelKey: 'nav.home' },
  { path: '/input', icon: null, labelKey: 'nav.add', isAdd: true },
  { path: '/history', icon: FiClock, labelKey: 'nav.history' },
  { path: '/charts', icon: FiBarChart2, labelKey: 'nav.charts' },
];

export default function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav" id="bottom-nav">
      <div className="bottom-nav-inner">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          if (item.isAdd) {
            return (
              <button
                key={item.path}
                className={`nav-item nav-item-add ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                id="nav-add-btn"
                aria-label={t(item.labelKey)}
              >
                <div className="nav-icon-add">
                  <FiPlus />
                </div>
              </button>
            );
          }

          const Icon = item.icon;
          return (
            <button
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              id={`nav-${item.labelKey.split('.')[1]}-btn`}
              aria-label={t(item.labelKey)}
            >
              <span className="nav-icon"><Icon /></span>
              <span className="nav-label">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
